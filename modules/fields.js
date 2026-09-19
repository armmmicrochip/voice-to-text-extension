import { state } from "./state.js";

const SUPPORTED_INPUT_TYPES = new Set(["text", "search", "email"]);

// ── Field eligibility ──────────────────────────────────────────────────────────

export function isSupportedField(el) {
  if (!el || el.disabled || el.readOnly) return false;
  const tag = el.tagName;
  if (tag === "TEXTAREA") return true;
  if (tag === "INPUT") {
    const type = (el.getAttribute("type") || "text").toLowerCase();
    return SUPPORTED_INPUT_TYPES.has(type);
  }
  return false;
}

// ── Text insertion ─────────────────────────────────────────────────────────────

export function insertText(field, text) {
  if (!text) return;

  const start =
    typeof field.selectionStart === "number"
      ? field.selectionStart
      : field.value.length;
  const end =
    typeof field.selectionEnd === "number"
      ? field.selectionEnd
      : field.value.length;

  const before = field.value.substring(0, start);
  const after = field.value.substring(end);

  // Space separator when existing content doesn't already end with whitespace
  const needsSpace = before.length > 0 && !/[\s\n]$/.test(before);
  const inserted = (needsSpace ? " " : "") + text;

  field.value = before + inserted + after;
  const cursor = start + inserted.length;
  try {
    field.setSelectionRange(cursor, cursor);
  } catch {
    // type="email" has no selection API and throws InvalidStateError
  }

  // Notify React / Vue / Angular of the programmatic change
  field.dispatchEvent(
    new InputEvent("input", { bubbles: true, composed: true }),
  );
  field.dispatchEvent(new Event("change", { bubbles: true }));
}
