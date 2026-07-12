-- Supabase SQL Editor içinde bu dosyanın tamamını çalıştır.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nickname text not null,
  brand text not null,
  model text not null,
  model_year integer check (model_year is null or model_year between 1900 and 2100),
  fuel_type text not null check (fuel_type in ('Benzin', 'Dizel', 'LPG')),
  plate text,
  start_odometer integer not null check (start_odometer >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists vehicles_user_plate_unique
on public.vehicles (user_id, upper(plate))
where plate is not null and plate <> '';

create index if not exists vehicles_user_id_index
on public.vehicles (user_id);

create table if not exists public.fuel_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  record_date date not null,
  odometer integer not null check (odometer >= 0),
  liters numeric(10, 2) not null check (liters > 0),
  amount numeric(12, 2) not null check (amount > 0),
  fuel_type text not null check (fuel_type in ('Benzin', 'Dizel', 'LPG')),
  station text,
  city text,
  full_tank boolean not null default true,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (vehicle_id, odometer)
);

create index if not exists fuel_records_user_id_index
on public.fuel_records (user_id);

create index if not exists fuel_records_vehicle_id_index
on public.fuel_records (vehicle_id);

create index if not exists fuel_records_date_index
on public.fuel_records (record_date desc);

create or replace function public.update_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists update_profiles_updated_at on public.profiles;
create trigger update_profiles_updated_at
before update on public.profiles
for each row execute function public.update_updated_at();

drop trigger if exists update_vehicles_updated_at on public.vehicles;
create trigger update_vehicles_updated_at
before update on public.vehicles
for each row execute function public.update_updated_at();

drop trigger if exists update_fuel_records_updated_at on public.fuel_records;
create trigger update_fuel_records_updated_at
before update on public.fuel_records
for each row execute function public.update_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.fuel_records enable row level security;

drop policy if exists "profile_select_own" on public.profiles;
create policy "profile_select_own"
on public.profiles for select to authenticated
using ((select auth.uid()) = id);

drop policy if exists "profile_update_own" on public.profiles;
create policy "profile_update_own"
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "vehicles_select_own" on public.vehicles;
create policy "vehicles_select_own"
on public.vehicles for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "vehicles_insert_own" on public.vehicles;
create policy "vehicles_insert_own"
on public.vehicles for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "vehicles_update_own" on public.vehicles;
create policy "vehicles_update_own"
on public.vehicles for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "vehicles_delete_own" on public.vehicles;
create policy "vehicles_delete_own"
on public.vehicles for delete to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "fuel_records_select_own" on public.fuel_records;
create policy "fuel_records_select_own"
on public.fuel_records for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "fuel_records_insert_own" on public.fuel_records;
create policy "fuel_records_insert_own"
on public.fuel_records for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.vehicles
    where vehicles.id = fuel_records.vehicle_id
      and vehicles.user_id = (select auth.uid())
  )
);

drop policy if exists "fuel_records_update_own" on public.fuel_records;
create policy "fuel_records_update_own"
on public.fuel_records for update to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.vehicles
    where vehicles.id = fuel_records.vehicle_id
      and vehicles.user_id = (select auth.uid())
  )
);

drop policy if exists "fuel_records_delete_own" on public.fuel_records;
create policy "fuel_records_delete_own"
on public.fuel_records for delete to authenticated
using ((select auth.uid()) = user_id);
