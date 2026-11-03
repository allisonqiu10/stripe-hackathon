<!-- OWNER: P1 -->
# Stripe Social Impact

Phase A foundation for a TEST MODE ONLY hackathon. API routes return JSON 501 until their owners implement them. UI pages are placeholders. Connect helpers, payment handlers, donation calculation, and seed are intentionally NotImplemented; do not interpret this scaffold as working payments.

## Setup

Use Node 22. Copy `.env.example` to `.env`, populate Stripe test credentials, then run:

```sh
npm ci
npm run db:migrate
npm run dev
npm run build
npm test
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the CLI signing secret to STRIPE_WEBHOOK_SECRET. Use test card `4242 4242 4242 4242`, a future expiry, and any three-digit CVC once P2 checkout is implemented. STRIPE_PUBLISHABLE_KEY is intentionally not automatically exposed to the browser; P4 should receive it via its server page. Never expose STRIPE_SECRET_KEY. APP_URL defaults in the example to localhost:3000. PLATFORM_FEE_BPS defaults to zero. SQLite database URL is relative to prisma/schema.prisma.

`npm run db:seed` is a Phase B placeholder. Current migrations create schema only.

## Ownership

| Owner | Paths |
| --- | --- |
| P1 | prisma/**, scripts/seed.ts, src/lib/db.ts, src/lib/contract/**, src/lib/stripe/client.ts, src/lib/stripe/connect.ts, src/lib/stripe/handlers/index.ts, src/lib/stripe/handlers/account.ts, src/app/api/causes/**, src/app/api/merchants/**, src/app/api/connect/**, .env.example, README.md, package.json |
| P2 | src/lib/donation/**, src/lib/stripe/handlers/payment.ts, src/app/api/checkout/**, src/app/api/webhooks/stripe/route.ts |
| P3 | src/app/merchant/**, src/components/merchant/** |
| P4 | src/app/shop/**, src/app/causes/**, src/components/customer/** |

Phase A alone creates shared scaffold/configuration and teammate stubs. After merge, use feat/p<N>-<name> branches, p<N>: commits, and edit only owned files. Do not change dependencies or shared configuration; request P1 changes. Use src/mocks/p<N>/ for fixtures; do not depend on unmerged teammate code. No shared UI components.

## Frozen interfaces

`src/lib/contract/index.ts` exports each named `*Schema` plus the corresponding inferred type (remove Schema suffix). Entity types: Merchant, Cause, Order, Donation, Quote. Requests: CreateCauseRequest, ListCausesRequest, CreateMerchantRequest, UpdateMerchantRequest, CheckoutQuoteRequest, CheckoutIntentRequest, MerchantOnboardRequest, CauseOnboardRequest, ConnectStatusRequest. Responses: CreateCauseResponse, GetCauseResponse, ListCausesResponse, CauseProgressResponse, CreateMerchantResponse, GetMerchantResponse, UpdateMerchantResponse, MerchantImpactResponse, CheckoutQuoteResponse, CheckoutIntentResponse, OnboardResponse, ConnectStatusResponse, ErrorResponse.

All money is integer cents. Database nullable fields serialize as null; dates as ISO strings. Quote requires a cause ID: P2 must reject checkout without a ready active cause. PATCH activeCauseId:null clears the selection. Aggregations in Phase B count TRANSFERRED rows only: gross amountCents, donorCount means contributions rather than unique people, orderCount means distinct represented orders, recent means newest ten contributions.

Shared exports:

- `db`: PrismaClient singleton.
- `stripe`: lazy shared Stripe client, pinned to 2026-10-28.endive, test keys only.
- `webhookHandlers`: partial event-type registry. Handlers take Stripe.Event and return Promise<void>.
- `createConnectedAccount({kind,id,name,email?}): Promise<Stripe.Account>`.
- `createOnboardingLink(accountId,returnPath): Promise<{url:string}>`.
- `getAccountStatus(accountId): Promise<ConnectStatusResponse>`.
- `calculateQuote(merchant: Pick<Merchant,'id'|'ruleType'|'percentageBps'|'activeCauseId'>, request: CheckoutQuoteRequest): Quote`.

All route handlers accept Request and a context with asynchronous params. P2 must verify webhook signatures and make payment processing idempotent. Stripe mutations must use idempotency keys.

Connect implementation is Phase C: approved v1 controller configuration (US, Express dashboard, Stripe requirement collection, application fees/losses, transfers capability). GET /api/connect/refresh?kind=merchant|cause&id= is the approved additional refresh endpoint. Completion pages are /merchant/onboarding/complete and /causes/[slug]/onboarding/complete. Read current Stripe Connect, Account Links, and testing docs before implementation.

Merge the Phase A branch to main before teammates branch from it. Phase B data APIs/seed and Phase C Connect onboarding remain follow-up work.

Dependency recovery: initial installation succeeded with `npm install --legacy-peer-deps`; the lockfile was subsequently resolved normally. Stripe browser packages are pinned to a compatible pair. npm audit reports three high-severity findings in the Prisma 6 development-tool dependency chain (deepmerge-ts); its suggested fix requires a Prisma major-version migration, which is not applied in this scaffold.

## Phase A exact file inventory

Added:

- `.env.example`
- `.gitignore`
- `README.md`
- `next-env.d.ts`
- `package-lock.json`
- `package.json`
- `postcss.config.mjs`
- `prisma/migrations/20261103230529_init/migration.sql`
- `prisma/migrations/migration_lock.toml`
- `prisma/schema.prisma`
- `scripts/seed.ts`
- `src/app/api/causes/[slug]/progress/route.ts`
- `src/app/api/causes/[slug]/route.ts`
- `src/app/api/causes/route.ts`
- `src/app/api/checkout/intent/route.ts`
- `src/app/api/checkout/quote/route.ts`
- `src/app/api/connect/cause/onboard/route.ts`
- `src/app/api/connect/merchant/onboard/route.ts`
- `src/app/api/connect/refresh/route.ts`
- `src/app/api/connect/status/route.ts`
- `src/app/api/merchants/[id]/impact/route.ts`
- `src/app/api/merchants/[id]/route.ts`
- `src/app/api/merchants/route.ts`
- `src/app/api/webhooks/stripe/route.ts`
- `src/app/causes/[slug]/onboarding/complete/page.tsx`
- `src/app/causes/[slug]/page.tsx`
- `src/app/causes/page.tsx`
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/merchant/onboarding/complete/page.tsx`
- `src/app/merchant/page.tsx`
- `src/app/page.tsx`
- `src/app/shop/[merchantId]/page.tsx`
- `src/components/customer/CauseCard.tsx`
- `src/components/customer/Shop.tsx`
- `src/components/merchant/MerchantDashboard.tsx`
- `src/lib/contract/index.test.ts`
- `src/lib/contract/index.ts`
- `src/lib/contract/stripe-client.test.ts`
- `src/lib/db.ts`
- `src/lib/donation/index.ts`
- `src/lib/stripe/client.ts`
- `src/lib/stripe/connect.ts`
- `src/lib/stripe/handlers/account.ts`
- `src/lib/stripe/handlers/index.ts`
- `src/lib/stripe/handlers/payment.ts`
- `src/mocks/p1/.gitkeep`
- `src/mocks/p2/.gitkeep`
- `src/mocks/p3/.gitkeep`
- `src/mocks/p4/.gitkeep`
- `tsconfig.json`

Removed obsolete starter files:

- `api/checkout/route.js`
- `layout.js`
- `page.js`
