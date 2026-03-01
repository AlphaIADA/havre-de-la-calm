# OTA Apartments — Booking Platform (Next.js + Prisma)

Multi-property short-stay booking platform with:
- Public site (`/`, `/properties`, `/stay/[unitSlug]`, `/book/[unitSlug]`, `/blog`)
- Guest portal (`/booking/[bookingCode]`) for status, KYC, and messaging
- Offline check-in subsite (host-based routing for `checkin.*`)
- Admin dashboard (`/admin`) for properties/units/bookings/availability/discounts/KYC/messages/blog/email
- Optional Paystack payments (Pay Now / Pay Later)
- Promo codes (global / property / unit scoped)
- SEO: metadata, JSON-LD, `/sitemap.xml`, `/robots.txt`

## Tech
- Next.js App Router
- Prisma (PostgreSQL)
- Tailwind CSS
- Resend (optional)
- Cloudinary private uploads (KYC docs)
- Paystack (optional)

## Node version
- Use Node 20 LTS or 22 LTS (see `.nvmrc`). Newer Node versions (e.g. Node 25) can cause flaky Next.js dev-server errors.

## Quickstart

1) Install deps:
```bash
npm install
```

2) Create `.env` (see env vars below).

3) Run migrations + seed:
```bash
npm run prisma:migrate
npm run db:seed
```

4) Start dev server:
```bash
npm run dev
```

If you hit a weird `.next/server/app/... ENOENT` error, run:
```bash
npm run dev:clean
```

## Environment variables

### Core
- `DATABASE_URL` (PostgreSQL connection string; Neon recommended)
- `NEXT_PUBLIC_APP_URL` (e.g. `https://otaapartments.com`)
- `NEXT_PUBLIC_ROOT_DOMAIN` (e.g. `otaapartments.com`)

### Admin auth (credentials login)
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET` (or `NEXTAUTH_SECRET`)

### Uploads (KYC docs)
KYC documents are uploaded to Cloudinary as **private** assets. Guests can upload, but **only ADMIN/STAFF can view** (via signed URLs).
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

### Paystack (optional)
If keys are not set, **Pay Now is hidden automatically**.
- `PAYSTACK_SECRET_KEY` (optional)
- `PAYSTACK_PUBLIC_KEY` (optional)
- `PAYSTACK_WEBHOOK_SECRET` (optional; if not set, webhook verification uses `PAYSTACK_SECRET_KEY`)

Webhook endpoint:
- `POST /api/paystack/webhook`

Verify endpoint (optional helper):
- `GET /api/paystack/verify?reference=...`

### Email (Resend) (optional)
If not set, emails are skipped silently.
- `RESEND_API_KEY`
- `EMAIL_FROM` (e.g. `OTA Apartments <no-reply@otaapartments.com>`)
- `EMAIL_REPLY_TO` (optional)

### Reviews
- Google Reviews widget is loaded via Elfsight in `components/GoogleReviews.tsx` (no env vars needed).

## Neon / DB setup
- Create a Neon Postgres database.
- Set `DATABASE_URL` to the Neon connection string.
- Run `npm run prisma:migrate` then `npm run db:seed`.

## Vercel domain + subdomain routing (checkin)
This repo uses `middleware.ts` for host-based routing:
- Requests on `checkin.<rootDomain>` are rewritten to `/checkin/*`.

In Vercel:
- Add `otaapartments.com`
- Add `checkin.otaapartments.com`

## Test `checkin.*` locally

Option A — `hosts` (recommended):
1) Add to `/etc/hosts`:
```
127.0.0.1 otaapartments.local
127.0.0.1 checkin.otaapartments.local
```
2) Set:
```bash
NEXT_PUBLIC_ROOT_DOMAIN=otaapartments.local
NEXT_PUBLIC_APP_URL=http://otaapartments.local:3000
```
3) Visit:
- `http://otaapartments.local:3000/`
- `http://checkin.otaapartments.local:3000/` (should show offline check-in UI)

Option B — curl host header:
```bash
curl -I -H "Host: checkin.otaapartments.com" http://localhost:3000/
```

## Assets (reused from existing repo)
Legacy assets were kept and moved under `public/`:
- `public/images` (existing property/room photos)
- `public/css`, `public/js`, `public/fonts`

Use paths like `/images/havre%20front.jpg` (spaces are OK; browser URL-encodes them).

## Notes / Security
- KYC documents are never linked publicly; admin must generate short-lived signed URLs to view.
- Legacy files containing hardcoded Gmail credentials were removed from the working tree. Rotate any leaked credentials immediately.
