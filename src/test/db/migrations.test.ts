// @vitest-environment node
/* eslint-disable @typescript-eslint/no-explicit-any -- rows returned by ad-hoc SQL in these tests are free-form */
/**
 * Runs the REAL migration files, in order, against an in-memory PostgreSQL (PGlite). Nothing here touches Supabase.
 *
 * Limits of this harness (also listed in docs/audit): PGlite is one connection, so it cannot prove concurrency
 * behaviour; pgcrypto is not available, so that single `create extension` line is skipped (no migration uses it);
 * the Supabase `auth` schema, roles and realtime publication are small stand-ins defined in PRELUDE below.
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";

const MIGRATIONS = path.resolve(__dirname, "../../../supabase/migrations");
const PROPOSED = path.resolve(__dirname, "../../../docs/proposed/0008_submission_throttling.sql");

const ADMIN_ID = "00000000-0000-4000-8000-000000000001";
const OTHER_ID = "00000000-0000-4000-8000-000000000002";

const PRELUDE = `
  create role anon nologin; create role authenticated nologin; create role service_role nologin;
  create schema auth;
  create table auth.users (id uuid primary key, email text);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated, service_role;
  grant usage on schema public to anon, authenticated, service_role;
  create schema storage;
  create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
  create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text,primary key(bucket_id,name));
  alter table storage.objects enable row level security;
  grant usage on schema storage to anon,authenticated,service_role;
  grant select,insert,delete on storage.objects to anon,authenticated;
  create publication supabase_realtime;
  insert into auth.users values ('${ADMIN_ID}', 'admin@reckomedia.com'), ('${OTHER_ID}', 'someone@example.com');
`;

const files = readdirSync(MIGRATIONS).filter((f) => f.endsWith(".sql")).sort();
const sql = (file: string) =>
  readFileSync(path.join(MIGRATIONS, file), "utf8").replace(/create extension if not exists pgcrypto;/i, "-- pgcrypto skipped in PGlite");

async function freshDb(upTo?: string, includeProposed = false) {
  const db = new PGlite();
  await db.exec(PRELUDE);
  for (const f of files) {
    if (upTo && f > upTo) break;
    await db.exec(sql(f));
  }
  if (includeProposed) await db.exec(readFileSync(PROPOSED, "utf8"));
  return db;
}
const setHeaders = (db: PGlite, headers: Record<string, string>) =>
  db.query(`select set_config('request.headers', $1, false)`, [JSON.stringify(headers)]);
const asRole = async (db: PGlite, role: "anon" | "authenticated" | "postgres", sub = "") => {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${sub}', false);`);
  if (role !== "postgres") await db.exec(`set role ${role}`);
};
const submit = (db: PGlite, over: Record<string, unknown> = {}) =>
  db.query<{ submit_inquiry: string }>(`select public.submit_inquiry($1::jsonb)`, [
    JSON.stringify({ name: "Test Person", email: "t@example.com", message: "Hello, I need a website.", elapsed_ms: 9000, ...over }),
  ]);
const rejects = async (p: Promise<unknown>, text: string | RegExp) => {
  await expect(p).rejects.toThrow(text);
};

describe("migration sequence", () => {
  it("applies 0001 to the latest file cleanly, in order, on an empty database", async () => {
    expect(files[0]).toBe("0001_crm_core.sql");
    expect(files.map((f) => f.slice(0, 4))).toEqual(files.map((_, i) => String(i + 1).padStart(4, "0"))); // no gaps, no duplicates
    const db = await freshDb();
    const tables = await db.query<{ tablename: string }>(`select tablename from pg_tables where schemaname='public' order by 1`);
    expect(tables.rows.map((r) => r.tablename)).toEqual([
      "activity_logs", "contact_tags", "contacts", "content_drafts", "content_published",
      "inquiries", "inquiry_notes", "portfolio_cleanup", "portfolio_items", "profiles", "services", "tags", "tasks",
    ]);
    const rls = await db.query<{ tablename: string; rowsecurity: boolean }>(`select tablename, rowsecurity from pg_tables where schemaname='public'`);
    expect(rls.rows.filter((r) => !r.rowsecurity)).toEqual([]); // row level security on every table
  }, 20_000); // WASM/Postgres cold startup can exceed the 5s unit-test default on Windows.

  it("seeds the admin profile and the client's services", async () => {
    const db = await freshDb();
    expect((await db.query(`select role from profiles where id='${ADMIN_ID}'`)).rows).toEqual([{ role: "admin" }]);
    const live = await db.query<{ title: string }>(`select title from services where status='published' order by category, sort_order`);
    expect(live.rows).toHaveLength(9);
    expect(live.rows.map((r) => r.title)).toContain("Facebook Ads");
    expect((await db.query(`select count(*)::int as n from services where status='draft'`)).rows[0]).toEqual({ n: 9 });
  });

  it("is rerunnable where it claims to be (0004 realtime tables, 0006 services)", async () => {
    const db = await freshDb();
    await db.exec(sql("0004_realtime_tables.sql"));
    await db.exec(sql("0006_client_services.sql"));
    expect((await db.query(`select count(*)::int as n from services where status='published'`)).rows[0]).toEqual({ n: 9 });
  });
});

describe("access control (row level security and grants)", () => {
  let db: PGlite;
  beforeAll(async () => {
    db = await freshDb();
    await asRole(db, "postgres");
    await submit(db, { email: "seed@example.com" });
  });

  it("anonymous visitors cannot read or write any private table", async () => {
    await asRole(db, "anon");
    for (const t of ["inquiries", "contacts", "tasks", "inquiry_notes", "activity_logs", "profiles", "tags", "content_drafts"]) {
      await rejects(db.query(`select * from public.${t}`), /permission denied/);
    }
    await rejects(db.query(`insert into public.inquiries (name,email,message) values ('x','x@x.co','hello there')`), /permission denied/);
  });

  it("anonymous visitors can read only published content and published services", async () => {
    await asRole(db, "anon");
    expect((await db.query(`select count(*)::int as n from public.services`)).rows[0]).toEqual({ n: 9 });
    expect((await db.query(`select count(*)::int as n from public.services where status='draft'`)).rows[0]).toEqual({ n: 0 });
    await rejects(db.query(`update public.services set title='hacked'`), /permission denied/);
  });

  it("a signed-in user who is not an admin sees and changes nothing", async () => {
    await asRole(db, "authenticated", OTHER_ID);
    expect((await db.query<{ is_admin: boolean }>(`select public.is_admin()`)).rows[0]!.is_admin).toBe(false);
    expect((await db.query(`select * from public.inquiries`)).rows).toHaveLength(0);
    expect((await db.query(`select * from public.contacts`)).rows).toHaveLength(0);
    await rejects(db.query(`insert into public.tasks (title) values ('x')`), /row-level security/);
    await rejects(db.query(`update public.profiles set role='admin'`), /permission denied/);
    await rejects(db.query(`insert into public.profiles (id, role) values ('${OTHER_ID}', 'admin')`), /permission denied/);
    await rejects(db.query(`select public.publish_content('hero')`), /forbidden/);
  });

  it("an admin sees and manages everything", async () => {
    await asRole(db, "authenticated", ADMIN_ID);
    expect((await db.query<{ is_admin: boolean }>(`select public.is_admin()`)).rows[0]!.is_admin).toBe(true);
    expect((await db.query(`select * from public.inquiries`)).rows.length).toBeGreaterThan(0);
    await db.query(`insert into public.tasks (title) values ('follow up')`);
    await db.query(`update public.inquiries set status='in_progress'`);
    expect((await db.query(`select action from public.activity_logs where action='status_changed'`)).rows.length).toBeGreaterThan(0);
  });

  it("helper and trigger functions cannot be called through the API", async () => {
    await asRole(db, "anon");
    for (const fn of ["public.set_updated_at()", "public.log_inquiry_changes()", "public.clean_text('x')"]) {
      await rejects(db.query(`select ${fn}`), /permission denied|trigger/);
    }
  });
});

describe("submit_inquiry (migration 0005 as deployed by the repo)", () => {
  let db: PGlite;
  beforeAll(async () => {
    db = await freshDb("0006");
  });
  const asVisitor = async () => {
    await asRole(db, "anon");
    await setHeaders(db, { "cf-connecting-ip": "203.0.113.7", "user-agent": "vitest" });
  };

  it("stores a normal message, creates the contact and hides nothing", async () => {
    await asVisitor();
    const id = (await submit(db, { email: "first@example.com", company: "Acme" })).rows[0]!.submit_inquiry;
    await asRole(db, "postgres");
    const row = (await db.query<any>(`select i.spam, i.contact_id, c.company, i.ip_hash from inquiries i join contacts c on c.id=i.contact_id where i.id=$1`, [id])).rows[0];
    expect(row.spam).toBe(false);
    expect(row.company).toBe("Acme");
    expect(row.ip_hash).toMatch(/^[0-9a-f]{32}$/); // md5 today - see the throttling proposal
  });

  it("rejects bad input with specific, mappable error codes", async () => {
    await asVisitor();
    await rejects(submit(db, { name: "" }), "invalid_name");
    await rejects(submit(db, { email: "nope" }), "invalid_email");
    await rejects(submit(db, { email: "a@b" }), "invalid_email");
    await rejects(submit(db, { message: "hi" }), "invalid_message");
    await rejects(submit(db, { message: "x".repeat(10001) }), "invalid_message");
    await rejects(submit(db, { phone: "call me maybe" }), "invalid_phone");
  });

  it("silently ignores honeypot submissions (nothing stored)", async () => {
    await asVisitor();
    const before = (await db.query<any>(`select count(*)::int as n from public.inquiries`).catch(() => ({ rows: [{ n: -1 }] }))).rows[0].n;
    await submit(db, { website: "http://spam.example", email: "bot@example.com" });
    await asRole(db, "postgres");
    expect((await db.query(`select count(*)::int as n from inquiries where email='bot@example.com'`)).rows[0]).toEqual({ n: 0 });
    expect(before).toBe(-1); // anon could not even count: confirms the direct-read lockout from inside the same session
  });

  it("collapses a double click / client retry into one row", async () => {
    await asVisitor();
    const a = (await submit(db, { email: "twice@example.com", message: "Same message twice please" })).rows[0]!.submit_inquiry;
    const b = (await submit(db, { email: "TWICE@example.com", message: "Same message twice please" })).rows[0]!.submit_inquiry;
    expect(b).toBe(a);
  });

  it("limits one email to 5 different messages an hour, then refuses", async () => {
    await asVisitor();
    for (let i = 0; i < 5; i++) await submit(db, { email: "busy@example.com", message: `Message number ${i} here` });
    await rejects(submit(db, { email: "busy@example.com", message: "Message number six here" }), "rate_limited");
  });

  it("limits one network to 8 an hour (even with different emails)", async () => {
    await asRole(db, "anon");
    await setHeaders(db, { "cf-connecting-ip": "198.51.100.9" });
    for (let i = 0; i < 8; i++) await submit(db, { email: `net${i}@example.com`, message: `Network message ${i} here` });
    await rejects(submit(db, { email: "net9@example.com", message: "Network message nine here" }), "rate_limited");
  });

  it("flags bots and junk as spam instead of losing them", async () => {
    await asRole(db, "anon");
    await setHeaders(db, { "cf-connecting-ip": "192.0.2.50" });
    await submit(db, { email: "fast@example.com", elapsed_ms: 300 });
    await submit(db, { email: "links@example.com", message: "see http://a.co http://b.co http://c.co now" });
    await submit(db, { email: "markup@example.com", name: "<script>x</script>" });
    await asRole(db, "postgres");
    const r = await db.query<any>(`select email, spam, spam_reason, contact_id from inquiries where email in ('fast@example.com','links@example.com','markup@example.com') order by email`);
    expect(r.rows.map((x) => [x.email, x.spam, x.spam_reason, x.contact_id])).toEqual([
      ["fast@example.com", true, "too_fast", null],
      ["links@example.com", true, "many_links", null],
      ["markup@example.com", true, "markup_or_link_in_name", null],
    ]);
  });

  it("strips control characters and trims", async () => {
    await asVisitor();
    await setHeaders(db, { "cf-connecting-ip": "203.0.113.200" });
    const id = (await submit(db, { email: "ctl@example.com", name: "  Zed\u0007\u0000x  " }).catch(() => submit(db, { email: "ctl@example.com", name: "  Zed\u0007x  " }))).rows[0]!.submit_inquiry;
    await asRole(db, "postgres");
    expect((await db.query<any>(`select name from inquiries where id=$1`, [id])).rows[0].name).toBe("Zedx");
  });
});

describe("migration 0007 (security hardening)", () => {
  it("applies on a clean database and validates its constraints", async () => {
    const db = await freshDb();
    const c = await db.query<any>(`select conname, convalidated from pg_constraint where conname in ('inquiries_page_url_http','services_cta_url_check') order by 1`);
    expect(c.rows).toEqual([
      { conname: "inquiries_page_url_http", convalidated: true },
      { conname: "services_cta_url_check", convalidated: true },
    ]);
  });

  it("refuses new non-http page URLs and keeps accepting real ones", async () => {
    const db = await freshDb();
    await asRole(db, "anon");
    await setHeaders(db, { "cf-connecting-ip": "203.0.113.31" });
    await rejects(submit(db, { email: "j1@example.com", page_url: "javascript:alert(1)" }), /inquiries_page_url_http/);
    await rejects(submit(db, { email: "j2@example.com", page_url: "data:text/html,x" }), /inquiries_page_url_http/);
    await submit(db, { email: "ok@example.com", page_url: "https://reckomedia.example/contact" });
    await submit(db, { email: "none@example.com" });
  });

  it("existing bad rows are preserved in extra, cleared, and stay editable (the NOT VALID trap)", async () => {
    const db = await freshDb("0006");
    await db.exec(`insert into public.inquiries (name,email,message,page_url) values ('Old','old@example.com','hello world','javascript:alert(1)')`);
    await db.exec(sql("0007_security_hardening.sql"));
    const r = (await db.query<any>(`select page_url, extra from inquiries where email='old@example.com'`)).rows[0];
    expect(r.page_url).toBeNull();
    expect(r.extra.original_page_url).toBe("javascript:alert(1)");
    await db.exec(`update public.inquiries set archived = true where email='old@example.com'`); // must not violate the constraint
  });

  it("proves the trap is real: WITHOUT the cleanup step an old bad row could no longer be archived", async () => {
    const db = await freshDb("0006");
    await db.exec(`insert into public.inquiries (name,email,message,page_url) values ('Old','old@example.com','hello world','javascript:alert(1)')`);
    const withoutCleanup = sql("0007_security_hardening.sql")
      .replace(/update public\.inquiries[\s\S]*?page_url !~\* '\^https\?:\/\/';/, "")
      .replace("alter table public.inquiries validate constraint inquiries_page_url_http;", "");
    expect(withoutCleanup).not.toContain("original_page_url");
    await db.exec(withoutCleanup);
    await rejects(db.exec(`update public.inquiries set archived = true where email='old@example.com'`), /inquiries_page_url_http/);
  });

  it("stops, naming the rows, if a service link needs a human decision", async () => {
    const db = await freshDb("0006");
    await db.exec(`insert into public.services (slug,category,title,cta_url) values ('promo','growth','Promo','//evil.example/x')`).catch(() => {
      /* the OLD 0003 check accepts //host - that is the bug */
    });
    expect((await db.query(`select count(*)::int as n from public.services where slug='promo'`)).rows[0]).toEqual({ n: 1 }); // old rule let it in
    await rejects(db.exec(sql("0007_security_hardening.sql")), /promo -> \/\/evil\.example/);
  });

  it("services links: same-site paths pass, //host and /\\host and script URLs are refused", async () => {
    const db = await freshDb();
    const ins = (slug: string, url: string) => db.query(`insert into public.services (slug,category,title,cta_url) values ($1,'growth','T',$2)`, [slug, url]);
    await ins("a", "/contact");
    await ins("b", "https://example.com/x");
    await ins("c", "#faq");
    await ins("d", "mailto:a@b.co");
    for (const [i, bad] of ["//evil.example", "/\\evil.example", "javascript:alert(1)", "ftp://x"].entries()) {
      await rejects(ins(`bad${i}`, bad), /services_cta_url_check/);
    }
  });
});

