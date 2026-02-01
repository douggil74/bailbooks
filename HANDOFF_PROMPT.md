# Project Handoff — BailMadeSimple (bailbonds-financed)

You are picking up work on a production bail bonds SaaS application. Read CLAUDE.md first, then this context.

## What This App Is

A full-stack bail bonds management platform for a St. Tammany Parish, Louisiana bail bonds company. Two user-facing flows:

1. **Defendant Onboarding** (`/onboard`) — 7-step wizard: personal info, bond details, employment, references, ID upload (Supabase Storage), Stripe card collection, signature + consent. Submits to Supabase `applications` table.

2. **Agent Admin Dashboard** (`/admin`) — Lists all cases. Click into `/admin/case/[id]` for full case detail: editable fields (auto-save on blur), setup wizard for new drafts, document viewer with lightbox, signature display, agent-only fields (power number, premium, down payment, payment amount, next payment date), card-on-file display + charge, check-in schedule/history, reminders sent log, activity timeline, SMS log, delete case with confirmation.

## Tech Stack

- **Next.js 16** (App Router, Turbopack), **React 19**, **TypeScript 5.9**
- **Tailwind CSS 4** — primary green `#1a4d2e`, gold accent `#d4af37`, Inter font
- **Supabase** (Postgres + Storage + Auth) — `@supabase/supabase-js`, client created via `lib/supabase.ts`
- **Stripe** — server SDK (`stripe`) + client (`@stripe/react-stripe-js`, `@stripe/stripe-js`). Card-on-file collection via SetupIntents, off-session charging via PaymentIntents
- **Twilio** — SMS for check-in requests, reminders
- **Vercel** — hosting + cron (`/api/cron/reminders`)
- **jsPDF** — PDF generation for applications

## Key Files You Should Know

### Lib layer
- `lib/supabase.ts` — createServerClient() and createBrowserClient()
- `lib/stripe-server.ts` — createCustomer, createSetupIntent, retrievePaymentMethod, createPaymentIntent
- `lib/stripe-client.ts` — singleton loadStripe() for browser
- `lib/bail-types.ts` — ALL TypeScript interfaces: Application, references, signatures, documents, checkins, SMS log, reminders, wizard step data, API request/response types, ChargeRequest, ChargeResponse, CardInfoResponse

### Database schema (Supabase `applications` table key columns)
id, status (draft/submitted/approved/active/completed), defendant_first, defendant_last, defendant_dob, defendant_phone, defendant_email, defendant_address/city/state/zip, defendant_ssn_last4, defendant_dl_number, employer_name, employer_phone, bond_amount, charge_description, court_name, court_date, case_number, jail_location, premium, down_payment, payment_plan, payment_amount, power_number, agent_notes, next_payment_date, stripe_customer_id, stripe_payment_method_id, sms_consent, gps_consent, checkin_frequency (weekly/biweekly/monthly), created_at, updated_at

Related tables: application_references, signatures, documents, checkins, sms_log, reminders_sent

### API Routes
- `/api/onboard/*` — start, save, references, upload, sign, submit, generate-pdf
- `/api/payment/*` — setup-intent, confirm, card-info, charge
- `/api/admin/*` — applications (list), case (GET/PUT/DELETE), case/detail
- `/api/checkin/*` — request, record, history
- `/api/cron/reminders` — automated court/payment/checkin reminders via Twilio SMS
- `/api/sms/webhook` — Twilio inbound SMS handler
- `/api/lead`, `/api/bonds`, `/api/recommend`, `/api/risk` — marketing site endpoints

### Components
- `app/components/CardCollectForm.tsx` — reusable Stripe card form (variant: 'light' for onboarding, 'dark' for admin)
- Onboard page has inline Input, NextButton, NavButtons, FileUpload components
- Admin case page has inline CaseField, EditField components

## Styling Conventions
- Dark theme for admin (`bg-gray-950`, `bg-gray-900` cards, `border-gray-800`, `text-white`)
- Light theme for onboarding/public pages (white backgrounds, gray borders)
- Gold headings in admin: `text-[#d4af37]`
- Gold CTA buttons in admin: `bg-[#d4af37] text-gray-900 hover:bg-[#e5c55a]`
- Green primary buttons on public: `bg-[#1a4d2e] text-white`
- All inputs in admin: `bg-gray-800 border-gray-700 text-white focus:ring-[#d4af37]`

## What's Already Working
- Full onboarding wizard (all 7 steps including real Stripe card collection)
- Admin dashboard with case list and full case detail page
- Card-on-file display, collection, replacement, and charging in admin
- Check-in system (SMS request → GPS recording)
- Automated cron reminders (court dates, payments, check-ins)
- SMS logging (inbound/outbound)
- PDF generation of full application
- Document upload + lightbox viewer
- Signature capture (canvas drawing)

## What Could Be Built Next (ideas, not instructions)
- Indemnitor/co-signer flow
- Payment history log (store each charge in a payments table)
- Receipt generation after charges
- Defendant portal (check-in self-service, view next court date, make payment)
- Agent authentication (currently no auth on admin routes)
- Bulk SMS to all active defendants
- Reporting/analytics dashboard
- Court date calendar view
- Integration with court record APIs
- Mobile-responsive improvements

## How To Run
```bash
npm run dev    # starts on localhost:3000
npm run build  # production build
```

Env vars needed: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, OPENAI_API_KEY, RESEND_API_KEY, ADMIN_EMAIL

Ask the user what feature they'd like to work on.
