-- V1 schema sketch for Supabase. Memory store backs local/dev tests;
-- apply this when wiring a real project.

create extension if not exists "pgcrypto";

create table if not exists profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  sex text not null check (sex in ('male', 'female')),
  age_years int not null check (age_years between 1 and 120),
  height_cm numeric not null,
  weight_kg numeric not null,
  activity text not null,
  goal text not null,
  meals_per_day int not null default 3,
  units text not null default 'metric',
  diet_tags text[] not null default '{}',
  preferred_retailers text[] not null default '{}',
  equipment text[] not null default '{}',
  budget_aud_per_week numeric,
  ai_photo_consent boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists macro_targets (
  user_id uuid primary key references auth.users (id) on delete cascade,
  calories_kcal numeric not null,
  protein_g numeric not null,
  carbs_g numeric not null,
  fat_g numeric not null,
  source text not null check (source in ('suggested', 'manual')),
  updated_at timestamptz not null default now()
);

create table if not exists foods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  brand text,
  barcode text,
  serving_label text not null,
  serving_grams numeric not null,
  calories_kcal numeric not null,
  protein_g numeric not null,
  carbs_g numeric not null,
  fat_g numeric not null,
  bookmarked boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists diary_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  food_id uuid not null references foods (id),
  food_name text not null,
  logged_at timestamptz not null,
  meal_slot text not null,
  quantity numeric not null,
  notes text,
  calories_kcal numeric not null,
  protein_g numeric not null,
  carbs_g numeric not null,
  fat_g numeric not null,
  client_id uuid,
  created_at timestamptz not null default now(),
  unique (user_id, client_id)
);

create table if not exists audit_events (
  id bigserial primary key,
  user_id uuid,
  event_type text not null,
  meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;
alter table macro_targets enable row level security;
alter table foods enable row level security;
alter table diary_entries enable row level security;

create policy profiles_own on profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy targets_own on macro_targets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy foods_own on foods
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy diary_own on diary_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
