# 01 — Overview and Architecture

## What the extension does

1. You focus a supported field (`text`, `search`, `email` inputs and `<textarea>`).
2. A round microphone button appears next to it.
3. Click it (or press **Ctrl+Shift+Space** / **Cmd+Shift+Space**) and speak; a live preview shows the transcript.
4. Click again (the button is now a stop icon): the final text is inserted at the cursor.

There is no backend, account or audio storage. Recognition is done by the browser (see [05](05-speech-recognition.md)).

## File map

| File | Role |
|------|------|
| `manifest.json` | Declares the extension, permissions, content script, popup ([02](02-manifest-and-module-loading.md)) |
| `content.js` | Tiny **classic-script loader**; dynamically imports `modules/main.js` |
| `modules/main.js` | Entry point: builds the UI and registers all event listeners |
| `modules/state.js` | One shared mutable state object |
| `modules/ui.js` | Shadow-DOM button, preview, positioning, toast |
| `modules/fields.js` | Which fields are supported; inserting text |
| `modules/speech.js` | Web Speech API start/stop and result handling |
| `modules/storage.js` | Reads/observes the saved language (`chrome.storage.sync`) |
| `modules/shortcut.js` | Cross-platform shortcut definition and label |
| `content.css` | Page-level styles (only the toast) |
| `shadow.css` | Styles inside the Shadow DOM (button, preview, animation) |
| `popup.html/.css/.js` | Toolbar popup: instructions and language selector |
| `icons/` | Extension icons (16/48/128 px) |

## Runtime pieces

```
 web page (any site)
 ┌──────────────────────────────────────────────────────────────┐
 │  page DOM  ── <input>, <textarea> …                           │
 │     ▲ focusin / focusout / keydown / scroll / resize          │
 │     │                                                         │
 │  content script (isolated world)                              │
 │   content.js ──import()──► modules/main.js                    │
 │        main ─► ui / fields / speech / storage / shortcut      │
 │                     │              │                          │
 │        Shadow DOM host (button)   SpeechRecognition ──► browser│
 └───────────────────────────────────────────────┬──────────────┘
                                                 │ chrome.storage.sync
                                     popup.html/popup.js (language)
```

There is **no background service worker**. Everything the extension needs runs in the page
(content script) or in the popup, and they communicate only through `chrome.storage`.

**Why no service worker:** nothing needs privileged, always-on logic. Fewer moving parts means
fewer bugs (service workers are ephemeral and must not hold state).

## Life of one dictation

1. Page loads → Chrome injects `content.js` (`document_idle`) → it `import()`s `modules/main.js`.
2. `init()` builds the hidden button host, attaches listeners, loads the saved language, and shows the button if a field is already focused (autofocus).
3. `focusin` on a supported field → `state.activeField = field` → `showButton()` positions the button.
4. Click / shortcut → `startListening()` creates a `SpeechRecognition`; the button becomes a stop icon.
5. `onresult` events update the live preview (final text plus grey interim text).
6. Click / shortcut again → `stopListening()` → `onend` fires → `insertText()` writes the transcript and dispatches events.
7. `focusout` to a non-field hides the button (unless still recording).

## Shared state (`modules/state.js`)

All modules import one plain object and mutate its properties. **Why:** an ES module is evaluated
once and cached, so every importer receives the *same* object. It is the simplest possible store
for a handful of values (active field, recognition instance, listening flag, language). Rule:
mutate properties, never reassign the exported object.

## Design decisions at a glance

| Decision | Why |
|----------|-----|
| Content script, not a page script | Needs the page DOM and `chrome.*` APIs together |
| Shadow DOM for the button | Website CSS cannot break our button, ours cannot leak out |
| Web Speech API, no custom model | Zero backend; browser does recognition |
| Split into small ES modules | Each file has one job, easier to teach and test |
| Loader + dynamic `import()` | Manifest content scripts cannot be declared as modules ([02](02-manifest-and-module-loading.md)) |
| Only the `storage` permission | Least privilege: no `tabs`, no host permissions beyond the content-script match |
