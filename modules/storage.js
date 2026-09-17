import { state } from './state.js';

// ── Load saved language preference ─────────────────────────────────────────────

export function loadLanguage() {
  if (typeof chrome === 'undefined' || !chrome.storage) return;
  chrome.storage.sync.get('language', ({ language }) => {
    if (language) state.currentLang = language;
  });
}

// ── React to popup language changes without a page reload ──────────────────────

export function subscribeToLanguageChanges() {
  if (typeof chrome === 'undefined' || !chrome.storage) return;
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.language) {
      state.currentLang = changes.language.newValue || navigator.language;
    }
  });
}
