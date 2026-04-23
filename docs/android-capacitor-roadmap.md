# Scriptora — Android (Capacitor) Roadmap

Capacitor is **already installed** (`@capacitor/core`, `@capacitor/cli`,
`@capacitor/android`, `@capacitor/ios` are in `package.json`) and
`capacitor.config.ts` exists at the project root. No further code changes
are required to start producing Android builds — only host-side commands.

## Current configuration

`capacitor.config.ts` ships with the Lovable hot-reload server URL. For a
real production APK you must remove the `server.url` block (otherwise the
APK loads remote content instead of the bundled `dist/`).

```ts
// capacitor.config.ts (production override)
const config: CapacitorConfig = {
  appId: "com.scriptora.app",      // change from app.lovable.* before release
  appName: "Scriptora",
  webDir: "dist",
  // server: omitted on production builds
};
```

## First-time setup (local machine)

Requires **Android Studio** and a JDK 17+.

```bash
git clone <your-repo>
cd scriptora
npm ci
npm run build
npx cap add android        # creates android/ folder (only the first time)
npx cap sync android
npx cap open android       # opens Android Studio
```

In Android Studio: **Build → Generate Signed Bundle / APK** → choose APK or
AAB → provide a keystore → produce the artifact.

## After every web change

```bash
npm run build
npm run cap:sync
```

## Publishing the artifact

1. Upload the generated `.apk` / `.aab` to GitHub Releases (or any CDN).
2. Copy the direct download URL into:
   - `VITE_ANDROID_APK_URL=…`
   - `VITE_ANDROID_AAB_URL=…`
3. Set `VITE_ENABLE_DOWNLOADS=true` and `VITE_DOWNLOAD_MODE=live`.
4. Redeploy the web app — the Download Center button activates automatically.

## Future: GitHub Actions APK build

A future workflow (`.github/workflows/android-build.yml`) can run
`./gradlew assembleRelease` on every tag and upload the APK as a release
artifact. This requires storing a base64-encoded keystore + passwords as
GitHub Secrets (`ANDROID_KEYSTORE_B64`, `ANDROID_KEYSTORE_PASSWORD`,
`ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`). Not included in v1 to avoid
shipping fake/insecure defaults.