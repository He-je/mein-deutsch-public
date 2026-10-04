# Development and validation

## Browser and core tests

Use Node.js 22 or newer. No runtime npm dependencies are needed.

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

## Android source build (Windows)

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
