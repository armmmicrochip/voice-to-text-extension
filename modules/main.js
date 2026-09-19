/**
 * Voice Input Assistant — entry point
 *
 * Wires together the focused modules and registers all event listeners.
 * Business logic lives in modules/; this file is intentionally thin.
 */

import { state } from "./state.js";
import { buildUI, showButton, hideButton, updatePosition } from "./ui.js";
import { startListening, stopListening } from "./speech.js";
import { isSupportedField } from "./fields.js";
import { loadLanguage, subscribeToLanguageChanges } from "./storage.js";

// ── Event handlers ─────────────────────────────────────────────────────────────

function handleFocusIn(e) {
  if (!isSupportedField(e.target)) return;
  state.activeField = e.target;
  showButton();
}

function handleFocusOut() {
  // Wait for the next focusin (if any) before deciding to hide.
  setTimeout(() => {
    const focused = document.activeElement;
    if (isSupportedField(focused)) {
      state.activeField = focused;
      showButton();
    } else if (!state.isListening) {
      hideButton();
    }
    // Keep button visible while recording so the user can stop
  }, 150);
}

function handleMicClick() {
  state.isListening ? stopListening() : startListening();
  if (state.activeField) state.activeField.focus();
}

function handleKeyDown(e) {
  // Alt+Shift+V toggles recording for the focused field
  if (
    e.altKey &&
    e.shiftKey &&
    e.key === "V" &&
    (state.activeField || state.isListening)
  ) {
    e.preventDefault();
    handleMicClick();
  }
}

// ── Initialisation ─────────────────────────────────────────────────────────────

function init() {
  buildUI();

  // mousedown preventDefault keeps focus in the active field during the click
  state.micBtn.addEventListener("mousedown", (e) => e.preventDefault());
  state.micBtn.addEventListener("click", handleMicClick);

  document.addEventListener("focusin", handleFocusIn, true);
  document.addEventListener("focusout", handleFocusOut, true);
  document.addEventListener("keydown", handleKeyDown, true);
  window.addEventListener("scroll", updatePosition, {
    passive: true,
    capture: true,
  });
  window.addEventListener("resize", updatePosition, { passive: true });

  loadLanguage();
  subscribeToLanguageChanges();

  // A field may already be focused (autofocus) before our listeners existed
  if (isSupportedField(document.activeElement)) {
    state.activeField = document.activeElement;
    showButton();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
