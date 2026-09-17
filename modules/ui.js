import { state } from './state.js';

const BTN_SIZE = 34; // px — must match shadow.css button width/height

const MIC_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <path d="M12 15a4 4 0 0 0 4-4V6a4 4 0 1 0-8 0v5a4 4 0 0 0 4 4z"/>
  <path d="M19 11a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.93V20H9a1 1 0 0 0 0 2h6a1 1 0 0 0 0-2h-2v-2.07A7 7 0 0 0 19 11z"/>
</svg>`;

const STOP_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <rect x="7" y="7" width="10" height="10" rx="1.5"/>
</svg>`;

// ── DOM construction ───────────────────────────────────────────────────────────

export function buildUI() {
  state.host = document.createElement('div');
  state.host.style.cssText = 'position:fixed;z-index:2147483647;display:none;pointer-events:none;';

  const shadow = state.host.attachShadow({ mode: 'open' });

  // Load shadow.css via extension URL (listed in web_accessible_resources)
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = chrome.runtime.getURL('shadow.css');

  const wrapper = document.createElement('div');
  wrapper.className = 'wrapper';

  state.micBtn = document.createElement('button');
  state.micBtn.type = 'button';

  state.previewEl = document.createElement('div');
  state.previewEl.className = 'preview';

  state.finalSpan = document.createElement('span');
  state.finalSpan.className = 'final';

  state.interimSpan = document.createElement('span');
  state.interimSpan.className = 'interim';

  state.previewEl.appendChild(state.finalSpan);
  state.previewEl.appendChild(state.interimSpan);

  wrapper.appendChild(state.micBtn);
  wrapper.appendChild(state.previewEl);
  shadow.appendChild(link);
  shadow.appendChild(wrapper);

  document.documentElement.appendChild(state.host);

  setButtonState(false); // set initial icon + ARIA
}

// ── Button visual state ────────────────────────────────────────────────────────

export function setButtonState(listening) {
  if (!state.micBtn) return;
  state.micBtn.innerHTML = listening ? STOP_SVG : MIC_SVG;
  state.micBtn.classList.toggle('listening', listening);
  const label = listening ? 'Stop voice input' : 'Start voice input';
  state.micBtn.setAttribute('aria-label', label);
  state.micBtn.title = label + ' — Alt+Shift+V';
}

// ── Transcript preview ─────────────────────────────────────────────────────────

export function updatePreview(final, interim) {
  state.finalSpan.textContent   = final;
  state.interimSpan.textContent = interim;
  state.previewEl.classList.toggle('visible', !!(final || interim));
}

export function clearPreview() {
  updatePreview('', '');
}

// ── Button positioning ─────────────────────────────────────────────────────────

export function positionButton() {
  if (!state.activeField || !state.host) return;
  const rect = state.activeField.getBoundingClientRect();
  const gap  = 6;

  let top  = rect.top + (rect.height - BTN_SIZE) / 2;
  let left = rect.right + gap;

  // Overflow right → tuck inside the field
  if (left + BTN_SIZE > window.innerWidth - 4) left = rect.right - BTN_SIZE - 4;

  // Clamp vertically
  top = Math.max(4, Math.min(top, window.innerHeight - BTN_SIZE - 4));

  state.host.style.top  = top  + 'px';
  state.host.style.left = left + 'px';
}

export function showButton() {
  positionButton();
  state.host.style.display      = 'block';
  state.host.style.pointerEvents = 'auto';
}

export function hideButton() {
  state.host.style.display      = 'none';
  state.host.style.pointerEvents = 'none';
  clearPreview();
  state.activeField = null;
}

export function updatePosition() {
  if (state.host && state.host.style.display !== 'none') positionButton();
}

// ── Toast notification ─────────────────────────────────────────────────────────

export function showToast(message) {
  const toast = document.createElement('div');
  toast.className   = 'via-toast';
  toast.textContent = message;
  document.documentElement.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}
