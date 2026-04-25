# Scriptora — GitHub Secrets & Variables Guide

**Never commit API keys.** All secrets live in GitHub Settings, never in code.

## Where to put what

GitHub repo → **Settings → Secrets and variables → Actions**.

| Type | Use | Examples |
|---|---|---|
| **Secrets** | Sensitive values, masked in logs, available as `${{ secrets.NAME }}` | API keys, service-role keys |
| **Variables** | Non-sensitive config, visible in logs, available as `${{ vars.NAME }}` | Public URLs, feature flags |

## Required Secrets (server-side only — never read from frontend)

| Secret | Used by | Notes |
|---|---|---|
| `DEEPSEEK_API_KEY` | Supabase Edge Functions (AI generation) | Primary AI provider |
| `GEMINI_API_KEY` | Supabase Edge Functions (Gemini fallback) | Optional, only if `VITE_ENABLE_GEMINI=true` |
| `BRAVE_SEARCH_API_KEY` | Supabase Edge Functions (market research, trending niches) | Optional |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge functions / admin scripts | Never expose to frontend |
| `SUPABASE_ACCESS_TOKEN` | Future CI deploys of edge functions | Optional |
| `SUPABASE_PROJECT_REF` | Future CI deploys of edge functions | Optional |

> **AI keys live in Supabase Edge Function secrets**, not in GitHub Actions.
> Add them via Supabase Dashboard → Project → Edge Functions → Secrets,
> or via the Lovable Cloud secrets UI.

## Required Variables (public, build-time)

These are injected into the frontend bundle by the `web-build` workflow.
If missing, the app falls back to "coming soon" mode — it never crashes.

| Variable | Default fallback | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | empty → backend disabled | Public Supabase URL |
| `VITE_SUPABASE_ANON_KEY` | empty → auth disabled | Public anon key |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | empty | Alias for anon key (Lovable Cloud naming) |
| `VITE_SUPABASE_PROJECT_ID` | empty | Project ref for client typing |
| `VITE_AI_PROVIDER` | `deepseek` | Default AI provider hint |
| `VITE_ENABLE_GEMINI` | `false` | Show Gemini option in UI |
| `VITE_ENABLE_PAYMENTS` | `false` | Master switch for payments |
| `VITE_PAYMENT_MODE` | `coming_soon` | `coming_soon` \| `external_links` \| `provider_sdk` |
| `VITE_PAYMENT_PROVIDER` | `none` | Provider hint |
| `VITE_PAYMENT_MONTHLY_URL` | empty | External checkout URL |
| `VITE_PAYMENT_YEARLY_URL` | empty | External checkout URL |
| `VITE_PAYMENT_LIFETIME_URL` | empty | External checkout URL |
| `VITE_ENABLE_DOWNLOADS` | `false` | Master switch for downloads |
| `VITE_DOWNLOAD_MODE` | `coming_soon` | `coming_soon` \| `live` |
| `VITE_ANDROID_APK_URL` | empty | Direct APK URL |
| `VITE_ANDROID_AAB_URL` | empty | Direct AAB URL |
| `VITE_MAC_DMG_URL` | empty | Direct DMG URL |
| `VITE_MAC_ZIP_URL` | empty | Direct ZIP URL |
| `VITE_WINDOWS_EXE_URL` | empty | Direct EXE URL |
| `VITE_APP_VERSION` | `0.1.0` | Shown in Download Center header |
| `VITE_BUILD_CHANNEL` | `alpha` | `alpha` \| `beta` \| `stable` |

## Local development

1. Copy `.env.example` → `.env`.
2. Fill in `VITE_SUPABASE_*` from your Supabase project (or leave empty for offline UI work).
3. AI keys: add them to Supabase Edge Function Secrets, **not** to `.env`.
4. `npm install && npm run dev`.

## Rotation policy

- Rotate `DEEPSEEK_API_KEY` / `GEMINI_API_KEY` / `BRAVE_SEARCH_API_KEY` whenever a contributor leaves.
- Rotate `SUPABASE_SERVICE_ROLE_KEY` from Supabase Dashboard → Settings → API → "Reset service_role key".
- Anon/publishable keys do not need rotation but can be rotated alongside the service role.