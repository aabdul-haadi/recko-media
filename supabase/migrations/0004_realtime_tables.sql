-- Phase 2b: realtime for every admin-visible table, plus live updates of published content on the public site.
-- Row Level Security still applies to realtime: visitors only receive rows their SELECT policy allows
-- (published content and published services); admins receive everything.
do $$
declare t text;
begin
  foreach t in array array['contacts','tasks','services','content_drafts','content_published','inquiry_notes','activity_logs']
  loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then
      null; -- already part of the publication
    end;
  end loop;
end $$;
