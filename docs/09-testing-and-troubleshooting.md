# 09 — Testing and Troubleshooting

## Load the extension (unpacked)

1. Open `chrome://extensions`, enable **Developer mode**.
2. **Load unpacked** and select the repository root (the folder containing `manifest.json`). The `docs/` folder inside it is ignored by Chrome.
3. After every code change click the extension's **Reload** icon, then **refresh the tab** you are testing (content scripts are only injected into pages loaded after the reload).

## Where to look for errors

| What | Where |
|------|-------|
| Content-script logs/errors (`modules/*.js`, `content.js`) | DevTools of the **web page** (F12 → Console). In the Console's context dropdown ("top") choose *Voice Input Assistant* to run code in the extension's isolated world |
| Manifest / load problems | `chrome://extensions` → the extension card → **Errors** |
| Popup code | Right-click the toolbar icon → **Inspect popup** |
| Extension files actually served | `chrome://extensions` → **Details** → Inspect views; or open `chrome-extension://<id>/manifest.json` |

## Error catalogue

| Symptom | Cause | Fix |
|---------|-------|-----|
| `Uncaught SyntaxError: Cannot use import statement outside a module` | Content script declared as a module in the manifest (not supported) so `import` runs in a classic script | Keep `content.js` classic and use dynamic `import()` ([02](02-manifest-and-module-loading.md)) |
| `Failed to fetch dynamically imported module: chrome-extension://…/modules/main.js` | Module not in `web_accessible_resources` | Add `"modules/*.js"` to the resources list |
| Nothing appears, no errors | Page was open before the reload | Refresh the tab |
| No icon on `chrome://…` pages, the Chrome Web Store, PDF viewer | Chrome forbids content scripts there | Expected; test on a normal site |
| No icon on a `file://` page | File access is off | Details → **Allow access to file URLs** |
| No icon in an embedded form (login widget, payment frame, comment box) | The field is in an **iframe** and `all_frames` is not set | Set `"all_frames": true` (then handle several instances) |
| Button shows but text is not inserted | Recognition error (mic blocked, offline) | See the toast; check site permission (lock icon → Microphone) |
| Toast "Microphone access denied" | Permission blocked for that site | Allow the microphone for the site and retry |
| Shortcut does nothing on Mac | Uses `e.key`, or Option-based combo | Use `e.code` and Cmd ([08](08-keyboard-shortcut.md)) |
| Dictating into an email field did not update the page | `setSelectionRange` throws on `type="email"` | Guarded in `insertText` ([06](06-text-insertion.md)) |
| Text appears but the page does not react | Framework value tracking (React) | Native-setter technique ([06](06-text-insertion.md)) |

## Manual test checklist

- [ ] Button appears for text, search, email and textarea; not for password, checkbox, disabled or read-only fields.
- [ ] Autofocused field (e.g. a search page) shows the button on load.
- [ ] Button follows the field when scrolling (page and inner scroll containers) and resizing.
- [ ] Moving focus between two fields does not flicker the button.
- [ ] Click and shortcut both start and stop; the icon turns into stop and pulses red.
- [ ] Interim text is grey/italic; final text is white; text is inserted at the caret and replaces a selection.
- [ ] Denying the microphone shows the toast.
- [ ] Changing the language in the popup affects an already-open tab.
- [ ] Ctrl+Shift+Space (Win/Linux) and Cmd+Shift+Space (Mac) work; the wrong modifier does nothing.

## Automated smoke test (optional)

We verified loading without a build step by driving Chrome with
[`puppeteer-core`](https://pptr.dev) against a small local HTML page, then reading the extension's
host element and a screenshot. Key points if you reproduce it:

- Launch a Chrome/Chromium binary with the extension enabled (`enableExtensions: [path]` in recent Puppeteer, or `--load-extension` on builds that still allow it) and `headless: true`.
- Serve the test page over `http://localhost` (content scripts do not run on `file://` by default).
- The extension's UI is in a Shadow DOM, so query `host.shadowRoot.querySelector("button")`.
- Real speech recognition cannot be automated reliably; test the event wiring (`listening` class, tooltip) instead of the transcript.

## Known limitations

- Only top-level frames (no iframes) and only `<input>`/`<textarea>`; no `contenteditable` or Shadow-DOM fields.
- Chrome/Edge only; requires internet (audio is processed by a web service).
- Button position is updated on focus, scroll and resize only.
- Plain `.value` assignment: React-style controlled inputs and undo history need extra work ([06](06-text-insertion.md)).
- Publishing: exclude `docs/`, `.git/` and other dev files from the Web Store ZIP, and describe the audio processing in the privacy policy.
