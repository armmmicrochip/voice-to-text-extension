# 06 — Text Insertion

File: `modules/fields.js`, function `insertText(field, text)`.

## Algorithm

1. Read the caret/selection: `selectionStart` and `selectionEnd` (fall back to end of value).
2. `before = value.slice(0, start)`, `after = value.slice(end)` — selected text is **replaced**, like typing over a selection.
3. Add a leading space only if `before` is non-empty and does not already end in whitespace (so dictating twice does not glue words together, and an empty field gets no stray space).
4. Set `field.value = before + inserted + after`.
5. `setSelectionRange(cursor, cursor)` puts the caret right after the inserted text.
6. Dispatch `input` (an `InputEvent`, `bubbles` and `composed`) and then `change`.

## Why dispatch events

Assigning `.value` from script does **not** fire any event. Sites listen to `input`/`change` for
validation, character counters, autosave and framework state. Without the events the text would
appear but the page would think the field is still empty (submit buttons stay disabled, etc.).

## Known limitations (good research topics)

1. **React and similar frameworks.** React tracks an input's value internally; assigning `field.value`
   directly updates that tracker, so the following `input` event can look like "no change" and
   `onChange` may not run. The widely used workaround is to call the *native* setter from the
   element prototype, then dispatch the event:

   ```js
   const proto = field instanceof HTMLTextAreaElement ? HTMLTextAreaElement : HTMLInputElement;
   Object.getOwnPropertyDescriptor(proto.prototype, "value").set.call(field, newValue);
   field.dispatchEvent(new InputEvent("input", { bubbles: true }));
   ```

   Test on a React-based site before relying on it; the current code uses a plain assignment.
2. **Undo history.** Setting `.value` clears the browser's undo stack (Ctrl/Cmd+Z will not undo the
   dictation). `document.execCommand("insertText", false, text)` keeps undo working but is a
   deprecated API; compare both.
3. **`type="email"` fields have no selection API.** In Chrome `selectionStart` is `null` and
   `setSelectionRange()` throws `InvalidStateError` (we tested this). Two guards handle it: the
   `typeof … === "number"` check makes us append at the end of the value, and a `try/catch`
   around `setSelectionRange` stops the exception from skipping the `input`/`change` events. This
   was a real bug found while writing this document: before the guard, dictating into an email
   field set the value but never notified the page.
4. **`contenteditable` and rich-text editors** (Gmail compose, Notion, Google Docs) are not
   `<input>`/`<textarea>`; they need `Selection`/`Range` APIs or `execCommand`.
5. **Fields in iframes or Shadow DOM** are not detected at all ([09](09-testing-and-troubleshooting.md)).

## Exercise

Write a tiny test page with a plain input, a textarea and a React-controlled input; compare the
plain assignment against the native-setter version.
