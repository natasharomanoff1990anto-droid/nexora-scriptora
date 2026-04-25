# Scriptora — Downloads Roadmap

This document describes the dormant Download Center and the steps required
to publish real installable artifacts (APK, AAB, DMG, ZIP, EXE).

## Phase 0 — Current state (shipped)

- `/downloads` page is premium-grade and production-ready.
- All download items defined in `src/config/downloads.ts`:
  Android APK, Android AAB, macOS DMG, macOS ZIP, Windows EXE.
- Reusable components in `src/components/downloads/`:
  - `DownloadCard`
  - `DownloadStatusBanner`
- `.env.example` documents all download-related variables.
- Default `VITE_DOWNLOAD_MODE=coming_soon` → no real artifact required.
- Each button activates **independently** based on its own URL env var.

## Phase 1 — Activate a single platform

The simplest path: host a file anywhere (GitHub Releases, S3, Cloudflare R2,
your own CDN) and paste the direct URL.

```
VITE_ENABLE_DOWNLOADS=true
VITE_DOWNLOAD_MODE=live
VITE_ANDROID_APK_URL=https://github.com/your-org/scriptora/releases/download/v0.2.0/scriptora.apk
```

Redeploy. Only the Android APK button activates; everything else stays in
coming-soon mode. No code change required.

## Phase 2 — Build pipelines

### Android (Capacitor)

1. `npm install @capacitor/core @capacitor/cli @capacitor/android`
2. `npx cap init` (use the project's app id)
3. `npx cap add android`
4. `npm run build && npx cap sync`
5. Open in Android Studio → Build → Generate Signed APK / AAB
6. Upload artifact, paste URL into `VITE_ANDROID_APK_URL`

### macOS / Windows / Linux (Electron)

See `<electron-desktop-app>` instructions: build via Vite + `@electron/packager`,
output `.zip` (cross-platform safe) or `.dmg` on macOS hosts.

1. `npm install --save-dev electron @electron/packager`
2. Add `electron/main.cjs` entry point
3. Set `base: './'` in `vite.config.ts`
4. `npx vite build && npx @electron/packager . Scriptora --platform=darwin --arch=arm64 --out=electron-release`
5. Archive + host the output, paste URL into `VITE_MAC_DMG_URL` (or ZIP).

### Windows / Linux

- Cross-compile from Linux: `--platform=win32` / `--platform=linux`.
- For real `.exe` / `.AppImage` / `.deb` installers, use a CI host with
  `electron-builder` (sandbox can only ship `.zip` / `.tar.gz`).

## Phase 3 — GitHub Actions automation

Recommended once builds stabilize.

1. Add `.github/workflows/release.yml` that:
   - Triggers on `v*` tag push.
   - Runs Capacitor build for Android (APK + AAB).
   - Runs Electron packager for macOS / Windows / Linux.
   - Publishes artifacts to GitHub Releases.
2. Update `.env` URLs to the stable release path:
   `https://github.com/<org>/<repo>/releases/latest/download/<file>`
3. Bump `VITE_APP_VERSION` and add an entry to `changelog` in
   `src/config/downloads.ts`.

## Component contract (do not break)

- `downloadItems` — single source of truth for available platforms.
- Each item's `available` flag is derived from `downloadsEnabled`,
  `downloadMode === "live"`, and a non-empty URL.
- `DownloadCard` opens the URL when `available`, otherwise shows the
  coming-soon dialog. No other behavior is required from callers.