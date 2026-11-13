# Staging test plan: migration 0007 and the throttling proposal (0008)

**Nothing in this plan touches production.** Everything below runs on a separate Supabase project (a "staging" copy).
Nothing is applied until the owner approves each gate in the deployment sequence at the end.

## 0. Environment

1. Create a new, empty Supabase project named e.g. `reckomedia-staging` (a Supabase branch of production also works if
   the plan includes branching; a branch copies schema, not data).
2. Apply `supabase/migrations/0001` to `0006`, in order, in the SQL editor. Production already has 0001 to 0006
   (verified from outside, see `LIVE_VERIFICATION_RESULTS.md`), so this reproduces it.
3. Create one admin user in the dashboard (Authentication > Users) using a staging-only email and password, and give it
   a `profiles` row: `insert into public.profiles (id, full_name, role) select id, 'Staging Admin', 'admin' from auth.users where email = '<that email>';`
4. Turn **off** "Allow new users to sign up" (this is also the production fix for finding L1).
5. Keep the staging **publishable key** and **URL** for the tests. Never use the production URL or keys.
6. Get your public IP once: `curl https://api.ipify.org` (and `curl -6 https://api64.ipify.org` if you have IPv6).

Everything the tests write uses addresses ending `@example.test` and can be removed with the printed clean-up SQL.

## 1. Migration 0007 (hardening of `page_url` and service links)

Run each case on a fresh copy of the staging database (or restore a point-in-time between cases).

| Case | Setup (staging SQL editor) | Action | Pass criteria |
|---|---|---|---|
| 1 Clean apply | Nothing extra | Run 0007 | Succeeds. `select conname, convalidated from pg_constraint where conname in ('inquiries_page_url_http','services_cta_url_check');` shows both, both `true` |
| 2 Old bad inquiry row | `insert into public.inquiries (name,email,message,page_url) values ('Old','old@example.test','hello world','javascript:alert(1)');` | Run 0007, then in the admin archive that inquiry | Migration succeeds; row's `page_url` is null and `extra->>'original_page_url'` holds the old value; archiving works with no error |
| 3 Bad service link | `insert into public.services (slug,category,title,cta_url) values ('promo','growth','Promo','//evil.example/x');` | Run 0007 | **Fails with a message naming `promo`**, and *nothing changed*: confirm `inquiries_page_url_http` does not exist and bad inquiry rows are untouched (the script is a single implicit transaction when run in one execution; this case proves it on the real editor) |
| 4 After apply, new input | After case 1 | Via the staging site/API submit `page_url = 'javascript:alert(1)'` | Rejected; a normal `https://` page address is still accepted |
| 5 Admin still works | After case 1 | Sign in to staging admin: inbox, services create/edit/reorder with a `/contact` link | All work. A `//evil.example` link is refused in the form and by the database |
| 6 Rollback | After case 1 | Run the rollback SQL below | Constraints gone, app behaves as before |

Rollback for 0007 (leaves cleaned `page_url` values as they are; the old value is kept in `extra.original_page_url`):
```sql
alter table public.inquiries drop constraint if exists inquiries_page_url_http;
alter table public.services  drop constraint if exists services_cta_url_check;
alter table public.services  add  constraint services_cta_url_check
  check (cta_url is null or (char_length(cta_url) <= 2000 and cta_url ~* '^(/|#|https?://|mailto:|tel:)'));
```

## 2. Throttling proposal (`docs/proposed/0008_submission_throttling.sql`), staging only

Apply it to staging only after section 1 passes. Keep the current (0005) function body saved first:
`select pg_get_functiondef('public.submit_inquiry(jsonb)'::regprocedure);`

### 2.1 Header trust (decides the design; run **before** relying on the fallback order)
```sql
create function public.debug_headers() returns jsonb language sql as $$ select current_setting('request.headers', true)::jsonb $$;
grant execute on function public.debug_headers() to anon;      -- STAGING ONLY. Drop it afterwards.
```
Then from your machine call `POST <staging>/rest/v1/rpc/debug_headers` with the staging key, once plain and once with
forged headers (`cf-connecting-ip: 203.0.113.77`, `x-forwarded-for: 198.51.100.5, 192.0.2.9`, `x-real-ip: 198.51.100.6`).

| Observe | Meaning | Pass criteria |
|---|---|---|
| `cf-connecting-ip` equals your real public IP even when you forged it | The edge overwrites it, so it can be trusted | Required for the 0008 design |
| `x-forwarded-for`: is the **last** entry your real IP? Does a forged first entry survive? | Confirms "use the last entry" is right and "first entry" was exploitable | Last entry = your IP |
| `x-real-ip` equals your real IP when forged? | If the edge does not overwrite it, it must stay unused (as in the draft) | Informational |

If `cf-connecting-ip` is *not* the real IP, **stop**: the address-based limits need a different source before 0008 is useful.
Finish with `drop function public.debug_headers();`.

### 2.2 Concurrency, duplicates, header trust, legitimate delivery (real PostgreSQL)

First run the script against the **current** function to see the weakness, then apply 0008 and run it again:
```
STAGING_URL=https://<staging-ref>.supabase.co STAGING_ANON_KEY=<staging publishable key> \
node scripts/staging/submission-concurrency-test.mjs --confirm-host <staging-ref>.supabase.co --yes-this-writes-test-data --parallel 30
```
The script refuses to run against the production project and prints the SQL for the checks below.

