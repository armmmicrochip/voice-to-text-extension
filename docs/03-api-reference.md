# 03 — API Reference

Every API the extension uses, where it is used, and the gotchas worth knowing. Follow the links
for the authoritative description.

## A. Chrome extension APIs and manifest features

| API / feature | Used in | Purpose | Gotchas |
|---------------|---------|---------|---------|
| [Manifest file format](https://developer.chrome.com/docs/extensions/reference/manifest) | `manifest.json` | Declares everything the extension is | Unknown keys are silently ignored (this caused our `"type": "module"` bug) |
| [`content_scripts`](https://developer.chrome.com/docs/extensions/reference/manifest/content-scripts) | `manifest.json` | Auto-inject `content.js` + `content.css` into pages | No `type: module`; runs only in pages loaded after install/reload; not on `chrome://` pages or the Web Store |
| [Content scripts concept](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts) | all `modules/` | Code that shares the page DOM but has its own JS world | Cannot see the page's JS variables; page cannot see ours |
| [`web_accessible_resources`](https://developer.chrome.com/docs/extensions/reference/manifest/web-accessible-resources) | `manifest.json` | Lets pages fetch `shadow.css` and `modules/*.js` | Exposes the files to any site; scope `matches` as tightly as possible |
| [Match patterns](https://developer.chrome.com/docs/extensions/develop/concepts/match-patterns) | `manifest.json` | `<all_urls>` selects where the script runs | `file://` pages need the user to enable "Allow access to file URLs" |
| [`chrome.runtime.getURL(path)`](https://developer.chrome.com/docs/extensions/reference/api/runtime) | `content.js`, `modules/ui.js` | Turns a packaged path into `chrome-extension://<id>/path` | ID differs between unpacked and Web Store installs, so never hard-code it |
| [`chrome.storage.sync`](https://developer.chrome.com/docs/extensions/reference/api/storage) `.get / .set` | `modules/storage.js`, `popup.js` | Persist the recognition language, synced across the user's Chrome profile | Small quota (about 100 KB total, 8 KB per item); values are async; callback or promise style |
| `chrome.storage.onChanged` | `modules/storage.js` | Tell open pages the language changed without a reload | Fires for *all* areas; check `area === "sync"` |
| [`action.default_popup`](https://developer.chrome.com/docs/extensions/reference/api/action) | `manifest.json`, `popup.*` | Toolbar-button popup UI | Popup is destroyed when it loses focus, so save immediately on change |
| [Permissions](https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions) | `manifest.json` | We declare only `storage` | Each extra permission raises a warning at install and needs a Web Store justification |

## B. Web platform APIs (work in any page, used from the content script)

### Speech
| API | Used in | Purpose |
|-----|---------|---------|
| [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) ([spec](https://webaudio.github.io/web-speech-api/)) | `modules/speech.js` | Speech-to-text |
| [`SpeechRecognition`](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition) (`webkitSpeechRecognition` in Chrome) | same | `continuous`, `interimResults`, `lang`, `start()`, `stop()`, events |
| [`SpeechRecognitionEvent`](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognitionEvent) / [`SpeechRecognitionResult`](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognitionResult) | same | `resultIndex`, `results[i].isFinal`, `results[i][0].transcript` |
| [`SpeechRecognitionErrorEvent`](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognitionErrorEvent) | same | `error` codes: `not-allowed`, `no-speech`, `aborted`, … |

### DOM, events and layout
| API | Used in | Purpose |
|-----|---------|---------|
| [`focusin`](https://developer.mozilla.org/en-US/docs/Web/API/Element/focusin_event) / [`focusout`](https://developer.mozilla.org/en-US/docs/Web/API/Element/focusout_event) | `main.js` | Detect entering/leaving a field (these bubble; `focus`/`blur` do not) |
| [`addEventListener` (capture, passive)](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener) | `main.js` | Capture phase catches events the page might stop; `passive` keeps scrolling smooth |
| [`Document.activeElement`](https://developer.mozilla.org/en-US/docs/Web/API/Document/activeElement) | `main.js` | Currently focused element (autofocus, post-blur checks) |
| [`getBoundingClientRect()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect) | `ui.js` | Field position in viewport coordinates |
| [`attachShadow`](https://developer.mozilla.org/en-US/docs/Web/API/Element/attachShadow) / [Shadow DOM guide](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM) | `ui.js` | Style-isolated container for the button |
| [CSS `position: fixed`](https://developer.mozilla.org/en-US/docs/Web/CSS/position) | `ui.js` | Button follows the viewport; coordinates match `getBoundingClientRect` |
| [`aria-label`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-label) | `ui.js` | Screen-reader name for an icon-only button |

### Text and input
| API | Used in | Purpose |
|-----|---------|---------|
| `selectionStart` / `selectionEnd`, [`setSelectionRange`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/setSelectionRange) | `fields.js` | Insert at the caret, then move the caret after the new text |
| [`InputEvent`](https://developer.mozilla.org/en-US/docs/Web/API/InputEvent) + `Event("change")` | `fields.js` | Make frameworks and validation notice a programmatic change |

### Keyboard and platform
| API | Used in | Purpose |
|-----|---------|---------|
| [`KeyboardEvent.code`](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code) vs [`.key`](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key) | `shortcut.js` | `code` = physical key (layout independent), `key` = produced character |
| [`navigator.userAgentData`](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/userAgentData) / [`navigator.platform`](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/platform) | `shortcut.js` | Detect macOS to choose Cmd vs Ctrl |

### JavaScript language features
[ES modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) (static `import`/`export`
in `modules/` and the popup) and [dynamic `import()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import)
(in `content.js`).

## C. Things we deliberately do *not* use (and could)

`chrome.commands` (global shortcuts, see [08](08-keyboard-shortcut.md)), `chrome.scripting`
(programmatic injection), `chrome.runtime` messaging, service workers, `all_frames`. Each is a
possible extension of the project; see [10](10-student-research-guide.md).
