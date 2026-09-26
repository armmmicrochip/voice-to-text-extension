# Voice Input Assistant — Developer Documentation

A Manifest V3 Chrome extension that shows a microphone button next to text fields and inserts
what you say (Web Speech API) into the field. This folder explains **how it works** and **why it
was built this way**, and gives students a **research path** to build it themselves.

Audience: developers and students who know basic JavaScript/HTML/CSS but are new to browser
extensions.

## Reading order

| # | Document | Read it to learn |
|---|----------|------------------|
| 01 | [Overview and architecture](01-overview-and-architecture.md) | File map, runtime pieces, end-to-end flow |
| 02 | [Manifest and module loading](02-manifest-and-module-loading.md) | Every manifest key, and the ES-module loading problem we had to solve |
| 03 | [API reference](03-api-reference.md) | Every Chrome and Web API used, with links to the original docs |
| 04 | [Content script and UI](04-content-script-and-ui.md) | Focus tracking, Shadow DOM button, positioning |
| 05 | [Speech recognition](05-speech-recognition.md) | Web Speech API lifecycle, errors, privacy |
| 06 | [Text insertion](06-text-insertion.md) | Writing text into fields, framework caveats |
| 07 | [Storage and popup](07-storage-and-popup.md) | Saving the language, the popup page |
| 08 | [Keyboard shortcut](08-keyboard-shortcut.md) | A cross-platform (Ctrl / Cmd) shortcut |
| 09 | [Testing and troubleshooting](09-testing-and-troubleshooting.md) | Loading, debugging, error catalogue, known limits |
| 10 | [Student research guide](10-student-research-guide.md) | What to study (with official links) and a build-it-yourself path |

## Conventions

- Paths such as `modules/ui.js` are relative to the repository root, not to `docs/`.
- Each design section has a **Why** note: the constraint or problem that forced the choice.
- Documentation links point to official sources (developer.chrome.com, MDN, W3C/WICG specs).

## Why this folder is safe to keep inside the extension

Chrome only reads files the manifest points to, so `docs/` and its `.md` files never affect loading.
The only reserved naming rule is that file and folder names must not start with `_` (except
`_locales`). Do not put a `manifest.json` inside `docs/`. When packaging for the Chrome Web Store,
leave `docs/` (and `.git/`) out of the ZIP.
