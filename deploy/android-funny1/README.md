# Android store app (TWA) — Funny One «Одна Чепуха: по кругу»

S-3b (FO-ID-1). A Trusted Web Activity built with
[Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap), the same way as Funny Multi's app
in [`deploy/android/`](../android/README.md): the app opens
`https://www.funny1.oursharedcode.com/?shell=android` full screen in Chrome, so every web deploy
reaches the app without a store review.

Read `deploy/android/README.md` first. Its **Versions** section (Bubblewrap CLI 1.25.0 through
`npx`, the 64-bit JDK) and its **Commands** section (`update --skipVersionUpgrade`, then `build`,
in PowerShell) apply here unchanged — run them from this directory. Only `twa-manifest.json` and
this README are tracked.

## What differs from Funny Multi's app

- **Package** `com.oursharedcode.funny1`, **host** `www.funny1.oursharedcode.com`.
- **Name** «Funny One» by default (Step 85). A phone set to another of the game's languages
  shows the game's Home title in it, written by `scripts/android-labels.mjs` (see Funny Multi's
  README, Names): in Russian «Одна Чепуха: по кругу», and under the icon «Одна Чепуха», because
  a launcher shows about 12 characters there.
- **It counts nothing,** in the app as on the web (owner decision, Step 85). For Data safety:
  no data collected. Home links to the privacy policy
  (`https://www.funny1.oursharedcode.com/privacy`), which Google Play asks for inside the app.
- **It is not an offline installer.** The first launch needs the network: Chrome loads the game
  once and its service worker stores all of it. From then on the app starts and plays with no
  network (checked in Chromium against a local build: a cold start at `/?shell=android` with the
  network off is answered from the service worker). The built-in pictures are part of that
  stored copy; pictures from the Internet (D-10) need a connection each time.
- **`?shell=android` changes nothing today.** Funny One has no Support screen to hide. The
  marker is in the launch URL so that a later web deploy can tell the store app from the browser
  — for one, to leave out pictures from the Internet if the Play Families listing needs that
  (FO-ID-1, an open owner decision) — without a new app build. The game's own footer link and
  QR code never carry it.
- **Icons are the placeholders** the web game ships today (`icon-512.png`,
  `icon-512-maskable.png`). `update` downloads them from the live site, so replace them there and
  run `update` again before a store listing. That is the one rebuild (owner decision, Step 85),
  with Google's app-signing fingerprint; the rest of Funny Multi's checklist (its README, Before
  the store listing) applies too.

## Signing key

The same key as Funny Multi's app: `C:/Users/Misha/.android-keys/funny37-upload.jks`, alias
`funny37` (see `deploy/android/README.md` for where the copy and the password live). Android
lets one key sign any number of apps. Under Play App Signing it is only the upload key, and
Google gives each app an app-signing key of its own. If the owner prefers a separate upload key
for this app, generate one as that README shows, point `signingKey` in `twa-manifest.json` at it
and replace the fingerprint in the file below.

The key's SHA-256 fingerprint is in `deploy/origin-root/funny1/.well-known/assetlinks.json`,
which `deploy/ship-funny-one.sh` publishes at
`https://www.funny1.oursharedcode.com/.well-known/assetlinks.json`. It must be live before the
first install, or the app opens with a URL bar. Once Play App Signing is on, add Google's
app-signing fingerprint beside it.

## Build

```powershell
npx.cmd -y "@bubblewrap/cli@1.25.0" update --skipVersionUpgrade
node ..\..\scriptsndroid-labels.mjs
npx.cmd -y "@bubblewrap/cli@1.25.0" build
```

`build` asks for the keystore password and then the key password (the same one). It writes
`app-release-signed.apk`, which is installed on a phone by hand, and `app-release-bundle.aab`,
which is uploaded to Play.

To check that the project compiles without the password (no installable file comes out):

```powershell
$env:JAVA_HOME = "$HOME\.bubblewrap\jdk64\jdk-17.0.11+9"
$env:ANDROID_HOME = "$HOME\.bubblewrap\android_sdk"
.\gradlew.bat assembleRelease
```

Done 2026-10-05: `app/build/outputs/apk/release/app-release-unsigned.apk`, 1.9 MB. The agent's
own shell must use this form even with `--skipSigning`: it sets
`NoDefaultCurrentDirectoryInExePath`, so the `gradlew.bat` that Bubblewrap starts by bare name
is not found there. The owner's terminal has no such setting.
