# Development and validation

## Browser and core tests

Use Node.js 22 or newer. The legacy browser preview/core tests need no installed dependencies; Capacitor staging and browser regressions use the locked packages.

```sh
npm start
npm test
```

The public preview binds to loopback and defaults to port 4174. Set `PORT` to change
it. Keep it separate from any personal preview if you want isolated browser storage.

## Optional browser regression tests

Install the pinned Playwright development dependency with `npm ci`, and have
Google Chrome installed. Then run:

```sh
npm run test:browser
```

Tests start their own loopback servers on ports 4183-4186 and close them when done.
They use fresh browser contexts and synthetic libraries. Native Android functions
are mocked. `PLAYWRIGHT_PATH` can point to an existing Playwright installation;
`BROWSER_CHANNEL` selects another installed supported channel. Tests may save
screenshots under ignored `build/`.

See [Validation record](VALIDATION.md) for the checks run on this prepared edition.

## Legacy 1.0.6 Android reference build (Windows)

The current script expects Python 3, JDK 21, Android platform 35 and build-tools 35.
Pass the platform directory containing `android.jar`, build-tools directory and JDK
root explicitly; SDKs are not bundled. From this repository root:

```powershell
python build-android.py --sdk 'C:\Android\Sdk\platforms\android-35' --tools 'C:\Android\Sdk\build-tools\35.0.0' --jdk 'C:\Java\jdk-21'
```

Those paths are examples. The script creates a **local development key** under
`android/signing/` and a local APK. Its built-in development password is not a
production secret or a release-signing setup. Keep generated keys and APKs out of Git.

The source retains application ID `de.meindeutsch.app`. A build with a new key
cannot update an existing installation signed with another key. Test on an emulator
or isolated device; do not uninstall a personal installation to try this source.
This preparation does not rebuild or validate an Android APK, device upgrade,
physical speech output or iPhone compatibility.

## Capacitor 1.0.7 public Android build

Use Node.js 22+, JDK 21 and an Android SDK with platform 36 and build tools 35.
Set `JAVA_HOME` and `ANDROID_HOME` to your installations. From the repository root:

```sh
npm ci --ignore-scripts
npm run stage:capacitor
npm run test:capacitor
cd capacitor/android
# Windows:
.\gradlew.bat --no-daemon :app:assembleDebug :app:assembleRelease :app:lintRelease
# macOS/Linux:
sh ./gradlew --no-daemon :app:assembleDebug :app:assembleRelease :app:lintRelease
```

Outputs are in `build/capacitor/android-app/outputs/`. Release output is unsigned;
debug builds use the Android SDK's local development key. No personal signing
configuration or installer is included. The public application ID is
`de.meindeutsch.publicapp`, so it installs separately from the personal app.
The Java namespace remains `de.meindeutsch.app`; this is not the install identity.

The staging script applies the same storage/speech overlays to `app/app.mjs`,
retains the storage key and WebView hostname, and packages the original public
sample. Shared plugin transformations only rename the package/environment probe
and remove the test export prefix. Reviewed Android resources and build setup are
maintained public adaptations. Gradle and npm download dependencies during setup;
the resulting app removes Internet permission and has no paid API integration.

`test:capacitor` checks queued speech cancellation, native Java Unicode chunking,
and old-to-new UI data preservation, backup export/restore/reload, settings and
sentence colours with an original fixture. Native transport is mocked through
the real Capacitor JavaScript protocol. These are not physical-device tests.
