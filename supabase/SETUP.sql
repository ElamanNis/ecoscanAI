-- EcoScan AI Supabase setup (run in Supabase SQL Editor)
-- Safe to re-run: uses IF NOT EXISTS / OR REPLACE where possible.

-- 0) Extensions (for gen_random_uuid)
create extension if not exists pgcrypto;

-- 0.1) Core tables (create if missing)
-- Notes:
-- - `auth.users.id` is a UUID in Supabase
-- - app code inserts into scans_history without id/created_at, so defaults are required

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  subscription_tier text not null default 'free' check (subscription_tier in ('free','standard','premium')),
  api_usage_count integer not null default 0,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.scans_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  region text not null,
  ndvi double precision not null,
  ndvi_category text not null,
  analysis_type text not null,
  payload jsonb not null
);

create table if not exists public.api_keys (
  api_key text not null,
  key_id text not null,
  plan text not null check (plan in ('free','pro','enterprise')),
  request_limit_per_minute integer not null,
  active boolean not null default true,
  created_at timestamptz default now(),
  last_used_at timestamptz,
  label text
);

create table if not exists public.rate_limits (
  key_id text primary key,
  count integer not null,
  reset_at bigint not null
);

-- 1) PROFILES: add Stripe fields (optional but recommended)
-- If `public.profiles` already exists (e.g. from Supabase starter template),
-- ensure required columns exist for this app.

alter table if exists public.profiles
  add column if not exists subscription_tier text,
  add column if not exists api_usage_count integer,
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists created_at timestamptz,
  add column if not exists updated_at timestamptz;

-- Normalize defaults for existing rows/columns
update public.profiles set subscription_tier = 'free' where subscription_tier is null;
update public.profiles set api_usage_count = 0 where api_usage_count is null;
update public.profiles set created_at = now() where created_at is null;
update public.profiles set updated_at = now() where updated_at is null;

alter table public.profiles alter column subscription_tier set default 'free';
alter table public.profiles alter column api_usage_count set default 0;

do $$
begin
  -- Ensure subscription tier is constrained to supported values
  if not exists (select 1 from pg_constraint where conname = 'profiles_subscription_tier_check') then
    alter table public.profiles
      add constraint profiles_subscription_tier_check
      check (subscription_tier in ('free','standard','premium'));
  end if;
end $$;

create index if not exists profiles_stripe_customer_id_idx on public.profiles (stripe_customer_id);
create index if not exists profiles_stripe_subscription_id_idx on public.profiles (stripe_subscription_id);

-- 2) SCANS HISTORY: index for faster dashboard + monthly counters
create index if not exists scans_history_user_created_idx on public.scans_history (user_id, created_at desc);

-- 3) API KEYS: unique constraints (recommended)
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='api_keys') then
    if not exists (select 1 from pg_constraint where conname = 'api_keys_api_key_unique') then
      alter table public.api_keys add constraint api_keys_api_key_unique unique (api_key);
    end if;
    if not exists (select 1 from pg_constraint where conname = 'api_keys_key_id_unique') then
      alter table public.api_keys add constraint api_keys_key_id_unique unique (key_id);
    end if;
  end if;
end $$;

-- 4) AUTO-CREATE PROFILE on signup (recommended)
-- Creates a profile row when a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Never block signups if `profiles` is misconfigured.
  -- The app also has a fallback: `/api/me` will create a profile row if missing.
  begin
    insert into public.profiles (id, full_name)
    values (new.id, null)
    on conflict (id) do nothing;
  exception
    when undefined_table then
      null;
    when others then
      null;
  end;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5) RLS POLICIES
-- Enable RLS
alter table public.profiles enable row level security;
alter table public.scans_history enable row level security;
alter table public.api_keys enable row level security;
alter table public.rate_limits enable row level security;

-- PROFILES: only the owner can read/write their profile
-- If you previously used Supabase "profiles" template, remove the public policy:
drop policy if exists "Public profiles are viewable by everyone." on public.profiles;

drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can view own profile." on public.profiles;
create policy "Users can view own profile"
  on public.profiles
  for select
  using ((select auth.uid()) = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can insert their own profile." on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles
  for insert
  with check ((select auth.uid()) = id);

drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can update own profile." on public.profiles;
create policy "Users can update own profile"
  on public.profiles
  for update
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- SCANS HISTORY: only the owner can read/insert their scans
drop policy if exists "Users can view own scans" on public.scans_history;
create policy "Users can view own scans"
  on public.scans_history
  for select
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own scans" on public.scans_history;
create policy "Users can insert own scans"
  on public.scans_history
  for insert
  with check ((select auth.uid()) = user_id);

-- API KEYS + RATE LIMITS: deny by default (server uses service role key)
-- No policies intentionally.
