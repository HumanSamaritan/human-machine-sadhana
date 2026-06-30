# Database recommendation

For the public test, use Supabase.

## Supabase is better for 1,000 test users

- Built-in Google login through Supabase Auth.
- Postgres database with relational structure.
- Row-Level Security so each user sees only their own entries.
- API generated automatically for app use.
- Easier to create dashboards, weekly/monthly aggregation and analytics.
- Can scale from personal use to multi-user beta.

## Google Sheets is only good for a very early internal prototype

Google Sheets is simple and familiar, but for this app it has limitations:

- Harder to secure private data per user.
- API quota limitations can appear when users grow.
- Complex to keep encrypted private gratitude entries and user-level access clean.
- Charts and analytics become harder at scale.

## Cost path

- Start: Supabase Free + Vercel Hobby + Resend free/test where possible.
- For 3 reminders/day: use external free cron or Vercel Pro.
- For production and reliability: Supabase Pro + Vercel Pro.
