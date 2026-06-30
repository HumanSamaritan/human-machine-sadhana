# Step-by-step implementation path

## Phase 1 — Minimum viable app

1. Create Supabase project.
2. Run `supabase/migrations/001_initial_schema.sql` in Supabase SQL Editor.
3. Enable Google Auth in Supabase.
4. Configure Google OAuth redirect URLs.
5. Add environment variables locally.
6. Run `npm install` and `npm run dev`.
7. Test Google login.
8. Save one Daily Entry.
9. Save one Mood entry.
10. Save one encrypted Gratitude entry.
11. Confirm Dashboard updates.

## Phase 2 — Vercel deployment

1. Push root folder contents to GitHub.
2. Import GitHub repo into Vercel.
3. Add the same environment variables to Vercel.
4. Deploy.
5. Add Vercel URL to Supabase redirect URLs.
6. Test login on production domain.
7. Test daily entry save on production.
8. Test dashboard rendering.

## Phase 3 — Reminders

1. Create Resend account.
2. Verify your sender domain.
3. Add `RESEND_API_KEY` and `REMINDER_FROM_EMAIL` in Vercel.
4. Add `CRON_SECRET` in Vercel.
5. Either use Vercel Pro cron or use an external scheduler to call `/api/reminders` hourly.
6. Scheduler header: `Authorization: Bearer YOUR_CRON_SECRET`.

## Phase 4 — Pilot with 1,000 users

1. Keep Supabase RLS enabled.
2. Create an admin analytics view later; do not expose private user records.
3. Add consent text explaining what data is collected.
4. Add data export/delete request options.
5. Move to Supabase Pro if storage, auth or reliability needs exceed free tier.
6. Add AI assessment using OpenAI or another model only after user consent and privacy review.

## Phase 5 — Learning dashboard improvement

The first version uses a deterministic scoring engine. Later improvements can add:

- Individual baseline adjustment.
- Prediction feedback loop: predicted energy vs actual energy.
- Weight tuning by user history.
- Optional device import from Apple Health / Google Fit / Health Connect.
- Organization-level anonymized insights.
