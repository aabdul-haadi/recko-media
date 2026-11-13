// Minimal in-memory stand-in for the Supabase REST + Auth API, used ONLY by the browser tests.
// It never talks to a real project and holds synthetic data only. It mirrors the rules of
// supabase/migrations (admin-only tables, submit_inquiry validation and limits) closely enough to drive the UI,
// and supports fault injection (POST /__fail) so error handling and intermittent failures can be reproduced.
import http from "node:http";
import { randomUUID } from "node:crypto";

const PORT = Number(process.env.STUB_PORT ?? 54329);
const ADMIN = { email: "admin@reckomedia.com", password: "Admin-Test-1", id: "00000000-0000-4000-8000-000000000001" };
const VIEWER = { email: "viewer@example.com", password: "Viewer-Test-1", id: "00000000-0000-4000-8000-000000000002" };
const admins = new Set([ADMIN.id]);

const iso = (minsAgo) => new Date(Date.now() - minsAgo * 60_000).toISOString();
const svc = (n, category, title, status, sort) => ({
  id: `10000000-0000-4000-8000-00000000000${n}`, slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-"), category, title,
  summary: `${title} summary`, details: null, features: [], price: null, icon: null, image_url: null, image_alt: null,
  cta_label: null, cta_url: null, featured: false, status, sort_order: sort, seo_title: null, seo_description: null,
  created_at: iso(500), updated_at: iso(500),
});
const inq = (n, name, email, message, extra = {}) => ({
  id: `20000000-0000-4000-8000-00000000000${n}`, contact_id: null, name, email, phone: null, company: null, subject: null,
  message, service: "SEO", source: "contact-page", page_url: "https://reckomedia.example/contact", extra: {}, status: "new",
  priority: "normal", follow_up_at: null, archived: false, spam: false, spam_reason: null, ip_hash: null, user_agent: null,
  created_at: iso(n * 30), updated_at: iso(n * 30), ...extra,
});

const seed = () => ({
  services: [
    svc(1, "creative", "Facebook Ads", "published", 1), svc(2, "creative", "Instagram Ads", "published", 2),
    svc(3, "growth", "Search Engine Optimization", "published", 1), svc(4, "technology", "Website Design", "draft", 1),
  ],
  inquiries: [
    inq(1, "Alice Example", "alice@example.com", "We need a new website for our bakery."),
    inq(2, "O\"Brien, (Bob)", "bob@example.com", "Looking for SEO help for our shop."),
    inq(3, "Mallory", "mallory@example.com", "Click my link please", { page_url: "javascript:alert(document.cookie)" }),
    inq(4, "Spammer", "spam@example.com", "buy cheap http://a http://b http://c", { spam: true, spam_reason: "many_links" }),
  ],
  contacts: [
    { id: "30000000-0000-4000-8000-000000000001", full_name: "Alice Example", email: "alice@example.com", email_normalized: "alice@example.com", phone: null, company: "Bakery Ltd", status: "lead", notes: null, first_contact_at: iso(90), last_interaction_at: iso(30), created_at: iso(90), updated_at: iso(30) },
    { id: "30000000-0000-4000-8000-000000000002", full_name: "Carol Client", email: "carol@example.com", email_normalized: "carol@example.com", phone: "+92 300 1234567", company: null, status: "client", notes: null, first_contact_at: iso(900), last_interaction_at: iso(100), created_at: iso(900), updated_at: iso(100) },
  ],
  tasks: [], tags: [], contact_tags: [], inquiry_notes: [], activity_logs: [], content_published: [], content_drafts: [],
});

let db = seed();
let failures = []; // { match: "PATCH services", status, times, delayMs }
const slow = []; // { match, delayMs, times }: answer normally but late
let submissions = []; // timestamps for rate limiting in submit_inquiry
const log = [];

const PUBLIC_READ = { content_published: () => true, services: (r) => r.status === "published" };

