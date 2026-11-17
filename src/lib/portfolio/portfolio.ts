import { useEffect } from "react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { createImageUrlCache } from "./image-cache";

export type PortfolioItem = {
  id: string;
  title: string;
  description: string;
  alt: string;
  category: string;
  tags: string[];
  status: "draft" | "published";
  sort_order: number;
  image_path: string;
  thumb_path: string;
  small_path: string;
  original_path: string;
  width: number;
  height: number;
  bytes: number;
  updated_at: string;
};
export type PortfolioCard = PortfolioItem & { thumbnail?: string; small?: string };
export const PAGE_SIZE = 24;
export const MAX_UPLOAD = 20 * 1024 * 1024;
export const portfolioKey = ["portfolio"];
export const cleanSearch = (value: string) =>
  value.replace(/[^\p{L}\p{N} @._-]/gu, "").slice(0, 100);
export const titleFromFile = (name: string) =>
  name
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200) || "Untitled project";

const publicImageUrls = createImageUrlCache({
  key: `recko:portfolio-urls:v1:${import.meta.env["VITE_SUPABASE_URL"] ?? "unconfigured"}`,
  storage: () => (typeof window === "undefined" ? undefined : window.sessionStorage),
  allowedUrl: (url) => {
    try {
      return new URL(url).origin === new URL(import.meta.env["VITE_SUPABASE_URL"] as string).origin;
    } catch {
      return false;
    }
  },
  sign: async (paths) => {
    const { data, error } = await getSupabase()
      .storage.from("portfolio")
      .createSignedUrls(paths, 3600);
    if (error) throw error;
    return data ?? [];
  },
});
export async function signImage(path: string, published = false, refresh = false) {
  if (published) {
    if (refresh) publicImageUrls.invalidate(path);
    const url = (await publicImageUrls.resolve([path])).get(path);
    if (!url) throw new Error("Image is unavailable. Please try again.");
    return url;
  }
  // Draft links are never persisted in browser storage or shared with public readers.
  const { data, error } = await getSupabase().storage.from("portfolio").createSignedUrl(path, 3600);
  if (error || !data?.signedUrl) throw new Error("Image is unavailable. Please try again.");
  return data.signedUrl;
}

async function thumbnails(items: PortfolioItem[]): Promise<PortfolioCard[]> {
  if (!items.length) return [];
  const publishedPaths = items
    .filter((i) => i.status === "published")
    .flatMap((i) => [i.small_path, i.thumb_path]);
  const draftPaths = items
    .filter((i) => i.status !== "published")
    .flatMap((i) => [i.small_path, i.thumb_path]);
  const [cached, drafts] = await Promise.all([
    publicImageUrls
      .resolve(publishedPaths)
      .catch(() => new Map(publishedPaths.map((path) => [path, publicImageUrls.get(path)]))),
    draftPaths.length
      ? getSupabase().storage.from("portfolio").createSignedUrls(draftPaths, 3600)
      : Promise.resolve({ data: [] }),
  ]);
  const urls = new Map([
    ...cached,
    ...(drafts.data ?? []).map((v) => [v.path, v.signedUrl] as const),
  ]);
  return items.map((i) => ({
    ...i,
    small: urls.get(i.small_path) ?? "",
    thumbnail: urls.get(i.thumb_path) ?? "",
  }));
}

