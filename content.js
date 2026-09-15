/**
 * Voice Input Assistant — content script
 *
 * Injects a microphone button next to focused text fields.
 * Uses Web Speech API for speech-to-text and inserts the result
 * into the field. The button lives inside a Shadow DOM so it
 * never conflicts with the host page's styles.
 *
 * Features:
 *  - Live interim transcript preview while speaking
 *  - Language stored in chrome.storage.sync (set via popup)
 *  - Keyboard shortcut: Alt+Shift+V to toggle recording
 */
(function () {
  'use strict';

  // ─── Constants ───────────────────────────────────────────────────────────────

  const SUPPORTED_INPUT_TYPES = new Set(['text', 'search', 'email']);
  const BTN_SIZE = 34; // px

  const MIC_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <path d="M12 15a4 4 0 0 0 4-4V6a4 4 0 1 0-8 0v5a4 4 0 0 0 4 4z"/>
    <path d="M19 11a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.93V20H9a1 1 0 0 0 0 2h6a1 1 0 0 0 0-2h-2v-2.07A7 7 0 0 0 19 11z"/>
  </svg>`;

  const STOP_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <rect x="7" y="7" width="10" height="10" rx="1.5"/>
  </svg>`;

  // ─── Shadow-DOM styles ────────────────────────────────────────────────────────

  const SHADOW_STYLE = `
    .wrapper {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 5px;
    }

    button {
      width: ${BTN_SIZE}px;
      height: ${BTN_SIZE}px;
      border-radius: 50%;
      border: none;
      background: #4285f4;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      flex-shrink: 0;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      transition: background 0.15s, transform 0.1s, box-shadow 0.15s;
      outline: none;
    }
    button:hover {
      background: #1a73e8;
      box-shadow: 0 3px 10px rgba(0,0,0,0.35);
      transform: scale(1.06);
    }
    button:active {
      transform: scale(0.93);
    }
    button.listening {
      background: #ea4335;
      animation: pulse 1.5s ease-in-out infinite;
    }
    svg {
      width: 18px;
      height: 18px;
      fill: white;
      pointer-events: none;
      display: block;
    }

    /* Live transcript preview */
    .preview {
      display: none;
      background: rgba(20,20,20,0.88);
      color: #fff;
      font: 12px/1.45 system-ui, sans-serif;
      padding: 5px 9px;
      border-radius: 6px;
      max-width: 260px;
      min-width: 48px;
      word-break: break-word;
      box-shadow: 0 2px 8px rgba(0,0,0,0.25);
    }
    .preview.visible {
      display: block;
    }
    .interim {
      color: rgba(255,255,255,0.55);
      font-style: italic;
    }
    .final {
      color: #fff;
    }

    @keyframes pulse {
      0%, 100% {
        box-shadow: 0 2px 6px rgba(234,67,53,0.4), 0 0 0 0 rgba(234,67,53,0.35);
      }
      60% {
        box-shadow: 0 2px 6px rgba(234,67,53,0.4), 0 0 0 9px rgba(234,67,53,0);
      }
    }
  `;

  // ─── State ────────────────────────────────────────────────────────────────────

  let host        = null;   // shadow host div appended to <html>
  let micBtn      = null;   // <button> inside shadow DOM
  let previewEl   = null;   // transcript preview div
  let finalSpan   = null;   // span for final text in preview
  let interimSpan = null;   // span for interim (grey) text in preview
  let activeField = null;   // currently focused supported field
  let recognition = null;   // SpeechRecognition instance
  let isListening = false;
  let finalTranscript = '';
  let currentLang = navigator.language || 'en-US'; // updated from storage

  // ─── Initialisation ───────────────────────────────────────────────────────────

  function init() {
    host = document.createElement('div');
    host.style.cssText = [
      'position:fixed',
      'z-index:2147483647',
      'display:none',
      'pointer-events:none',
    ].join(';');

    const shadow = host.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = SHADOW_STYLE;

    const wrapper = document.createElement('div');
    wrapper.className = 'wrapper';

    micBtn = document.createElement('button');
    micBtn.type = 'button';
    setMicState();

    previewEl = document.createElement('div');
    previewEl.className = 'preview';

    finalSpan = document.createElement('span');
    finalSpan.className = 'final';

    interimSpan = document.createElement('span');
    interimSpan.className = 'interim';

    previewEl.appendChild(finalSpan);
    previewEl.appendChild(interimSpan);

    wrapper.appendChild(micBtn);
    wrapper.appendChild(previewEl);
    shadow.appendChild(style);
    shadow.appendChild(wrapper);

    document.documentElement.appendChild(host);

    // mousedown preventDefault keeps focus in the active field
    micBtn.addEventListener('mousedown', e => e.preventDefault());
    micBtn.addEventListener('click', handleMicClick);

    document.addEventListener('focusin',  handleFocusIn,  true);
    document.addEventListener('focusout', handleFocusOut, true);
    document.addEventListener('keydown',  handleKeyDown,  true);
    window.addEventListener('scroll', updatePosition, { passive: true, capture: true });
    window.addEventListener('resize', updatePosition, { passive: true });

    // Load saved language preference
    loadLanguage();

    // React to language changes made in the popup while the page is open
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'sync' && changes.language) {
          currentLang = changes.language.newValue || navigator.language;
        }
      });
    }
  }

  function loadLanguage() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.sync.get('language', ({ language }) => {
        if (language) currentLang = language;
      });
    }
  }

  // ─── Field detection ──────────────────────────────────────────────────────────

  function isSupportedField(el) {
    if (!el || el.disabled || el.readOnly) return false;
    const tag = el.tagName;
    if (tag === 'TEXTAREA') return true;
    if (tag === 'INPUT') {
      const type = (el.getAttribute('type') || 'text').toLowerCase();
      return SUPPORTED_INPUT_TYPES.has(type);
    }
    return false;
  }

  // ─── Focus/Blur handlers ──────────────────────────────────────────────────────

  function handleFocusIn(e) {
    if (!isSupportedField(e.target)) return;
    activeField = e.target;
    positionButton();
    host.style.display = 'block';
    host.style.pointerEvents = 'auto';
  }

  function handleFocusOut(e) {
    // Short delay: focusout fires before the next focusin,
    // so we check afterwards where focus actually landed.
    setTimeout(() => {
      const focused = document.activeElement;
      if (isSupportedField(focused)) {
        activeField = focused;
        positionButton();
      } else if (!isListening) {
        hideButton();
      }
      // If still listening keep the button visible so the user can stop
    }, 150);
  }

  // ─── Keyboard shortcut ────────────────────────────────────────────────────────

  function handleKeyDown(e) {
    // Alt+Shift+V — toggle recording for the currently focused supported field
    if (e.altKey && e.shiftKey && e.key === 'V') {
      if (activeField || isListening) {
        e.preventDefault();
        handleMicClick();
      }
    }
  }

  // ─── Button positioning ───────────────────────────────────────────────────────

  function positionButton() {
    if (!activeField || !host) return;
    const rect = activeField.getBoundingClientRect();
    const gap  = 6;

    let top  = rect.top + (rect.height - BTN_SIZE) / 2;
    let left = rect.right + gap;

    // Overflow right → tuck inside the field on its right edge
    if (left + BTN_SIZE > window.innerWidth - 4) {
      left = rect.right - BTN_SIZE - 4;
    }

    // Clamp vertically
    top = Math.max(4, Math.min(top, window.innerHeight - BTN_SIZE - 4));

    host.style.top  = top  + 'px';
    host.style.left = left + 'px';
  }

  function updatePosition() {
    if (host && host.style.display !== 'none') positionButton();
  }

  function hideButton() {
    if (host) {
      host.style.display = 'none';
      host.style.pointerEvents = 'none';
    }
    clearPreview();
    activeField = null;
  }

  // ─── Mic button interaction ───────────────────────────────────────────────────

  function handleMicClick() {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
    if (activeField) activeField.focus();
  }

  // ─── Speech recognition ───────────────────────────────────────────────────────

  function startListening() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      showToast('Speech recognition is not supported. Please use Chrome or Edge.');
      return;
    }

    finalTranscript = '';
    recognition = new SR();
    recognition.continuous     = true;
    recognition.interimResults = true;
    recognition.lang           = currentLang;

    recognition.onstart = () => {
      isListening = true;
      setStopState();
    };

    recognition.onresult = (event) => {
      let interim = '';
      finalTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      updatePreview(finalTranscript, interim);
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      if (event.error === 'not-allowed') {
        showToast('Microphone access denied. Please allow microphone access and try again.');
      } else {
        showToast(`Voice recognition error: ${event.error}`);
      }
      finalTranscript = '';
    };

    recognition.onend = () => {
      const text = finalTranscript.trim();
      finalTranscript = '';
      isListening = false;
      recognition = null;
      setMicState();
      clearPreview();

      if (text && activeField) {
        insertText(activeField, text);
      }
    };

    try {
      recognition.start();
    } catch (err) {
      console.warn('[VoiceInput] Could not start recognition:', err);
      isListening = false;
      recognition = null;
      setMicState();
    }
  }

  function stopListening() {
    if (recognition) {
      recognition.stop(); // triggers onend → handles insertion and reset
    }
  }

  // ─── Transcript preview ───────────────────────────────────────────────────────

  function updatePreview(final, interim) {
    if (!previewEl) return;
    const hasContent = final || interim;
    if (hasContent) {
      finalSpan.textContent   = final;
      interimSpan.textContent = interim;
      previewEl.classList.add('visible');
    } else {
      clearPreview();
    }
  }

  function clearPreview() {
    if (!previewEl) return;
    finalSpan.textContent   = '';
    interimSpan.textContent = '';
    previewEl.classList.remove('visible');
  }

  // ─── Text insertion ───────────────────────────────────────────────────────────

  function insertText(field, text) {
    if (!text) return;

    const start = typeof field.selectionStart === 'number' ? field.selectionStart : field.value.length;
    const end   = typeof field.selectionEnd   === 'number' ? field.selectionEnd   : field.value.length;

    const before = field.value.substring(0, start);
    const after  = field.value.substring(end);

    // Space separator when the existing text doesn't already end with whitespace
    const needsSpace = before.length > 0 && !/[\s\n]$/.test(before);
    const inserted   = (needsSpace ? ' ' : '') + text;

    field.value = before + inserted + after;
    const cursor = start + inserted.length;
    field.setSelectionRange(cursor, cursor);

    // Notify frameworks (React, Vue, Angular …) of the programmatic change
    field.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // ─── Button visual state ──────────────────────────────────────────────────────

  function setMicState() {
    if (!micBtn) return;
    micBtn.innerHTML = MIC_SVG;
    micBtn.classList.remove('listening');
    micBtn.setAttribute('aria-label', 'Start voice input');
    micBtn.title = 'Start voice input — Alt+Shift+V';
  }

  function setStopState() {
    if (!micBtn) return;
    micBtn.innerHTML = STOP_SVG;
    micBtn.classList.add('listening');
    micBtn.setAttribute('aria-label', 'Stop voice input');
    micBtn.title = 'Stop voice input — Alt+Shift+V';
  }

  // ─── Toast notification ───────────────────────────────────────────────────────

  function showToast(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = [
      'position:fixed',
      'bottom:20px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(30,30,30,0.92)',
      'color:#fff',
      'padding:10px 16px',
      'border-radius:6px',
      'font:14px/1.4 system-ui,sans-serif',
      'z-index:2147483646',
      'max-width:340px',
      'text-align:center',
      'box-shadow:0 3px 10px rgba(0,0,0,0.3)',
      'pointer-events:none',
    ].join(';');
    document.documentElement.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  // ─── Bootstrap ────────────────────────────────────────────────────────────────

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
