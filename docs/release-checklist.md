# Scriptora — Release Checklist

Use this list before tagging a new version. Every item is intentional —
skipping breaks something downstream.

## 1. Local sanity

- [ ] `git pull` latest `main`
- [ ] `npm ci`
- [ ] `npx tsc --noEmit`  (typecheck)
- [ ] `npm run lint`
- [ ] `npm run test`
- [ ] `npm run build`  (must succeed without warnings)
- [ ] `npm run preview` and smoke-test:
  - [ ] `/dashboard` opens
  - [ ] `/pricing` opens, Pro CTAs show "coming soon" modal
  - [ ] `/downloads` opens, all cards correct
  - [ ] KDP Engine, Title Domination, Trending Niches, Cover Studio, Book Editor work

## 2. Configuration

- [ ] `.env` filled locally (never committed)
- [ ] GitHub Variables set (see `docs/github-secrets.md`)
- [ ] GitHub Secrets set (AI keys live in Supabase, not here)
- [ ] Supabase Edge Function secrets up to date (DeepSeek / Gemini / Brave)

## 3. Versioning

- [ ] Bump `VITE_APP_VERSION` (GitHub Variable + `.env.example` reference)
- [ ] Add new entry to `changelog` array in `src/config/downloads.ts`
- [ ] Bump `VITE_BUILD_CHANNEL` if promoting (`alpha` → `beta` → `stable`)

## 4. Web release

- [ ] Push to `main`. The `Web Build` workflow runs typecheck + build and
      uploads the `dist/` artifact.
- [ ] Deploy via Lovable Publish (or your hosting of choice).

## 5. Native artifacts (when applicable)

### Android
- [ ] `npm run build && npm run cap:sync`
- [ ] Open Android Studio → Generate Signed APK/AAB
- [ ] Upload to GitHub Releases
- [ ] Update `VITE_ANDROID_APK_URL` / `VITE_ANDROID_AAB_URL`

### macOS
- [ ] Follow `docs/mac-installer-roadmap.md`
- [ ] Upload `.dmg` / `.zip` to GitHub Releases
- [ ] Update `VITE_MAC_DMG_URL` / `VITE_MAC_ZIP_URL`

### Windows / Linux
- [ ] Optional, see `docs/mac-installer-roadmap.md` (Electron cross-build)

## 6. Activate the Download Center

- [ ] Set `VITE_ENABLE_DOWNLOADS=true`
- [ ] Set `VITE_DOWNLOAD_MODE=live`
- [ ] Re-deploy the web app
- [ ] Verify each activated platform actually downloads

## 7. Post-release

- [ ] Create a GitHub Release with notes
- [ ] Announce in changelog / users channel
- [ ] Monitor Supabase logs + Sentry (if configured) for 24h