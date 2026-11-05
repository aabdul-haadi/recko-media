-- Phase 2: homepage content (draft + published) and services management.
-- Public visitors can read ONLY published rows. Drafts are admin-only.

-- ---------------------------------------------------------------- homepage content
create table public.content_drafts (
  key text primary key check (key ~ '^[a-z0-9_]{1,50}$'),
  data jsonb not null default '{}'::jsonb check (pg_column_size(data) < 200000),
  enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid()
);
create table public.content_published (
  key text primary key check (key ~ '^[a-z0-9_]{1,50}$'),
  data jsonb not null,
  enabled boolean not null default true,
  published_at timestamptz not null default now(),
  published_by uuid references auth.users(id) on delete set null
);

create or replace function public.touch_content_draft()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  new.updated_by = auth.uid();
  return new;
end $$;
create trigger content_drafts_touch before insert or update on public.content_drafts
  for each row execute function public.touch_content_draft();

-- Copies the draft to the live (published) table. Admin only.
create or replace function public.publish_content(p_key text)
returns timestamptz language plpgsql security definer set search_path = public as $$
declare v_at timestamptz := now();
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  insert into public.content_published (key, data, enabled, published_at, published_by)
  select d.key, d.data, d.enabled, v_at, auth.uid() from public.content_drafts d where d.key = p_key
  on conflict (key) do update
    set data = excluded.data, enabled = excluded.enabled, published_at = excluded.published_at, published_by = excluded.published_by;
  if not found then
    raise exception 'no_draft' using errcode = 'P0002';
  end if;
  insert into public.activity_logs(actor_id, entity_type, action, details)
  values (auth.uid(), 'content', 'published', jsonb_build_object('key', p_key));
  return v_at;
end $$;
revoke all on function public.publish_content(text) from public, anon;
grant execute on function public.publish_content(text) to authenticated;

-- ---------------------------------------------------------------- services
create table public.services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 100),
  category text not null check (category in ('creative','growth','technology')),
  title text not null check (char_length(title) between 1 and 200),
  summary text not null default '' check (char_length(summary) <= 500),
  details text check (details is null or char_length(details) <= 20000),
  features text[] not null default '{}' check (cardinality(features) <= 30),
  price text check (price is null or char_length(price) <= 100),
  icon text check (icon is null or char_length(icon) <= 50),
  image_url text check (image_url is null or char_length(image_url) <= 2000),
  image_alt text check (image_alt is null or char_length(image_alt) <= 300),
  cta_label text check (cta_label is null or char_length(cta_label) <= 100),
  cta_url text check (cta_url is null or (char_length(cta_url) <= 2000 and cta_url ~* '^(/|#|https?://|mailto:|tel:)')),
  featured boolean not null default false,
  status text not null default 'draft' check (status in ('draft','published')),
  sort_order integer not null default 0,
  seo_title text check (seo_title is null or char_length(seo_title) <= 120),
  seo_description text check (seo_description is null or char_length(seo_description) <= 320),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index services_public_idx on public.services (category, sort_order) where status = 'published';
create trigger services_updated before update on public.services
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- RLS + grants
alter table public.content_drafts enable row level security;
alter table public.content_published enable row level security;
alter table public.services enable row level security;

create policy content_drafts_admin on public.content_drafts for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy content_published_public_read on public.content_published for select to anon, authenticated using (true);
create policy services_public_read on public.services for select to anon, authenticated using (status = 'published');
create policy services_admin on public.services for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

revoke all on public.content_drafts, public.content_published, public.services from anon, authenticated;
grant select on public.content_published, public.services to anon;
grant select on public.content_published to authenticated;
grant select, insert, update, delete on public.content_drafts, public.services to authenticated;
grant all on public.content_drafts, public.content_published, public.services to service_role;

-- ---------------------------------------------------------------- seed: current live services
insert into public.services (slug, category, title, summary, status, sort_order) values
  ('branding-identity','creative','Branding & Identity','Build a brand people recognize, remember and trust.','published',1),
  ('content-production','creative','Content Production','Professional photography, reels, videos and creative campaigns that capture attention.','published',2),
  ('social-media-management','creative','Social Media Management','Consistent content, meaningful communication and a social presence that feels alive.','published',3),
  ('social-media-advertising','growth','Social Media Advertising','Reach the right audience through strategic paid campaigns.','published',1),
  ('search-engine-optimization','growth','Search Engine Optimization','Improve visibility and help customers discover your business.','published',2),
  ('search-engine-marketing','growth','Search Engine Marketing','Connect your business with people actively searching for your services.','published',3),
  ('website-design-development','technology','Website Design & Development','Modern websites designed to communicate clearly and convert visitors.','published',1),
  ('ecommerce-solutions','technology','E-commerce Solutions','Online stores built around your products and customers.','published',2),
  ('ai-automation','technology','AI Automation','Smarter workflows that reduce repetitive work and improve efficiency.','published',3)
on conflict (slug) do nothing;
