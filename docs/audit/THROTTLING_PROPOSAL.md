# Proposal: concurrency-safe, abuse-resistant inquiry throttling

**Status: proposal only. Nothing here has been applied to any database.** The draft SQL is
`docs/proposed/0008_submission_throttling.sql` (deliberately outside `supabase/migrations`). It must be rehearsed on a
copy of the project and approved before use. It replaces one function, `public.submit_inquiry`, and adds a private
schema; it deletes and rewrites no rows.

## What is wrong today (migration 0005, read from the source)

| # | Weakness | How it fails | Severity |
|---|---|---|---|
| 1 | Limits are "count rows, then insert" with no lock | Parallel requests all see the same low count and all insert. Five parallel posts with one email are all accepted; a client-library retry can double-insert because the 10-minute duplicate check races the same way. | Medium |
| 2 | The global circuit breaker (300 per hour) rejects with `rate_limited` and counts spam too | An attacker sending 300 junk messages from many addresses makes every genuine visitor see "try again later" for the rest of the hour. The lockout is cheap to cause and invisible to the owner. | Medium (availability of the lead form) |
| 3 | IP hash is `md5('reckomedia:' || ip)` | The salt is in the public repo and there are only about 4.3 billion IPv4 addresses, so stored hashes can be reversed by brute force. That makes the stored value personal data in practice. | Low-Medium (privacy) |
| 4 | Address header order: `cf-connecting-ip`, `x-real-ip`, then the **first** `x-forwarded-for` entry | The first entry of `x-forwarded-for` is whatever the client sent, so if the request does not carry `cf-connecting-ip`, a visitor can invent a new "address" per request and bypass the per-network limit. | Medium (to be confirmed on the live gateway) |
| 5 | IPv6 is hashed per full address | One home connection has a /64 of addresses; rotating inside it defeats the per-network limit. | Low |
| 6 | `too_fast` threshold is 2.5 s from hydration | Browser autofill plus Enter can finish in about a second. The message is stored but **hidden in the spam tab**, so a real lead can be missed. | Medium (business) |
| 7 | `page_url` accepts any text | Stored `javascript:` URLs; already neutralised in the admin UI and by migration 0007. | Fixed in app, closed in DB by 0007 |

## Proposed design

1. **Serialise per sender.** At the start of the function take transaction-scoped advisory locks
   (`pg_advisory_xact_lock`) on the email and on the network bucket, always in that order. The duplicate check and
   every count then run one sender at a time. Locks are released automatically at commit or rollback; the fixed order
   prevents deadlocks; unrelated visitors never wait for each other. Cost: one cheap lock call per submission.
2. **Never turn the global guard into a lockout.** Per-sender limits still reject (they only affect that sender).
   Beyond 300 non-spam messages an hour, new messages are **stored but quarantined** as spam with reason
   `flood_guard`, so the owner can restore them with the existing one-click "Not spam". Only an extreme hard cap
   (3,000 an hour) rejects, purely to bound storage.
3. **Keyed address hashing.** A random 256-bit secret is generated inside the database (from the CSPRNG behind
   `gen_random_uuid`) and kept in `private.app_secrets`, a schema not exposed by the API, with RLS on and no grants.
   The stored value is `sha256(secret || ':' || ip)`. Without the secret, brute force over the IPv4 space is useless.
   (HMAC would be marginally more conventional; with the secret as a prefix and the digest never revealed, a plain
   SHA-256 is adequate here, avoids depending on where pgcrypto is installed, and keeps the function self-contained.)
   If the secret is ever missing, the function stores **no** address rather than a weak hash.
4. **Trustworthy address.** Prefer `cf-connecting-ip` (overwritten by Cloudflare). For the fallback use the **last**
   `x-forwarded-for` entry, the one a trusted proxy appended, never the first. `x-real-ip` is deliberately not used
   because it may be client-settable. A 3-second `lock_timeout` keeps a burst of identical requests from queueing. IPv6 is reduced to its /64. A malformed
   header means "no address" (per-email limits still apply).
5. **Fewer real leads hidden.** `too_fast` drops from 2,500 ms to 1,200 ms. Bots post in well under that.
6. **Defence in depth.** Oversized payloads are refused (60 KB); a non-http(s) `page_url` is dropped instead of failing
   the visitor's message.

## Migration impact

- Replaces one function body (`create or replace`); same name, signature, grants (`anon`, `authenticated` execute).
  The front end needs **no change**; it already maps `rate_limited` and `invalid_*` errors.
- Adds schema `private`, table `private.app_secrets` (one row), one index on `inquiries(created_at) where not spam`.
- Existing `ip_hash` values are unkeyed md5 and will not match new hashes, so every network starts with a clean
  count at the moment of deployment (a one-time, harmless loosening that lasts at most a day). Old values can age out
  with a retention job (null `ip_hash` and `user_agent` after 30 days), which is **not** included and needs its own approval.
- Locking adds negligible latency. The worst case is one visitor's duplicate or retried request waiting a few
  milliseconds for their own first request to commit, which is the intended behaviour.
- Rollback: re-run the 0005 definition of `submit_inquiry` (kept in `supabase/migrations/0005_submission_hardening.sql`).
  The private schema can stay; it is unused by the old function.
- Risk to check on staging: where `pgcrypto` lives is irrelevant to this design, but the exact header the Supabase
  gateway sets must be confirmed (checklist section 4) before trusting the fallback order.

## How it is verified before anyone applies it

1. Load migrations 0001 to 0007 plus this file into an in-memory PostgreSQL (PGlite) with stubs for the Supabase
   `auth` schema and roles, and run the behaviours in `src/test/db/*.test.ts`: validation, duplicate collapse, per-email
   and per-network limits, flood-guard quarantine, `page_url` handling, `private.app_secrets` unreadable by `anon`.
2. Concurrency itself cannot be proven in a single-connection in-memory database. It must be proven on a real
   Postgres (staging project or a local Docker database) with N parallel calls; the script for that is part of the
   checklist and its result is recorded as **not run** until then.
3. Rehearse on a Supabase branch of the live project, run the checklist, then apply to production in a quiet period.
