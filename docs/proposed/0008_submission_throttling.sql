-- PROPOSED - NOT APPLIED, NOT IN supabase/migrations.
-- Replaces public.submit_inquiry from migration 0005. Read docs/audit/THROTTLING_PROPOSAL.md first.
-- Do not run this against any project until the live-database checklist (docs/audit/LIVE_SUPABASE_CHECKLIST.md)
-- is complete and the owner has approved it. It is additive: no table is dropped, no row is changed or removed.

-- 1. A private home for the hashing secret. The "private" schema is not exposed through the API (verify in the
--    checklist) and only this security-definer function can read it. The value is generated inside the database
--    from the CSPRNG behind gen_random_uuid(); it never appears in git, logs or the front end.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table if not exists private.app_secrets (name text primary key, value text not null);
alter table private.app_secrets enable row level security;     -- no policies: nobody but the owner role can read it
revoke all on private.app_secrets from public, anon, authenticated;
insert into private.app_secrets (name, value)
values ('ip_hash_pepper', replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''))
on conflict (name) do nothing;

-- 2. Replacement function.
create or replace function public.submit_inquiry(payload jsonb)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_headers jsonb := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::jsonb;
  -- Cloudflare overwrites cf-connecting-ip, so a visitor cannot forge it. x-forwarded-for is client-appendable,
  -- so only its LAST entry (added by the nearest trusted proxy) is used, and only as a fallback. x-real-ip is NOT
  -- used: unless the gateway is shown to overwrite it, a visitor could set it to anything.
  v_ip_raw text := nullif(btrim(coalesce(
    v_headers->>'cf-connecting-ip',
    nullif(btrim(regexp_replace(coalesce(v_headers->>'x-forwarded-for', ''), '^.*,', '')), ''),
    '')), '');
  v_ip text;
  v_ip_hash text;
  v_pepper text;
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
  if pg_column_size(payload) > 60000 then raise exception 'invalid_message' using errcode = '22023'; end if;

  -- Honeypot: bots fill the hidden field. Pretend success and store nothing.
  if coalesce(payload->>'website', '') <> '' then return gen_random_uuid(); end if;

  if char_length(v_name) not between 1 and 200 then raise exception 'invalid_name' using errcode = '22023'; end if;
  if char_length(v_email) > 320 or v_email !~* '^[A-Za-z0-9._%+''-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' then
    raise exception 'invalid_email' using errcode = '22023';
  end if;
  if char_length(v_message) not between 5 and 10000 then raise exception 'invalid_message' using errcode = '22023'; end if;
  if v_phone is not null and (char_length(v_phone) > 50 or v_phone !~ '^[0-9+()./ -]{5,50}$') then
    raise exception 'invalid_phone' using errcode = '22023';
  end if;
  if pg_column_size(v_extra) > 8000 then v_extra := '{}'::jsonb; end if;
  -- Only http(s) page addresses are kept; anything else is dropped instead of failing the visitor's message.
  if v_page is not null and v_page !~* '^https?://' then v_page := null; end if;

  v_norm := lower(v_email);

  -- Keyed hash of the visitor's network address. IPv6 is reduced to its /64 so rotating addresses inside one
  -- network share a bucket. A garbled header simply means "no address known".
  if v_ip_raw is not null then
    begin
      v_ip := case when v_ip_raw like '%:%' then host(network(set_masklen(v_ip_raw::inet, 64))) else host(v_ip_raw::inet) end;
    exception when others then
      v_ip := null;
    end;
  end if;
  if v_ip is not null then
    select value into v_pepper from private.app_secrets where name = 'ip_hash_pepper';
    if v_pepper is null then
      v_ip := null;                                      -- fail open on privacy: store no address rather than a weak hash
    else
      v_ip_hash := encode(sha256(convert_to(v_pepper || ':' || v_ip, 'UTF8')), 'hex');
    end if;
  end if;

  -- Serialise concurrent submissions that share an email or a network, so the counts below cannot be raced
  -- by parallel requests. Locks are transaction-scoped (released automatically) and always taken in the same
  -- order (email, then network), so they cannot deadlock.
  -- A short lock timeout stops a burst of identical requests from queueing up and holding database connections.
  perform set_config('lock_timeout', '3s', true);
  perform pg_advisory_xact_lock(hashtextextended('inq:email:' || v_norm, 0));
  if v_ip_hash is not null then perform pg_advisory_xact_lock(hashtextextended('inq:ip:' || v_ip_hash, 0)); end if;

  -- Duplicate (double click / client retry): same email + message within 10 minutes returns the original.
  select id into v_existing from public.inquiries
   where lower(email) = v_norm and message = v_message and created_at > now() - interval '10 minutes'
   order by created_at desc limit 1;
  if v_existing is not null then return v_existing; end if;

  -- Per-sender limits: the only ones that reject. They protect a single inbox/network from being flooded.
  if (select count(*) from public.inquiries where lower(email) = v_norm and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'rate_limited' using errcode = '54000';
  end if;
  if v_ip_hash is not null and (
       (select count(*) from public.inquiries where ip_hash = v_ip_hash and created_at > now() - interval '1 hour') >= 8
    or (select count(*) from public.inquiries where ip_hash = v_ip_hash and created_at > now() - interval '1 day') >= 30) then
    raise exception 'rate_limited' using errcode = '54000';
  end if;

  -- Global flood guard. It must not be a switch an attacker can flip to lock real visitors out, so beyond the soft
  -- limit messages are still STORED, quarantined as spam ('flood_guard') where the admin can restore them with one
  -- click. Only an extreme hard cap rejects, to bound storage.
  if (select count(*) from public.inquiries where created_at > now() - interval '1 hour') >= 3000 then
    raise exception 'rate_limited' using errcode = '54000';
  end if;

  -- Content heuristics. Suspicious submissions are kept but flagged as spam for admin review.
  if v_elapsed is not null and v_elapsed < 1200 then
    v_reason := 'too_fast';                              -- was 2500: browser autofill lets real people finish quickly
  elsif (select count(*) from public.inquiries where created_at > now() - interval '1 hour' and not spam) >= 300 then
    v_reason := 'flood_guard';
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

-- 3. Supporting index for the global/flood-guard counts (cheap, additive).
create index if not exists inquiries_recent_idx on public.inquiries (created_at desc) where not spam;

-- Existing ip_hash values (unkeyed md5) simply stop matching new submissions, so every network starts with a clean
-- count after this runs. They age out; a retention job (delete ip_hash/user_agent older than 30 days) is recommended
-- separately and is NOT part of this file.