// Share one realtime subscription across gallery/showcase readers of the same cache.
const subscriptions = new WeakMap<object, { references: number; close: () => void }>();
export function usePortfolio(admin = false, search = "", category = "") {
  const client = useQueryClient();
  useEffect(() => {
    // The existing admin layout already invalidates this table's queries.
    if (admin || !isSupabaseConfigured()) return;
    let subscription = subscriptions.get(client);
    if (!subscription) {
      let timer: ReturnType<typeof setTimeout>;
      const db = getSupabase();
      const channel = db
        .channel("portfolio-public")
        .on("postgres_changes", { event: "*", schema: "public", table: "portfolio_items" }, () => {
          clearTimeout(timer);
          timer = setTimeout(() => {
            void client.invalidateQueries({ queryKey: portfolioKey });
          }, 300);
        })
        .subscribe();
      subscription = {
        references: 0,
        close: () => {
          clearTimeout(timer);
          void db.removeChannel(channel);
        },
      };
      subscriptions.set(client, subscription);
    }
    subscription.references++;
    return () => {
      if (--subscription.references === 0) {
        subscription.close();
        subscriptions.delete(client);
      }
    };
  }, [admin, client]);
  return useInfiniteQuery({
    queryKey: ["portfolio", admin ? "admin" : "public", cleanSearch(search), category],
    initialPageParam: 0,
    staleTime: 60_000,
    refetchInterval: 60_000,
    queryFn: async ({ pageParam }) => {
      if (!isSupabaseConfigured()) return [] as PortfolioCard[];
      let query = getSupabase()
        .from("portfolio_items")
        .select("*")
        .order("sort_order")
        .order("id")
        .range(pageParam, pageParam + PAGE_SIZE - 1);
      if (!admin) query = query.eq("status", "published");
      if (search) query = query.ilike("title", `%${cleanSearch(search)}%`);
      if (category) query = query.eq("category", category);
      const { data, error } = await query;
      if (error) throw new Error("Could not load portfolio. Check your connection and try again.");
      return thumbnails(data as PortfolioItem[]);
    },
    getNextPageParam: (last, pages) =>
      last.length === PAGE_SIZE ? pages.length * PAGE_SIZE : undefined,
  });
}

export function usePortfolioCategories() {
  return useQuery({
    queryKey: ["portfolio", "categories"],
    staleTime: 60_000,
    queryFn: async () => {
      if (!isSupabaseConfigured()) return [] as string[];
      const { data, error } = await getSupabase().rpc("portfolio_categories");
      if (error) throw error;
      return data as string[];
    },
  });
}

export type PortfolioMetadata = Pick<
  PortfolioItem,
  "title" | "description" | "alt" | "category" | "tags" | "status"
>;
export function validateMetadata(meta: PortfolioMetadata) {
  if (
    !meta.title.trim() ||
    meta.title.length > 200 ||
    !meta.alt.trim() ||
    meta.alt.length > 300 ||
    !meta.category.trim() ||
    meta.category.length > 60 ||
    meta.description.length > 3000 ||
    meta.tags.length > 12 ||
    meta.tags.join(",").length > 500
  )
    throw new Error(
      "Enter a title, image description and category within the field limits (up to 12 tags).",
    );
}

export type ImageVariants = {
  full: Blob;
  thumb: Blob;
  small: Blob;
  width: number;
  height: number;
  extension: string;
};
export async function prepareImage(file: File): Promise<ImageVariants> {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type))
    throw new Error("Choose a PNG, JPEG or WebP image.");
  if (!file.size || file.size > MAX_UPLOAD) throw new Error("Images must be smaller than 20 MB.");
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("This image is damaged or cannot be read.");
  }
  try {
    if (bitmap.width * bitmap.height > 48_000_000)
      throw new Error("This image is too large. Use an image under 48 megapixels.");
    const render = async (w: number, h: number, crop = false) => {
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Your browser cannot prepare images.");
      if (crop) {
        const ratio = Math.max(w / bitmap.width, h / bitmap.height);
        ctx.drawImage(
          bitmap,
          (w - bitmap.width * ratio) / 2,
          0,
          bitmap.width * ratio,
          bitmap.height * ratio,
        );
      } else ctx.drawImage(bitmap, 0, 0, w, h);
      try {
        return await new Promise<Blob>((resolve, reject) =>
          canvas.toBlob(
            (b) =>
              b?.type === "image/webp"
                ? resolve(b)
                : reject(new Error("WebP export is unavailable in this browser.")),
            "image/webp",
            0.82,
          ),
        );
      } finally {
        canvas.width = 0;
        canvas.height = 0;
      }
    };
    const ratio = Math.min(1, 1920 / bitmap.width, 16383 / bitmap.height);
    const width = Math.max(1, Math.round(bitmap.width * ratio)),
      height = Math.max(1, Math.round(bitmap.height * ratio));
    // Sequential rendering bounds memory use for long website screenshots.
    const full = await render(width, height);
    const thumb = await render(960, 640, true);
    const small = await render(480, 320, true);
    return {
      full,
      thumb,
      small,
      width,
      height,
      extension: file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1]!,
    };
  } finally {
    bitmap.close();
  }
}

