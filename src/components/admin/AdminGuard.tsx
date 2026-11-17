import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/admin/auth";
import { AdminShellSkeleton } from "./skeletons";

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
    return <AdminShellSkeleton />;
  }
  return <>{children}</>;
}
