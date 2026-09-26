-- Hardening migration for EXOUSIA 2026
-- 1. Add CHECK constraints to public.events to secure capacity integrity
alter table public.events 
  add constraint chk_events_capacity check (capacity >= 0),
  add constraint chk_events_confirmed_count check (confirmed_count >= 0),
  add constraint chk_events_confirmed_limit check (confirmed_count <= capacity),
  add constraint chk_events_held_count check (held_count >= 0);

-- 2. Refactor public.register_participant_atomic to verify festival timeline and deadline
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
    select id, confirmed_count, capacity, registration_status 
      into v_event_id, v_confirmed_count, v_capacity, v_reg_status
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

  return p_confirmation_code;
end;
$$ language plpgsql security definer;
