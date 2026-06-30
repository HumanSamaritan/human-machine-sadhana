# Codex Prompt: Build and deploy Human + Machine Sadhana App

You are working on a Next.js app called Human + Machine Sadhana.

Goal: prepare a production-ready Vercel deployment with Supabase Auth, Supabase database, Google login, daily tracker, mood logging, encrypted gratitude, reminders and dashboards.

## Tasks

1. Install dependencies with `npm install`.
2. Run TypeScript/build checks with `npm run build`.
3. Fix any build errors without changing the product intent.
4. Confirm the root directory contains `app/`, `components/`, `lib/`, `public/`, `package.json`.
5. Ensure `.env.local` values are read correctly.
6. Ensure Supabase SQL migration runs successfully.
7. Test Google login flow.
8. Test Daily Entry save and upsert by date.
9. Test Mood save and upsert by date + mood_time.
10. Test encrypted Gratitude save and local decrypt.
11. Test Dashboard with empty data and with at least one saved daily entry.
12. Test `/api/reminders?test=1` with a Resend API key.
13. Prepare for Vercel deployment.

## Constraints

- Keep Supabase Row Level Security enabled.
- Do not expose `SUPABASE_SERVICE_ROLE_KEY` to client components.
- Keep gratitude encryption client-side.
- Keep UI simple and mobile-friendly.
- Keep "Quantum Mind Readiness" clearly positioned as a metaphor, not a medical/scientific claim.

## Preferred deployment stack

- Vercel for app hosting.
- Supabase for Auth + Postgres + RLS.
- Resend for emails.
- External daily scheduler for one reminder per day.
