-- Adds the "CRM & Automation" service card to the Technology section of the Services page.
--
-- Why a separate file: this row was added to 0009_recko_services_content.sql AFTER 0009 had already been run on the
-- live project, so the live database has the other eight services but not this one. Re-running 0009 would overwrite
-- any wording the client has since edited in Admin > Services for those eight services, so only the missing row is
-- added here. It is safe to run more than once and never changes an existing row: if a service with this address
-- already exists (published or hidden as a draft), it is left exactly as it is.
--
-- Prefer not to run SQL? The same card can be added in Admin > Services > New service (category: Web Experiences /
-- technology, name "CRM & Automation", then switch it to Published).
insert into public.services (slug, category, title, summary, details, features, status, sort_order)
values (
  'crm-automation',
  'technology',
  'CRM & Automation',
  'Connect your leads, sales team and follow-up flows so every enquiry is handled consistently.',
  'We set up practical CRM and automation workflows that help qualified leads move faster and keep your pipeline visible.',
  array['CRM setup and pipeline management','Lead routing and assignment','WhatsApp, email and SMS follow-up','Sales and reporting automation'],
  'published',
  2
)
on conflict (slug) do nothing;
