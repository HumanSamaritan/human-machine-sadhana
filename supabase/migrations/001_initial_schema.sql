create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  timezone text default 'Asia/Singapore',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.daily_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  day_type text,
  entry_mode text,
  device_manual_note text,
  physical_vitality_min numeric default 0,
  inner_practice_min numeric default 0,
  mindful_eating_score numeric default 0,
  revenue_money_work_min numeric default 0,
  growth_self_learning_min numeric default 0,
  ai_human_partnership_min numeric default 0,
  family_connection_min numeric default 0,
  seva_planet_min numeric default 0,
  joyful_relaxation_min numeric default 0,
  sleep_preparation_min numeric default 0,
  sleep_hours numeric,
  sleep_quality numeric,
  meals_captured text,
  breakfast_notes text,
  lunch_notes text,
  dinner_notes text,
  water_litres numeric,
  estimated_calories numeric,
  energy_score numeric,
  mood_score numeric,
  one_short_reflection text,
  tomorrow_focus text,
  wellbeing_score numeric,
  performance_score numeric,
  happiness_quotient numeric,
  quantum_mind_score numeric,
  predicted_next_day_energy numeric,
  ai_assessment text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, entry_date)
);

create table if not exists public.mood_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  mood_time text default 'end_of_day',
  mood_score integer check (mood_score between 1 and 10),
  energy_score integer check (energy_score between 1 and 10),
  stress_score integer check (stress_score between 1 and 10),
  valence_label text,
  factors text[] default '{}',
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, entry_date, mood_time)
);

create table if not exists public.gratitude_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  ciphertext text not null,
  iv text not null,
  salt text not null,
  algorithm text default 'AES-GCM/PBKDF2-SHA256',
  item_count integer default 0,
  created_at timestamptz default now()
);

create table if not exists public.reminder_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  timezone text default 'Asia/Singapore',
  morning_time text default '08:00',
  afternoon_time text default '14:00',
  evening_time text default '20:30',
  enabled boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.prediction_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  predicted_energy numeric,
  actual_energy numeric,
  actual_mood numeric,
  prediction_delta numeric,
  notes text,
  created_at timestamptz default now(),
  unique(user_id, entry_date)
);

create table if not exists public.reminder_sends (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  local_date date not null,
  reminder_slot text not null check (reminder_slot in ('morning', 'afternoon', 'evening')),
  email text,
  sent_at timestamptz default now(),
  unique(user_id, local_date, reminder_slot)
);

alter table public.profiles enable row level security;
alter table public.daily_entries enable row level security;
alter table public.mood_entries enable row level security;
alter table public.gratitude_entries enable row level security;
alter table public.reminder_preferences enable row level security;
alter table public.prediction_feedback enable row level security;
alter table public.reminder_sends enable row level security;

create policy "profiles owner read" on public.profiles for select using (auth.uid() = id);
create policy "profiles owner insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles owner update" on public.profiles for update using (auth.uid() = id);

create policy "daily owner read" on public.daily_entries for select using (auth.uid() = user_id);
create policy "daily owner insert" on public.daily_entries for insert with check (auth.uid() = user_id);
create policy "daily owner update" on public.daily_entries for update using (auth.uid() = user_id);
create policy "daily owner delete" on public.daily_entries for delete using (auth.uid() = user_id);

create policy "mood owner read" on public.mood_entries for select using (auth.uid() = user_id);
create policy "mood owner insert" on public.mood_entries for insert with check (auth.uid() = user_id);
create policy "mood owner update" on public.mood_entries for update using (auth.uid() = user_id);
create policy "mood owner delete" on public.mood_entries for delete using (auth.uid() = user_id);

create policy "gratitude owner read" on public.gratitude_entries for select using (auth.uid() = user_id);
create policy "gratitude owner insert" on public.gratitude_entries for insert with check (auth.uid() = user_id);
create policy "gratitude owner delete" on public.gratitude_entries for delete using (auth.uid() = user_id);

create policy "reminders owner read" on public.reminder_preferences for select using (auth.uid() = user_id);
create policy "reminders owner insert" on public.reminder_preferences for insert with check (auth.uid() = user_id);
create policy "reminders owner update" on public.reminder_preferences for update using (auth.uid() = user_id);

create policy "feedback owner read" on public.prediction_feedback for select using (auth.uid() = user_id);
create policy "feedback owner insert" on public.prediction_feedback for insert with check (auth.uid() = user_id);
create policy "feedback owner update" on public.prediction_feedback for update using (auth.uid() = user_id);

create index if not exists daily_entries_user_date_idx on public.daily_entries(user_id, entry_date desc);
create index if not exists mood_entries_user_date_idx on public.mood_entries(user_id, entry_date desc);
create index if not exists gratitude_entries_user_date_idx on public.gratitude_entries(user_id, entry_date desc);
create index if not exists reminder_sends_user_date_idx on public.reminder_sends(user_id, local_date desc);
