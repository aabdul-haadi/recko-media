import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  SERVICE_COLUMNS,
  contentDefaults,
  defaultServices,
  type PublicService,
  type SectionData,
} from "./schema";

export type Section = { data: SectionData; enabled: boolean };
export type SiteContent = {
  sections: Record<string, Section>;
  services: PublicService[];
  /** True when showing unpublished drafts to a signed-in admin. */
  preview: boolean;
};

const FETCH_TIMEOUT_MS = 4000;

export function buildContent(
  rows: { key: string; data: SectionData; enabled: boolean }[],
  services: PublicService[] | null,
  preview = false,
): SiteContent {
  const sections: Record<string, Section> = {};
  for (const [key, defaults] of Object.entries(contentDefaults)) {
    const row = rows.find((r) => r.key === key);
    sections[key] = {
      data: row && row.data && typeof row.data === "object" ? { ...defaults, ...row.data } : defaults,
      enabled: row ? row.enabled : true,
    };
  }
  return { sections, services: services && services.length > 0 ? services : services === null ? defaultServices : [], preview };
}

export const fallbackContent: SiteContent = buildContent([], null);

function withTimeout<T>(promise: PromiseLike<T>): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timeout")), FETCH_TIMEOUT_MS)),
  ]);
}

/** Reads ONLY published rows (anonymous access). Falls back to built-in copy if anything fails. */
export async function fetchPublishedContent(): Promise<SiteContent> {
  if (!isSupabaseConfigured()) return fallbackContent;
  try {
    const supabase = getSupabase();
    const [content, services] = await withTimeout(
      Promise.all([
        supabase.from("content_published").select("key,data,enabled"),
        supabase.from("services").select(SERVICE_COLUMNS).eq("status", "published").order("sort_order"),
      ]),
    );
    if (content.error || services.error) return fallbackContent;
    return buildContent(content.data as never, services.data as PublicService[]);
  } catch {
    return fallbackContent;
  }
}

/** Admin preview: drafts and unpublished services. Row Level Security returns nothing for non-admins. */
export async function fetchDraftContent(): Promise<SiteContent | null> {
  const supabase = getSupabase();
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) return null;
  const [content, services] = await Promise.all([
    supabase.from("content_drafts").select("key,data,enabled"),
    supabase.from("services").select(SERVICE_COLUMNS).order("sort_order"),
  ]);
  if (content.error || services.error) return null;
  // Sections without a draft fall back to their published version, then to defaults.
  const published = await supabase.from("content_published").select("key,data,enabled");
  const rows = [...(published.data ?? []), ...(content.data ?? [])] as { key: string; data: SectionData; enabled: boolean }[];
  const merged = Object.values(Object.fromEntries(rows.map((r) => [r.key, r])));
  return buildContent(merged, services.data as PublicService[], true);
}

const ContentContext = createContext<SiteContent>(fallbackContent);

export function ContentProvider({ value, children }: { value: SiteContent; children: ReactNode }) {
  const [override, setOverride] = useState<SiteContent | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    if (new URLSearchParams(window.location.search).get("preview") !== "draft") return;
    let active = true;
    fetchDraftContent().then((draft) => active && draft && setOverride(draft));
    return () => {
      active = false;
    };
  }, []);

  // Live updates: when the admin publishes, open visitor tabs pick it up without a reload.
  const [live, setLive] = useState<SiteContent | null>(null);
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    if (new URLSearchParams(window.location.search).get("preview") === "draft") return;
    const supabase = getSupabase();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refetch = () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        const fresh = await fetchPublishedContent();
        if (fresh !== fallbackContent) setLive(fresh); // keep what is shown if the refetch failed
      }, 400);
    };
    const channel = supabase
      .channel("site-content")
      .on("postgres_changes", { event: "*", schema: "public", table: "content_published" }, refetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "services" }, refetch)
      .subscribe();
    return () => {
      clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, []);

  const current = override ?? live ?? value;
  return (
    <ContentContext.Provider value={current}>
      {current.preview && (
        <div role="status" className="fixed inset-x-0 bottom-0 z-[100] bg-amber-400 px-4 py-2 text-center text-sm font-medium text-black">
          Preview mode: you are seeing unpublished drafts. Visitors still see the published site.
        </div>
      )}
      {children}
    </ContentContext.Provider>
  );
}

export function useSiteContent() {
  return useContext(ContentContext);
}

/** Typed-loosely access to one section's content (published, or draft in preview mode). */
export function useSection(key: string): { data: Record<string, any>; enabled: boolean } {
  const section = useContext(ContentContext).sections[key] ?? { data: contentDefaults[key] ?? {}, enabled: true };
  return section as { data: Record<string, any>; enabled: boolean };
}

export function useServices(): PublicService[] {
  return useContext(ContentContext).services;
}

/** Only allow safe link targets coming from the database. */
export function safeUrl(value: unknown, fallback = "#") {
  const url = typeof value === "string" ? value.trim() : "";
  return /^(\/|#|https?:\/\/|mailto:|tel:)/i.test(url) ? url : fallback;
}
