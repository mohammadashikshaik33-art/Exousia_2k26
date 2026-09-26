-- Initialize Database Schema for EXOUSIA 2026
-- Department of Electrical & Electronics Engineering (EEE)

-- 1. Venues Table
create table public.venues (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  building text not null,
  room_number text,
  description text,
  coordinates text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Coordinators Table
create table public.coordinators (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  department text not null,
  role text not null,
  email text,
  phone text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Festival Editions Table
create table public.festival_editions (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text not null unique,
  year integer not null,
  theme text not null,
  tagline text not null,
  timezone text not null default 'Asia/Kolkata',
  starts_at timestamp with time zone not null,
  ends_at timestamp with time zone not null,
  registration_opens_at timestamp with time zone not null,
  registration_closes_at timestamp with time zone not null,
  registration_status text not null default 'upcoming' check (registration_status in ('upcoming', 'open', 'closed', 'suspended')),
  primary_venue_id uuid references public.venues(id) on delete set null,
  published boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Events Table
create table public.events (
  id uuid default gen_random_uuid() primary key,
  festival_id uuid references public.festival_editions(id) on delete cascade not null,
  slug text not null unique,
  title text not null,
  category text not null check (category in ('technical', 'spot', 'fun')),
  discipline_tags text[] not null default '{}',
  day_number integer not null check (day_number in (1, 2)),
  start_at text not null,
  end_at text not null,
  venue_id uuid references public.venues(id) on delete set null,
  short_description text not null,
  full_description text not null,
  objective text not null,
  rules text[] not null default '{}',
  eligibility text not null,
  team_min integer not null default 1,
  team_max integer not null default 1,
  duration_minutes integer not null,
  judging_criteria text[] not null default '{}',
  prize_label text not null,
  fee_minor integer not null default 0,
  currency text not null default 'INR',
  capacity integer not null,
  confirmed_count integer not null default 0,
  held_count integer not null default 0,
  registration_mode text not null default 'online' check (registration_mode in ('online', 'on-site', 'external', 'closed')),
  registration_status text not null default 'open' check (registration_status in ('open', 'closed', 'full')),
  external_registration_url text,
  featured boolean not null default false,
  poster_asset_id text,
  published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Event Coordinators Junction (Many-to-Many)
create table public.event_coordinators (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references public.events(id) on delete cascade not null,
  coordinator_id uuid references public.coordinators(id) on delete cascade not null,
  unique (event_id, coordinator_id)
);

-- 6. Registrations Table (Header + Primary contact + Team JSONB payload)
create table public.registrations (
  id uuid default gen_random_uuid() primary key,
  festival_id uuid references public.festival_editions(id) on delete cascade not null,
  confirmation_code text not null unique,
  idempotency_key text not null unique,
  registration_kind text not null check (registration_kind in ('festival-only', 'event-only', 'combined')),
  primary_name text not null,
  primary_email text not null,
  primary_phone text not null,
  primary_college text not null,
  primary_department text not null,
  primary_year text not null,
  status text not null default 'confirmed' check (status in ('pending', 'confirmed', 'cancelled')),
  team_name text,
  team_members jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Registration Items Table (Linked selected events)
create table public.registration_items (
  id uuid default gen_random_uuid() primary key,
  registration_id uuid references public.registrations(id) on delete cascade not null,
  event_id uuid references public.events(id) on delete cascade not null,
  status text not null default 'confirmed' check (status in ('pending', 'confirmed', 'cancelled')),
  fee_snapshot integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Payments Table (Razorpay billing metadata)
create table public.payments (
  id uuid default gen_random_uuid() primary key,
  registration_id uuid references public.registrations(id) on delete cascade not null,
  provider text not null check (provider = 'razorpay'),
  provider_order_id text not null unique,
  provider_payment_id text,
  amount integer not null, -- minor units (paise)
  currency text not null default 'INR',
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed', 'refunded')),
  verified_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);


-- INDEXES FOR PERFORMANCE HARDENING
create index idx_events_published_category on public.events(published, category);
create index idx_events_slug on public.events(slug);
create index idx_registrations_confirmation on public.registrations(confirmation_code);
create index idx_registrations_idempotency on public.registrations(idempotency_key);
create index idx_registration_items_event on public.registration_items(event_id);
create index idx_payments_order on public.payments(provider_order_id);


-- ENABLE ROW LEVEL SECURITY
alter table public.festival_editions enable row level security;
alter table public.venues enable row level security;
alter table public.coordinators enable row level security;
alter table public.events enable row level security;
alter table public.event_coordinators enable row level security;
alter table public.registrations enable row level security;
alter table public.registration_items enable row level security;
alter table public.payments enable row level security;


-- PUBLIC READ-ONLY ACCESS POLICIES
create policy "Allow public read access to published festival editions"
  on public.festival_editions for select
  using (published = true);

create policy "Allow public read access to all venues"
  on public.venues for select
  using (true);

create policy "Allow public read access to all coordinators"
  on public.coordinators for select
  using (true);

create policy "Allow public read access to published events"
  on public.events for select
  using (published = true);

create policy "Allow public read access to event-coordinators maps"
  on public.event_coordinators for select
  using (true);


-- RESTRICT PRIVILEGED ACCESS TO SERVICE ROLE ONLY (NO PUBLIC REST WRITES)
create policy "Restricted select registrations check"
  on public.registrations for select
  using (false); -- Only service role / server can fetch registrations globally

create policy "Restricted select items check"
  on public.registration_items for select
  using (false);

create policy "Restricted select payments check"
  on public.payments for select
  using (false);


-- ATOMIC DATABASE TRANSACTION RPC FOR CONCURRENCY MANAGEMENT
create or replace function public.register_participant_atomic(
  p_festival_slug text,
  p_registration_kind text,
  p_primary_name text,
  p_primary_email text,
  p_primary_phone text,
  p_primary_college text,
  p_primary_department text,
  p_primary_year text,
  p_team_name text,
  p_team_members jsonb,
  p_event_slug text,
  p_confirmation_code text,
  p_idempotency_key text
) returns text as $$
declare
  v_festival_id uuid;
  v_event_id uuid;
  v_registration_id uuid;
  v_confirmed_count integer;
  v_capacity integer;
  v_reg_status text;
  v_already_registered boolean;
begin
  -- 1. Resolve festival ID
  select id into v_festival_id from public.festival_editions where slug = p_festival_slug;
  if v_festival_id is null then
    raise exception 'festival_not_found';
  end if;

  -- 2. Check for duplicate registration on this email/festival
  select exists(
    select 1 from public.registrations 
    where primary_email = p_primary_email 
      and festival_id = v_festival_id 
      and registration_kind = p_registration_kind
  ) into v_already_registered;

  if v_already_registered then
    raise exception 'duplicate_registration';
  end if;

  -- 3. Resolve and lock event if specified
  if p_event_slug is not null and p_event_slug <> '' then
    select id, confirmed_count, capacity, registration_status 
      into v_event_id, v_confirmed_count, v_capacity, v_reg_status
      from public.events
      where slug = p_event_slug
      for update;

    if v_event_id is null then
      raise exception 'event_not_found';
    end if;

    -- Concurrency check: Ensure space remains
    if v_confirmed_count >= v_capacity or v_reg_status <> 'open' then
      raise exception 'capacity_exhausted';
    end if;
  end if;

  -- 4. Create Registration Header
  insert into public.registrations (
    festival_id,
    confirmation_code,
    idempotency_key,
    registration_kind,
    primary_name,
    primary_email,
    primary_phone,
    primary_college,
    primary_department,
    primary_year,
    status,
    team_name,
    team_members
  ) values (
    v_festival_id,
    p_confirmation_code,
    p_idempotency_key,
    p_registration_kind,
    p_primary_name,
    p_primary_email,
    p_primary_phone,
    p_primary_college,
    p_primary_department,
    p_primary_year,
    'confirmed',
    p_team_name,
    p_team_members
  ) returning id into v_registration_id;

  -- 5. Attach Registration Item & atomic increment
  if v_event_id is not null then
    insert into public.registration_items (
      registration_id,
      event_id,
      status,
      fee_snapshot
    ) values (
      v_registration_id,
      v_event_id,
      'confirmed',
      0 -- Free entries
    );

    update public.events
      set confirmed_count = confirmed_count + 1
      where id = v_event_id;
  end if;

  return p_confirmation_code;
end;
$$ language plpgsql security definer;