| Test | Current function (expected) | After 0008 (pass criteria) |
|---|---|---|
| T1 one email, 30 parallel different messages | More than 5 accepted (the race) | **At most 5 accepted**, the rest `rate_limited`, no other error |
| T2 same message 30 times in parallel | Possibly more than one stored row | **Exactly one** stored row, one distinct id |
| T3 many emails, one network | Possibly more than 8 | **At most 8 per hour** for the network |
| T4 header probes | Forged `x-forwarded-for` first entry may change the hash | **All probes store the same `ip_hash`**, equal to the hash of your real IP: `select encode(sha256(convert_to((select value from private.app_secrets where name='ip_hash_pepper') \|\| ':' \|\| '<your public ip>', 'UTF8')), 'hex');` |
| T5 legitimate fast visitor (1.5 s) | Flagged `too_fast` (current 2.5 s limit) | **Stored, `spam = false`, contact created** |
| T6 latency under contention | n/a | p95 stays well under a second; zero lock timeouts in normal use |

### 2.3 IPv6 grouping
From a connection that has IPv6 (`curl -6`), submit once, then compare the stored hash with the hash of the **/64** and of the full address:
```sql
select encode(sha256(convert_to((select value from private.app_secrets where name='ip_hash_pepper') || ':' || host(network(set_masklen('<your ipv6>'::inet, 64))), 'UTF8')), 'hex') as expected_for_64,
       encode(sha256(convert_to((select value from private.app_secrets where name='ip_hash_pepper') || ':' || '<your ipv6>', 'UTF8')), 'hex') as full_address;
```
Pass: the stored `ip_hash` equals `expected_for_64` and not `full_address`. If your machine has several addresses in the same
/64 (Windows temporary addresses), a second submission from another of them must store the same hash. If you have no IPv6,
this stays **not tested** and is listed as such in the report.

### 2.4 Flood guard must never lock out a real visitor
```sql
insert into public.inquiries (name,email,message,spam)
select 'synthetic', 'flood' || g || '@example.test', 'synthetic flood message ' || g, false from generate_series(1, 300) g;
```
Submit a genuine message through the staging **website**. Pass: it is **not rejected**; it appears in the admin *Spam*
view with reason `flood_guard`; "Not spam" restores it to the inbox and creates its contact. Then clean up:
`delete from public.inquiries where email like 'flood%@example.test';`

### 2.5 End-to-end through the real site (staging build)
Build the site against staging (`VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` set to the staging values) and:
submit the contact form on a phone and on a desktop; receive it in the staging admin inbox within seconds; check a
double click gives one row; check a form left idle then sent is not marked spam; sign out and in again; check
realtime shows a new inquiry without reload.

### 2.6 Abuse resilience (staging only, keep volumes small)
Send 40 parallel requests with 40 different emails from one machine: expect 8 accepted for the network then
`rate_limited`; confirm the database stays responsive (`select 1` latency) and the admin inbox loads normally.

## 3. Exit criteria for asking to apply anything to production
All of: section 1 cases 1 to 6 pass; 2.1 shows `cf-connecting-ip` is trustworthy; T1 to T6 pass; 2.4 passes; no
unexplained errors in the staging Supabase logs; owner has reviewed `LIVE_VERIFICATION_RESULTS.md` owner checklist output.

## 4. Deployment sequence (each step needs the owner's explicit approval)

| # | Step | Who | Gate |
|---|---|---|---|
| 0 | Local commits `bea5661`, `ed69243`, `bcce600` (+ docs commit) stay unpushed. Decide when to push `main` (a push syncs to Lovable) | Owner | Approval to push |
| 1 | Run the owner checklist SQL and the two Advisors in the production dashboard; paste results | Owner | Results reviewed |
| 2 | **Turn off public sign-up** in production Auth settings (finding L1). No code change, no downtime | Owner | Approval |
| 3 | Create the staging project and run section 1 and section 2 | Owner + assistant | Sections pass |
| 4 | Fix anything the staging run exposes; re-run until clean | Assistant | Pass |
| 5 | Confirm production backups / point-in-time recovery are on; note the restore point | Owner | Done |
| 6 | Apply **0007** to production in the SQL editor, off-hours | Owner | Approval |
| 7 | Verify: both constraints validated; admin can archive an old inquiry; submit one real inquiry; re-run the Security Advisor | Owner + assistant | Pass |
| 8 | Push the code commits to `main` (Lovable deploys). The code is safe with or without 0007 | Owner | Approval to push |
| 9 | Post-deploy: submit a real inquiry on the live site and on a phone, confirm it arrives; check the served security headers and the browser console | Owner | Pass |
| 10 | Only if staging passed: apply **0008** to production in a quiet period; save the 0005 function body first for rollback; repeat step 9 | Owner | Separate approval |
| 11 | Add monitoring: uptime checks on `/` and `/contact`, an alert on `submit_inquiry` errors in Supabase logs | Owner | Done |

Rollback: 0007 (SQL in section 1) and 0008 (re-run the saved 0005 function body; the private schema may stay) are both
reversible without data loss. Code rollback: redeploy the previous Lovable version.
