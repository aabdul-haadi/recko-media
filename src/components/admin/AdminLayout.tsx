import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell, Briefcase, CheckSquare, ExternalLink, FileEdit, Inbox, LayoutDashboard, LogOut, MoreHorizontal, Search, Users,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "@/lib/admin/auth";
import { useAdminTheme } from "./useAdminTheme";
import { ConfirmProvider, useConfirm } from "./confirm";

const nav = [
  { to: "/admin", label: "Dashboard", short: "Home", icon: LayoutDashboard, tile: "#4f46e5", exact: true },
  { to: "/admin/inquiries", label: "Inquiries", short: "Inquiries", icon: Inbox, tile: "#ec4899" },
  { to: "/admin/homepage", label: "Homepage Editor", short: "Homepage", icon: FileEdit, tile: "#8b5cf6" },
  { to: "/admin/services", label: "Services", short: "Services", icon: Briefcase, tile: "#0ea5e9" },
  { to: "/admin/contacts", label: "Contacts", short: "Contacts", icon: Users, tile: "#10b981" },
  { to: "/admin/tasks", label: "Tasks & Follow-ups", short: "Tasks", icon: CheckSquare, tile: "#f59e0b" },
] as const;

function Brand() {
  return (
    <Link to="/admin" className="flex items-center gap-2.5">
      <span className="admin-gradient grid size-9 place-items-center rounded-xl text-sm font-bold shadow-md shadow-indigo-500/30">R</span>
      <span className="leading-tight">
        <span className="block font-display text-[15px] font-bold tracking-tight">ReckoMEDIA</span>
        <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Admin studio</span>
      </span>
    </Link>
  );
}

function NavLinks({ badge, onNavigate }: { badge: number; onNavigate?: () => void }) {
  return (
    <nav aria-label="Admin" className="space-y-1">
      {nav.map(({ to, label, icon: Icon, tile, ...rest }) => (
        <Link
          key={to}
          to={to}
          activeOptions={{ exact: "exact" in rest }}
          onClick={onNavigate}
          className="admin-nav-link"
        >
          <span className="admin-tile" style={{ ["--tile" as string]: tile }}><Icon className="size-4" aria-hidden="true" /></span>
          <span className="flex-1">{label}</span>
          {to === "/admin/inquiries" && badge > 0 && (
            <span className="grid min-w-5 place-items-center rounded-full bg-pink-500 px-1.5 text-[10px] font-bold text-white">{badge}</span>
          )}
        </Link>
      ))}
    </nav>
  );
}

/** Realtime table -> cached queries that must refresh when that table changes. */
const liveTables: Record<string, string[]> = {
  inquiries: ["inquiries", "dashboard", "contacts"],
  inquiry_notes: ["inquiries"],
  contacts: ["contacts", "dashboard", "inquiries"],
  tasks: ["tasks", "dashboard"],
  services: ["services"],
  content_drafts: ["content"],
  content_published: ["content"],
  activity_logs: ["dashboard", "inquiries"],
};

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <ConfirmProvider>
      <AdminFrame>{children}</AdminFrame>
    </ConfirmProvider>
  );
}

