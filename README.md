# Stripe Social Impact

A test-mode hackathon app for merchant-funded percentage donations and customer round-ups. Built with Next.js, React, Prisma/SQLite, and Stripe Connect. Includes merchant settings, cause registration, checkout, webhook settlement, and impact reporting.

## Setup

Use Node 22. Copy `.env.example` to `.env` and fill in Stripe **test-mode** keys. Never expose `STRIPE_SECRET_KEY`. The server passes only `STRIPE_PUBLISHABLE_KEY` to checkout and payment confirmation pages.

```sh
npm ci
npm run db:migrate
npm run db:seed
npm run dev
```

`DATABASE_URL` is relative to `prisma/schema.prisma`. Set `APP_URL` to the app's origin for Connect return URLs. `PLATFORM_FEE_BPS` defaults to zero and is deducted from the donation portion.

Open `/merchant?merchantId=demo-roundup` or `/merchant?merchantId=demo-percent` for seeded merchants, `/causes` to browse causes, and `/shop/demo-roundup` for the storefront. The seed includes synthetic historical contributions. Seeded accounts start without Stripe accounts; complete merchant and cause onboarding before attempting payments. Rerunning the seed preserves real account setup and repairs legacy fake `acct_seed_*` account IDs.

Create a cause at `/causes/new` and follow its Stripe onboarding flow. To resume setup for a seeded cause, open `/causes/community-garden/onboarding/complete` (or another seeded slug). Choose an onboarded active cause in the merchant dashboard.

Forward both platform payment events and connected-account events to the webhook endpoint:

```sh
stripe listen --forward-to localhost:3000/api/webhooks/stripe --forward-connect-to localhost:3000/api/webhooks/stripe
```

Copy the listener signing secret into `STRIPE_WEBHOOK_SECRET`. Checkout uses the Stripe test card `4242 4242 4242 4242`, a future expiry, and any three-digit CVC.

For independent offline UI demos, set `NEXT_PUBLIC_USE_MOCKS=1` for merchant screens and/or `NEXT_PUBLIC_P4_MOCKS=1` for customer screens, then restart the dev server. These mock datasets are separate and do not exercise Stripe or the database.

## Checks

```sh
npm test
npm run build
npm audit
```

Tests use temporary SQLite databases and mocked Stripe calls. They do not charge cards or create external accounts. The build generates the Prisma client and checks TypeScript. The `@prisma/config` dependency has a scoped `deepmerge-ts` 8.0.0 override to address the recursive-merge advisory while retaining Prisma 6; migrations, seeding, tests, and builds validate compatibility.

## Contracts and behavior

`src/lib/contract/index.ts` is the shared Zod/type contract for API responses, request validation, and both UIs. All money is integer USD cents. Nullable database fields serialize as `null`; dates serialize as ISO strings. Next.js route params are asynchronous.

- Round-up adds the difference to the **next** dollar; an exact-dollar subtotal adds 100 cents when opted in. Percentage donations come out of the item amount, without increasing the customer total.
- Checkout requires a selected ACTIVE cause and completed onboarding for both accounts. Account status checks and webhooks persist changes in transfer readiness.
- PaymentIntent creation requires an `Idempotency-Key`. Retries with the same input reuse the intent; conflicting input returns 409.
- Payment webhooks validate signatures, reject live events, and reconcile merchant/cause transfers with stable Stripe idempotency keys. Full refunds reverse transfers. Partial refunds are flagged for manual reconciliation.
- Impact and progress aggregate TRANSFERRED donation rows. `donorCount` means contributions, and `orderCount` counts distinct represented orders. Recent progress includes the newest ten contributions.

## Demo limitations

This is a test-mode demo with no authentication or merchant authorization. Merchant IDs select identities; do not expose it as a production payment service. Checkout accepts a client-provided subtotal rather than a server-owned product/order catalog.

Webhook serialization currently protects only one Node process. Multiple workers require a durable per-order reconciliation lock. Stripe creation idempotency keys have a retention window; reconcile orphan intents before retries after that window. Partial refunds require manual reconciliation. Automated tests use Stripe mocks; a real test-mode checkout/onboarding/refund walkthrough still requires configured credentials and the Stripe listener.

## Layout

- `src/app/api`: causes, merchants, Connect, checkout, and webhooks
- `src/lib/contract`: shared runtime schemas and types
- `src/lib/donation`, `src/lib/stripe`: totals, account setup, and settlement
- `src/app/merchant`, `src/components/merchant`: merchant UI
- `src/app/shop`, `src/app/causes`, `src/components/customer`: customer/cause UI
- `prisma`, `scripts/seed.ts`: schema, migrations, and sample data
- `src/mocks`: independent UI/test fixtures
