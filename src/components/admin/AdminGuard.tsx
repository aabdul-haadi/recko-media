import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CircleNotch as Loader2 } from "@phosphor-icons/react";
import { useAuth } from "@/lib/admin/auth";

/** Client-side convenience guard. Real protection is Row Level Security in the database. */
export function AdminGuard({ children }: { children: ReactNode }) {
  const { loading, session, isAdmin, configured } = useAuth();
  const navigate = useNavigate();
  const allowed = Boolean(session && isAdmin);

  useEffect(() => {
    if (!loading && !allowed) navigate({ to: "/admin/login" });
  }, [loading, allowed, navigate]);

  if (!configured) {
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center text-sm">
        Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.
      </div>
    );
  }
  if (loading || !allowed) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Loading" />
      </div>
    );
  }
  return <>{children}</>;
}
