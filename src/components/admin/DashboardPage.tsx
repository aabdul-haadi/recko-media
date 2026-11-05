import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowUpRight, CheckCircle as CheckCircle2, CheckSquare, Tray as Inbox, CircleNotch as Loader2, ChatCircleDots as MessageSquareReply, Sparkle as Sparkles, UsersThree as Users } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getSupabase } from "@/lib/supabase";
import type { ActivityLog, Inquiry, Task } from "@/lib/admin/types";
import { INQUIRY_STATUSES, statusLabel } from "@/lib/admin/types";
import { EmptyState, ErrorState, StatusBadge, formatDate, formatDateTime } from "./shared";

async function countWhere(table: string, filter?: (q: any) => any) {
  let query = getSupabase().from(table).select("id", { count: "exact", head: true });
  if (filter) query = filter(query);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

const actionText: Record<string, string> = {
  created: "New inquiry received",
  status_changed: "Status changed",
  priority_changed: "Priority changed",
  archived: "Inquiry archived",
  unarchived: "Inquiry restored",
  follow_up_set: "Follow-up scheduled",
  note_added: "Note added",
};

export function DashboardPage() {
  const [range, setRange] = useState("30");

  const stats = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: async () => {
      const [total, contacts, ...byStatus] = await Promise.all([
        countWhere("inquiries", (q) => q.eq("archived", false).eq("spam", false)),
        countWhere("contacts"),
        ...INQUIRY_STATUSES.map((s) => countWhere("inquiries", (q) => q.eq("archived", false).eq("spam", false).eq("status", s))),
      ]);
      return { total, contacts, byStatus: Object.fromEntries(INQUIRY_STATUSES.map((s, i) => [s, byStatus[i]!])) };
    },
  });

  const chart = useQuery({
    queryKey: ["dashboard", "chart", range],
    queryFn: async () => {
      const days = Number(range);
      const since = new Date(Date.now() - days * 86_400_000);
      since.setHours(0, 0, 0, 0);
      const { data, error } = await getSupabase()
        .from("inquiries")
        .select("created_at")
        .eq("spam", false)
        .gte("created_at", since.toISOString())
        .limit(5000);
      if (error) throw error;
      const buckets = new Map<string, number>();
      for (let i = 0; i < days; i++) {
        const d = new Date(since.getTime() + i * 86_400_000);
        buckets.set(d.toISOString().slice(0, 10), 0);
      }
      for (const row of data ?? []) {
        const key = new Date(row.created_at as string).toISOString().slice(0, 10);
        if (buckets.has(key)) buckets.set(key, buckets.get(key)! + 1);
      }
      return [...buckets].map(([date, inquiries]) => ({ date: date.slice(5), inquiries }));
    },
  });

  const recent = useQuery({
    queryKey: ["dashboard", "recent"],
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from("inquiries")
        .select("*")
        .eq("archived", false)
        .eq("spam", false)
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data as Inquiry[];
    },
  });

  const activity = useQuery({
    queryKey: ["dashboard", "activity"],
    queryFn: async () => {
      const { data, error } = await getSupabase().from("activity_logs").select("*").order("created_at", { ascending: false }).limit(8);
      if (error) throw error;
      return data as ActivityLog[];
    },
  });

  const followUps = useQuery({
    queryKey: ["dashboard", "tasks"],
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from("tasks")
        .select("*")
        .eq("status", "pending")
        .order("due_at", { ascending: true, nullsFirst: false })
        .limit(5);
      if (error) throw error;
      return data as Task[];
    },
  });

  const statIcon = { new: Sparkles, in_progress: Loader2, responded: MessageSquareReply, closed: CheckCircle2 } as const;
  const statColor = { new: "#ec4899", in_progress: "#f59e0b", responded: "#10b981", closed: "#64748b" } as const;
  const cards = [
    { label: "Total inquiries", value: stats.data?.total, icon: Inbox, color: "#4f46e5" },
    ...INQUIRY_STATUSES.map((st) => ({ label: statusLabel[st], value: stats.data?.byStatus[st], icon: statIcon[st], color: statColor[st] })),
    { label: "Contacts", value: stats.data?.contacts, icon: Users, color: "#0ea5e9" },
  ];
  const newCount = stats.data?.byStatus["new"] ?? 0;

  return (
    <>
      <section className="admin-gradient relative mb-4 overflow-hidden rounded-2xl p-4 shadow-lg shadow-indigo-500/20 sm:mb-6 sm:p-6">
        <div className="absolute -right-10 -top-10 size-44 rounded-full bg-white/15 blur-2xl" aria-hidden="true" />
        <p className="relative text-xs font-medium text-white/80">
          {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        </p>
        <h1 className="relative mt-1 font-display text-xl font-bold sm:text-2xl">
          {!stats.data ? "Welcome back" : newCount > 0 ? `You have ${newCount} new ${newCount === 1 ? "inquiry" : "inquiries"}` : "You are all caught up"}
        </h1>
        <div className="relative mt-4 flex flex-wrap gap-2">
          <Button asChild size="sm" className="bg-white text-indigo-700 hover:bg-white/90"><Link to="/admin/inquiries" search={{ q: "", open: "" }}><Inbox className="mr-2 size-4" />Inquiries</Link></Button>
          <Button asChild size="sm" variant="secondary" className="border-0 bg-white/20 text-white hover:bg-white/30"><Link to="/admin/homepage"><Sparkles className="mr-2 size-4" />Edit homepage</Link></Button>
          <Button asChild size="sm" variant="secondary" className="border-0 bg-white/20 text-white hover:bg-white/30"><Link to="/admin/tasks"><CheckSquare className="mr-2 size-4" />Add follow-up</Link></Button>
        </div>
      </section>

      {stats.error && <ErrorState error={stats.error} />}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 xl:grid-cols-6">
        {cards.map((card) => (
          <div key={card.label} className="admin-card admin-card-hover flex items-center gap-3 p-3">
            <span className="admin-tile size-9" style={{ ["--tile" as string]: card.color }}><card.icon className="size-4" aria-hidden="true" /></span>
            <div className="min-w-0">
              <p className="truncate text-[11px] text-muted-foreground">{card.label}</p>
              <p className="text-xl font-bold leading-tight tabular-nums">{card.value ?? "…"}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 sm:mt-6 sm:gap-6 xl:grid-cols-[1.6fr_1fr]">
        <section className="admin-card p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Inquiries over time</h2>
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="h-8 w-32 text-xs" aria-label="Date range"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {chart.error ? <ErrorState error={chart.error} /> : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart.data ?? []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
                  <Tooltip />
                  <Bar dataKey="inquiries" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="admin-card p-4 sm:p-5">
          <h2 className="mb-3 text-sm font-semibold">Pending follow-ups</h2>
          {followUps.error ? <ErrorState error={followUps.error} /> : followUps.data?.length === 0 ? (
            <EmptyState title="Nothing pending" hint="Tasks you create appear here." />
          ) : (
            <ul className="space-y-3">
              {followUps.data?.map((task) => {
                const overdue = task.due_at && new Date(task.due_at) < new Date();
                return (
                  <li key={task.id} className="flex items-start justify-between gap-3 text-sm">
                    <span>{task.title}</span>
                    <span className={overdue ? "shrink-0 text-red-600" : "shrink-0 text-muted-foreground"}>
                      {overdue ? "Overdue · " : ""}{formatDate(task.due_at)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <div className="mt-4 grid gap-4 sm:mt-6 sm:gap-6 xl:grid-cols-2">
        <section className="admin-card p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent inquiries</h2>
            <Link to="/admin/inquiries" search={{ q: "", open: "" }} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">View all <ArrowUpRight className="size-3.5" /></Link>
          </div>
          {recent.error ? <ErrorState error={recent.error} /> : recent.data?.length === 0 ? (
            <EmptyState title="No inquiries yet" hint="Submissions from the website contact form appear here." />
          ) : (
            <ul className="divide-y divide-border">
              {recent.data?.map((inq) => (
                <li key={inq.id}>
                  <Link to="/admin/inquiries" search={{ q: "", open: inq.id }} className="flex items-center justify-between gap-3 py-3 hover:bg-muted/50">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{inq.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{inq.service ?? inq.email} · {formatDateTime(inq.created_at)}</span>
                    </span>
                    <StatusBadge status={inq.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="admin-card p-4 sm:p-5">
          <h2 className="mb-3 text-sm font-semibold">Recent activity</h2>
          {activity.error ? <ErrorState error={activity.error} /> : activity.data?.length === 0 ? (
            <EmptyState title="No activity yet" />
          ) : (
            <ul className="space-y-3 text-sm">
              {activity.data?.map((log) => (
                <li key={log.id} className="flex justify-between gap-3">
                  <span>
                    {actionText[log.action] ?? log.action}
                    {log.action === "status_changed" && <span className="text-muted-foreground"> → {statusLabel[log.details["to"] as keyof typeof statusLabel] ?? String(log.details["to"])}</span>}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatDateTime(log.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
