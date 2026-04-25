# Scriptora — macOS Installer Roadmap

No desktop wrapper is bundled in v1. The two viable paths are documented
here; pick one when you're ready to ship a real Mac build.

## Option A — Tauri (recommended for size & performance)

- Output: ~5–10 MB `.dmg` / `.app`.
- Uses the system WebView (WKWebView on macOS).
- Requires Rust toolchain on the build machine.

```bash
npm install --save-dev @tauri-apps/cli
npx tauri init
# edit src-tauri/tauri.conf.json: set distDir to "../dist"
npm run build
npx tauri build           # produces .dmg + .app under src-tauri/target/release/bundle/
```

## Option B — Electron (simpler, heavier)

- Output: ~80–150 MB `.dmg` / `.zip`.
- Bundles its own Chromium, identical rendering everywhere.
- Requires `base: "./"` in `vite.config.ts` for `file://` loading.

```bash
npm install --save-dev electron @electron/packager
# create electron/main.cjs (CommonJS) loading dist/index.html
npm run build
npx @electron/packager . Scriptora --platform=darwin --arch=arm64 --out=electron-release
```

## Publishing the artifact

1. Archive: `cd electron-release && zip -r Scriptora-darwin-arm64.zip Scriptora-darwin-arm64`.
2. Upload `.dmg` and/or `.zip` to GitHub Releases.
3. Copy URLs into:
   - `VITE_MAC_DMG_URL=…`
   - `VITE_MAC_ZIP_URL=…`
4. Set `VITE_ENABLE_DOWNLOADS=true` and `VITE_DOWNLOAD_MODE=live`.
5. Redeploy. Download Center activates automatically.

## Why this is documented but not implemented

- Tauri requires Rust on the build host; cannot be reliably shipped from
  Lovable's sandbox.
- Electron adds ~150 MB to the dev install and a separate main-process
  surface to maintain — should be added only when desktop is a real product
  goal, not speculatively.
- Generating a fake `.dmg` would mislead users — strict no-fake policy.