import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "@phosphor-icons/react";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useAdminTheme } from "./useAdminTheme";

/** Clean, borderless frame shared by sign-in, forgot-password and reset-password. */
export function AuthFrame({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  useAdminTheme("dark");
  return (
    <div className="auth-dark">
      <main className="auth-center">
        <div className="auth-card auth-pop">
          <Link to="/" className="auth-logo" aria-label="Go to the ReckoMEDIA website">
            <BrandLogo variant="ink" />
          </Link>
          <h1 className="auth-title">{title}</h1>
          {subtitle && <p className="auth-subtitle">{subtitle}</p>}
          {!isSupabaseConfigured() ? (
            <p role="alert" className="rounded-xl bg-red-500/10 p-4 text-sm text-red-200">
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
  );
}
