/** Keep signed URLs stable long enough for the browser/CDN cache to do its job.
 * Only published image URLs may use the persistent instance. Drafts stay private.
 */
export const IMAGE_URL_TTL = 45 * 60_000; // Signatures last 60 min; reserve a 15 min margin.
const MAX_ENTRIES = 256;
type Entry = { url: string; expires: number };
type Store = Pick<Storage, "getItem" | "setItem">;
type Signed = { path?: string | null; signedUrl?: string | null; error?: string | null };
export function createImageUrlCache({
  sign,
  key,
  storage,
  now = Date.now,
  allowedUrl = (url: string) => /^https?:\/\//.test(url),
}: {
  sign: (paths: string[]) => Promise<Signed[]>;
  key: string;
  storage: () => Store | undefined;
  now?: () => number;
  allowedUrl?: (url: string) => boolean;
}) {
  const entries = new Map<string, Entry>();
  const pending = new Map<string, Promise<string | undefined>>();
  let hydrated = false;
  function load() {
    if (hydrated) return;
    hydrated = true;
    try {
      const rows: unknown = JSON.parse(storage()?.getItem(key) ?? "[]");
      if (!Array.isArray(rows)) return;
      for (const row of rows.slice(-MAX_ENTRIES)) {
        if (
          !Array.isArray(row) ||
          typeof row[0] !== "string" ||
          !row[1] ||
          typeof row[1] !== "object"
        )
          continue;
        const entry = row[1] as Partial<Entry>;
        if (
          typeof entry.url === "string" &&
          entry.url.length < 4000 &&
          allowedUrl(entry.url) &&
          typeof entry.expires === "number" &&
          entry.expires > now() &&
          entry.expires <= now() + IMAGE_URL_TTL
        )
          entries.set(row[0], entry as Entry);
      }
    } catch {
      /* Storage may be disabled. Memory caching still works. */
    }
  }
  function save() {
    for (const [path, entry] of entries) if (entry.expires <= now()) entries.delete(path);
    while (entries.size > MAX_ENTRIES) entries.delete(entries.keys().next().value!);
    try {
      storage()?.setItem(key, JSON.stringify([...entries]));
    } catch {
      /* Quota/private browsing. */
    }
  }
  function get(path: string) {
    load();
    const entry = entries.get(path);
    if (entry && entry.expires > now()) return entry.url;
    entries.delete(path);
    return undefined;
  }
  function invalidate(path: string) {
    load();
    entries.delete(path);
    save();
  }
  async function resolve(paths: string[]) {
    const unique = [...new Set(paths)];
    const missing = unique.filter((path) => !get(path) && !pending.has(path));
    if (missing.length) {
      const requestedAt = now();
      const batch = Promise.resolve()
        .then(() => sign(missing))
        .then((rows) => {
          for (const row of rows)
            if (
              row.path &&
              missing.includes(row.path) &&
              row.signedUrl &&
              !row.error &&
              allowedUrl(row.signedUrl)
            )
              entries.set(row.path, { url: row.signedUrl, expires: requestedAt + IMAGE_URL_TTL });
          save();
        });
      for (const path of missing)
        pending.set(
          path,
          batch.then(() => get(path)).finally(() => pending.delete(path)),
        );
    }
    const values = await Promise.all(
      unique.map(async (path) => [path, get(path) ?? (await pending.get(path))] as const),
    );
    return new Map(values);
  }
  return { get, resolve, invalidate };
}
export function canPrefetchImage(connection?: {
  saveData?: boolean;
  effectiveType?: string;
  downlink?: number;
}) {
  return (
    !connection?.saveData &&
    !["slow-2g", "2g", "3g"].includes(connection?.effectiveType ?? "") &&
    !(typeof connection?.downlink === "number" && connection.downlink < 4)
  );
}
