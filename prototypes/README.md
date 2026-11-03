# Stripe Fundraisers: interactive design prototypes

Clickable design concepts for the business and organization sides. These are static files with fictional data. They have no backend, take no payments, and don't import anything from `src/`.

Next.js doesn't serve this folder, so it isn't part of the app.

## Run them

From the repo root:

```sh
python3 -m http.server 4173
```

- Business: http://localhost:4173/prototypes/business.html
- Organization: http://localhost:4173/prototypes/org.html

Open both in the same browser. They share demo data through `localStorage`, so changes on one side appear on the other.

## Suggested demo

1. Organization: **New fundraiser**, **Fill with example**, **Publish fundraiser**.
2. **Request a partnership** and ask Boneyard Coffee.
3. Business: **Requests**, **Review and accept**, **Activate partnership**.
4. **Simulate a day of sales** until the date reaches the partnership, then compare the totals.
5. **Reset demo** to start over.

## Keep in mind

- **Concept labels:** the public fundraiser page imitates stripe.com. Keep its "Concept mockup" labels on any copy you share.
- **Placeholders:** organizations, businesses and figures are fictional. Cover pictures and profile pictures are drawn placeholders.
