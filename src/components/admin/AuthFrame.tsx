import type { ReactNode } from "react";
import { Inbox, Lock, PenLine, Zap } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useAdminTheme } from "./useAdminTheme";

const chips = [
  { icon: PenLine, text: "Edit the homepage live", color: "#8b5cf6" },
  { icon: Zap, text: "Publish in one click", color: "#f59e0b" },
  { icon: Inbox, text: "Never miss an inquiry", color: "#ec4899" },
];

/** Animated aurora sign-in frame shared by sign-in, forgot-password and reset-password. */
export function AuthFrame({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  useAdminTheme();
  return (
    <div className="auth-aurora grid lg:grid-cols-[1.1fr_1fr]">
      <div className="auth-blob auth-blob-1" aria-hidden="true" />
      <div className="auth-blob auth-blob-2" aria-hidden="true" />
      <div className="auth-blob auth-blob-3" aria-hidden="true" />
      <div className="auth-blob auth-blob-4" aria-hidden="true" />

      <section className="hidden flex-col justify-between p-12 lg:flex">
        <p className="flex items-center gap-2.5 font-display text-lg font-bold">
          <span className="admin-gradient grid size-9 place-items-center rounded-xl text-sm shadow-md shadow-indigo-500/30">R</span>
          ReckoMEDIA
        </p>
        <div className="max-w-lg">
          <h2 className="font-display text-5xl font-bold leading-[1.05] tracking-tight">
            Run your website <span className="admin-gradient-text">from one calm place.</span>
          </h2>
          <p className="mt-5 max-w-md text-base text-muted-foreground">
            Edit content, manage services and answer every inquiry without touching code.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {chips.map(({ icon: Icon, text, color }) => (
              <span key={text} className="auth-chip">
                <span className="admin-tile size-6 rounded-lg" style={{ ["--tile" as string]: color }}><Icon className="size-3.5" aria-hidden="true" /></span>
                {text}
              </span>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Secure admin area · Protected by Supabase Auth</p>
      </section>

      <main className="grid place-items-center px-4 py-8 sm:px-8">
        <div className="auth-pop w-full max-w-[22rem]">
          <p className="mb-5 flex items-center justify-center gap-2 font-display text-base font-bold lg:hidden">
            <span className="admin-gradient grid size-8 place-items-center rounded-lg text-xs shadow-md shadow-indigo-500/30">R</span>
            ReckoMEDIA
          </p>
          <div className="auth-glass p-5 sm:p-7">
            <div className="mb-4 flex items-center gap-3">
              <span className="admin-gradient grid size-10 shrink-0 place-items-center rounded-xl shadow-md shadow-indigo-500/30">
                <Lock className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Admin studio</p>
                <h1 className="text-xl font-bold leading-tight">{title}</h1>
              </div>
            </div>
            <p className="mb-4 text-[13px] leading-snug text-muted-foreground">{subtitle}</p>
            {!isSupabaseConfigured() ? (
              <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
                Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to your environment.
              </p>
            ) : (
              children
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
