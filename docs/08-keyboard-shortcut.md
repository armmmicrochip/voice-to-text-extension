# 08 — Keyboard Shortcut

File: `modules/shortcut.js`, used by `modules/main.js` (`handleKeyDown`), `modules/ui.js` (tooltip) and `popup.js` (label).

**Shortcut:** Ctrl+Shift+Space on Windows/Linux, **Cmd**+Shift+Space on macOS. It toggles
recording for the focused field (or stops an active recording).

## The problem with the first version (Alt+Shift+V)

```js
e.altKey && e.shiftKey && e.key === "V"
```

On macOS, **Option+Shift+V produces a different character** (not `"V"`), so `e.key === "V"` was
never true and the shortcut silently did nothing. Two lessons:

1. [`KeyboardEvent.key`](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key) is *the character produced*; it changes with modifiers and keyboard layout (Cyrillic, Armenian, AZERTY…).
2. [`KeyboardEvent.code`](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code) is *the physical key* (`"Space"`, `"KeyV"`); it is stable across layouts. Use `code` for shortcuts.

## The current implementation

```js
const platform = navigator.userAgentData?.platform || navigator.platform || "";
export const IS_MAC = /mac|iphone|ipad/i.test(platform);

export function isToggleShortcut(e) {
  const primary = IS_MAC ? e.metaKey && !e.ctrlKey : e.ctrlKey && !e.metaKey;
  return primary && e.shiftKey && !e.altKey && e.code === "Space" && !e.repeat;
}
```

- **Primary modifier by platform.** macOS convention is Cmd (`metaKey`); elsewhere Ctrl. We also require the *other* one to be off, so Ctrl+Shift+Space on a Mac (or Win+Shift+Space on Windows) does not trigger.
- **`!e.altKey`** avoids accidental matches with Alt-based layouts.
- **`!e.repeat`** ignores auto-repeat while the keys are held, otherwise recording would flip on and off many times.
- Platform detection: [`navigator.userAgentData`](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/userAgentData) where available, else the older [`navigator.platform`](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/platform).
- The listener is registered in the **capture** phase and calls `preventDefault()`, so the page does not also react to the keys. It only acts when a field is active or recording is running.

## Why Space and not a letter

| Candidate | Problem |
|-----------|---------|
| Ctrl/Cmd+Shift+V | "Paste as plain text" in browsers |
| Ctrl/Cmd+Shift+M, +N, +T, +W … | Reserved by Chrome (profile menu, new window, reopen tab, …); pages often cannot intercept them |
| Letter keys with Option/Alt | Different characters on Mac; layout dependent |
| **Ctrl/Cmd+Shift+Space** | Not used by Chrome; layout independent via `code` |

Change the key in one place (`isToggleShortcut` and `SHORTCUT_LABEL`) and every label updates.

## Alternative: `chrome.commands`

The [`commands`](https://developer.chrome.com/docs/extensions/reference/api/commands) API lets you
declare `suggested_key: { default: "Ctrl+Shift+Space", mac: "Command+Shift+Space" }` in the
manifest; users can rebind it at `chrome://extensions/shortcuts`, and it works even when a page
swallows key events. Cost: it needs a background service worker plus
`chrome.tabs.sendMessage` to reach the content script, and Chrome limits suggested keys
(they must include Ctrl/Alt/Command). We chose an in-page listener for simplicity and zero
extra permissions. Comparing both is a good student project.

## Test matrix

| Pressed | Windows/Linux | macOS |
|---------|--------------|-------|
| Ctrl+Shift+Space | toggles | ignored |
| Cmd+Shift+Space | ignored (Win key) | toggles |
| Ctrl+Space | ignored | ignored |
| Held down | one toggle | one toggle |
