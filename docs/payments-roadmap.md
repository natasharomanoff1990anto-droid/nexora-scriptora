# Scriptora — Payments Roadmap

This document describes the dormant payments architecture and the steps
required to turn it into a live billing system.

## Phase 0 — Current state (shipped)

- Pricing page (`/pricing`) is premium-grade and production-ready.
- Plans defined centrally in `src/config/payments.ts` (Free / Pro Monthly /
  Pro Yearly / Lifetime).
- Lightweight paywall hook in `src/hooks/useSubscription.ts`.
- Reusable components in `src/components/payments/`:
  - `PricingCard`
  - `ComingSoonPaymentModal`
  - `PaymentStatusBanner`
  - `ProBadge`
- `.env.example` documents all payment-related variables.
- Default `VITE_PAYMENT_MODE=coming_soon` → no real checkout, no SDKs loaded.
- No provider SDK is bundled. No API keys are required.

## Phase 1 — External checkout links

Use this phase to start charging customers without writing any backend code,
via hosted checkout pages (Stripe Payment Links, Lemon Squeezy, Paddle, etc.).

1. Create the products in your provider dashboard.
2. Copy each hosted checkout URL.
3. In `.env`:

   ```
   VITE_ENABLE_PAYMENTS=true
   VITE_PAYMENT_MODE=external_links
   VITE_PAYMENT_PROVIDER=stripe         # or paddle / lemonsqueezy / paypal
   VITE_PAYMENT_MONTHLY_URL=https://...
   VITE_PAYMENT_YEARLY_URL=https://...
   VITE_PAYMENT_LIFETIME_URL=https://...
   ```

4. Redeploy. The Pro buttons will automatically open the configured URLs.
   No code change is required.

## Phase 2 — Server-side webhooks & subscription sync

Activate real plan unlocks based on payment events.

1. Add a Supabase Edge Function (e.g. `payments-webhook/index.ts`) that:
   - Verifies the provider's webhook signature.
   - Maps the customer email to a Supabase user.
   - Upserts `user_plans.plan` to `pro` or `premium`.
2. Configure the webhook endpoint in the provider dashboard.
3. Switch `VITE_PAYMENT_MODE=provider_sdk` if you start using a hosted SDK
   (e.g. Stripe Checkout via redirect from your own backend).
4. The existing `usePlan()` / `useSubscription()` hooks already react to
   `user_plans` changes — premium features unlock automatically.

## Phase 3 — Billing dashboard & usage limits

- Customer portal link (Stripe Billing Portal / Paddle Customer Portal).
- Invoice history page.
- Per-plan AI credit limits (already partially modeled in `PLAN_LIMITS`).
- Usage analytics on `/usage`.
- Dunning / failed-payment recovery flow.

## Component contract (do not break)

- `paymentsConfig.plans` — single source of truth for plan metadata.
- `resolvePlanAction(plan)` — single entry point for CTA behavior.
- `useSubscription()` — single hook for "is this user premium?" checks.

Anything that respects these three contracts will keep working when payments
are flipped on.