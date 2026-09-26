# 10 — Student Research Guide

Goal: after studying the linked official documentation you should be able to **build this
extension yourself** and explain every design decision. This guide does not give the answers; it
lists **what to study, why it matters here, and what to be able to answer**. Documents 01–09 show one
finished solution to compare against afterwards.

Links are official sources (Chrome for Developers, MDN, W3C/WICG). Work in order; each stage ends with a
runnable milestone.

---

## Stage 1 — Extension fundamentals

| Study | Link |
|-------|------|
| Build your first extension | [Get started](https://developer.chrome.com/docs/extensions/get-started) |
| Extension development overview | [Develop](https://developer.chrome.com/docs/extensions/develop) |
| Manifest file format (all keys) | [Manifest reference](https://developer.chrome.com/docs/extensions/reference/manifest) |
| Why Manifest V3 | [Migrate to MV3](https://developer.chrome.com/docs/extensions/develop/migrate) |
| Permissions and least privilege | [Declare permissions](https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions) |

**Be able to answer:** What is the difference between a content script, a popup and a service worker?
Which files does Chrome read, and which does it ignore? Why is `"permissions": ["storage"]` enough here?

**Milestone:** an unpacked extension that shows a popup and logs "hello" from a content script on every page.

## Stage 2 — Content scripts

| Study | Link |
|-------|------|
| Content scripts and isolated worlds | [Content scripts concept](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts) |
| `content_scripts` manifest keys (`matches`, `run_at`, `all_frames`, `world`) | [Reference](https://developer.chrome.com/docs/extensions/reference/manifest/content-scripts) |
| Which URLs to target | [Match patterns](https://developer.chrome.com/docs/extensions/develop/concepts/match-patterns) |
| Packaged files and URLs | [`chrome.runtime`](https://developer.chrome.com/docs/extensions/reference/api/runtime) |
| Files pages may fetch | [`web_accessible_resources`](https://developer.chrome.com/docs/extensions/reference/manifest/web-accessible-resources) |

**Be able to answer:** Why can't a content script call a function defined by the page? When does
`document_idle` run? Why is `web_accessible_resources` needed for a stylesheet loaded into a page?

**Milestone:** the content script draws a fixed-position dot in the corner of any page.

## Stage 3 — Modern JavaScript without a bundler (research task)

| Study | Link |
|-------|------|
| ES modules (`import`/`export`) | [MDN: Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) |
| Dynamic `import()` | [MDN: import()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import) |
| Content-script schema | [content_scripts reference](https://developer.chrome.com/docs/extensions/reference/manifest/content-scripts) |

**Research question:** Split your script into modules. You will hit
`Cannot use import statement outside a module`. Find out why, list three ways to solve it and their trade-offs
(compare with [02](02-manifest-and-module-loading.md) only after you have written your own answer).

**Milestone:** a multi-file content script that loads without a build tool.

## Stage 4 — DOM, events and layout

| Study | Link |
|-------|------|
| `focusin` / `focusout` vs `focus` / `blur` | [focusin](https://developer.mozilla.org/en-US/docs/Web/API/Element/focusin_event), [focusout](https://developer.mozilla.org/en-US/docs/Web/API/Element/focusout_event) |
| Capture vs bubble, `passive` | [addEventListener](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener) |
| Current focus | [activeElement](https://developer.mozilla.org/en-US/docs/Web/API/Document/activeElement) |
| Element geometry | [getBoundingClientRect](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect) |
| Fixed positioning | [CSS position](https://developer.mozilla.org/en-US/docs/Web/CSS/position) |
| Style isolation | [Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM), [attachShadow](https://developer.mozilla.org/en-US/docs/Web/API/Element/attachShadow) |
| Accessible icon buttons | [aria-label](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-label) |

**Be able to answer:** Why do scroll events need `capture: true`? Why does clicking a button steal focus
and how do you stop it? Why put UI in a Shadow DOM on a page you do not own?

**Milestone:** a button that follows the focused field, does not flicker between fields, and is unaffected by the page's CSS.

## Stage 5 — Speech recognition

| Study | Link |
|-------|------|
| Concepts and examples | [Using the Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API) |
| API overview and spec | [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API), [W3C/WICG spec](https://webaudio.github.io/web-speech-api/) |
| Interface details | [SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition), [Event](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognitionEvent), [Result](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognitionResult), [ErrorEvent](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognitionErrorEvent) |
| Language codes | [`lang`](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/lang), [W3C: language tags](https://www.w3.org/International/articles/language-tags/) |
| Browser support | [Can I use](https://caniuse.com/speech-recognition) |
| Secure contexts and microphone access | [Secure Contexts](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts), [getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) |

**Be able to answer:** What do `continuous` and `interimResults` change? What does `resultIndex` prevent?
Difference between `stop()` and `abort()`? Where does the audio go, and what must a privacy policy say?

**Milestone:** dictate into a field with a live preview and a working stop control.

## Stage 6 — Writing text into fields

| Study | Link |
|-------|------|
| Caret and selection | [setSelectionRange](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/setSelectionRange) |
| Synthetic events | [InputEvent](https://developer.mozilla.org/en-US/docs/Web/API/InputEvent) |

**Research question:** Why does assigning `input.value` in a content script not update a React-controlled
input? Test which input types support `selectionStart`, then read [06](06-text-insertion.md).

**Milestone:** insertion that respects caret/selection, works in `email` fields, and notifies the page.

## Stage 7 — Persistence and popup

| Study | Link |
|-------|------|
| `chrome.storage` (`sync` vs `local`, `onChanged`) | [storage API](https://developer.chrome.com/docs/extensions/reference/api/storage) |
| Toolbar popup | [`action` API](https://developer.chrome.com/docs/extensions/reference/api/action) |
| Extension CSP (why no inline scripts) | [Improve extension security](https://developer.chrome.com/docs/extensions/develop/migrate/improve-security) |

**Be able to answer:** Why can't the popup and the page share `localStorage`? What are the `sync` quotas?
Why must the popup save on `change` instead of on a Save button?

**Milestone:** a language selector whose value affects already-open tabs without a reload.

## Stage 7b — Cross-platform keyboard shortcut

| Study | Link |
|-------|------|
| `code` vs `key` | [KeyboardEvent.code](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code), [KeyboardEvent.key](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key) |
| Platform detection | [userAgentData](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/userAgentData), [platform](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/platform) |
| Manifest-level shortcuts | [`commands` API](https://developer.chrome.com/docs/extensions/reference/api/commands) |

**Milestone:** Ctrl+Shift+Space on Windows and Cmd+Shift+Space on macOS, and an explanation of why Alt+Shift+V fails on a Mac.

## Stage 8 — Engineering practice (not only Chrome)

| Topic | Link |
|-------|------|
| Formatting and linting | [Prettier](https://prettier.io) |
| Browser automation for smoke tests | [Puppeteer](https://pptr.dev) |
| Communicating between extension parts | [Messaging](https://developer.chrome.com/docs/extensions/develop/concepts/messaging) |
| Programmatic injection | [`scripting` API](https://developer.chrome.com/docs/extensions/reference/api/scripting) |
| Background logic (if you add it) | [Service workers](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers) |
| Publishing | [Chrome Web Store: publish](https://developer.chrome.com/docs/webstore/publish) |

## Extension challenges (choose one)

1. Support `contenteditable` editors.
2. Detect fields inside iframes (`all_frames`) and open Shadow roots.
3. Per-site enable/disable toggle stored in `chrome.storage`.
4. Voice commands such as "new line" and "delete last word".
5. Replace the in-page shortcut with `chrome.commands` and message the content script.
6. Reduce detectability with `use_dynamic_url` and evaluate the trade-off.

## What to submit / how to self-check

- A working extension loaded unpacked, plus a short write-up answering each "Be able to answer" block in your own words.
- The [manual test checklist](09-testing-and-troubleshooting.md) completed on at least three different websites.
- A list of the limitations you found that are not in these documents.
