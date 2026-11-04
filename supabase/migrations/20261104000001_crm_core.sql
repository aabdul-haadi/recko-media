-- ReckoMEDIA CMS + CRM: Phase 1 core (admin, contacts, inquiries, notes, tasks, activity).
-- Single role: ADMIN. Admin accounts are created manually (see docs/ADMIN_SETUP.md).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- helpers
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'admin' check (role = 'admin'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- Only users with a profile row are admins. Profiles are inserted manually, never by trigger,
-- so enabling sign-ups by mistake can not grant admin access.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin');
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------- contacts
create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 1 and 200),
  email text check (email is null or char_length(email) <= 320),
  email_normalized text generated always as (nullif(lower(btrim(email)), '')) stored,
  phone text check (phone is null or char_length(phone) <= 50),
  company text check (company is null or char_length(company) <= 200),
  status text not null default 'lead' check (status in ('lead','active','client','inactive')),
  notes text check (notes is null or char_length(notes) <= 10000),
  first_contact_at timestamptz not null default now(),
  last_interaction_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index contacts_email_unique on public.contacts (email_normalized) where email_normalized is not null;
create index contacts_name_idx on public.contacts (lower(full_name));
create index contacts_last_interaction_idx on public.contacts (last_interaction_at desc);
create trigger contacts_updated before update on public.contacts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- tags
create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 1 and 50),
  created_at timestamptz not null default now()
);
create table public.contact_tags (
  contact_id uuid not null references public.contacts(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (contact_id, tag_id)
);
create index contact_tags_tag_idx on public.contact_tags (tag_id);

-- ---------------------------------------------------------------- inquiries
create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references public.contacts(id) on delete set null,
  name text not null check (char_length(name) between 1 and 200),
  email text not null check (char_length(email) between 3 and 320),
  phone text check (phone is null or char_length(phone) <= 50),
  company text check (company is null or char_length(company) <= 200),
  subject text check (subject is null or char_length(subject) <= 300),
  message text not null check (char_length(message) between 1 and 10000),
  service text check (service is null or char_length(service) <= 200),
  source text not null default 'website' check (char_length(source) <= 100),
  page_url text check (page_url is null or char_length(page_url) <= 2000),
  extra jsonb not null default '{}'::jsonb,
  status text not null default 'new' check (status in ('new','in_progress','responded','closed')),
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  follow_up_at timestamptz,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index inquiries_created_idx on public.inquiries (created_at desc);
create index inquiries_status_idx on public.inquiries (status) where not archived;
create index inquiries_contact_idx on public.inquiries (contact_id);
create index inquiries_email_idx on public.inquiries (lower(email), created_at desc);
create trigger inquiries_updated before update on public.inquiries
  for each row execute function public.set_updated_at();

create table public.inquiry_notes (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.inquiries(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  author_id uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index inquiry_notes_inquiry_idx on public.inquiry_notes (inquiry_id, created_at desc);

-- ---------------------------------------------------------------- tasks
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 300),
  description text check (description is null or char_length(description) <= 5000),
  due_at timestamptz,
  status text not null default 'pending' check (status in ('pending','completed','cancelled')),
  contact_id uuid references public.contacts(id) on delete cascade,
  inquiry_id uuid references public.inquiries(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tasks_due_idx on public.tasks (due_at) where status = 'pending';
create trigger tasks_updated before update on public.tasks
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- activity log
create table public.activity_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index activity_logs_created_idx on public.activity_logs (created_at desc);
create index activity_logs_entity_idx on public.activity_logs (entity_type, entity_id);

create or replace function public.log_inquiry_changes()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.activity_logs(actor_id, entity_type, entity_id, action, details)
    values (auth.uid(), 'inquiry', new.id, 'created', jsonb_build_object('name', new.name, 'source', new.source));
  elsif tg_op = 'UPDATE' then
    if new.status is distinct from old.status then
      insert into public.activity_logs(actor_id, entity_type, entity_id, action, details)
      values (auth.uid(), 'inquiry', new.id, 'status_changed', jsonb_build_object('from', old.status, 'to', new.status));
    end if;
    if new.priority is distinct from old.priority then
      insert into public.activity_logs(actor_id, entity_type, entity_id, action, details)
      values (auth.uid(), 'inquiry', new.id, 'priority_changed', jsonb_build_object('from', old.priority, 'to', new.priority));
    end if;
    if new.archived is distinct from old.archived then
      insert into public.activity_logs(actor_id, entity_type, entity_id, action, details)
      values (auth.uid(), 'inquiry', new.id, case when new.archived then 'archived' else 'unarchived' end, '{}'::jsonb);
    end if;
    if new.follow_up_at is distinct from old.follow_up_at then
      insert into public.activity_logs(actor_id, entity_type, entity_id, action, details)
      values (auth.uid(), 'inquiry', new.id, 'follow_up_set', jsonb_build_object('at', new.follow_up_at));
    end if;
  end if;
  return new;
end $$;
create trigger inquiries_activity after insert or update on public.inquiries
  for each row execute function public.log_inquiry_changes();

create or replace function public.log_inquiry_note()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.activity_logs(actor_id, entity_type, entity_id, action, details)
  values (auth.uid(), 'inquiry', new.inquiry_id, 'note_added', '{}'::jsonb);
  return new;
end $$;
create trigger inquiry_notes_activity after insert on public.inquiry_notes
  for each row execute function public.log_inquiry_note();

-- ---------------------------------------------------------------- row level security
alter table public.profiles       enable row level security;
alter table public.contacts       enable row level security;
alter table public.tags           enable row level security;
alter table public.contact_tags   enable row level security;
alter table public.inquiries      enable row level security;
alter table public.inquiry_notes  enable row level security;
alter table public.tasks          enable row level security;
alter table public.activity_logs  enable row level security;

-- Admin-only access. There are no policies for anon, so public users can read or write nothing directly.
create policy profiles_self_read on public.profiles for select to authenticated using (id = auth.uid());
create policy contacts_admin on public.contacts for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy tags_admin on public.tags for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy contact_tags_admin on public.contact_tags for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy inquiries_admin on public.inquiries for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy inquiry_notes_admin on public.inquiry_notes for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy tasks_admin on public.tasks for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy activity_admin_read on public.activity_logs for select to authenticated using (public.is_admin());

-- ---------------------------------------------------------------- secure public submission
-- The only way an anonymous visitor can write data. Validates, rate-limits, de-duplicates,
-- and links the inquiry to a contact via the normalized email.
create or replace function public.submit_inquiry(payload jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_name text := btrim(coalesce(payload->>'name', ''));
  v_email text := btrim(coalesce(payload->>'email', ''));
  v_phone text := nullif(btrim(coalesce(payload->>'phone', '')), '');
  v_company text := nullif(btrim(coalesce(payload->>'company', '')), '');
  v_subject text := nullif(btrim(coalesce(payload->>'subject', '')), '');
  v_message text := btrim(coalesce(payload->>'message', ''));
  v_service text := nullif(btrim(coalesce(payload->>'service', '')), '');
  v_source text := coalesce(nullif(btrim(coalesce(payload->>'source', '')), ''), 'website');
  v_page text := nullif(btrim(coalesce(payload->>'page_url', '')), '');
  v_extra jsonb := case when jsonb_typeof(payload->'extra') = 'object' then payload->'extra' else '{}'::jsonb end;
  v_norm text;
  v_contact uuid;
  v_existing uuid;
  v_id uuid;
begin
  -- Honeypot: bots fill the hidden "website" field. Pretend success and store nothing.
  if coalesce(payload->>'website', '') <> '' then
    return gen_random_uuid();
  end if;

  if char_length(v_name) not between 1 and 200 then raise exception 'invalid_name' using errcode = '22023'; end if;
  if v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' or char_length(v_email) > 320 then
    raise exception 'invalid_email' using errcode = '22023';
  end if;
  if char_length(v_message) not between 1 and 10000 then raise exception 'invalid_message' using errcode = '22023'; end if;
  if v_phone is not null and char_length(v_phone) > 50 then raise exception 'invalid_phone' using errcode = '22023'; end if;
  if pg_column_size(v_extra) > 8000 then v_extra := '{}'::jsonb; end if;

  v_norm := lower(v_email);

  -- Duplicate (double click / retry): same email + message within 10 minutes returns the original.
  select id into v_existing from public.inquiries
   where lower(email) = v_norm and message = v_message and created_at > now() - interval '10 minutes'
   order by created_at desc limit 1;
  if v_existing is not null then return v_existing; end if;

  -- Rate limit: at most 5 inquiries per email per hour.
  if (select count(*) from public.inquiries where lower(email) = v_norm and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'rate_limited' using errcode = '54000';
  end if;

  insert into public.contacts (full_name, email, phone, company)
  values (v_name, v_email, v_phone, v_company)
  on conflict (email_normalized) where email_normalized is not null
  do update set
    last_interaction_at = now(),
    phone = coalesce(public.contacts.phone, excluded.phone),
    company = coalesce(public.contacts.company, excluded.company)
  returning id into v_contact;

  insert into public.inquiries (contact_id, name, email, phone, company, subject, message, service, source, page_url, extra)
  values (v_contact, v_name, v_email, v_phone, v_company, v_subject, v_message, v_service, left(v_source, 100), left(v_page, 2000), v_extra)
  returning id into v_id;

  return v_id;
end $$;
revoke all on function public.submit_inquiry(jsonb) from public;
grant execute on function public.submit_inquiry(jsonb) to anon, authenticated;

-- ---------------------------------------------------------------- realtime (RLS still applies)
alter publication supabase_realtime add table public.inquiries;
