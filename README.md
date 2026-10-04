# Mein Deutsch

A local-first German study app with sentence explanations, vocabulary review,
speech controls and an A1-C2 grammar library. This public source edition includes
an original demonstration text and the existing Android host.

## Try the browser preview

Install Node.js 22 or newer, then run from this folder:

```sh
npm start
```

Open **http://127.0.0.1:4174** and select **Try the sample article**, then confirm
the import. The preview and core tests use Node's built-in modules; installing
packages is only needed for the optional browser tests. No API key is required.

## Features

- Import or paste structured German study JSON with English explanations.
- Read full texts; tap individual sentences for translations and vocabulary.
- Highlight subject, modal, object and main verb roles supplied in the study file.
- Listen to sentences or a complete text, with pause/resume controls.
- Browse vocabulary as cards or a list, filter it, and mark review progress.
- Study 80 bundled grammar topics grouped into A1-C2.
- Export and restore local backups; switch between English and German menus.

The browser uses localStorage and browser speech synthesis. Android uses an
app-private JSON library and native text-to-speech. Their libraries are independent;
automatic device synchronization is not implemented. Android-specific settings and
physical-device behavior cannot be validated by the browser preview.

## Project layout

| Path | Purpose |
| --- | --- |
| `app/` | Web interface, import logic, grammar and original demo |
| `android/` | Custom Android WebView host, storage and speech bridge |
| `tests/` | Core and browser regression tests with original fixtures |
| `import-kit/` | Study format, reusable prompt and sample JSON |
| `docs/` | User guide, architecture, build instructions and publication scope |

See [User guide](docs/USER_GUIDE.md), [Architecture](docs/ARCHITECTURE.md),
[Development and tests](docs/DEVELOPMENT.md), [Grammar notes](docs/GRAMMAR_CONTENT.md)
and [Public scope](docs/PUBLIC_SCOPE.md). See the dated
[Validation record](docs/VALIDATION.md) for verified behavior and remaining limits.

## Status

This source baseline is version 1.0.6. It is a portfolio/development edition, not a
new Android release. No installer or signing key is distributed here. Capacitor
experiments, iPhone support, cloud services and automatic sync are not included.
Grammar levels are editorial study groupings, not a certified course.

This is an AI-assisted personal project. AI tools assisted code, study content and
documentation preparation. Automated checks cover specific behaviors; they do not
substitute for device testing or independent language review.
