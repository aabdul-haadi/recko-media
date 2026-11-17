-- Dynamic portfolio. Private storage: originals are admin-only; published derivatives
-- can be signed by visitors. No service-role key is shipped to the browser.
create sequence public.portfolio_order_seq;
create table public.portfolio_items (
  id uuid primary key,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  description text not null default '' check (char_length(description) <= 3000),
  alt text not null check (char_length(btrim(alt)) between 1 and 300),
  category text not null default 'Web' check (char_length(btrim(category)) between 1 and 60),
  tags text[] not null default '{}' check (cardinality(tags) <= 12 and char_length(array_to_string(tags, ',')) <= 500),
  status text not null default 'draft' check (status in ('draft','published')),
  sort_order bigint not null default nextval('public.portfolio_order_seq'),
  image_path text not null unique,
  thumb_path text not null unique,
  small_path text not null unique,
  original_path text not null unique,
  width integer not null check (width between 1 and 16383),
  height integer not null check (height between 1 and 16383),
  bytes integer not null check (bytes between 1 and 20971520),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint portfolio_order_unique unique(sort_order) deferrable initially deferred,
  check (image_path ~ ('^' || id::text || '/[a-f0-9-]{36}/full[.]webp$')),
  check (thumb_path = replace(image_path, '/full.webp', '/thumb.webp')),
  check (small_path = replace(image_path, '/full.webp', '/small.webp')),
  check (original_path ~ ('^' || id::text || '/[a-f0-9-]{36}/original[.](png|jpg|webp)$'))
);
create index portfolio_public_order on public.portfolio_items(status, sort_order);
create trigger portfolio_updated before update on public.portfolio_items for each row execute function public.set_updated_at();
alter table public.portfolio_items enable row level security;
create policy portfolio_read on public.portfolio_items for select to anon, authenticated using(status = 'published' or public.is_admin());
create policy portfolio_admin on public.portfolio_items for all to authenticated using(public.is_admin()) with check(public.is_admin());
grant select on public.portfolio_items to anon;
grant select, insert, update, delete on public.portfolio_items to authenticated;
grant usage on sequence public.portfolio_order_seq to authenticated;
grant all on public.portfolio_items to service_role;
grant all on sequence public.portfolio_order_seq to service_role;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types) values
 ('portfolio', 'portfolio', false, 20971520, array['image/webp']),
 ('portfolio-originals', 'portfolio-originals', false, 20971520, array['image/png','image/jpeg','image/webp']);

-- Anonymous callers cannot execute is_admin(); use a separate published SELECT policy.
drop policy portfolio_read on public.portfolio_items;
create policy portfolio_published on public.portfolio_items for select to anon, authenticated using(status = 'published');
create policy portfolio_object_published on storage.objects for select to anon, authenticated using (
 bucket_id = 'portfolio' and exists(select 1 from public.portfolio_items p where p.status='published' and name in (p.image_path,p.thumb_path,p.small_path))
);
create policy portfolio_object_admin_read on storage.objects for select to authenticated using(bucket_id in ('portfolio','portfolio-originals') and public.is_admin());
create policy portfolio_object_admin_insert on storage.objects for insert to authenticated with check (
 bucket_id in ('portfolio','portfolio-originals') and public.is_admin()
 and name ~ '^[a-f0-9-]{36}/[a-f0-9-]{36}/(full[.]webp|thumb[.]webp|small[.]webp|original[.](png|jpg|webp))$'
);
-- Immutable objects: replacements use a fresh version folder. Never overwrite cached images.
create policy portfolio_object_admin_delete on storage.objects for delete to authenticated using (
 bucket_id in ('portfolio','portfolio-originals') and public.is_admin()
 and not exists(select 1 from public.portfolio_items p where name in(p.image_path,p.thumb_path,p.small_path,p.original_path))
);

create table public.portfolio_cleanup (
 bucket text not null check(bucket in ('portfolio','portfolio-originals')),
 path text not null,
 created_at timestamptz not null default now(),
 primary key(bucket,path)
);
alter table public.portfolio_cleanup enable row level security;
create policy portfolio_cleanup_admin on public.portfolio_cleanup for all to authenticated using(public.is_admin()) with check(public.is_admin());
grant select, insert, delete on public.portfolio_cleanup to authenticated;
grant all on public.portfolio_cleanup to service_role;

create function public.portfolio_files_changed() returns trigger language plpgsql security definer set search_path = public as $$
begin
 if TG_OP = 'DELETE' or old.image_path <> new.image_path then
   insert into public.portfolio_cleanup(bucket,path) values
    ('portfolio',old.image_path),('portfolio',old.thumb_path),('portfolio',old.small_path),('portfolio-originals',old.original_path)
   on conflict do nothing;
 end if;
 if TG_OP = 'DELETE' then return old; end if;
 return new;
end $$;
create trigger portfolio_cleanup_files after update or delete on public.portfolio_items for each row execute function public.portfolio_files_changed();
revoke all on function public.portfolio_files_changed() from public, anon, authenticated;

-- Reject records pointing to missing uploads. Storage and DB cannot share a transaction:
-- upload first, then commit metadata; the client compensates failed commits with cleanup.
create function public.portfolio_check_files() returns trigger language plpgsql security definer set search_path = public as $$
begin
 if not exists(select 1 from storage.objects where bucket_id='portfolio' and name=new.image_path)
 or not exists(select 1 from storage.objects where bucket_id='portfolio' and name=new.thumb_path)
 or not exists(select 1 from storage.objects where bucket_id='portfolio' and name=new.small_path)
 or not exists(select 1 from storage.objects where bucket_id='portfolio-originals' and name=new.original_path)
 then raise exception 'portfolio_files_missing' using errcode='23514'; end if;
 return new;
end $$;
create trigger portfolio_check_files before insert or update on public.portfolio_items for each row execute function public.portfolio_check_files();
revoke all on function public.portfolio_check_files() from public, anon, authenticated;

create function public.swap_portfolio(p_id uuid,p_other uuid,p_order bigint,p_other_order bigint)
returns void language plpgsql security definer set search_path = public as $$
declare a bigint; b bigint;
begin
 if not public.is_admin() then raise exception 'forbidden' using errcode='42501'; end if;
 lock table public.portfolio_items in share row exclusive mode;
 select sort_order into a from public.portfolio_items where id=p_id;
 select sort_order into b from public.portfolio_items where id=p_other;
 if a is null or b is null or a<>p_order or b<>p_other_order or p_id=p_other
 or exists(select 1 from public.portfolio_items where sort_order>least(a,b) and sort_order<greatest(a,b))
 then raise exception 'portfolio_order_changed'; end if;
 update public.portfolio_items set sort_order=case id when p_id then b else a end where id in(p_id,p_other);
end $$;
revoke all on function public.swap_portfolio(uuid,uuid,bigint,bigint) from public,anon;
grant execute on function public.swap_portfolio(uuid,uuid,bigint,bigint) to authenticated;
alter publication supabase_realtime add table public.portfolio_items;

create function public.portfolio_categories() returns setof text language sql stable security invoker set search_path=public as $$
 select distinct category from public.portfolio_items order by category;
$$;
revoke all on function public.portfolio_categories() from public;
grant execute on function public.portfolio_categories() to anon,authenticated;
