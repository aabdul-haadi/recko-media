# Live verification results: project `bhmeshccyapgsvqhptal`

Date: 2026-11-13. Mode: **read-only, from outside**, using only the project's public (publishable) key, the same access any
website visitor has. Nothing was written, no account was created, no email was triggered, and no other Supabase project
was touched.

## What could and could not be done

The Supabase connection available to the assistant belongs to an account that holds three other projects
(`SAM`, `DC-ccp`, `SAMxCRM`) and has **no permission on `bhmeshccyapgsvqhptal`** (`list_migrations` returned "You do not
have permission"). The assistant therefore could **not** read migrations, policies, advisors, logs, extensions or admin rows.
Those items remain **unverified** and need the project owner (see "Still unverified").

## Verified from outside (evidence)

| # | Check | Method | Result |
|---|---|---|---|
| V1 | Project identity | `.env` URL host `bhmeshccyapgsvqhptal.supabase.co`; `/auth/v1/health` answers (GoTrue v2.197.0) | The project exists and is live. **Not verified:** that the deployed website (Lovable) is configured with this same project; only the local `.env` was inspected. |
| V2 | All 11 tables exist | `GET /rest/v1/<table>`: private tables answer `42501 permission denied` (a missing table would answer "not found") | Migrations 0001, 0002, 0003 applied |
| V3 | Private data denied to anonymous visitors | `inquiries, contacts, inquiry_notes, tasks, tags, contact_tags, activity_logs, profiles, content_drafts` all `401 / 42501` | Good |
| V4 | Public data limited | `services` returns 9 rows, all `published`; `content_published` readable | Good. `content_published` is **empty**, so the homepage editor has never published; the site runs on built-in copy. |
| V5 | Migration 0006 applied | The 9 published slugs are the client set (`facebook-ads`, `seo`, `google-ads`, `wordpress`, `shopify`...) | Applied; the 9 older services are drafts, hidden |
| V6 | Migration 0005 columns exist | Selecting `spam`, `spam_reason`, `ip_hash`, `user_agent` gives `42501` (exists), a bogus column gives `42703` (missing); Postgres resolves names before permissions | All four exist |
| V7 | **Deployed `submit_inquiry` is the 0005 version** | Name `"\u0001"` + invalid email returns `invalid_name` (0005 strips control characters first; 0001 would have answered `invalid_email`). No row can be written by either. | Confirmed |
| V8 | Honeypot works | `{website: "x"}` returns a random UUID and stores nothing (by design) | Good |
| V9 | Internal functions not callable | `is_admin`, `publish_content`, `clean_text` anonymous: `401 / 42501`; `log_inquiry_changes`: not exposed | Good |
| V10 | No anonymous writes | Empty-row `INSERT` (would fail NOT NULL, cannot store anything) on `inquiries, contacts, tasks, tags, services, content_drafts, profiles`, and `PATCH`/`DELETE` with a match-nothing filter on `inquiries, services`: all `401 / 42501` | Good |
| V11 | API schema not browsable | `GET /rest/v1/` as anonymous: `401` | Good |
| V12 | Auth settings (public endpoint) | `disable_signup: false`, `mailer_autoconfirm: false`, `phone_autoconfirm: false`, providers: email only | See finding L1 |

## Findings from the live checks

**L1 - Public sign-up is enabled (Medium).** `disable_signup` is `false`, so anyone can create an account on the project
(email confirmation is required, which limits but does not remove the issue). The app never needs this: admins are created
in the dashboard and password reset works for existing users. Why it matters here: migration 0002 grants the
`authenticated` role full read/write on every admin table, so **row-level security is the only barrier** between a
self-registered stranger and the inbox. The policies in the repo are correct (proven in the in-memory database tests),
but the live policies have not been inspected. With sign-up off, only accounts you create are authenticated at all. Also
reduces confirmation-email abuse. **Not fixed: this is a dashboard setting on the live project and needs the owner.**
Fix: Authentication > Sign In / Providers > turn off "Allow new users to sign up".

**L2 - Homepage CMS never published (Info).** `content_published` is empty. The public site shows built-in text and the admin
"Homepage Editor" changes will only appear after the first publish. Not a defect; worth knowing before relying on it.

## Still unverified (needs the project owner or a supplied test account)

1. Contents of the live RLS policies and grants (V3/V10 prove the anonymous role only). A non-admin **signed-in** user's
   access cannot be tested without creating an account, which is a write. Plan: after sign-up is disabled, the owner
   invites a throwaway user; the assistant then runs read-only probes as that user.
2. `profiles` rows: exactly which accounts are admins. `auth.users` list.
3. Migration history table, function bodies (only behaviour was probed), `pgcrypto` location, extra schemas, realtime
   publication membership, triggers.
4. Auth: minimum password length, leaked-password protection, JWT expiry, redirect-URL allow-list, SMTP/rate limits, MFA.
5. Supabase **Security Advisor** and **Performance Advisor** results, logs, backups / point-in-time recovery status.
6. Which header the gateway sets for the client address (affects the throttling design). Needs a write, so staging only.
7. Deployed website: its Supabase environment variables, served security headers, hosting and rollback setup.

## Owner checklist (read-only unless marked)

Run in the project's SQL editor; each is a `select`. Then open the two Advisor pages and paste the findings.

```sql
select version, name from supabase_migrations.schema_migrations order by version;      -- may be empty if applied by hand
select tablename, rowsecurity from pg_tables where schemaname = 'public' order by 1;   -- all true
select tablename, policyname, roles, cmd, qual, with_check from pg_policies where schemaname = 'public' order by 1, 2;
select grantee, table_name, privilege_type from information_schema.role_table_grants
 where table_schema = 'public' and grantee in ('anon', 'authenticated') order by 2, 1, 3;
select p.id, u.email, p.role, u.created_at from public.profiles p join auth.users u on u.id = p.id;
select count(*) as accounts, count(*) filter (where id in (select id from public.profiles)) as admins from auth.users;
select pg_get_functiondef('public.submit_inquiry(jsonb)'::regprocedure);
select extname, extnamespace::regnamespace from pg_extension order by 1;
select schema_name from information_schema.schemata where schema_name not like 'pg_%' order by 1;  -- is there a "private" schema yet?
select * from pg_publication_tables where pubname = 'supabase_realtime' order by tablename;
-- read-only data checks before migration 0007:
select id, left(page_url, 120) from public.inquiries where page_url is not null and page_url !~* '^https?://';
select slug, cta_url from public.services where cta_url is not null and not (cta_url ~* '^(/(?![/\\])|#|https?://|mailto:|tel:)');
select id, created_at, left(message, 60) from public.inquiries where page_url ~* '^\s*(javascript|data|vbscript):';
```
Dashboard: Authentication > Sign In / Providers (sign-up), Policies / Passwords (length, leaked-password protection),
URL Configuration (redirect allow-list), Database > Backups (PITR), Advisors > Security and Performance.
