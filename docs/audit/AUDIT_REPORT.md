# ReckoMEDIA site: audit report (running record)

Last updated: 2026-11-13. Scope so far: static review of code and migrations, browser end-to-end tests against a stand-in
backend, in-memory execution of the real migrations, accessibility scan, lab performance measurements of the production
build. **Not done:** anything against the live Supabase project, a real deployment, real email, load testing.

**Production-readiness verdict: NOT ESTABLISHED.** The live database, the deployed site and the hosting configuration
have not been verified (see section 9 and `LIVE_SUPABASE_CHECKLIST.md`). Passing local tests is necessary, not sufficient.

## 1. How things were verified (and the limits of each)

| Layer | Method | What it proves | What it cannot prove |
|---|---|---|---|
| Unit / component | Vitest + jsdom | Logic and rendering of isolated pieces | Real browser behaviour |
| Database | The real files `supabase/migrations/0001..0007` executed in PGlite (Postgres in WebAssembly) with stand-ins for Supabase's `auth` schema and roles | Migrations apply in order; RLS/grants; `submit_inquiry` rules; the 0007 data-cleanup | Concurrency (single connection), Supabase-specific behaviour (gateway headers, pgcrypto, realtime), the live project's actual state |
| Browser | Playwright + installed Chrome against the real app (dev server) and `e2e/stub-supabase.mjs`, an in-memory imitation of Supabase REST/Auth with synthetic data and fault injection | Real DOM, navigation, forms, dialogs, keyboard, mobile viewport, error handling, retry behaviour | That the real Supabase behaves like the imitation; production build quirks |
| Accessibility | axe-core (WCAG 2.0/2.1 A and AA) inside the browser tests | Automated rule violations (serious and critical) | Manual screen-reader review; roughly a third of WCAG issues need a human |
| Performance | Production build served from `e2e/serve-build.mjs` (Node hosting the Cloudflare worker bundle), Chrome, 4x CPU slowdown, about 1.6 Mbps and 150 ms latency, median of 3 | Relative weight and timing of pages | Real Cloudflare behaviour, CDN caching, real users. Not Lighthouse. |

The browser stand-in never contacts the live project: the dev server is started with `VITE_SUPABASE_URL` pointing at
`127.0.0.1`, which overrides `.env`.

## 2. Findings, all verified fixes

| ID | Severity | Finding | Root cause | Fix | Regression test |
|---|---|---|---|---|---|
| F1 | High | Stored XSS path: the admin inbox rendered a visitor-supplied `page_url` as a link; `javascript:` URLs reach the public RPC unvalidated | No scheme check anywhere | `safeHttpUrl` in the admin UI; DB constraint in 0007 (cleanup first, see F9) | `shared.test.ts`; browser test "javascript: page address is shown as text"; DB tests |
| F2 | Medium | **Contact form could lose a message and leak personal details into the URL.** The form is server-rendered; if the visitor submits before React attaches (slow phone/network) the browser performs a native GET, reloading the page and writing name, email and message into the address bar (history, analytics, server logs, Referer) | No `method`, button enabled before hydration | Send button disabled until hydrated; `method="post"` so details can never enter a URL | `prehydration.spec.ts` (failed before the fix, passes after) |
| F3 | Medium | Protocol-relative links (`//evil.example`, `/\evil.example`) were accepted as "site links" in the admin forms and rendered on the public site (admin-entered, so phishing/typo risk) | Pattern allowed any leading `/` | Pattern requires `/` not followed by `/` or `\` in the editor, `safeUrl`, image address and the DB constraint | `content.test.ts`, `shared.test.ts`, browser test, DB tests (old rule proven to accept `//host`) |
| F4 | Medium | Admin search could error on `"` or `\` (PostgREST filter syntax) | Incomplete character stripping | Strip `"` and `\` too | Browser test with hostile search strings |
| F5 | Medium | Reordering services is two writes; a failure between them leaves two services at one position | No rollback | Undo the first write on failure | Browser test with an injected failure on the second write |
| F6 | Medium (a11y) | Every public page heading carried `aria-label` on a plain `span` (prohibited; ignored by screen readers, which may then read the animated letters one by one) | `SplitReveal` | Visually hidden real text plus the existing `aria-hidden` animation (keeps the CSS-transition design from `AGENTS.md`) | axe scan on all five public pages |
| F7 | Low (a11y) | "Contact Us" link on About distinguished by colour only; a label on the home page failed contrast (2.4:1 / dark-on-black) | Styling | Underline; lighter label colour (about 8:1) | axe scan |
| F8 | Medium (ops) | Failed submissions left no trace for the owner (generic message to visitor, nothing recorded) | No reporting | Unexpected failures reported via the existing runtime-error hook with the error code only; test proves no name/email/message is included | `inquiries.test.ts` |
| F9 | High (migration safety) | My own earlier migration 0007 had a trap: a `NOT VALID` constraint is skipped for existing rows but enforced on every later `UPDATE`, so an old bad row could never be archived or edited | Misunderstanding of `NOT VALID` | 0007 now preserves the old value in `extra.original_page_url`, clears it, validates; and stops with the offending rows named if a service link needs a human decision | DB tests, including one that demonstrates the failure without the cleanup |
| F10 | Medium (environment) | `node_modules` was damaged (truncated `@tanstack/router-core`: 140 files missing, including all type declarations). This caused the long-standing type error in `src/routes/index.tsx` and noisy dev logs | Earlier disk-full event | Clean reinstall from the lockfile. **`tsc` now reports 0 errors.** Lockfile changed only by the dev tools added below | `tsc --noEmit` |

