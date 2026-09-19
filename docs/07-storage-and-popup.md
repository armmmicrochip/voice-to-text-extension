# 07 — Storage and Popup

Files: `modules/storage.js`, `popup.html`, `popup.css`, `popup.js`.

## What is stored

One key: `language` (a BCP 47 tag such as `en-US`, `ru-RU`, `hy-AM`) in
[`chrome.storage.sync`](https://developer.chrome.com/docs/extensions/reference/api/storage).
Default when nothing is saved: `navigator.language`, then `"en-US"`.

## Why `chrome.storage`, not `localStorage`

- The popup and the content script live in **different origins** (`chrome-extension://…` vs each website). `localStorage` is per-origin, so they could never share it, and a site's `localStorage` is visible to that site.
- `chrome.storage` is shared by all extension contexts and needs the `storage` permission (the only one we request).
- `sync` (vs `local`) follows the user across devices signed in to Chrome. Trade-off: small quotas (about 100 KB total, 8 KB per item). Use `chrome.storage.local` if you store large or device-specific data.

## Data flow

```
popup.js  ── chrome.storage.sync.set({language}) ──►  storage
                                                       │ onChanged
content script (each open tab) ◄───────────────────────┘
   state.currentLang = newValue   ──►  used by the next recognition.start()
```

- **On page load:** `loadLanguage()` calls `chrome.storage.sync.get("language", …)` and stores the result in `state.currentLang`.
- **While the page is open:** `subscribeToLanguageChanges()` registers `chrome.storage.onChanged`. The listener fires for every storage area, so it filters `area === "sync" && changes.language`. Result: changing the language in the popup affects all open tabs immediately, no reload.
- Both functions start with `if (typeof chrome === "undefined" || !chrome.storage) return;`, which keeps the module importable in non-extension contexts (for example a plain test page).

## The popup

`popup.html` is a normal HTML page opened by the toolbar button ([`action.default_popup`](https://developer.chrome.com/docs/extensions/reference/api/action)).

- Shows the usage steps. The shortcut text is filled in by `popup.js` from `modules/shortcut.js`, so Mac users see **Cmd** and others see **Ctrl**.
- Shows an "Unsupported" badge when `SpeechRecognition` does not exist in the popup's browser.
- A language `<select>`: on open, it reads the saved value; if that value is not in the list (for example the browser default `fr-CA`), it inserts a matching option so nothing is silently replaced.
- On `change` it saves immediately and shows "Saved ✓". **Why immediate:** a popup is destroyed as soon as it loses focus, so there is no reliable "Save" moment.
- Extension pages cannot use inline `<script>` code (default extension CSP), which is why logic lives in `popup.js`, loaded with `<script type="module" src="popup.js">`.

## Exercises

1. Add an "Enabled on this site" switch stored per hostname.
2. Convert the callback style to `await chrome.storage.sync.get(...)` (promises are supported in MV3).
3. Add the `hy-AM` (Armenian) option if it is missing and check that recognition starts in it.
