-- Phase 4 security hardening (additive; review docs/audit/LIVE_SUPABASE_CHECKLIST.md before applying).
--
-- 1. inquiries.page_url is visitor-controlled (it travels through the public submit_inquiry RPC) and is shown
--    as a link in the admin inbox. Only http(s) URLs are legitimate, so reject anything else (javascript:,
--    data:, ...).
--
--    A NOT VALID check is skipped for rows that already exist, but it IS checked whenever such a row is
--    updated later (archiving, changing status...). So any existing non-http(s) value is first moved into the
--    row's "extra" data (nothing is lost) and cleared, otherwise the admin could no longer update that inquiry.
update public.inquiries
   set extra = coalesce(extra, '{}'::jsonb) || jsonb_build_object('original_page_url', left(page_url, 2000)),
       page_url = null
 where page_url is not null and page_url !~* '^https?://';

alter table public.inquiries
  drop constraint if exists inquiries_page_url_http,
  add constraint inquiries_page_url_http check (page_url is null or page_url ~* '^https?://') not valid;
alter table public.inquiries validate constraint inquiries_page_url_http;

-- 2. The same applies to a services call-to-action URL: a protocol-relative "//host" (or "/\host") matched the
--    old "/" prefix and would link visitors to another site. Content is edited by people, so an existing offending
--    value is NOT rewritten automatically: the migration stops and names the rows so they can be fixed in the admin.
do $$
declare bad text;
begin
  select string_agg(slug || ' -> ' || cta_url, '; ') into bad
    from public.services
   where cta_url is not null and not (cta_url ~* '^(/(?![/\\])|#|https?://|mailto:|tel:)');
  if bad is not null then
    raise exception 'services have call-to-action links that need a manual fix before this migration: %', bad;
  end if;
end $$;

alter table public.services
  drop constraint if exists services_cta_url_check,
  add constraint services_cta_url_check check (
    cta_url is null or (char_length(cta_url) <= 2000 and cta_url ~* '^(/(?![/\\])|#|https?://|mailto:|tel:)')
  );