Dependency changes: dev-only additions `@playwright/test`, `@axe-core/playwright`, `@electric-sql/pglite`; Vite upgraded
earlier to 8.3.6 (security advisories). Production dependency audit: **0 vulnerabilities**. Dev-only audit: 1 moderate
(`minimatch` ReDoS inside the ESLint toolchain; not shipped, fix requires a breaking upgrade; accepted for now).

## 3. Intermittent failures: what was reproduced and what was ruled out

- **Reproduced, root cause found, fixed:** pre-hydration native submit (F2). This is a credible cause of "the form
  sometimes works and sometimes doesn't": the outcome depends on how fast the page becomes interactive.
- **Observed, not a defect:** supabase-js retries a dropped request once (two calls for one click). The database's
  10-minute duplicate check absorbs it. Under concurrency that check races (see section 6, T1).
- **Ruled out by test:** login bouncing back to `/admin/login` when the admin check is slow (1.5 s delay injected);
  stale search results overwriting newer ones when responses arrive out of order; double-click creating two
  inquiries or two sign-ins.
- **Cannot be investigated without live access:** the original report that inquiries sometimes fail to save. If
  migration 0005 is not applied on the live project, the deployed function is the older one. The checklist's first
  database section answers that in minutes.

## 4. Security review summary (static + executed)

Strong: RLS on all 11 tables; `anon` can read only published content/services and call one function; admin rights come
from a database check that nobody can self-grant (tested as anon, as a signed-in non-admin and as admin); helper and
trigger functions are not callable from the API; no secrets in the repo; CSV export neutralises spreadsheet formulas;
security headers defined in the build output.

Open (see `THROTTLING_PROPOSAL.md`, not applied): rate-limit race, global-limit lockout, unkeyed IP hash, spoofable
address-header fallback, 2.5 s "too fast" threshold hiding real leads.

Other open items: `@typescript-eslint/no-explicit-any` in 5 places in app code; two inputs share the accessible name
"Search inquiries" on that admin page (header search and page search); about 500 KB of unreferenced logo/icon PNGs in
`public/` (`logo-bright.png` is 561 KB and unused).

## 5. Browser test inventory (e2e/)

Public: five pages render with no uncaught errors, no horizontal scroll (desktop and phone), 404 handling, header
navigation; contact form validation, focus, success, single insert, double-click, server error then retry, dropped
connection, rate-limit message, honeypot hidden, pre-hydration safety. Admin: redirect when signed out, wrong
password, non-admin refused, sign-in/reload/sign-out, short username, double-click sign-in, password reset; inquiries
list/spam hidden/search/hostile input/`javascript:` link/failed update; services list/create/duplicate slug/link
validation/publish/reorder/rollback/delete/load failure; contacts list/search. Accessibility: axe on 5 public + 5
admin pages; keyboard-only form completion; dialog focus trap and Escape; phone menu; admin pages without sideways
scroll on a phone; tap-target size. Reliability: slow admin check at login and reload; out-of-order search responses.

