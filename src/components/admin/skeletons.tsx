import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAdminTheme } from "./useAdminTheme";

/**
 * Loading placeholders for the admin. Each one is announced once to assistive technology ("Loading contacts")
 * while the grey shapes themselves are hidden from it; the pulse stops for people who prefer reduced motion.
 */
function Busy({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">{label}</span>
      {/* the layout classes sit on the element that holds the shapes, so spacing and dividers apply to them */}
      <div aria-hidden="true" className={className}>
        {children}
      </div>
    </div>
  );
}

const widths = ["w-2/5", "w-1/2", "w-1/3", "w-3/5", "w-2/5", "w-1/2"];
const subWidths = ["w-3/5", "w-2/5", "w-1/2", "w-1/3", "w-3/5", "w-2/5"];

function Rows({ rows }: { rows: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
          <Skeleton className="size-9 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className={cn("h-4", widths[i % widths.length])} />
            <Skeleton className={cn("h-3", subWidths[i % subWidths.length])} />
          </div>
          <Skeleton className="hidden h-6 w-16 shrink-0 rounded-full sm:block" />
        </div>
      ))}
    </>
  );
}

/** Rows of a list or table (inquiries, contacts, tasks, recent items). */
export function ListSkeleton({ label, rows = 6, card = true }: { label: string; rows?: number; card?: boolean }) {
  return (
    <Busy label={label} className={cn(card && "admin-card", "divide-y divide-border")}>
      <Rows rows={rows} />
    </Busy>
  );
}

/** Services grouped by category. */
export function ServicesSkeleton() {
  return (
    <Busy label="Loading services">
      {[3, 3, 3].map((rows, group) => (
        <section key={group} className="mb-8">
          <Skeleton className="mb-3 h-3 w-40" />
          <div className="admin-card divide-y divide-border">
            <Rows rows={rows} />
          </div>
        </section>
      ))}
    </Busy>
  );
}

/** A form made of labelled boxes (the page editor). */
export function FormSkeleton({ label, fields = 5 }: { label: string; fields?: number }) {
  return (
    <Busy label={label} className="space-y-5">
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className={cn("w-full", i % 3 === 2 ? "h-20" : "h-9")} />
        </div>
      ))}
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-24" />
      </div>
    </Busy>
  );
}

/** The chart area on the dashboard. */
export function ChartSkeleton({ label }: { label: string }) {
  return (
    <Busy label={label} className="flex h-64 items-end gap-2 px-2 pb-6">
      {[40, 65, 30, 80, 55, 70, 45, 90, 35, 60, 50, 75].map((h, i) => (
        <Skeleton key={i} className="flex-1 rounded-b-none" style={{ height: `${h}%` }} />
      ))}
    </Busy>
  );
}

/** Two fields and a button, in the shape of the sign-in forms (used while a reset link is being checked). */
export function AuthFormSkeleton() {
  return (
    <Busy label="Loading" className="space-y-4">
      <Skeleton className="h-12 w-full rounded-xl bg-white/10" />
      <Skeleton className="h-12 w-full rounded-xl bg-white/10" />
      <Skeleton className="h-12 w-full rounded-xl bg-white/10" />
    </Busy>
  );
}

/** Stands in for the whole admin (menu, header and content) while the sign-in is being checked. */
export function AdminShellSkeleton() {
  useAdminTheme(); // the same bright theme the finished page uses, so nothing flashes dark
  return (
    <Busy label="Loading the admin" className="flex min-h-screen bg-background">
      <aside className="hidden w-60 shrink-0 space-y-3 border-r border-border bg-white p-5 lg:block">
        <Skeleton className="mb-6 h-9 w-36" />
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </aside>
      <div className="min-w-0 flex-1">
        <div className="flex h-14 items-center justify-between border-b border-border bg-white px-4 sm:px-6">
          <Skeleton className="h-8 w-48 sm:w-72" />
          <Skeleton className="size-8 rounded-full" />
        </div>
        <div className="mx-auto max-w-7xl space-y-5 px-3 py-6 sm:px-5 lg:px-8">
          <Skeleton className="h-8 w-56" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
          <div className="admin-card divide-y divide-border">
            <Rows rows={4} />
          </div>
        </div>
      </div>
    </Busy>
  );
}
