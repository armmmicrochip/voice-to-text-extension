const select   = document.getElementById('lang-select');
const badge    = document.getElementById('status-badge');
const saveHint = document.getElementById('save-hint');

// ── Web Speech API availability check ──────────────────────────────────────────

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SR) {
  badge.textContent = 'Unsupported';
  badge.style.background = 'rgba(234,67,53,0.6)';
}

// ── Populate select with the browser default as initial fallback ───────────────

const browserLang = navigator.language || 'en-US';

// ── Load saved language from storage ──────────────────────────────────────────

chrome.storage.sync.get('language', ({ language }) => {
  const saved = language || browserLang;
  // Try to select the saved value; if not found, add a custom option
  if (![...select.options].some(o => o.value === saved)) {
    const opt = document.createElement('option');
    opt.value = saved;
    opt.textContent = saved;
    select.insertBefore(opt, select.firstChild);
  }
  select.value = saved;
});

// ── Save on change ─────────────────────────────────────────────────────────────

let hintTimer = null;

select.addEventListener('change', () => {
  const lang = select.value;
  chrome.storage.sync.set({ language: lang }, () => {
    saveHint.textContent = 'Saved ✓';
    saveHint.classList.remove('fade');

    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => {
      saveHint.classList.add('fade');
      setTimeout(() => { saveHint.textContent = ''; }, 300);
    }, 1800);
  });
});
