// Shared mutable state — imported by all modules.
// Mutate properties in place; never reassign the object itself.
export const state = {
  host: null, // shadow host div
  micBtn: null, // <button> inside shadow root
  previewEl: null, // transcript preview container
  finalSpan: null, // confirmed text span
  interimSpan: null, // in-progress text span
  activeField: null, // currently focused input / textarea
  recognition: null, // SpeechRecognition instance
  isListening: false,
  finalTranscript: "",
  currentLang: navigator.language || "en-US",
};
