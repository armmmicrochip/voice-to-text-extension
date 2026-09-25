# 05 — Speech Recognition

File: `modules/speech.js`. API: [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
(`SpeechRecognition`, [spec](https://webaudio.github.io/web-speech-api/)).

## Why the Web Speech API

It is built into Chrome, needs no API key, backend or model, and is enough for an MVP. The
trade-offs are in "Limits" below. In Chrome the constructor is prefixed, so we do:

```js
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SR) { showToast("Speech recognition is not supported…"); return; }
```

## Configuration

```js
recognition.continuous     = true;   // keep listening across pauses until we stop it
recognition.interimResults = true;   // emit partial (not yet final) text for the live preview
recognition.lang           = state.currentLang;   // BCP 47 tag, e.g. "en-US", "hy-AM"
```

`lang` comes from the popup setting or falls back to `navigator.language`
([07](07-storage-and-popup.md)); it is read at each `start`, so a change applies to the next dictation.

## Event lifecycle

| Event | What we do |
|-------|-----------|
| `start` | `state.isListening = true`, switch button to the stop icon |
| `result` | Rebuild the preview from **new** results only (see below) |
| `error` | `no-speech` and `aborted` are ignored; `not-allowed` shows a toast; anything else shows the error code |
| `end` | Reset state, clear preview, **insert the transcript** into the active field |

Insertion happens in `onend`, not in `onresult`. **Why:** the user asked for "stop, then insert";
`stop()` finishes processing what was already captured and then fires `end`, so the last words are
not lost. (`abort()` would discard them.)

### Reading results correctly

```js
for (let i = event.resultIndex; i < event.results.length; i++) {
  const result = event.results[i];
  if (result.isFinal) state.finalTranscript += result[0].transcript;
  else                interim += result[0].transcript;
}
```

`event.results` is a list that keeps growing during a session. Starting at `event.resultIndex`
avoids re-adding results we already consumed. Final text is accumulated in
`state.finalTranscript`; interim text is thrown away and rebuilt on each event. `result[0]` is the
best alternative (`[0]` = highest confidence).

## Permissions and privacy

- The first `start()` on a site makes Chrome show the microphone permission prompt for **that site's origin**. If the user blocks it we get `error: not-allowed` and show a clear toast.
- The microphone is only activated after an explicit click or shortcut. There is no background listening.
- In Chrome the audio is sent to a web service for recognition (MDN: "server-based recognition engine… Your audio is sent to a web service… so it won't work offline"). Say this in any privacy statement; it matters for the Web Store review.

## Limits worth knowing

- **Chrome/Edge only** (prefixed API); other browsers vary. Check [Can I use](https://caniuse.com/speech-recognition).
- Needs a network connection.
- Recognition can stop on its own after silence or a service limit; our `end` handler simply inserts whatever was captured and resets the UI.
- Accuracy depends on accent, noise, microphone and the selected `lang`.
- Only one recognition session at a time: `start()` while already running throws, which is why the call is wrapped in `try/catch` and resets state on failure.

## Exercises

1. Add a `lang` list entry for another language and dictate in it.
2. Show the confidence value (`result[0].confidence`) in the preview.
3. Use `abort()` for an "Esc to cancel" behaviour that inserts nothing.