## 6. Test results (final run)

| Suite | Result |
|---|---|
| Vitest: unit, component and database (14 files) | **85 passed, 0 failed** (33 of them execute the real migrations in PGlite) |
| Playwright, desktop + phone (Chrome) | **80 passed, 1 skipped by design (phone-menu test on desktop), 0 failed** |
| `tsc --noEmit` | **0 errors** |
| Production build | passes |
| `npm audit --omit=dev` | 0 vulnerabilities |
| ESLint | 15 non-formatting errors remain: 5 older `any` uses in app code (DashboardPage, InquiriesPage, content.tsx); the rest are in tests and are suppressed with reasons. About 4,900 further findings are Prettier line-ending noise from a CRLF working tree, which `.gitattributes` fixes at checkout |

History honesty: an intermediate full run right after the dependency reinstall had 2 failures (a networkidle timeout on
the cold dev server, and the password-reset test). Both passed 4 of 4 when repeated on a warm server and the final run
passed everything after a browser warm-up step was added. The cause was **not proven**; it is attributed to the cold
dev server after the reinstall. If it recurs on a warm server, treat it as a real bug.

Not run: concurrency test of `submit_inquiry` on a real Postgres, load tests, real-browser Safari/Firefox,
screen-reader testing, email delivery, deployment pipeline checks, Core Web Vitals from real users.

## 7. Performance (lab, production build, throttled phone profile, median of 3)

| Page | FCP ms | LCP ms | CLS | TBT ms | Transfer KB | JS KB (gzip) | Requests |
|---|---|---|---|---|---|---|---|
| / | 2320 | 2320 | 0.000 | **921** | 499 | 298 | 29 |
| /about | 1384 | 2064 | 0.001 | 370 | 616 | 263 | 25 |
| /services | 1932 | 2156 | 0.011 | 344 | 740 | 263 | 28 |
| /portfolio | 1472 | 1472 | 0.000 | 314 | 688 | 263 | 27 |
| /contact | 1468 | 1468 | 0.016 | 300 | 709 | 287 | 28 |
| /admin/login | 2736 | 3376 | 0.000 | 351 | 384 | 200 | 21 |

Reading: layout stability is good (CLS near 0). Main-thread blocking is high on the home page (921 ms, "poor" above
about 600 ms) and moderate elsewhere. Every public page downloads a 175 KB (gzip) shared bundle that contains the
entire Supabase client (auth, realtime, REST) although public pages only read two tables and call one function.
Recommendation (not implemented, needs a design decision): load the Supabase client only when needed, or use the lightweight
REST client for public reads; defer GSAP and the animation helpers on routes that do not need them; remove the
per-character span explosion from long headings on the home page. Expected gain is the largest of any single change
here, but it is a refactor, so it is deliberately left for approval. Home HTML is 154 KB uncompressed.

## 8. Observability

Added: unexpected inquiry failures are reported through the existing runtime-error hook with the error code only
(tested for no personal data). Still missing: any server-side logging or alert for failed inquiry inserts (the RPC runs
inside Supabase); an uptime check; a request/correlation ID. Recommended: Supabase log drain or alert on
`submit_inquiry` errors, an uptime monitor on `/` and `/contact`.

## 9. Production readiness: what is still unverified

1. Live database state (migrations applied? admin rows? sign-ups disabled? advisors?) - `LIVE_SUPABASE_CHECKLIST.md`.
2. Behaviour of the real gateway for client-IP headers (affects the throttling design).
3. Concurrency behaviour of `submit_inquiry` on real Postgres.
4. Deployment: hosting environment variables, served security headers, rollback and backup procedure, monitoring.
5. Real-device and cross-browser behaviour; manual accessibility review.
6. Decisions awaiting the owner: apply 0007 (after checklist), approve or amend the throttling proposal, performance refactor.
