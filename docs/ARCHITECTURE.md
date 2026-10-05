# Architecture

The current application uses HTML, CSS and JavaScript modules. `app/core.mjs`
validates imports, handles word identity, merges article data and validates backups.
`app/app.mjs` renders the interface and coordinates storage and speech.

On Android, `MainActivity.java` hosts packaged web assets in a WebView. A native
bridge handles file import/export, an app-private `library.json` with `AtomicFile`,
and Android text-to-speech. The manifest does not request Internet permission.

For browser development, `preview.mjs` serves `app/` on the loopback interface.
`preview-public.mjs` defaults to port 4174. Browser storage uses localStorage;
speech uses the browser's available speech engine and voices.

Study files are versioned JSON. Sentence segments must reproduce the sentence
exactly. Vocabulary identity uses normalized kind, headword and meaning, so the
same identity can collect examples from different texts without resetting progress.
Backup restoration replaces the library; it is not a merge or synchronization feature.

ChatGPT can prepare study JSON outside the application using the supplied prompt.
There is no embedded LLM API, account server, cloud database or automatic sync.
Device voice availability varies. Browser tests mock native calls and cannot prove
Android lifecycle, audio output, installation or upgrade behavior.

## Capacitor migration (1.0.7)

`capacitor/scripts/stage.mjs` applies the shared async storage and speech overlays
to the legacy UI. `StudyStoragePlugin` serializes atomic library reads/writes and
reports picker/export cancellation separately from success. `StudySpeechPlugin`
uses Android TTS lifecycle callbacks with generation/token guards; the JavaScript
controller orders commands and cancels stale queued playback. `MainActivity`
registers the plugins and handles native back navigation. The legacy JavaScript
interface is removed from the staged UI.

The public app uses its own application ID and private storage. The unchanged
WebView hostname and vocabulary preferences support the production migration
strategy; the public ID does not read or upgrade the user's personal app data.
