# Mein Deutsch study format v1

The app imports UTF-8 JSON. See ChatGPT-Prompt.txt for the complete generation instructions and sample.json for a full working article.

## Root

| Field | Required | Value |
|---|---|---|
| type | yes | mein-deutsch-study |
| version | yes | 1 |
| id | yes | Stable unique ASCII article slug, up to 120 characters |
| title | yes | Original German title, up to 300 characters |
| language | yes | de |
| explanationLanguage | yes | en |
| source | no | Plain text, up to 1,000 characters |
| sentences | yes | 1-500 sentence objects, in reading order |

## Sentence

- id: nonempty string, unique within the article.
- text: full German sentence, up to 20,000 characters.
- translation: English translation, up to 20,000 characters.
- segments: optional array of up to 150 objects with text and role. All text values concatenated must exactly equal the sentence. Roles: plain, subject, modal, verb, object. Empty array means no colour annotation.
- vocabulary: array of up to 100 items.
- expressions: array of up to 50 items with text and meaning.

## Vocabulary

Each item has kind (noun, verb or other), lemma and meaning.
Nouns should include plural. Verbs should include past and perfect.
For nouns without an ordinary plural in the intended meaning, write a short explanatory string rather than inventing a form.

    {"kind":"noun","lemma":"das Buch","plural":"die Bücher","meaning":"book"}
    {"kind":"verb","lemma":"lesen","past":"las","perfect":"hat gelesen","meaning":"to read"}
    {"kind":"other","lemma":"heute","meaning":"today"}

## Expressions

    {"text":"ganz oder teilweise","meaning":"wholly or partly"}

No HTML or Markdown is interpreted in imported content. All imported strings are displayed as text. Unknown fields are discarded by the importer.

## Updates and word identity

Reuse the original root id when correcting a file. The app asks before replacing an existing article. Exact matches of normalised kind + lemma + meaning share one vocabulary card with multiple source references. Normalisation folds case and whitespace, not synonyms. Different meanings remain separate.

Vocabulary ordering uses the app's first-import sequence, not dates in files or alphabetical order. New identities are placed above existing identities. Repeated existing words keep their original sequence and review progress.

## Backup

Backup files use type mein-deutsch-backup and are created by Export backup. They contain articles, settings and review records. Do not ask ChatGPT to manufacture backups. Restore asks for confirmation and replaces the current library.
