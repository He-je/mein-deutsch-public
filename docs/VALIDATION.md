# Validation record

## 2026-10-05 - Reviewed Capacitor 1.0.7 source publication

- Locked `npm ci --ignore-scripts --offline`: passed; Capacitor core/Android 8.5.2.
- Existing core tests: 11 passed. Existing browser regressions: 4 passed.
- Capacitor speech/Unicode tests: 4 passed. Migration UI round trip: passed with
  two fictional articles, 25 vocabulary entries and 50 example links, known/seen
  progress, reading position and non-default settings. Startup makes no writes;
  export and restore/reload preserve the complete state; role colours render.
- Public debug and unsigned release builds passed. Full release lint passed with
  0 errors and 10 warnings. The API 27 navigation-bar theme property was moved
  into `values-v27` for minimum API 26 compatibility. SDK metadata, deprecated
  Java/TTS APIs and Gradle deprecation notices remain non-fatal tooling limits.
- Five Java runtime files and twelve shared web assets match the accepted personal
  production implementation. Public sample and startup package check differ by
  design. Android build/resources are adapted for a separate public application.
- Packaged web assets match staging; application ID is `de.meindeutsch.publicapp`,
  version 1.0.7/code 8. No Internet permission, personal data or signing key is
  included. WebView debugging is off. Generated APKs remain local and ignored.
- Browser tests use mocked native transport through the real Capacitor JavaScript
  protocol. The public application ID has not been physically tested. The
  personal production update was user-confirmed separately; iOS is untested.

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
