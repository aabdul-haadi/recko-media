import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckSquare, Inbox, LayoutDashboard, LogOut, Menu, Search, Users } from "lucide-react";
import { Toaster, toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "@/lib/admin/auth";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/inquiries", label: "Inquiries", icon: Inbox },
  { to: "/admin/contacts", label: "Contacts", icon: Users },
  { to: "/admin/tasks", label: "Tasks & Follow-ups", icon: CheckSquare },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Admin" className="space-y-1">
      {nav.map(({ to, label, icon: Icon, ...rest }) => (
        <Link
          key={to}
          to={to}
          activeOptions={{ exact: "exact" in rest }}
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          activeProps={{ className: "bg-muted text-foreground font-medium" }}
        >
          <Icon className="size-4" aria-hidden="true" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function AdminLayout({ children }: { children: ReactNode }) {
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

  // One realtime subscription for the whole admin: notify on new inquiries and refresh data.
  useEffect(() => {
    const supabase = getSupabase();
    const channel = supabase
      .channel("admin-inquiries")
      .on("postgres_changes", { event: "*", schema: "public", table: "inquiries" }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ["inquiries"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        queryClient.invalidateQueries({ queryKey: ["contacts"] });
        if (payload.eventType === "INSERT") {
          const row = payload.new as { id: string; name: string; service: string | null };
          toast.success(`New inquiry from ${row.name}`, {
            description: row.service ?? undefined,
            action: { label: "Open", onClick: () => navigate({ to: "/admin/inquiries", search: { q: "", open: row.id } }) },
          });
        }
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, navigate]);

  function onSearch(event: FormEvent) {
    event.preventDefault();
    navigate({ to: "/admin/inquiries", search: { q: search.trim(), open: "" } });
  }

  async function logout() {
    await signOut();
    queryClient.clear();
    navigate({ to: "/admin/login" });
  }

  return (
    <div className="min-h-screen bg-muted/30 text-foreground">
      <Toaster richColors position="top-right" />
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-background p-4 lg:flex">
        <Link to="/admin" className="mb-8 px-3 pt-2 text-lg font-semibold tracking-tight">
          Recko<span className="text-muted-foreground">MEDIA</span> <span className="text-xs font-normal text-muted-foreground">Admin</span>
        </Link>
        <NavLinks />
        <div className="mt-auto space-y-2 border-t border-border pt-4">
          <p className="truncate px-3 text-xs text-muted-foreground">{session?.user.email}</p>
          <Button variant="ghost" className="w-full justify-start gap-3" onClick={logout}>
            <LogOut className="size-4" aria-hidden="true" /> Sign out
          </Button>
        </div>
      </aside>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-64 p-4">
          <SheetTitle className="mb-6 px-3 text-lg">ReckoMEDIA Admin</SheetTitle>
          <NavLinks onNavigate={() => setMenuOpen(false)} />
          <Button variant="ghost" className="mt-6 w-full justify-start gap-3" onClick={logout}>
            <LogOut className="size-4" aria-hidden="true" /> Sign out
          </Button>
        </SheetContent>
      </Sheet>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur md:px-8">
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
            <Menu className="size-5" />
          </Button>
          <form onSubmit={onSearch} className="relative max-w-md flex-1" role="search">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search inquiries…" className="pl-9" aria-label="Search inquiries" />
          </form>
          <Link
            to="/admin/inquiries"
            search={{ q: "", open: "" }}
            className={cn("relative ml-auto grid size-10 place-items-center rounded-full border border-border hover:bg-muted")}
            aria-label={`Notifications: ${newCount.data ?? 0} new inquiries`}
          >
            <Bell className="size-4" aria-hidden="true" />
            {(newCount.data ?? 0) > 0 && (
              <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
                {newCount.data}
              </span>
            )}
          </Link>
        </header>
        <main className="mx-auto max-w-7xl p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