async function uploadObject(
  bucket: string,
  path: string,
  blob: Blob,
  onProgress: (bytes: number) => void,
  signal?: AbortSignal,
) {
  const session = await getSupabase().auth.getSession();
  if (!session.data.session)
    throw new Error("Your session expired. Sign in again before uploading.");
  if (signal?.aborted) throw new Error("Upload cancelled.");
  const url = `${import.meta.env["VITE_SUPABASE_URL"]}/storage/v1/object/${bucket}/${path.split("/").map(encodeURIComponent).join("/")}`;
  await new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", url);
    request.timeout = 120000;
    request.responseType = "json";
    request.setRequestHeader("Authorization", `Bearer ${session.data.session!.access_token}`);
    request.setRequestHeader("apikey", import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string);
    request.setRequestHeader("Content-Type", blob.type);
    request.setRequestHeader("Cache-Control", "max-age=3600");
    request.setRequestHeader("x-upsert", "false");
    const abort = () => request.abort();
    signal?.addEventListener("abort", abort, { once: true });
    const finish = (error?: Error) => {
      signal?.removeEventListener("abort", abort);
      if (error) reject(error);
      else resolve();
    };
    request.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.min(e.loaded, blob.size));
    };
    request.onload = () =>
      finish(
        request.status >= 200 &&
          request.status < 300 &&
          request.response?.Key === `${bucket}/${path}`
          ? undefined
          : new Error("Upload failed. Nothing was published. Please retry."),
      );
    request.onerror = () => finish(new Error("Upload failed. Check your connection and retry."));
    request.ontimeout = () =>
      finish(new Error("Upload timed out. Nothing was published. Please retry."));
    request.onabort = () =>
      finish(new Error("Upload cancelled. Temporary files will be cleaned up safely."));
    request.send(blob);
  });
}

