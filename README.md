# Voice Input Assistant for Chrome

**Presented by:** Armen Martirosyan  
**Year:** 2026 [1]

## Agenda

1. The Problem
2. The Idea
3. Fields to Support
4. Pipeline/Architecture
5. The Role of Browser Speech Recognition
6. Example
7. MVP Scope
8. Tools & Libraries
9. Challenges & Limitations
10. Next Steps [1]

## The Problem

Typing long text is slow and not always convenient. [1]

## The Idea

When a user focuses a supported text field, the extension shows a microphone button beside it.

Clicking the microphone starts speech recognition.

While listening, the microphone becomes a stop/pause control.

Clicking it again stops recording and inserts the recognized text into the focused field.

The interaction is fast, contextual, and does not require leaving the current webpage. [1]

## Fields to Support

The extension should support the following fields:

- `<input type="text">`
- `<input type="search">`
- `<input type="email">`
- `<textarea>`

Password fields should be excluded to protect privacy and avoid unsafe voice entry. [1]

## Pipeline / Architecture

The presentation includes a section titled **“Pipeline / Architecture,”** but no additional architecture details or diagram text are provided. [1]

## The Role of Browser Speech Recognition

### Speech Recognition Role

The extension uses Chrome’s built-in Web Speech API.

It listens to microphone audio and produces a text transcript.

No custom speech-to-text model or separate AI backend is required for the MVP.

The browser handles recognition, while the extension handles:

- Field detection
- Button UI
- Text insertion

The microphone is activated only after an explicit user click. [1]

## Example

1. A user clicks a message or email text field on any website.
2. A small microphone icon appears next to the focused field.
3. The user clicks the icon and says:
   > “Hello, I would like to schedule a meeting for next Tuesday.”
4. The icon changes to a stop control while listening.
5. The user clicks stop.
6. The recognized sentence is inserted into the field. [1]

## MVP Scope

The MVP is a Chrome-only extension built with Manifest V3.

It includes:

- Manual start and stop using an injected microphone button
- Support for text, search, email, and textarea fields
- Web Speech API integration for speech-to-text conversion
- Use of the browser’s default language setting
- Basic handling for microphone permissions
- Basic handling for recognition errors

The first version does **not** include:

- A cloud backend
- User accounts
- Audio storage
- Cross-browser support [1]

## Tools & Libraries

### Chrome Extensions Manifest V3

Used for extension configuration and permissions.

### JavaScript

Used for extension behavior and DOM interaction.

### Content Scripts

Used to detect focused fields and inject the microphone button.

### Web Speech API

Used for speech-to-text transcription.

### HTML and CSS

Used to create the microphone button and lightweight user interface.

### Chrome Storage API

Planned for future preferences, such as:

- Enable/disable state
- Language selection

### Chrome DevTools and Manual Website Testing

Used for debugging and validation. [1]

## Challenges & Limitations

The project may face the following challenges:

- Detecting editable fields reliably across different websites
- Keeping the button correctly positioned during scrolling, resizing, and layout changes
- Avoiding conflicts with each website’s styles and existing interface
- Variations in Web Speech API availability and behavior across browsers and environments
- Recognition accuracy issues caused by:
  - Accents
  - Punctuation
  - Background noise
  - Microphone quality
- Ensuring that microphone permissions and privacy controls are clear and user-controlled [1]

## Next Steps

Planned future improvements include:

- Adding language selection
- Adding automatic language detection
- Adding keyboard shortcuts
- Supporting customizable button positioning
- Supporting customizable button appearance
- Adding voice commands such as:
  - “New line”
  - “Delete last word”
- Improving support for rich-text editors
- Improving support for iframes
- Improving support for Shadow DOM fields
- Improving accessibility through ARIA labels
- Supporting keyboard-only operation
- Expanding support to Microsoft Edge and other Chromium-based browsers
- Exploring offline or local speech-recognition options [1]

## Summary

Voice Input Assistant for Chrome enables simple and quick typing directly where users already work. [1]
