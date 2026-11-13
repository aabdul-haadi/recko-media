# Live Supabase verification checklist

Nothing in this audit has been run against the live project. The app's `.env` points at project
`bhmeshccyapgsvqhptal`, which is **not** on the Supabase account that was connected during the audit
(that account holds `SAM`, `DC-ccp` and `SAMxCRM`; none were touched). Every item below is therefore
**unverified** until someone with access to the live project runs it. All queries are read-only unless marked.

Do not apply `supabase/migrations/0007_*.sql` (or the proposed 0008) until sections 1 to 4 are complete.

## 0. Before anything else
- [ ] Confirm which project the production site uses (compare the `VITE_SUPABASE_URL` host in the hosting provider's
      environment settings with the project ref above). Staging and production may differ.
- [ ] Take a backup / confirm Point-in-Time Recovery is enabled (Dashboard > Database > Backups). Note the restore point.
- [ ] Ideally create a Supabase **branch** or a copy of the project and rehearse 0007 there first.

## 1. Migration sequence (SQL editor, read-only)
Expected: 0001 to 0006 applied in order, 0007 not yet applied.
```sql
select version, name from supabase_migrations.schema_migrations order by version;  -- may be empty if applied by hand
select table_name from information_schema.tables where table_schema = 'public' order by 1;
```
Expected public tables: `activity_logs, contact_tags, contacts, content_drafts, content_published, inquiries,
inquiry_notes, profiles, services, tags, tasks`.
- [ ] Every expected table exists. A missing table means a migration was skipped.
- [ ] `inquiries` has the columns `spam, spam_reason, ip_hash, user_agent` (migration 0005). **If these are missing, the
      deployed `submit_inquiry` is the old version and the site's anti-spam and rate limits are not active.**
```sql
select column_name from information_schema.columns where table_schema='public' and table_name='inquiries' order by 1;
select pg_get_functiondef('public.submit_inquiry(jsonb)'::regprocedure);   -- must mention "ip_hash" and "clean_text"
select proname from pg_proc where pronamespace='public'::regnamespace order by 1;
```
Expected functions: `clean_text, is_admin, log_inquiry_changes, log_inquiry_note, publish_content, set_updated_at,
submit_inquiry, touch_content_draft`.
- [ ] `services` contains the client's nine services from 0006 and the old nine are `draft`.

## 2. Access control (read-only)
```sql
select tablename, rowsecurity from pg_tables where schemaname='public' order by 1;           -- all must be true
select tablename, policyname, roles, cmd, qual from pg_policies where schemaname='public' order by 1,2;
select grantee, table_name, privilege_type from information_schema.role_table_grants
 where table_schema='public' and grantee in ('anon','authenticated') order by 2,1,3;
```
- [ ] RLS is on for all 11 tables.
- [ ] `anon` has SELECT only on `content_published` and `services`, and nothing else.
- [ ] `authenticated` write access is limited to admin-checked tables (policies call `is_admin()`).
- [ ] `profiles` has **no** insert/update policy (nobody can promote themselves).
```sql
select p.id, u.email, p.role from public.profiles p join auth.users u on u.id = p.id;        -- exactly the intended admins
select count(*) from auth.users;                                                              -- compare with admin count
```
- [ ] The only admin rows are people who should have admin. Any other user in `auth.users` is harmless to data
      (not admin) but should be reviewed.
- [ ] **Auth settings** (Dashboard > Authentication): public sign-ups **disabled**, email confirmation on, password
      minimum length and leaked-password protection on, a sensible JWT expiry, redirect URL allow-list contains only the
      real site and `/admin/reset-password`.
- [ ] **API settings**: exposed schemas are `public` only (the proposed 0008 stores a secret in schema `private`).
- [ ] Run the Supabase **Security** and **Performance advisors** (Dashboard > Advisors) and record every warning.

## 3. Data checks before 0007 (read-only)
```sql
-- rows that 0007 would have to clean (it preserves the value in extra.original_page_url, then clears it)
select id, left(page_url, 120) from public.inquiries where page_url is not null and page_url !~* '^https?://';
-- rows that would make 0007 stop (fix them in the admin first)
select slug, cta_url from public.services where cta_url is not null and not (cta_url ~* '^(/(?![/\\])|#|https?://|mailto:|tel:)');
-- a hostile submission already stored
select id, name, left(message, 80), created_at from public.inquiries where page_url ~* '^\s*(javascript|data|vbscript):';
```
- [ ] Review the three results. A `javascript:` row means someone has already probed the form.

## 4. Behaviour checks on a **staging copy only** (writes data)
Run these only where test data is acceptable.
- [ ] Submit an inquiry through the site: it appears in the admin inbox, not marked spam.
- [ ] Submit twice quickly: one row. Submit 6 times in an hour with one email: the sixth is refused.
- [ ] Call the RPC directly with a bad email / empty name / 20,000-character message: refused with `invalid_*`.
- [ ] Call with `page_url = 'javascript:alert(1)'`: refused after 0007 (or stored but never rendered as a link).
- [ ] Send the request with a forged `x-forwarded-for: 1.2.3.4` header and look at the stored `ip_hash`: it must not
      be the hash of `1.2.3.4` (confirms the real address header wins). Record which header the gateway really sets.
- [ ] As anon (publishable key), `select * from inquiries` returns nothing / is denied; `insert` is denied.
- [ ] As a signed-up non-admin user, every admin table is empty / denied and `rpc/is_admin` returns false.
- [ ] Sign in as admin: dashboard, inquiries, contacts, tasks, services and homepage editor all load; publish a draft.
- [ ] Realtime: a new inquiry shows up live in the admin without a reload.

## 5. After applying 0007 (only once 1 to 4 pass)
```sql
select conname, convalidated from pg_constraint where conname in ('inquiries_page_url_http','services_cta_url_check');
```
- [ ] Both constraints exist and are validated.
- [ ] Admin can still archive / change status on an old inquiry.
- [ ] Re-run the Security advisor.

## 6. Deployment (outside the database)
- [ ] Hosting environment variables contain only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
      (no service-role key anywhere in the build; search the built JS for `service_role`).
- [ ] HTTPS only; the security headers from `.output/public/_headers` are actually served (check with
      `curl -I https://<site>/`): HSTS, nosniff, referrer policy, permissions policy, frame-ancestors.
- [ ] A staging/preview deployment exists and the rollback procedure (redeploy previous build; Supabase PITR) is written down.
- [ ] Monitoring: uptime check on `/` and `/contact`, and an alert path for inquiry-insert failures.
