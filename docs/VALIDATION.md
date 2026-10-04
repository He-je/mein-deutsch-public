# Validation record

## 2026-10-04 — Public source preparation

| Check | Result |
| --- | --- |
| Locked development dependency installation | `npm ci --ignore-scripts --offline` passed using the available local cache |
| Core tests | 11 passed: demo/segment validation, import/identity, duplicate progress, backups and settings |
| Browser regressions | 4 passed: audio settings, grammar, reader playback, vocabulary navigation |
| Grammar coverage | All 80 lessons rendered at 320px and 844px widths; navigation, large text and example speech calls checked |
| Demo reader visual inspection | Original sample, English explanation, sentence roles and vocabulary displayed correctly |

Browser tests used installed Chrome and isolated contexts. Android bridge behavior
was mocked; the reader test also exercised browser speech callbacks with a mock.
These results do not establish real speech output or phone-engine behavior.

No APK was rebuilt, signed or installed during public preparation. Android device
testing, same-package upgrades, iPhone compatibility and public hosting are outside
this record. Grammar and AI-assisted study explanations have not received an
independent language-teacher review. This is a dated verification record, not an
automatically updated claim about future commits.
