import { state } from "./state.js";
import {
  setButtonState,
  updatePreview,
  clearPreview,
  showToast,
} from "./ui.js";
import { insertText } from "./fields.js";

// ── Start recording ────────────────────────────────────────────────────────────

export function startListening() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    showToast(
      "Speech recognition is not supported. Please use Chrome or Edge.",
    );
    return;
  }

  state.finalTranscript = "";
  const recognition = new SR();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = state.currentLang;

  recognition.onstart = () => {
    state.isListening = true;
    state.recognition = recognition;
    setButtonState(true);
  };

  recognition.onresult = (event) => {
    // Iterate only new/changed results from event.resultIndex onwards
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) {
        state.finalTranscript += result[0].transcript;
      } else {
        interim += result[0].transcript;
      }
    }
    updatePreview(state.finalTranscript, interim);
  };

  recognition.onerror = (event) => {
    if (event.error === "no-speech" || event.error === "aborted") return;
    if (event.error === "not-allowed") {
      showToast(
        "Microphone access denied. Please allow microphone access and try again.",
      );
    } else {
      showToast(`Voice recognition error: ${event.error}`);
    }
    state.finalTranscript = "";
  };

  recognition.onend = () => {
    const text = state.finalTranscript.trim();
    state.finalTranscript = "";
    state.isListening = false;
    state.recognition = null;
    setButtonState(false);
    clearPreview();

    if (text && state.activeField) insertText(state.activeField, text);
  };

  try {
    recognition.start();
  } catch (err) {
    console.warn("[VoiceInput] Could not start recognition:", err);
    state.isListening = false;
    state.recognition = null;
    setButtonState(false);
  }
}

// ── Stop recording ─────────────────────────────────────────────────────────────

export function stopListening() {
  if (state.recognition) state.recognition.stop(); // triggers onend → inserts text
}
