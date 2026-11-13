-- Phase 4 security hardening (apply in the Supabase SQL editor; additive and non-destructive).
--
-- 1. inquiries.page_url is visitor-controlled (it travels through the public submit_inquiry RPC) and is shown
--    as a link in the admin inbox. Only http(s) URLs are legitimate, so reject anything else (javascript:,
--    data:, ...). NOT VALID enforces the rule for new rows without scanning or rejecting existing data.
alter table public.inquiries
  drop constraint if exists inquiries_page_url_http,
  add constraint inquiries_page_url_http check (page_url is null or page_url ~* '^https?://') not valid;

-- 2. The same applies to a services call-to-action URL: a protocol-relative "//host" matched the old "/" prefix.
alter table public.services
  drop constraint if exists services_cta_url_check,
  add constraint services_cta_url_check check (
    cta_url is null or (char_length(cta_url) <= 2000 and cta_url ~* '^(/(?!/)|#|https?://|mailto:|tel:)')
  ) not valid;