export async function savePortfolio(
  meta: PortfolioMetadata,
  file?: File,
  existing?: PortfolioItem,
  progress: (n: number, text: string) => void = () => {},
  signal?: AbortSignal,
) {
  validateMetadata(meta);
  const db = getSupabase();
  const id = existing?.id ?? crypto.randomUUID();
  let assets: Partial<PortfolioItem> = {};
  if (file) {
    progress(0, "Optimizing image");
    const variants = await prepareImage(file);
    if (signal?.aborted) throw new Error("Upload cancelled.");
    const base = `${id}/${crypto.randomUUID()}`;
    const entries = [
      { bucket: "portfolio", path: `${base}/full.webp`, blob: variants.full },
      { bucket: "portfolio", path: `${base}/thumb.webp`, blob: variants.thumb },
      { bucket: "portfolio", path: `${base}/small.webp`, blob: variants.small },
      { bucket: "portfolio-originals", path: `${base}/original.${variants.extension}`, blob: file },
    ];
    // Durable recovery for interrupted tabs/uploads. A 24h grace period protects in-flight saves.
    const scheduled = await db.from("portfolio_cleanup").insert(
      entries.map((e) => ({
        bucket: e.bucket,
        path: e.path,
        created_at: new Date(Date.now() + 86400000).toISOString(),
      })),
    );
    if (scheduled.error) throw new Error("Could not start a safe upload. Please try again.");
    let sent = 0;
    const total = entries.reduce((sum, e) => sum + e.blob.size, 0);
    for (const entry of entries) {
      if (signal?.aborted)
        throw new Error("Upload cancelled. Temporary files will be cleaned up safely.");
      await uploadObject(
        entry.bucket,
        entry.path,
        entry.blob,
        (bytes) =>
          progress(
            Math.round(((sent + bytes) / total) * 95),
            "Uploading image and optimized previews",
          ),
        signal,
      );
      sent += entry.blob.size;
      progress(Math.round((sent / total) * 95), "Uploading image and optimized previews");
    }
    assets = {
      image_path: entries[0]!.path,
      thumb_path: entries[1]!.path,
      small_path: entries[2]!.path,
      original_path: entries[3]!.path,
      width: variants.width,
      height: variants.height,
      bytes: variants.full.size,
    };
  } else if (!existing) throw new Error("Choose an image first.");
  if (signal?.aborted) throw new Error("Upload cancelled. Nothing was published.");
  const row = {
    ...meta,
    title: meta.title.trim(),
    alt: meta.alt.trim(),
    category: meta.category.trim(),
    ...assets,
  };
  progress(95, "Saving project details");
  const result = existing
    ? await db
        .from("portfolio_items")
        .update(row)
        .eq("id", id)
        .eq("updated_at", existing.updated_at)
        .select()
        .single()
    : await db
        .from("portfolio_items")
        .insert({ id, ...row })
        .select()
        .single();
  if (result.error) {
    // A lost response may hide a successful commit. NEVER remove objects based on a network error.
    if (file) {
      const check = await db.from("portfolio_items").select("*").eq("id", id).maybeSingle();
      if (!check.error && check.data?.image_path === assets.image_path) {
        progress(100, "Saved");
        return check.data as PortfolioItem;
      }
    }
    throw new Error(
      "Could not confirm the save, or this item changed in another tab. Refresh before retrying. Temporary uploads are retained for safe recovery.",
    );
  }
  if (file)
    await db
      .from("portfolio_cleanup")
      .delete()
      .in("path", [
        assets.image_path!,
        assets.thumb_path!,
        assets.small_path!,
        assets.original_path!,
      ]);
  progress(100, "Saved");
  return result.data as PortfolioItem;
}

export async function deletePortfolio(item: PortfolioItem) {
  const { data, error } = await getSupabase()
    .from("portfolio_items")
    .delete()
    .eq("id", item.id)
    .eq("updated_at", item.updated_at)
    .select("id");
  if (error || !data?.length)
    throw new Error("Could not delete. The item may have changed; refresh and retry.");
}
export async function swapPortfolio(a: PortfolioItem, b: PortfolioItem) {
  const { error } = await getSupabase().rpc("swap_portfolio", {
    p_id: a.id,
    p_other: b.id,
    p_order: a.sort_order,
    p_other_order: b.sort_order,
  });
  if (error)
    throw new Error("The order changed in another tab, or the move failed. Refresh and retry.");
}
export async function cleanupPortfolio() {
  const db = getSupabase();
  const pending = await db
    .from("portfolio_cleanup")
    .select("bucket,path")
    .lte("created_at", new Date().toISOString())
    .limit(100);
  if (pending.error) throw new Error("Could not load pending storage cleanup.");
  for (const entry of pending.data ?? []) {
    // Storage RLS independently refuses deletion of objects still referenced by any item.
    const refs = await db
      .from("portfolio_items")
      .select("id")
      .or(
        `image_path.eq.${entry.path},thumb_path.eq.${entry.path},small_path.eq.${entry.path},original_path.eq.${entry.path}`,
      )
      .limit(1);
    if (refs.error) throw new Error("Could not verify storage references.");
    if (!refs.data?.length) {
      const removed = await db.storage.from(entry.bucket).remove([entry.path]);
      if (removed.error)
        throw new Error("Some unused files could not be removed. Use Retry storage cleanup.");
    }
    const removedQueue = await db
      .from("portfolio_cleanup")
      .delete()
      .eq("bucket", entry.bucket)
      .eq("path", entry.path);
    if (removedQueue.error) throw new Error("Storage cleanup will be retried.");
  }
}
