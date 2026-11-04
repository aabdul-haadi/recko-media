-- Phase 1 hardening: explicit API privileges + first admin profile.
-- Newer Supabase projects do not auto-grant table access to the API roles, so grant exactly what is needed.
-- Row Level Security (migration 1) still decides which rows an authenticated user can see.

-- Anonymous visitors: no direct table access at all (they only call submit_inquiry).
revoke all on public.profiles, public.contacts, public.tags, public.contact_tags, public.inquiries,
  public.inquiry_notes, public.tasks, public.activity_logs from anon;

-- Signed-in users: RLS limits everything to admins.
grant select on public.profiles, public.activity_logs to authenticated;
grant select, insert, update, delete on public.contacts, public.tags, public.contact_tags,
  public.inquiries, public.inquiry_notes, public.tasks to authenticated;

-- Server-side role.
grant all on public.profiles, public.contacts, public.tags, public.contact_tags, public.inquiries,
  public.inquiry_notes, public.tasks, public.activity_logs to service_role;

-- Internal helper functions must not be callable from the API.
revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.log_inquiry_changes() from public, anon, authenticated;
revoke all on function public.log_inquiry_note() from public, anon, authenticated;

-- First admin: the auth user admin@reckomedia.com (already created in Supabase Auth).
insert into public.profiles (id, full_name, role)
select id, 'Admin', 'admin' from auth.users where email = 'admin@reckomedia.com'
on conflict (id) do update set role = 'admin';
