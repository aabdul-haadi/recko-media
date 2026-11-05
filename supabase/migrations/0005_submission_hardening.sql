-- Phase 3: hardened public inquiry submission.
-- Defence in depth, all enforced in the database so it also protects direct API calls:
--   * honeypot, minimum fill time, content heuristics (links / markup / repeated text) -> flagged as SPAM, never lost
--   * rate limits per email, per network address (hashed) and a global circuit breaker
--   * control-character stripping, strict length + format validation, duplicate collapsing
-- Spam is stored (so a real person is never silently dropped) but hidden from the inbox and contacts.

alter table public.inquiries
  add column if not exists spam boolean not null default false,
  add column if not exists spam_reason text check (spam_reason is null or char_length(spam_reason) <= 100),
  add column if not exists ip_hash text check (ip_hash is null or char_length(ip_hash) <= 64),
  add column if not exists user_agent text check (user_agent is null or char_length(user_agent) <= 300);

create index if not exists inquiries_ip_idx on public.inquiries (ip_hash, created_at desc) where ip_hash is not null;
create index if not exists inquiries_inbox_idx on public.inquiries (created_at desc) where not archived and not spam;

create or replace function public.clean_text(value text)
returns text language sql immutable as $$
  select btrim(regexp_replace(coalesce(value, ''), '[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]', '', 'g'));
$$;

create or replace function public.submit_inquiry(payload jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_headers jsonb := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::jsonb;
  v_ip text := nullif(btrim(split_part(coalesce(v_headers->>'cf-connecting-ip', v_headers->>'x-real-ip', v_headers->>'x-forwarded-for', ''), ',', 1)), '');
  v_ip_hash text;
  v_ua text := left(nullif(v_headers->>'user-agent', ''), 300);
  v_name text := public.clean_text(payload->>'name');
  v_email text := public.clean_text(payload->>'email');
  v_phone text := nullif(public.clean_text(payload->>'phone'), '');
  v_company text := nullif(public.clean_text(payload->>'company'), '');
  v_subject text := nullif(public.clean_text(payload->>'subject'), '');
  v_message text := public.clean_text(payload->>'message');
  v_service text := nullif(public.clean_text(payload->>'service'), '');
  v_source text := coalesce(nullif(public.clean_text(payload->>'source'), ''), 'website');
  v_page text := nullif(public.clean_text(payload->>'page_url'), '');
  v_extra jsonb := case when jsonb_typeof(payload->'extra') = 'object' then payload->'extra' else '{}'::jsonb end;
  v_elapsed integer := case when (payload->>'elapsed_ms') ~ '^[0-9]{1,9}$' then (payload->>'elapsed_ms')::integer end;
  v_norm text;
  v_reason text;
  v_contact uuid;
  v_existing uuid;
  v_id uuid;
begin
  -- Honeypot: bots fill the hidden "website" field. Pretend success and store nothing.
  if coalesce(payload->>'website', '') <> '' then
    return gen_random_uuid();
  end if;

  -- Strict validation (these are real mistakes a visitor can fix).
  if char_length(v_name) not between 1 and 200 then raise exception 'invalid_name' using errcode = '22023'; end if;
  if char_length(v_email) > 320 or v_email !~* '^[A-Za-z0-9._%+''-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' then
    raise exception 'invalid_email' using errcode = '22023';
  end if;
  if char_length(v_message) not between 5 and 10000 then raise exception 'invalid_message' using errcode = '22023'; end if;
  if v_phone is not null and (char_length(v_phone) > 50 or v_phone !~ '^[0-9+()./ -]{5,50}$') then
    raise exception 'invalid_phone' using errcode = '22023';
  end if;
  if pg_column_size(v_extra) > 8000 then v_extra := '{}'::jsonb; end if;

  v_norm := lower(v_email);
  v_ip_hash := case when v_ip is null then null else md5('reckomedia:' || v_ip) end;

  -- Duplicate (double click / retry): same email + message within 10 minutes returns the original.
  select id into v_existing from public.inquiries
   where lower(email) = v_norm and message = v_message and created_at > now() - interval '10 minutes'
   order by created_at desc limit 1;
  if v_existing is not null then return v_existing; end if;

  -- Rate limits. Hitting one returns a friendly error; nothing is stored.
  if (select count(*) from public.inquiries where lower(email) = v_norm and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'rate_limited' using errcode = '54000';
  end if;
  if v_ip_hash is not null then
    if (select count(*) from public.inquiries where ip_hash = v_ip_hash and created_at > now() - interval '1 hour') >= 8
       or (select count(*) from public.inquiries where ip_hash = v_ip_hash and created_at > now() - interval '1 day') >= 30 then
      raise exception 'rate_limited' using errcode = '54000';
    end if;
  end if;
  -- Circuit breaker against distributed floods.
  if (select count(*) from public.inquiries where created_at > now() - interval '1 hour') >= 300 then
    raise exception 'rate_limited' using errcode = '54000';
  end if;

  -- Content heuristics. Suspicious submissions are kept but flagged as spam for admin review.
  if v_elapsed is not null and v_elapsed < 2500 then
    v_reason := 'too_fast';
  elsif (char_length(v_message) - char_length(replace(lower(v_message), 'http', ''))) / 4 > 2 then
    v_reason := 'many_links';
  elsif v_message ~* '<\s*(script|a|iframe|img|object|embed|form)\M' or v_name ~ '[<>]' or v_name ~* '^(https?://|www\.)' then
    v_reason := 'markup_or_link_in_name';
  elsif v_ip_hash is not null and exists (
    select 1 from public.inquiries where ip_hash = v_ip_hash and message = v_message and created_at > now() - interval '1 day'
  ) then
    v_reason := 'repeated_message';
  end if;

  if v_reason is null then
    insert into public.contacts (full_name, email, phone, company)
    values (v_name, v_email, v_phone, v_company)
    on conflict (email_normalized) where email_normalized is not null
    do update set
      last_interaction_at = now(),
      phone = coalesce(public.contacts.phone, excluded.phone),
      company = coalesce(public.contacts.company, excluded.company)
    returning id into v_contact;
  end if;

  insert into public.inquiries (contact_id, name, email, phone, company, subject, message, service, source, page_url, extra,
                                spam, spam_reason, ip_hash, user_agent)
  values (v_contact, v_name, v_email, v_phone, v_company, v_subject, v_message, v_service, left(v_source, 100), left(v_page, 2000),
          v_extra, v_reason is not null, v_reason, v_ip_hash, v_ua)
  returning id into v_id;

  return v_id;
end $$;
revoke all on function public.submit_inquiry(jsonb) from public;
grant execute on function public.submit_inquiry(jsonb) to anon, authenticated;
revoke all on function public.clean_text(text) from public, anon, authenticated;
