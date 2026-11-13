#!/usr/bin/env node
// STAGING ONLY. Exercises public.submit_inquiry over the real HTTP API with parallel requests.
// It WRITES test rows, so it is guarded:
//   - refuses to run against the production project (and any host you have not retyped exactly)
//   - needs the flag --yes-this-writes-test-data
// Usage:
//   STAGING_URL=https://<staging-ref>.supabase.co STAGING_ANON_KEY=<staging publishable key> \
//   node scripts/staging/submission-concurrency-test.mjs --confirm-host <staging-ref>.supabase.co --yes-this-writes-test-data
// It prints what it observed and the SQL to run in the STAGING SQL editor to check the stored rows and to clean up.
import { randomBytes } from "node:crypto";

const PRODUCTION_REFS = ["bhmeshccyapgsvqhptal"];
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const value = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);

const url = (process.env.STAGING_URL ?? "").replace(/\/$/, "");
const key = process.env.STAGING_ANON_KEY ?? "";
if (!url || !key) die("Set STAGING_URL and STAGING_ANON_KEY (the staging project's publishable key).");
const host = new URL(url).host;
if (PRODUCTION_REFS.some((ref) => url.includes(ref))) die(`REFUSED: ${host} is the production project. This script never runs against production.`);
if (value("--confirm-host") !== host) die(`Retype the target to confirm: --confirm-host ${host}`);
if (!flag("--yes-this-writes-test-data")) die("Add --yes-this-writes-test-data to confirm that test rows will be written to this project.");

const run = randomBytes(4).toString("hex");
const tag = (name) => `st-${run}-${name}@example.test`;
const N = Number(value("--parallel") ?? 20);

async function submit(over = {}, headers = {}) {
  const started = performance.now();
  try {
    const res = await fetch(`${url}/rest/v1/rpc/submit_inquiry`, {
      method: "POST",
      headers: { "content-type": "application/json", apikey: key, authorization: `Bearer ${key}`, ...headers },
      body: JSON.stringify({ payload: { name: "Staging Test", email: tag("default"), message: "Staging test message, please ignore.", elapsed_ms: 9000, source: "staging-test", ...over } }),
    });
    const text = await res.text();
    let body; try { body = JSON.parse(text); } catch { body = text; }
    return { ok: res.ok, status: res.status, id: res.ok ? body : null, error: res.ok ? null : (body?.message ?? text), ms: performance.now() - started };
  } catch (e) {
    return { ok: false, status: 0, id: null, error: String(e), ms: performance.now() - started };
  }
}
const pct = (arr, p) => [...arr].sort((a, b) => a - b)[Math.min(arr.length - 1, Math.floor((p / 100) * arr.length))];
const results = {};
const line = (t) => console.log(t);

line(`\nRun ${run} against ${host}  (${N} parallel requests per test)\n`);

// T1. One email, N different messages at once. The limit is 5 per hour: more than 5 accepted proves a race.
{
  const rs = await Promise.all(Array.from({ length: N }, (_, i) => submit({ email: tag("race"), message: `Parallel message number ${i} for the race test` })));
  const accepted = rs.filter((r) => r.ok).length;
  const limited = rs.filter((r) => r.error === "rate_limited").length;
  results.T1 = { accepted, rate_limited: limited, other_errors: rs.filter((r) => !r.ok && r.error !== "rate_limited").map((r) => r.error), expectation: "accepted <= 5 once 0008 is applied (more than 5 shows the race in the current function)" };
  line(`T1 per-email limit under parallel load: accepted=${accepted} rate_limited=${limited}  (expect <= 5 with 0008)`);
}

// T2. The same message N times at once (double click / client retry). Must collapse to one stored row.
{
  const rs = await Promise.all(Array.from({ length: N }, () => submit({ email: tag("dup"), message: "Identical message sent many times at once" })));
  const ids = new Set(rs.filter((r) => r.ok).map((r) => r.id));
  results.T2 = { requests_ok: rs.filter((r) => r.ok).length, distinct_ids: ids.size, expectation: "distinct_ids = 1" };
  line(`T2 duplicate collapse under parallel load: distinct stored ids=${ids.size}  (expect 1)`);
}

