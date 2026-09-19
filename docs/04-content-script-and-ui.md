# 04 — Content Script and UI

Files: `modules/main.js`, `modules/ui.js`, `modules/fields.js` (`isSupportedField`), `shadow.css`, `content.css`.

## Isolated world

A content script shares the page's **DOM** but has its own **JavaScript world**: it cannot read
the page's variables and the page cannot read ours, yet we still get `chrome.*`. Read
[Work in isolated worlds](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts).
This is why we can safely read `document.activeElement` and add elements, but cannot call a
site's own functions.

## Which fields get a button (`isSupportedField`)

A field qualifies when it is a `<textarea>` or an `<input>` of type `text`, `search` or `email`
(an input with no `type` attribute counts as `text`), and is not `disabled` or `readOnly`.

**Why not `password`:** privacy and unsafe voice entry. **Why not `tel/url/number`:** kept out of
the MVP to limit behaviour surprises; add them to `SUPPORTED_INPUT_TYPES` if wanted.
`contenteditable` editors are *not* supported (they need a different insertion strategy).

## Tracking focus (`main.js`)

```js
document.addEventListener("focusin",  handleFocusIn,  true);   // capture
document.addEventListener("focusout", handleFocusOut, true);
```

- We use `focusin/focusout` because, unlike `focus/blur`, they **bubble**, so one listener on `document` covers every field, including fields added later by SPAs.
- Capture (`true`) means we see the event before the page can stop it.
- **`focusout` waits 150 ms** before hiding. Moving focus from one field to another fires `focusout` then `focusin`; hiding immediately would make the button flicker. After the delay we re-check `document.activeElement`.
- The button is **never hidden while recording**, so the user can always stop.

## Why a Shadow DOM button (`ui.js`)

Websites ship aggressive CSS (`button { … }`, `* { … }`). Elements we put in the page would be
restyled by it, and our CSS would leak into the site. A
[Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM)
gives a boundary in both directions.

Structure built by `buildUI()`:

```
<div id=host style="position:fixed; z-index:2147483647; display:none">   ← appended to <html>
  #shadow-root (open)
    <link rel=stylesheet href=chrome-extension://…/shadow.css>
    <div class=wrapper>
      <button>  (mic or stop SVG)
      <div class=preview><span class=final/><span class=interim/></div>
```

- Host is appended to `document.documentElement` (not `body`) so it survives pages that replace `<body>`.
- `z-index: 2147483647` is the maximum, keeping the button above site UI.
- The stylesheet is loaded with `chrome.runtime.getURL("shadow.css")`, which is why it is a web-accessible resource.
- `content.css` only styles the **toast**, because the toast lives in the page, not in the shadow root.
- The button has an `aria-label` and `title` (with the shortcut), set in `setButtonState()`, so icon-only UI is still accessible.

## Keeping focus while clicking

Clicking a button normally moves focus away from the text field, which would fire `focusout` and
lose the caret. We cancel it:

```js
micBtn.addEventListener("mousedown", (e) => e.preventDefault());
```

and `handleMicClick()` calls `activeField.focus()` afterwards as a safety net.

## Positioning (`positionButton`)

1. `rect = field.getBoundingClientRect()` gives viewport coordinates, which match `position: fixed`.
2. Default: vertically centred, 6 px to the right of the field.
3. If that would overflow the viewport width, tuck it inside the field's right edge.
4. Clamp vertically to stay on screen.

It is recalculated on `focusin`, `scroll` and `resize`. The scroll listener uses
`{ capture: true, passive: true }` because **scroll events do not bubble**: capturing lets us hear
scrolling of any inner scroll container, not just the window. `passive` promises we never call
`preventDefault`, keeping scrolling smooth.

Known limit: if a page moves the field with CSS animation or JS without scrolling/resizing, the
button is not repositioned (a `ResizeObserver`/`IntersectionObserver` would be the next step).

## Toast

`showToast(message)` appends a `.via-toast` element to the page for 4 s (used for "microphone
denied" and "unsupported browser"). It is styled by `content.css`.