describe("PROPOSED 0008 throttling (draft, not applied anywhere)", () => {
  let db: PGlite;
  beforeAll(async () => {
    db = await freshDb(undefined, true);
  });
  const visit = async (headers: Record<string, string> = { "cf-connecting-ip": "203.0.113.10" }) => {
    await asRole(db, "anon");
    await setHeaders(db, { "user-agent": "vitest", ...headers });
  };
  const row = async (email: string) => {
    await asRole(db, "postgres");
    return (await db.query<any>(`select spam, spam_reason, ip_hash, page_url from inquiries where email=$1 order by created_at desc limit 1`, [email])).rows[0];
  };

  it("keeps the same behaviour for normal visitors and still validates input", async () => {
    await visit();
    await submit(db, { email: "p1@example.com" });
    expect((await row("p1@example.com")).spam).toBe(false);
    await rejects(submit(db, { email: "bad" }), "invalid_email");
    await rejects(submit(db, { message: "x".repeat(70000) }), "invalid_message");
  });

  it("hashes the address with a secret: not md5, stable per network, different between networks", async () => {
    await visit({ "cf-connecting-ip": "203.0.113.11" });
    await submit(db, { email: "h1@example.com" });
    await submit(db, { email: "h2@example.com" });
    await visit({ "cf-connecting-ip": "203.0.113.12" });
    await submit(db, { email: "h3@example.com" });
    const [h1, h2, h3] = [await row("h1@example.com"), await row("h2@example.com"), await row("h3@example.com")];
    expect(h1.ip_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(h1.ip_hash).toBe(h2.ip_hash);
    expect(h1.ip_hash).not.toBe(h3.ip_hash);
    await asRole(db, "postgres");
    const md5 = (await db.query<any>(`select md5('reckomedia:203.0.113.11') as m`)).rows[0].m;
    expect(h1.ip_hash).not.toContain(md5);
  });

  it("the secret lives in a private schema that visitors and admins cannot read", async () => {
    for (const role of ["anon", "authenticated"] as const) {
      await asRole(db, role, ADMIN_ID);
      await rejects(db.query(`select * from private.app_secrets`), /permission denied/);
    }
    await asRole(db, "postgres");
    expect((await db.query<any>(`select length(value) as n from private.app_secrets where name='ip_hash_pepper'`)).rows[0].n).toBe(64);
  });

  it("ignores a forged first x-forwarded-for entry and uses the last (proxy-added) one", async () => {
    await visit({ "x-forwarded-for": "9.9.9.9, 203.0.113.50" });
    await submit(db, { email: "x1@example.com" });
    await visit({ "x-forwarded-for": "8.8.8.8, 203.0.113.50" });
    await submit(db, { email: "x2@example.com" });
    expect((await row("x1@example.com")).ip_hash).toBe((await row("x2@example.com")).ip_hash);
  });

  it("buckets IPv6 by /64 so rotating inside one network does not evade the limit", async () => {
    await visit({ "cf-connecting-ip": "2001:db8:1:2:aaaa:bbbb:cccc:1111" });
    await submit(db, { email: "v6a@example.com" });
    await visit({ "cf-connecting-ip": "2001:db8:1:2:ffff:eeee:dddd:2222" });
    await submit(db, { email: "v6b@example.com" });
    await visit({ "cf-connecting-ip": "2001:db8:1:3::1" });
    await submit(db, { email: "v6c@example.com" });
    expect((await row("v6a@example.com")).ip_hash).toBe((await row("v6b@example.com")).ip_hash);
    expect((await row("v6a@example.com")).ip_hash).not.toBe((await row("v6c@example.com")).ip_hash);
  });

  it("a garbage address header means no address stored, and the message still goes through", async () => {
    await visit({ "cf-connecting-ip": "not-an-ip" });
    await submit(db, { email: "garbage@example.com" });
    expect((await row("garbage@example.com")).ip_hash).toBeNull();
  });

  it("drops a non-http page address instead of failing the visitor's message", async () => {
    await visit({ "cf-connecting-ip": "203.0.113.60" });
    await submit(db, { email: "page@example.com", page_url: "javascript:alert(1)" });
    expect((await row("page@example.com")).page_url).toBeNull();
    await submit(db, { email: "page2@example.com", page_url: "https://reckomedia.example/contact" });
    expect((await row("page2@example.com")).page_url).toBe("https://reckomedia.example/contact");
  });

  it("the same per-sender limits still reject (5 per email, 8 per network)", async () => {
    await visit({ "cf-connecting-ip": "203.0.113.70" });
    for (let i = 0; i < 5; i++) await submit(db, { email: "lim@example.com", message: `Limit message ${i} text` });
    await rejects(submit(db, { email: "lim@example.com", message: "Limit message six text" }), "rate_limited");
    await visit({ "cf-connecting-ip": "203.0.113.71" });
    for (let i = 0; i < 8; i++) await submit(db, { email: `n${i}@example.com`, message: `Network ${i} message text` });
    await rejects(submit(db, { email: "n9@example.com", message: "Network nine message text" }), "rate_limited");
  });

  it("a flood cannot lock real visitors out: past the soft limit messages are quarantined, not refused", async () => {
    await asRole(db, "postgres");
    await db.exec(`
      insert into public.inquiries (name,email,message,spam)
      select 'bot', 'flood' || g || '@example.com', 'flood message ' || g, false from generate_series(1, 300) g;`);
    await visit({ "cf-connecting-ip": "203.0.113.80" });
    await submit(db, { email: "genuine@example.com", message: "A genuine question about SEO" }); // must NOT throw
    const r = await row("genuine@example.com");
    expect(r.spam).toBe(true);
    expect(r.spam_reason).toBe("flood_guard"); // visible in the spam tab, restorable in one click
  });

  it("the hard cap still protects storage", async () => {
    await asRole(db, "postgres");
    await db.exec(`
      insert into public.inquiries (name,email,message,spam)
      select 'bot', 'cap' || g || '@example.com', 'cap message ' || g, true from generate_series(1, 3000) g;`);
    await visit({ "cf-connecting-ip": "203.0.113.81" });
    await rejects(submit(db, { email: "late@example.com", message: "Too late for this hour" }), "rate_limited");
  });

  it("the fast-fill threshold is lowered: a 1.5 s autofill submit is kept as a real lead", async () => {
    await asRole(db, "postgres");
    await db.exec(`delete from public.inquiries where email like 'cap%' or email like 'flood%'`);
    await visit({ "cf-connecting-ip": "203.0.113.90" });
    await submit(db, { email: "autofill@example.com", elapsed_ms: 1500 });
    expect((await row("autofill@example.com")).spam).toBe(false);
    await submit(db, { email: "robot@example.com", elapsed_ms: 300 });
    expect((await row("robot@example.com")).spam_reason).toBe("too_fast");
  });
});


describe("portfolio database and storage authorization", () => {
  let db: PGlite;
  const id = "40000000-0000-4000-8000-000000000001";
  const other = "40000000-0000-4000-8000-000000000002";
  const version = "50000000-0000-4000-8000-000000000001";
  const base = `${id}/${version}`;
  beforeAll(async () => {
    db = await freshDb();
    await asRole(db,"authenticated",ADMIN_ID);
    for(const file of ["full.webp","thumb.webp","small.webp"]) await db.query("insert into storage.objects(bucket_id,name) values ('portfolio',$1)",[`${base}/${file}`]);
    await db.query("insert into storage.objects(bucket_id,name) values ('portfolio-originals',$1)",[`${base}/original.png`]);
  });
  it("creates a draft only after all storage objects exist", async () => {
    await db.query(`insert into portfolio_items(id,title,alt,image_path,thumb_path,small_path,original_path,width,height,bytes) values($1,'Website','Website preview',$2,$3,$4,$5,1920,8000,1000)`,[id,`${base}/full.webp`,`${base}/thumb.webp`,`${base}/small.webp`,`${base}/original.png`]);
    await rejects(db.query(`insert into portfolio_items(id,title,alt,image_path,thumb_path,small_path,original_path,width,height,bytes) values($1,'Missing','Missing preview',$2,$3,$4,$5,1920,8000,1000)`,[other,`${other}/${version}/full.webp`,`${other}/${version}/thumb.webp`,`${other}/${version}/small.webp`,`${other}/${version}/original.png`]),/portfolio_files_missing/);
  });
  it("hides drafts and originals from anonymous visitors and denies uploads",async()=>{
    await asRole(db,"anon");
    expect((await db.query("select * from portfolio_items")).rows).toHaveLength(0);
    expect((await db.query("select * from storage.objects")).rows).toHaveLength(0);
    await rejects(db.query("insert into storage.objects(bucket_id,name) values('portfolio','bad.webp')"),/row-level security/);
    await rejects(db.query("delete from portfolio_items"),/permission denied/);
    await asRole(db,"authenticated",OTHER_ID);
    await rejects(db.query(`update portfolio_items set title='hacked' returning id`).then(r=>{if(!r.rows.length)throw new Error('forbidden');}),/forbidden/);
    await rejects(db.query("select swap_portfolio($1,$2,1,2)",[id,other]),/forbidden/);
  });
  it("publishes metadata and derivatives while protecting originals and live objects",async()=>{
    await asRole(db,"authenticated",ADMIN_ID);
    await db.query("update portfolio_items set status='published',title='Updated website',description='Details',tags=array['Design'] where id=$1",[id]);
    expect((await db.query("delete from storage.objects returning name")).rows).toHaveLength(0);
    await asRole(db,"anon");
    expect((await db.query("select title from portfolio_items")).rows).toEqual([{title:"Updated website"}]);
    expect((await db.query("select name from storage.objects")).rows).toHaveLength(3);
    expect((await db.query("select portfolio_categories() as category")).rows).toEqual([{category:"Web"}]);
    await asRole(db,"authenticated",ADMIN_ID);
  });
  it("atomically reorders adjacent items and rejects stale concurrent moves",async()=>{
    const base2=`${other}/${version}`;
    for(const file of ["full.webp","thumb.webp","small.webp"]) await db.query("insert into storage.objects(bucket_id,name) values ('portfolio',$1)",[`${base2}/${file}`]);
    await db.query("insert into storage.objects(bucket_id,name) values ('portfolio-originals',$1)",[`${base2}/original.png`]);
    await db.query(`insert into portfolio_items(id,title,alt,image_path,thumb_path,small_path,original_path,width,height,bytes) values($1,'Other','Other preview',$2,$3,$4,$5,1920,8000,1000)`,[other,`${base2}/full.webp`,`${base2}/thumb.webp`,`${base2}/small.webp`,`${base2}/original.png`]);
    const orders=await db.query<{id:string;sort_order:number}>("select id,sort_order::int from portfolio_items order by sort_order");
    const a=orders.rows[0]!,b=orders.rows[1]!;
    await db.query("select swap_portfolio($1,$2,$3,$4)",[a.id,b.id,a.sort_order,b.sort_order]);
    expect((await db.query<{id:string}>("select id from portfolio_items order by sort_order")).rows.map(r=>r.id)).toEqual([b.id,a.id]);
    await rejects(db.query("select swap_portfolio($1,$2,$3,$4)",[a.id,b.id,a.sort_order,b.sort_order]),/portfolio_order_changed/);
  });
  it("replaces safely, queues old files, and deletes without leaving references",async()=>{
    const version2="50000000-0000-4000-8000-000000000002";
    const next=`${id}/${version2}`;
    for(const file of ["full.webp","thumb.webp","small.webp"]) await db.query("insert into storage.objects(bucket_id,name) values ('portfolio',$1)",[`${next}/${file}`]);
    await db.query("insert into storage.objects(bucket_id,name) values ('portfolio-originals',$1)",[`${next}/original.png`]);
    await db.query("update portfolio_items set image_path=$2,thumb_path=$3,small_path=$4,original_path=$5 where id=$1",[id,`${next}/full.webp`,`${next}/thumb.webp`,`${next}/small.webp`,`${next}/original.png`]);
    expect((await db.query("select * from portfolio_cleanup")).rows).toHaveLength(4);
    expect((await db.query("delete from storage.objects where name like $1 returning name",[`${base}/%`])).rows).toHaveLength(4);
    await db.query("delete from portfolio_items where id=$1",[id]);
    expect((await db.query("select * from portfolio_cleanup")).rows).toHaveLength(8);
    expect((await db.query("delete from storage.objects where name like $1 returning name",[`${next}/%`])).rows).toHaveLength(4);
  });
});
