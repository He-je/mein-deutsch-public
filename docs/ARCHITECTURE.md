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