function AdminFrame({ children }: { children: ReactNode }) {
  useAdminTheme();
  const confirm = useConfirm();
  const [live, setLive] = useState(false);
  const { signOut, session } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");

  const newCount = useQuery({
    queryKey: ["inquiries", "new-count"],
    queryFn: async () => {
      const { count, error } = await getSupabase()
        .from("inquiries")
        .select("id", { count: "exact", head: true })
        .eq("status", "new")
        .eq("archived", false);
      if (error) throw error;
      return count ?? 0;
    },
  });
  const badge = newCount.data ?? 0;

  // One realtime channel for the whole admin: every table change refreshes the screens that show it.
  useEffect(() => {
    const supabase = getSupabase();
    const timers = new Map<string, ReturnType<typeof setTimeout>>();
    // Coalesce bursts of changes into one refetch per table.
    const refresh = (table: string) => {
      clearTimeout(timers.get(table));
      timers.set(table, setTimeout(() => {
        for (const key of liveTables[table] ?? []) queryClient.invalidateQueries({ queryKey: [key] });
      }, 250));
    };
    let channel = supabase.channel("admin-live");
    for (const table of Object.keys(liveTables)) {
      channel = channel.on("postgres_changes", { event: "*", schema: "public", table }, (payload) => {
        refresh(table);
        if (table === "inquiries" && payload.eventType === "INSERT") {
          const row = payload.new as { id: string; name: string; service: string | null };
          toast.success(`New inquiry from ${row.name}`, {
            description: row.service ?? undefined,
            action: { label: "Open", onClick: () => navigate({ to: "/admin/inquiries", search: { q: "", open: row.id } }) },
          });
        }
      });
    }
    channel.subscribe((status) => setLive(status === "SUBSCRIBED"));
    // Catch up after the connection or tab was asleep.
    const onVisible = () => document.visibilityState === "visible" && queryClient.invalidateQueries();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      timers.forEach(clearTimeout);
      supabase.removeChannel(channel);
    };
  }, [queryClient, navigate]);

  function onSearch(event: FormEvent) {
    event.preventDefault();
    navigate({ to: "/admin/inquiries", search: { q: search.trim(), open: "" } });
  }

  async function logout() {
    if (!(await confirm({ title: "Sign out?", description: "You will need to sign in again to manage the website.", confirmLabel: "Yes, sign out" }))) return;
    await signOut();
    queryClient.clear();
    navigate({ to: "/admin/login" });
  }

  const tabs = nav.slice(0, 4);

  return (
    <div className="admin-shell text-foreground">
      <Toaster richColors position="top-center" />

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-white/80 p-4 backdrop-blur lg:flex">
        <div className="mb-6 px-1 pt-1"><Brand /></div>
        <NavLinks badge={badge} />
        <div className="mt-auto space-y-2 pt-4">
          <a href="/" target="_blank" rel="noreferrer noopener" className="admin-nav-link">
            <span className="admin-tile"><ExternalLink className="size-4" aria-hidden="true" /></span>View website
          </a>
          <div className="admin-card flex items-center gap-2 p-2.5">
            <span className="admin-gradient grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold">{(session?.user.email ?? "A")[0]?.toUpperCase()}</span>
            <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{session?.user.email}</span>
            <Button variant="ghost" size="icon" className="size-8" aria-label="Sign out" onClick={logout}><LogOut className="size-4" /></Button>
          </div>
        </div>
      </aside>

      {/* Mobile "more" sheet */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl px-4 pb-8">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SheetDescription className="sr-only">All admin sections</SheetDescription>
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
          <NavLinks badge={badge} onNavigate={() => setMenuOpen(false)} />
          <a href="/" target="_blank" rel="noreferrer noopener" className="admin-nav-link mt-1">
            <span className="admin-tile"><ExternalLink className="size-4" /></span>View website
          </a>
          <Button variant="outline" className="mt-3 w-full justify-start gap-2" onClick={logout}><LogOut className="size-4" />Sign out</Button>
        </SheetContent>
      </Sheet>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border bg-white/80 px-3 backdrop-blur sm:px-5 lg:px-8">
          <div className="lg:hidden"><Brand /></div>
          <form onSubmit={onSearch} className="relative ml-auto hidden w-full max-w-sm sm:block lg:ml-0" role="search">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search inquiries…" className="h-9 rounded-full bg-muted/60 pl-9" aria-label="Search inquiries" />
          </form>
          <span className="ml-auto hidden items-center gap-1.5 text-[11px] font-medium text-muted-foreground sm:flex" role="status" aria-live="polite">
            <span className={"size-2 rounded-full " + (live ? "bg-emerald-500 shadow-[0_0_0_3px_rgb(16_185_129/0.2)]" : "bg-amber-400")} aria-hidden="true" />
            {live ? "Live" : "Connecting…"}
          </span>
          <Link
            to="/admin/inquiries"
            search={{ q: "", open: "" }}
            className="relative ml-auto grid size-9 place-items-center rounded-full border border-border bg-white hover:bg-muted sm:ml-0"
            aria-label={`Notifications: ${badge} new inquiries`}
          >
            <Bell className="size-4" aria-hidden="true" />
            {badge > 0 && <span className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-pink-500 px-1 text-[10px] font-bold text-white">{badge}</span>}
          </Link>
        </header>

        <main className="admin-rise mx-auto max-w-7xl px-3 pb-24 pt-4 sm:px-5 sm:pt-6 lg:px-8 lg:pb-10">{children}</main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="admin-tabbar lg:hidden" aria-label="Admin quick navigation">
        {tabs.map(({ to, short, icon: Icon, tile, ...rest }) => (
          <Link key={to} to={to} activeOptions={{ exact: "exact" in rest }} className="admin-tab" style={{ ["--tile" as string]: tile }}>
            <span className="admin-tab-icon relative">
              <Icon className="size-5" aria-hidden="true" />
              {to === "/admin/inquiries" && badge > 0 && <span className="absolute -right-2 -top-1 size-2 rounded-full bg-pink-500" />}
            </span>
            {short}
          </Link>
        ))}
        <button type="button" className="admin-tab" style={{ ["--tile" as string]: "#64748b" }} onClick={() => setMenuOpen(true)} aria-label="More">
          <span className="admin-tab-icon"><MoreHorizontal className="size-5" aria-hidden="true" /></span>More
        </button>
      </nav>
    </div>
  );
}
