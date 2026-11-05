import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, IconContext } from "@phosphor-icons/react";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useAdminTheme } from "./useAdminTheme";

/** Dark, animated sign-in frame shared by sign-in, forgot-password and reset-password. */
export function AuthFrame({ title, children }: { title: string; subtitle?: string; children: ReactNode }) {
  useAdminTheme("dark");
  return (
    <IconContext.Provider value={{ weight: "duotone" }}>
      <div className="auth-dark">
        <div className="auth-grid" aria-hidden="true" />
        <div className="auth-glow auth-glow-blue" aria-hidden="true" />
        <div className="auth-glow auth-glow-violet" aria-hidden="true" />
        <div className="auth-glow auth-glow-lime" aria-hidden="true" />
        <div className="auth-orbits" aria-hidden="true">
          <span className="auth-ring auth-ring-1"><i /></span>
          <span className="auth-ring auth-ring-2"><i /></span>
          <span className="auth-ring auth-ring-3"><i /></span>
        </div>

        <main className="auth-center">
          <div className="auth-card auth-pop">
            <Link to="/" className="auth-logo" aria-label="Go to the ReckoMEDIA website">
              <BrandLogo variant="ink" />
            </Link>
            <h1 className="auth-title">{title}</h1>
            {!isSupabaseConfigured() ? (
              <p role="alert" className="rounded-lg border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200">
                Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to your environment.
              </p>
            ) : (
              children
            )}
          </div>
          <Link to="/" className="auth-back">
            <ArrowLeft aria-hidden="true" weight="bold" size={14} />
            Back to website
          </Link>
        </main>
      </div>
    </IconContext.Provider>
  );
}
