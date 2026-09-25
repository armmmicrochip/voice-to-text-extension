# 02 — Manifest and Module Loading

## Annotated `manifest.json`

| Key | Value here | What / why |
|-----|-----------|------------|
| `manifest_version` | `3` | Required for new extensions; MV2 is being retired. MV3 = service workers, `action`, stricter CSP. |
| `name`, `version`, `description` | — | Shown in `chrome://extensions` and the Web Store. Bump `version` on every release. |
| `action.default_popup` | `popup.html` | Page opened when the toolbar icon is clicked ([07](07-storage-and-popup.md)). |
| `icons`, `action.default_icon` | 16/48/128 px PNGs | Each size is a **separate real file**; referencing a missing file breaks the manifest. |
| `content_scripts[].matches` | `["<all_urls>"]` | Inject on every site; the button must work anywhere. See [match patterns](https://developer.chrome.com/docs/extensions/develop/concepts/match-patterns). |
| `content_scripts[].js` | `["content.js"]` | The loader (see below). |
| `content_scripts[].css` | `["content.css"]` | Injected into the page; only the toast uses it. |
| `content_scripts[].run_at` | `document_idle` | After the DOM is ready; recommended default, no need to block page load. |
| `web_accessible_resources` | `shadow.css`, `modules/*.js` | Files the *page context* may fetch. Required for the stylesheet and the dynamic imports. |
| `permissions` | `["storage"]` | Only what we use: `chrome.storage.sync`. |

Not present on purpose: `host_permissions` (we never call `fetch` on other origins), `tabs`,
`activeTab`, `scripting`, `background`. Ask "does the code call it?" before adding a permission.

## The module-loading problem (the bug that shaped the project)

We split the content script into ES modules (`import { state } from "./state.js"`). Loading it
gave:

```
Uncaught SyntaxError: Cannot use import statement outside a module
```

and **no microphone button appeared anywhere**.

**Cause.** An earlier manifest had `"type": "module"` inside `content_scripts`. That key does not
exist in Chrome's [content_scripts schema](https://developer.chrome.com/docs/extensions/reference/manifest/content-scripts)
(supported keys: `matches`, `js`, `css`, `run_at`, `all_frames`, `world`, …), so Chrome ignored it
and ran the file as a **classic script**. Classic scripts cannot contain static `import`
statements, so the script died at parse time. (`"type": "module"` *is* valid for
`background.service_worker`, and for `<script type="module">` in extension pages such as the popup.)

**Fix.** Keep `content.js` a classic script and let it load the real code with **dynamic
`import()`**, which classic scripts are allowed to use:

```js
(async () => {
  try {
    await import(chrome.runtime.getURL("modules/main.js"));
  } catch (err) {
    console.error("[VoiceInput] Failed to load modules:", err);
  }
})();
```

`modules/main.js` then uses ordinary static imports of its siblings (`./state.js`, …).

### Options we had

| Option | Result |
|--------|--------|
| Bundler (Vite, esbuild, webpack…) | Works, produces one file; but adds a build step, config and `node_modules` to a teaching project |
| One big `content.js` | Works, but throws away the modular structure |
| **Loader + dynamic `import()`** | **Chosen:** no tooling, keeps modules, loader is 8 lines |

### Consequences of the chosen option

- **`web_accessible_resources` is mandatory.** The import is a fetch of `chrome-extension://<id>/modules/main.js` made from the page's context, and every module in the import graph (`state.js`, `ui.js`, …) is fetched the same way. Hence `"modules/*.js"`. Without it the console shows `Failed to fetch dynamically imported module`.
- **Detectability.** Any site can probe web-accessible URLs and learn the extension is installed. Chrome offers a `use_dynamic_url` option for this; see the [web_accessible_resources reference](https://developer.chrome.com/docs/extensions/reference/manifest/web-accessible-resources). Worth researching as an improvement.
- **Still an isolated world.** We verified that modules loaded this way can use `chrome.runtime.getURL` and `chrome.storage` (they run in the content script's isolated world, not the page's).
- **Loading is async.** The button code starts slightly after `document_idle`, so `init()` checks whether a field is *already* focused (autofocus) — otherwise no `focusin` would ever fire for it.

## Popup is different

`popup.html` is an extension page (`chrome-extension://…`), so `<script type="module" src="popup.js">`
works normally and `popup.js` can `import` from `modules/shortcut.js` directly. No loader and no
`web_accessible_resources` needed there.

## Reload rules (a common student trap)

- Changing `manifest.json` or any file → click **Reload** on the extension in `chrome://extensions`.
- Content scripts are injected only into pages loaded **after** the reload → refresh the tab too.
