# Android store app (TWA) — Funny Multi «Чепуха 37»

B-1d (FM-APP-1). A Trusted Web Activity built with
[Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap): the app opens
`https://www.funny37.oursharedcode.com/?shell=android` full screen in Chrome, so every web deploy
reaches the app without a store review. `?shell=android` is how the page knows it is inside the
app: it hides the Support screen (B-1c, `apps/funny-multi-client/src/storeShell.ts`) and counts
the visit as the app's (Step 85, `apps/funny-multi-client/src/funnel.ts`). The privacy link on
Home (Step 85) is the in-app link Google Play asks for.

**Rebuild only for what the web cannot change:** the package, the names, the icons, the signing
key, the colours and splash, the start URL. Anything on the pages reaches the app with the next
web deploy.

## Names

English by default: «Funny Multi», under the icon and in Settings (`name` and `launcherName` in
`twa-manifest.json`, since Step 85). A phone set to another of the game's languages shows the
game's Home title in it, «Чепуха 37» in Russian. Bubblewrap knows only one name, so
`scripts/android-labels.mjs` writes the others into the generated project, from the game's
catalogs (`home.title`). The same script names Funny One's app (`deploy/android-funny1/`).
Most titles are machine drafts (B-3), and some are longer than a launcher shows under an icon;
the script's `--dry-run` prints them all.

Only `twa-manifest.json` and this README are tracked. Bubblewrap regenerates the Gradle project
(`app/`, `gradle/`, `build.gradle`, …) from the manifest, and `.gitignore` drops it and the build
outputs.

## Versions

Bubblewrap CLI **1.25.0**, run with `npx`, never added to `package.json`, so it stays out of the
lockfile and the `npm audit` gate. It brings Android command-line tools 6609375, build-tools
36.1.0, Gradle 8.11.1 and AGP 8.9.1, and it targets SDK 36 (min SDK 21). JDK and SDK live in
`~/.bubblewrap/`, Gradle's downloads in `~/.gradle/`; nothing is installed system-wide.

**Use the 64-bit JDK.** On Windows Bubblewrap installs a 32-bit Temurin 17.0.11 into
`~/.bubblewrap/jdk/`, and a 32-bit JVM cannot reserve the 1536 MB heap that the generated
`gradle.properties` asks for ("Could not reserve enough space for object heap"). The 64-bit
build of the same version is unpacked in `~/.bubblewrap/jdk64/jdk-17.0.11+9`, from Adoptium's
`OpenJDK17U-jdk_x64_windows_hotspot_17.0.11_9.zip`, checked against Adoptium's published
SHA-256. Bubblewrap is pointed at it with
`npx.cmd -y "@bubblewrap/cli@1.25.0" updateConfig --jdkPath "$HOME\.bubblewrap\jdk64\jdk-17.0.11+9"`.

## Signing key

`C:/Users/Misha/.android-keys/funny37-upload.jks`, alias `funny37`, RSA 2048. Never in this repo.
It is PKCS12, so the key password is the keystore password. Keep the password in the owner's
password manager. A copy of the `.jks` file (and the public `.pem`) is on an external drive
(location in the agent's memory). Without the file and the password, the installed app cannot be
updated. Under Play App Signing (B-1e) this key
becomes the upload key, and Google signs what users install with a key of its own.

The key's SHA-256 fingerprint is in `deploy/origin-root/funny37/.well-known/assetlinks.json`,
the file that `deploy/ship.sh` publishes. Android checks that file when the app is installed. If
the file does not list the signing key, the app opens with a URL bar. Publish it before the
first install. Once Play App Signing is on, add Google's app-signing fingerprint (Play Console →
Test and release → App integrity) beside the upload key's.

## Commands

Run them in PowerShell (VS Code: Terminal → New Terminal), from this directory. Node and Java
prompts can misbehave in Git Bash. Use `npx.cmd`, not `npx`, so that the execution policy does
not block `npx.ps1`. Quote the package name, because a bare `@` is PowerShell's splat operator.

**First run, once per PC.** Any command triggers it. Bubblewrap asks to install the JDK (Enter)
and the Android SDK (Enter), then asks you to accept the Android SDK terms (`y`):

```powershell
npx.cmd -y "@bubblewrap/cli@1.25.0" doctor
```

Then switch to the 64-bit JDK (see Versions).

**Signing key, once.** `keytool` asks for a new password twice, and `-exportcert` asks for it
once more:

```powershell
$kt = "$HOME\.bubblewrap\jdk64\jdk-17.0.11+9\bin\keytool.exe"
New-Item -ItemType Directory -Force "$HOME\.android-keys" | Out-Null
& $kt -genkeypair -keystore "$HOME\.android-keys\funny37-upload.jks" -alias funny37 -keyalg RSA -keysize 2048 -validity 20000 -dname "CN=oursharedcode, O=oursharedcode, C=AU"
& $kt -exportcert -rfc -alias funny37 -keystore "$HOME\.android-keys\funny37-upload.jks" -file "$HOME\.android-keys\funny37-upload.pem"
```

The `.pem` is the public certificate. Print its SHA-256 for `assetlinks.json` without a
password: `& $kt -printcert -file "$HOME\.android-keys\funny37-upload.pem"`.

**Regenerate the project after editing `twa-manifest.json`.** Without the flag, `update` raises
`appVersionCode` and `appVersion` by one, which every Play upload needs:

```powershell
npx.cmd -y "@bubblewrap/cli@1.25.0" update --skipVersionUpgrade
```

**Then the names, before every build.** `update` deletes the generated project, names included,
so run this from the repository's root after each `update` (it writes both apps' names, and
refuses if `build` would regenerate a project):

```powershell
node scripts/android-labels.mjs
```

**Build.** The first build installs build-tools 36.1.0 and asks you to accept their licence
(`y`). Every build asks for the keystore password and then the key password (the same one):

```powershell
npx.cmd -y "@bubblewrap/cli@1.25.0" build
```

The build writes two files to this directory: `app-release-signed.apk`, which is installed on
a phone by hand, and `app-release-bundle.aab`, which is uploaded to Play.

## Before the store listing (B-1e)

The listing build is the one rebuild (owner decision, Step 85): `update` (without
`--skipVersionUpgrade` if a build was ever uploaded), the names, `build`. Then:

- **Google's app-signing fingerprint** goes into `assetlinks.json` beside the upload key's (see
  Signing key), and is published before testers install from Play.
- **Uninstall the copy installed by hand** (B-1d) before installing from Play: it is signed with
  the upload key, Play's with Google's key, and Android refuses to update one with the other.
- **Data safety:** the app counts visits (Step 85): the day, the interface language, that the
  visit came from the app, and the country looked up from the address, which is not kept. No
  account, nothing shared, nothing sold; see the privacy page's "Visit counts". Gifts are not
  in the app.
- **The privacy policy link** in the listing is `https://www.funny37.oursharedcode.com/privacy`;
  the app links to it from Home already.
- **The listing itself** — texts, graphics and the App content answers — is in `store/` (Step 87);
  `store/README.md` is the upload checklist.
- On Android 16 and later, a tablet or an unfolded phone ignores `"orientation": "portrait"`
  (the app targets SDK 36) and may show the game in landscape, as a browser on a tablet does.
