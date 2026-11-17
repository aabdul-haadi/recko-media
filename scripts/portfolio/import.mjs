// Defaults to a local, non-network dry run. --apply explicitly uploads drafts.
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
const source =
  process.argv.find((arg) => arg.startsWith("--source="))?.slice(9) ?? "src/assets/portfolio/web";
const destination = await mkdtemp(path.join(tmpdir(), "recko-portfolio-"));
const rows = JSON.parse(
  execFileSync("python", ["scripts/portfolio/prepare.py", source, destination], {
    encoding: "utf8",
    maxBuffer: 4 * 1024 * 1024,
  }),
);
const total = (key) => rows.reduce((n, r) => n + r[key], 0);
console.log(
  JSON.stringify(
    {
      images: rows.length,
      sourceBytes: total("source_bytes"),
      originalBytes: total("original_bytes"),
      fullBytes: total("full_bytes"),
      thumbnail960Bytes: total("thumb_bytes"),
      thumbnail480Bytes: total("small_bytes"),
      temporaryVariants: destination,
    },
    null,
    2,
  ),
);
if (!process.argv.includes("--apply")) {
  console.log("Dry run only. No network requests or database changes.");
  process.exit(0);
}
const url = process.env.VITE_SUPABASE_URL,
  key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key || !process.env.PORTFOLIO_ADMIN_EMAIL || !process.env.PORTFOLIO_ADMIN_PASSWORD)
  throw new Error(
    "Set Supabase public configuration and PORTFOLIO_ADMIN_EMAIL / PORTFOLIO_ADMIN_PASSWORD in your shell.",
  );
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const auth = await db.auth.signInWithPassword({
  email: process.env.PORTFOLIO_ADMIN_EMAIL,
  password: process.env.PORTFOLIO_ADMIN_PASSWORD,
});
if (auth.error) throw new Error("Admin sign-in failed.");
try {
  if ((await db.rpc("is_admin")).data !== true) throw new Error("Admin authorization required.");
  for (const row of rows) {
    // Deterministic identity makes a repeated import safe; never overwrites an edited item.
    const hex = createHash("sha256")
      .update(`recko-portfolio:${row.name}`)
      .digest("hex")
      .slice(0, 32);
    const id = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20)}`;
    const prior = await db.from("portfolio_items").select("id").eq("id", id).maybeSingle();
    if (prior.error) throw prior.error;
    if (prior.data) {
      console.log(`Already imported: ${row.name}`);
      continue;
    }
    const base = `${id}/${randomUUID()}`;
    const extension = path.extname(row.original).slice(1);
    const entries = [
      ...["full", "thumb", "small"].map((name) => ({
        bucket: "portfolio",
        path: `${base}/${name}.webp`,
        file: path.join(row.directory, `${name}.webp`),
        type: "image/webp",
      })),
      {
        bucket: "portfolio-originals",
        path: `${base}/original.${extension}`,
        file: row.original,
        type: extension === "png" ? "image/png" : "image/webp",
      },
    ];
    const queued = await db.from("portfolio_cleanup").insert(
      entries.map((e) => ({
        bucket: e.bucket,
        path: e.path,
        created_at: new Date(Date.now() + 86400000).toISOString(),
      })),
    );
    if (queued.error) throw queued.error;
    for (const e of entries) {
      const result = await db.storage.from(e.bucket).upload(e.path, await readFile(e.file), {
        upsert: false,
        contentType: e.type,
        cacheControl: "3600",
      });
      if (result.error) throw result.error;
    }
    const title = row.name
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    const result = await db.from("portfolio_items").insert({
      id,
      title,
      alt: `${title} website design`,
      category: "Web",
      description: "",
      tags: [],
      status: "draft",
      image_path: entries[0].path,
      thumb_path: entries[1].path,
      small_path: entries[2].path,
      original_path: entries[3].path,
      width: row.width,
      height: row.height,
      bytes: row.full_bytes,
    });
    if (result.error)
      throw new Error(
        `Could not confirm ${row.name}. Retry this import; recovery objects are retained.`,
      );
    await db
      .from("portfolio_cleanup")
      .delete()
      .in(
        "path",
        entries.map((e) => e.path),
      );
    console.log(`Imported draft: ${row.name}`);
  }
} finally {
  await db.auth.signOut();
}
