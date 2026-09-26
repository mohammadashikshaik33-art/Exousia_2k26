-- Migration to create email outbox and update registration transaction
-- 1. Create Email Outbox Table
create table public.email_outbox (
  id uuid default gen_random_uuid() primary key,
  registration_id uuid references public.registrations(id) on delete cascade not null,
  recipient text not null,
  subject text not null,
  body text not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  error_message text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  sent_at timestamp with time zone
);

-- Index for background worker queries
create index idx_email_outbox_status on public.email_outbox(status);

-- Enable RLS (Service-role only writes)
alter table public.email_outbox enable row level security;

create policy "Restricted select outbox check"
  on public.email_outbox for select
  using (false); -- Only service role / server can fetch outbox entries

-- 2. Update public.register_participant_atomic to insert outbox notification
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
  v_fest_reg_status text;
  v_fest_closes_at timestamp with time zone;
  v_event_title text;
  v_email_body text;
begin
  -- 1. Resolve festival ID and verify timeline constraints (Must be published)
  select id, registration_status, registration_closes_at 
    into v_festival_id, v_fest_reg_status, v_fest_closes_at
    from public.festival_editions 
    where slug = p_festival_slug
      and published = true;
    
  if v_festival_id is null then
    raise exception 'festival_not_found';
  end if;

  -- Enforce database-level timeline validity
  if v_fest_reg_status <> 'open' then
    raise exception 'registration_closed';
  end if;
  
  if now() > v_fest_closes_at then
    raise exception 'registration_deadline_passed';
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

  -- 3. Resolve and lock event if specified (Must be published)
  if p_event_slug is not null and p_event_slug <> '' then
    select id, title, confirmed_count, capacity, registration_status 
      into v_event_id, v_event_title, v_confirmed_count, v_capacity, v_reg_status
      from public.events
      where slug = p_event_slug
        and published = true
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

  -- 6. Insert Email Outbox Record
  v_email_body := 'Hello ' || p_primary_name || ',' || chr(10) || chr(10) ||
                  'Your registration for EXOUSIA 2026 is CONFIRMED.' || chr(10) ||
                  'Confirmation Receipt: ' || p_confirmation_code || chr(10) ||
                  'Registration Type: ' || p_registration_kind || chr(10);
                  
  if v_event_title is not null then
    v_email_body := v_email_body || 'Allocated Lab Event: ' || v_event_title || chr(10);
  end if;
  
  if p_team_name is not null and p_team_name <> '' then
    v_email_body := v_email_body || 'Allocated Team Name: ' || p_team_name || chr(10);
  end if;
  
  v_email_body := v_email_body || chr(10) || 'Please report at the EEE Block Central Atrium to verify credentials.' || chr(10) ||
                  'Department of EEE // EXOUSIA 2026';

  insert into public.email_outbox (
    registration_id,
    recipient,
    subject,
    body,
    status
  ) values (
    v_registration_id,
    p_primary_email,
    'EXOUSIA 2026 Registration Confirmation - ' || p_confirmation_code,
    v_email_body,
    'pending'
  );

  return p_confirmation_code;
end;
$$ language plpgsql security definer;
