# Human + Machine Sadhana App

A Next.js + Supabase app for the Daily Human + Machine Sadhana ritual.

It converts the Excel tracker into a simple web app with:

- Google login through Supabase Auth
- Daily quick entry page
- Mood / state-of-mind page
- Encrypted gratitude page
- Dashboard with wellbeing, happiness quotient, predicted next-day energy, performance and Quantum Mind Readiness
- Prediction feedback that compares forecasted energy with actual mood/energy logs and personalizes future dashboard forecasts
- One daily email reminder through Resend and an external daily scheduler
- Supabase database with row-level security

## Recommended stack

Use Supabase, not Google Sheets, for the first public test.

Why:

- Google login and user-level data security are built into Supabase Auth.
- Supabase gives you Postgres, row-level security, authentication and APIs in one place.
- For 1,000 test users, this data model is relational and privacy-sensitive. Google Sheets is fine for an internal prototype, but it becomes fragile for multi-user privacy, API quotas and analytics.
- Google Sheets can still be used later as an export destination.

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Supabase setup

1. Create a Supabase project.
2. Go to SQL Editor.
3. Run `supabase/migrations/001_initial_schema.sql`.
4. Go to Authentication → Providers → Google.
5. Enable Google provider.
6. Add Google OAuth client ID and secret.
7. Add these redirect URLs:

```text
http://localhost:3000/dashboard
https://your-vercel-domain.vercel.app/dashboard
```

8. Copy Supabase URL and anon key into `.env.local`.
9. Copy service role key into `.env.local` for the reminder route only. Do not expose it on the client.

## Vercel setup

Set these environment variables in Vercel:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
REMINDER_FROM_EMAIL=Human + Machine Sadhana <reminders@yourdomain.com>
CRON_SECRET=long-random-secret
NEXT_PUBLIC_SITE_URL=https://your-vercel-domain.vercel.app
```

Build settings:

```text
Framework Preset: Next.js
Install Command: npm install
Build Command: npm run build
Output Directory: leave blank
Root Directory: leave blank
```

## Reminder setup

The app includes `app/api/reminders/route.ts`.

It checks reminder preferences and sends one email when current local hour matches the user's daily reminder time.
It also records each sent date in `reminder_sends`, so repeat calls do not send more than one reminder per day.

For one daily reminder:

- Use a free/low-cost external scheduler hitting `/api/reminders` once per day near the user's preferred reminder time.
- Header required: `Authorization: Bearer YOUR_CRON_SECRET`.
- The package no longer includes a Vercel cron definition.

## Data pages

### Login

Nature + human-machine bonding visual. Google login.

### Daily Entry

One screen with sliders/dropdowns for:

- Physical Vitality
- Inner Practice
- Mindful Eating
- Revenue & Money-Energy Work
- Growth & Self-Learning
- AI/Human Partnership Practice
- Family Connection
- Seva + Planet Action
- Joyful Relaxation
- Sleep Preparation
- Sleep Pattern / Rest
- Meals, water, calories, energy, mood, reflection

### Mood

State-of-mind style slider, actual energy, stress/load, and associated factors.

### Gratitude

Browser-side encryption using AES-GCM and PBKDF2. Only encrypted text is stored in Supabase. The passphrase is not stored; if the user forgets it, gratitude content cannot be recovered.

### Dashboard

Shows daily, weekly and monthly:

- Wellbeing Score
- Happiness Quotient
- Performance Score
- Quantum Mind Readiness
- Predicted next-day energy
- Personalized forecast adjustment based on predicted vs actual energy feedback
- Actual mood and energy comparison
- Dimension chart

## Scoring note

This app is a reflection and planning tool, not a medical or psychological diagnosis tool.

"Quantum Mind Readiness" is used as a metaphor for disciplined attention, mental error-correction, learning, ethical judgment and human-machine partnership. It is not a claim that the brain becomes a quantum computer.