// T3. Different emails from this one machine at once. Timing only; the per-network count is checked in SQL below.
{
  const rs = await Promise.all(Array.from({ length: N }, (_, i) => submit({ email: tag(`net${i}`), message: `Network bucket message ${i} for the staging test` })));
  results.T3 = { accepted: rs.filter((r) => r.ok).length, rate_limited: rs.filter((r) => r.error === "rate_limited").length, expectation: "at most 8 per hour per network; the rest rate_limited" };
  line(`T3 per-network limit: accepted=${results.T3.accepted} rate_limited=${results.T3.rate_limited}  (expect <= 8 accepted per hour for this network)`);
}

// T4. Header trust. Forged headers must not change which address is recorded. Compare the stored hashes in SQL.
{
  const forged = [
    ["real", {}],
    ["cf-forged", { "cf-connecting-ip": "203.0.113.77" }],
    ["xff-first-forged", { "x-forwarded-for": "198.51.100.5, 192.0.2.9" }],
    ["xreal-forged", { "x-real-ip": "198.51.100.6" }],
  ];
  results.T4 = {};
  for (const [name, h] of forged) {
    const r = await submit({ email: tag(`hdr-${name}`), message: `Header trust probe ${name} for staging` }, h);
    results.T4[name] = { ok: r.ok, id: r.id, error: r.error };
    line(`T4 header probe ${name.padEnd(17)} ${r.ok ? "stored " + r.id : "rejected: " + r.error}`);
  }
}

// T5. A normal, legitimate visitor (fast autofill: 1.5 s) must be stored and not hidden as spam.
{
  const r = await submit({ email: tag("legit"), name: "Legit Visitor", message: "Hello, I would like a quote for a new website.", elapsed_ms: 1500 });
  results.T5 = { ok: r.ok, id: r.id, error: r.error, expectation: "stored with spam = false" };
  line(`T5 legitimate fast visitor: ${r.ok ? "stored " + r.id : "REJECTED: " + r.error}`);
}

// T6. Latency while serialised.
{
  const rs = await Promise.all(Array.from({ length: N }, (_, i) => submit({ email: tag("lat"), message: `Latency probe ${i} for staging` })));
  const ms = rs.map((r) => r.ms);
  results.T6 = { p50_ms: Math.round(pct(ms, 50)), p95_ms: Math.round(pct(ms, 95)), max_ms: Math.round(Math.max(...ms)), lock_timeouts: rs.filter((r) => /lock|55P03/i.test(r.error ?? "")).length };
  line(`T6 same-email contention latency: p50=${results.T6.p50_ms}ms p95=${results.T6.p95_ms}ms max=${results.T6.max_ms}ms lock timeouts=${results.T6.lock_timeouts}`);
}

line(`\n----- run these in the STAGING SQL editor -----`);
line(`-- 1. rows stored per test (T1 accepted must be <= 5; T2 must be 1 row)`);
line(`select split_part(split_part(email, '-', 3), '@', 1) as test, count(*) as rows, count(*) filter (where spam) as spam_rows`);
line(`  from public.inquiries where email like 'st-${run}-%@example.test' group by 1 order by 1;`);
line(`-- 2. header trust (T4): all four probes must share ONE ip_hash (the real address), never the forged ones`);
line(`select email, left(ip_hash, 12) as ip_hash_prefix, spam, spam_reason from public.inquiries where email like 'st-${run}-hdr-%' order by email;`);
line(`-- 3. legitimate delivery (T5): spam must be false and a contact must exist`);
line(`select i.spam, i.spam_reason, c.id is not null as has_contact from public.inquiries i left join public.contacts c on c.id = i.contact_id where i.email = '${tag("legit")}';`);
line(`-- 4. clean up this run's test data`);
line(`delete from public.inquiries where email like 'st-${run}-%@example.test';`);
line(`delete from public.contacts  where email like 'st-${run}-%@example.test';`);
line(`\nJSON summary:\n${JSON.stringify(results, null, 2)}`);

function die(message) {
  console.error(message);
  process.exit(2);
}