function cors(res) {
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("access-control-allow-headers", "*");
  res.setHeader("access-control-allow-methods", "GET,POST,PATCH,PUT,DELETE,HEAD,OPTIONS");
  res.setHeader("access-control-expose-headers", "content-range");
}
function send(res, status, body, headers = {}) {
  cors(res);
  res.statusCode = status;
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  if (body === undefined) return res.end();
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(body));
}
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const jwtFor = (user) => `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: user.id, email: user.email, role: "authenticated", aud: "authenticated", exp: Math.floor(Date.now() / 1000) + 3600 })}.stub`;
function userFromAuth(req) {
  const m = /^Bearer (.+)$/.exec(req.headers.authorization ?? "");
  if (!m) return null;
  try {
    const p = JSON.parse(Buffer.from(m[1].split(".")[1], "base64url").toString());
    return p.sub ? { id: p.sub, email: p.email } : null;
  } catch { return null; }
}
const isAdmin = (u) => Boolean(u && admins.has(u.id));

function matches(row, col, op, val) {
  const cell = row[col];
  switch (op) {
    case "eq": return String(cell) === val;
    case "neq": return String(cell) !== val;
    case "gte": return String(cell) >= val;
    case "lte": return String(cell) <= val;
    case "is": return val === "null" ? cell == null : String(cell) === val;
    case "in": return val.replace(/^\(|\)$/g, "").split(",").includes(String(cell));
    case "ilike": {
      const re = new RegExp("^" + val.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/%/g, ".*") + "$", "i");
      return cell != null && re.test(String(cell));
    }
    default: return true;
  }
}
function splitTop(s) { return s.split(","); }
function filterRows(rows, params) {
  let out = rows;
  for (const [key, value] of params) {
    if (["select", "order", "limit", "offset", "on_conflict", "columns"].includes(key)) continue;
    if (key === "or") {
      const conds = splitTop(value.replace(/^\(|\)$/g, "")).map((c) => { const [col, op, ...rest] = c.split("."); return [col, op, rest.join(".")]; });
      out = out.filter((r) => conds.some(([c, o, v]) => matches(r, c, o, v)));
      continue;
    }
    const m = /^(not\.)?([a-z]+)\.(.*)$/s.exec(value);
    if (!m) continue;
    out = out.filter((r) => { const ok = matches(r, key, m[2], m[3]); return m[1] ? !ok : ok; });
  }
  const order = params.get("order");
  if (order) {
    const keys = order.split(",").map((o) => { const [c, d] = o.split("."); return [c, d === "desc"]; });
    out = [...out].sort((a, b) => {
      for (const [c, desc] of keys) {
        const x = a[c], y = b[c];
        if (x === y) continue;
        return ((x ?? "") < (y ?? "") ? -1 : 1) * (desc ? -1 : 1);
      }
      return 0;
    });
  }
  return out;
}
function embed(table, rows, select) {
  return rows.map((r) => {
    const o = { ...r };
    if (table === "tasks") {
      if (/contacts\(/.test(select)) { const c = db.contacts.find((x) => x.id === r.contact_id); o.contacts = c ? { full_name: c.full_name } : null; }
      if (/inquiries\(/.test(select)) { const i = db.inquiries.find((x) => x.id === r.inquiry_id); o.inquiries = i ? { name: i.name } : null; }
    }
    if (table === "contacts" && /contact_tags\(/.test(select)) {
      o.contact_tags = db.contact_tags.filter((x) => x.contact_id === r.id).map((x) => ({ tags: db.tags.find((t) => t.id === x.tag_id) }));
    }
    return o;
  });
}

function submitInquiry(p) {
  const clean = (v) => String(v ?? "").replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
  if (clean(p.website)) return { status: 200, body: randomUUID() };
  const name = clean(p.name), email = clean(p.email), message = clean(p.message), phone = clean(p.phone) || null;
  const fail = (code) => ({ status: 400, body: { code: "22023", message: code } });
  if (name.length < 1 || name.length > 200) return fail("invalid_name");
  if (email.length > 320 || !/^[A-Za-z0-9._%+'-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) return fail("invalid_email");
  if (message.length < 5 || message.length > 10000) return fail("invalid_message");
  if (phone && !/^[0-9+()./ -]{5,50}$/.test(phone)) return fail("invalid_phone");
  const dup = db.inquiries.find((i) => i.email.toLowerCase() === email.toLowerCase() && i.message === message && Date.now() - Date.parse(i.created_at) < 600_000);
  if (dup) return { status: 200, body: dup.id };
  const hour = db.inquiries.filter((i) => i.email.toLowerCase() === email.toLowerCase() && Date.now() - Date.parse(i.created_at) < 3_600_000).length;
  if (hour >= 5) return { status: 429, body: { code: "54000", message: "rate_limited" } };
  const spam = p.elapsed_ms != null && Number(p.elapsed_ms) < 2500;
  const row = inq(9, name, email, message, { id: randomUUID(), phone, company: clean(p.company) || null, service: clean(p.service) || null, source: clean(p.source) || "website", page_url: p.page_url ?? null, spam, spam_reason: spam ? "too_fast" : null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
  db.inquiries.unshift(row);
  return { status: 200, body: row.id };
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const text = Buffer.concat(chunks).toString();
  try { return text ? JSON.parse(text) : undefined; } catch { return undefined; }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  if (req.method === "OPTIONS") { cors(res); res.statusCode = 204; return res.end(); }
  const body = await readBody(req);
  const path = url.pathname;

  if (path === "/__reset") { db = seed(); failures = []; slow.length = 0; log.length = 0; return send(res, 200, { ok: true }); }
  if (path === "/__fail") { failures.push({ times: 1, status: 500, delayMs: 0, ...body }); return send(res, 200, { ok: true }); }
  if (path === "/__slow") { slow.push({ times: 1, delayMs: 1000, ...body }); return send(res, 200, { ok: true }); }
  if (path === "/__state") return send(res, 200, { db, log });
  if (path === "/__seed" && body) { Object.assign(db, body); return send(res, 200, { ok: true }); }

  const tag = `${req.method} ${path.replace("/rest/v1/", "").replace("rpc/", "rpc:")}`;
  log.push(tag);
  const s = slow.find((x) => tag.includes(x.match) && x.times > 0);
  if (s) { s.times -= 1; await new Promise((r) => setTimeout(r, s.delayMs)); }
  let f = failures.find((x) => tag.includes(x.match) && x.times > 0);
  if (f && f.skip > 0) { f.skip -= 1; f = undefined; } // let the first N matching requests through
  if (f) {
    f.times -= 1;
    if (f.delayMs) await new Promise((r) => setTimeout(r, f.delayMs));
    if (f.status === 0) return req.socket.destroy();
    return send(res, f.status, { code: "XX000", message: "injected failure" });
  }

  // ---- auth
  if (path === "/auth/v1/token") {
    const user = [ADMIN, VIEWER].find((u) => u.email === body?.email && u.password === body?.password);
    if (!user) return send(res, 400, { error: "invalid_grant", error_description: "Invalid login credentials", code: 400, msg: "Invalid login credentials" });
    const now = Math.floor(Date.now() / 1000);
    return send(res, 200, { access_token: jwtFor(user), token_type: "bearer", expires_in: 3600, expires_at: now + 3600, refresh_token: "r-" + user.id, user: { id: user.id, aud: "authenticated", role: "authenticated", email: user.email, app_metadata: {}, user_metadata: {}, created_at: iso(1000) } });
  }
  if (path === "/auth/v1/user") { const u = userFromAuth(req); return u ? send(res, 200, { id: u.id, aud: "authenticated", role: "authenticated", email: u.email, app_metadata: {}, user_metadata: {}, created_at: iso(1000) }) : send(res, 401, { message: "unauthorized" }); }
  if (path === "/auth/v1/logout") return send(res, 204);
  if (path === "/auth/v1/recover") return send(res, 200, {});
  if (path.startsWith("/auth/v1/")) return send(res, 200, {});
  if (path.startsWith("/realtime/")) return send(res, 404, { message: "realtime disabled in tests" });

  // ---- rpc
  const user = userFromAuth(req);
  if (path === "/rest/v1/rpc/is_admin") return send(res, 200, isAdmin(user));
  if (path === "/rest/v1/rpc/submit_inquiry") { const r = submitInquiry(body?.payload ?? {}); return send(res, r.status, r.body); }
  if (path === "/rest/v1/rpc/publish_content") return isAdmin(user) ? send(res, 200, new Date().toISOString()) : send(res, 403, { code: "42501", message: "forbidden" });

  // ---- tables
  const table = path.replace("/rest/v1/", "");
  if (!(table in db)) return send(res, 404, { code: "42P01", message: `unknown table ${table}` });
  const admin = isAdmin(user);
  const publicOnly = PUBLIC_READ[table];
  if (!admin && !(publicOnly && req.method === "GET")) return send(res, req.method === "GET" ? 200 : 401, req.method === "GET" ? [] : { code: "42501", message: "permission denied" });

  const params = url.searchParams;
  const select = params.get("select") ?? "*";
  const prefer = req.headers.prefer ?? "";
  const wantRows = /return=representation/.test(prefer);
  const wantObject = /pgrst\.object/.test(req.headers.accept ?? "");
  let rows = db[table];
  if (!admin && publicOnly) rows = rows.filter(publicOnly);

  if (req.method === "GET" || req.method === "HEAD") {
    const filtered = filterRows(rows, params);
    const total = filtered.length;
    let page = filtered;
    const range = req.headers.range;
    let start = 0;
    if (range && /^\d+-\d+$/.test(range)) { const [a, b] = range.split("-").map(Number); start = a; page = filtered.slice(a, b + 1); }
    if (params.get("offset")) start = Number(params.get("offset"));
    if (params.get("limit")) page = filtered.slice(start, start + Number(params.get("limit")));
    const headers = /count=exact/.test(prefer) ? { "content-range": `${total ? start : "*"}-${start + Math.max(page.length - 1, 0)}/${total}` } : {};
    if (req.method === "HEAD") return send(res, 200, undefined, headers);
    const data = embed(table, page, select);
    if (wantObject) return data.length === 1 ? send(res, 200, data[0], headers) : send(res, 406, { code: "PGRST116", message: "JSON object requested, multiple (or no) rows returned" });
    return send(res, 200, data, headers);
  }
  if (req.method === "POST") {
    const items = Array.isArray(body) ? body : [body];
    const upsert = /resolution=merge-duplicates/.test(prefer);
    const created = [];
    for (const item of items) {
      const keyCols = table === "content_drafts" ? ["key"] : table === "contact_tags" ? ["contact_id", "tag_id"] : table === "tags" ? ["name"] : table === "services" ? ["slug"] : [];
      const existing = keyCols.length ? db[table].find((r) => keyCols.every((k) => r[k] === item[k])) : undefined;
      if (existing && !upsert) return send(res, 409, { code: "23505", message: `duplicate key value violates unique constraint on ${table}` });
      if (existing) { Object.assign(existing, item); created.push(existing); continue; }
      const row = { id: randomUUID(), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...item };
      if (table === "tasks") Object.assign(row, { status: "pending", description: null, due_at: null, contact_id: null, inquiry_id: null, ...item });
      if (table === "services") Object.assign(row, { status: "draft", featured: false, features: [], ...item });
      db[table].push(row);
      created.push(row);
    }
    return wantRows ? send(res, 201, wantObject ? created[0] : created) : send(res, 201);
  }
  if (req.method === "PATCH") {
    const targets = filterRows(db[table], params);
    for (const r of targets) Object.assign(r, body, { updated_at: new Date().toISOString() });
    return wantRows ? send(res, 200, wantObject ? targets[0] : targets) : send(res, 204);
  }
  if (req.method === "DELETE") {
    const targets = new Set(filterRows(db[table], params));
    db[table] = db[table].filter((r) => !targets.has(r));
    return send(res, 204);
  }
  return send(res, 405, { message: "method not allowed" });
});

server.listen(PORT, "127.0.0.1", () => console.log(`stub supabase on ${PORT}`));
