import { useEffect, useState } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Archive, ArchiveRestore, Download, ExternalLink, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getSupabase } from "@/lib/supabase";
import type { ActivityLog, Inquiry, InquiryNote } from "@/lib/admin/types";
import { INQUIRY_PRIORITIES, INQUIRY_STATUSES, statusLabel } from "@/lib/admin/types";
import {
  EmptyState, ErrorState, PAGE_SIZE, Pager, PageHeader, PriorityText, StatusBadge,
  downloadCsv, formatDateTime, fromLocalInput, toLocalInput,
} from "./shared";

type Filters = { status: string; service: string; source: string; from: string; to: string; archived: boolean };
const ALL = "all";

function applyFilters(query: any, q: string, f: Filters) {
  query = query.eq("archived", f.archived);
  if (f.status !== ALL) query = query.eq("status", f.status);
  if (f.service !== ALL) query = query.eq("service", f.service);
  if (f.source !== ALL) query = query.eq("source", f.source);
  if (f.from) query = query.gte("created_at", new Date(f.from).toISOString());
  if (f.to) query = query.lte("created_at", new Date(`${f.to}T23:59:59`).toISOString());
  const term = q.trim().replace(/[%,()]/g, " ");
  if (term) {
    const like = `%${term}%`;
    query = query.or(`name.ilike.${like},email.ilike.${like},message.ilike.${like},subject.ilike.${like},phone.ilike.${like}`);
  }
  return query;
}

export function InquiriesPage() {
  const search = useSearch({ from: "/admin/inquiries" });
  const navigate = useNavigate();
  const [q, setQ] = useState(search.q);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<Filters>({ status: ALL, service: ALL, source: ALL, from: "", to: "", archived: false });

  useEffect(() => { setQ(search.q); setPage(0); }, [search.q]);

  const options = useQuery({
    queryKey: ["inquiries", "options"],
    queryFn: async () => {
      const { data, error } = await getSupabase().from("inquiries").select("service,source").limit(5000);
      if (error) throw error;
      const uniq = (key: "service" | "source") => [...new Set((data ?? []).map((r) => r[key]).filter(Boolean) as string[])].sort();
      return { services: uniq("service"), sources: uniq("source") };
    },
  });

  const list = useQuery({
    queryKey: ["inquiries", "list", q, filters, page],
    queryFn: async () => {
      const base = getSupabase().from("inquiries").select("*", { count: "exact" });
      const { data, error, count } = await applyFilters(base, q, filters)
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
      if (error) throw error;
      return { rows: data as Inquiry[], total: count ?? 0 };
    },
    placeholderData: (previous) => previous,
  });

  async function exportCsv() {
    const { data, error } = await applyFilters(getSupabase().from("inquiries").select("*"), q, filters)
      .order("created_at", { ascending: false })
      .limit(10000);
    if (error) {
      toast.error("Export failed. Please try again.");
      return;
    }
    const rows = (data as Inquiry[]).map((i) => [i.created_at, i.name, i.email, i.phone, i.company, i.subject, i.service, i.source, i.page_url, i.status, i.priority, i.follow_up_at, i.message]);
    downloadCsv(`inquiries-${new Date().toISOString().slice(0, 10)}.csv`, [
      ["Created", "Name", "Email", "Phone", "Company", "Subject", "Service", "Source", "Page URL", "Status", "Priority", "Follow-up", "Message"],
      ...rows,
    ]);
    toast.success(`Exported ${rows.length} inquiries`);
  }

  const set = (patch: Partial<Filters>) => { setFilters((f) => ({ ...f, ...patch })); setPage(0); };

  return (
    <>
      <PageHeader
        title="Inquiries"
        description="Every submission from the website contact forms."
        actions={<Button variant="outline" size="sm" onClick={exportCsv}><Download className="mr-2 size-4" />Export CSV</Button>}
      />

      <div className="mb-4 grid gap-3 rounded-xl border border-border bg-background p-4 md:grid-cols-3 xl:grid-cols-7">
        <Input className="xl:col-span-2" value={q} placeholder="Search name, email, message…" aria-label="Search inquiries" onChange={(e) => { setQ(e.target.value); setPage(0); }} />
        <FilterSelect label="Status" value={filters.status} onChange={(v) => set({ status: v })} items={INQUIRY_STATUSES.map((s) => [s, statusLabel[s]])} />
        <FilterSelect label="Service" value={filters.service} onChange={(v) => set({ service: v })} items={(options.data?.services ?? []).map((s) => [s, s])} />
        <FilterSelect label="Source" value={filters.source} onChange={(v) => set({ source: v })} items={(options.data?.sources ?? []).map((s) => [s, s])} />
        <Input type="date" aria-label="From date" value={filters.from} onChange={(e) => set({ from: e.target.value })} />
        <Input type="date" aria-label="To date" value={filters.to} onChange={(e) => set({ to: e.target.value })} />
        <div className="flex items-center gap-2 md:col-span-3 xl:col-span-7">
          <Button variant={filters.archived ? "default" : "outline"} size="sm" onClick={() => set({ archived: !filters.archived })}>
            <Archive className="mr-2 size-4" />{filters.archived ? "Showing archived" : "Show archived"}
          </Button>
        </div>
      </div>

      {list.error ? <ErrorState error={list.error} /> : list.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading inquiries…</p>
      ) : list.data && list.data.rows.length === 0 ? (
        <EmptyState title="No inquiries found" hint="Try clearing your filters. New website submissions appear here automatically." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Received</TableHead><TableHead>Name</TableHead><TableHead>Service</TableHead>
                <TableHead>Status</TableHead><TableHead>Priority</TableHead><TableHead>Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.data?.rows.map((inq) => (
                <TableRow key={inq.id} className="cursor-pointer" onClick={() => navigate({ to: "/admin/inquiries", search: { q: search.q, open: inq.id } })}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{formatDateTime(inq.created_at)}</TableCell>
                  <TableCell>
                    <button type="button" className="text-left font-medium hover:underline">{inq.name}</button>
                    <div className="text-xs text-muted-foreground">{inq.email}</div>
                  </TableCell>
                  <TableCell>{inq.service ?? "—"}</TableCell>
                  <TableCell><StatusBadge status={inq.status} /></TableCell>
                  <TableCell><PriorityText priority={inq.priority} /></TableCell>
                  <TableCell className="text-muted-foreground">{inq.source}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <Pager page={page} total={list.data?.total ?? 0} onPage={setPage} />

      <InquiryDetail id={search.open} onClose={() => navigate({ to: "/admin/inquiries", search: { q: search.q, open: "" } })} />
    </>
  );
}

function FilterSelect({ label, value, onChange, items }: { label: string; value: string; onChange: (v: string) => void; items: string[][] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label}><SelectValue placeholder={label} /></SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>All {label.toLowerCase()}s</SelectItem>
        {items.map(([v, l]) => <SelectItem key={v} value={v!}>{l}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function InquiryDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");

  const inquiry = useQuery({
    queryKey: ["inquiries", "detail", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await getSupabase().from("inquiries").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data as Inquiry | null;
    },
  });
  const notes = useQuery({
    queryKey: ["inquiries", "notes", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await getSupabase().from("inquiry_notes").select("*").eq("inquiry_id", id).order("created_at", { ascending: false });
      if (error) throw error;
      return data as InquiryNote[];
    },
  });
  const history = useQuery({
    queryKey: ["inquiries", "history", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await getSupabase().from("activity_logs").select("*").eq("entity_type", "inquiry").eq("entity_id", id).order("created_at", { ascending: false });
      if (error) throw error;
      return data as ActivityLog[];
    },
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["inquiries"] }).then(() => queryClient.invalidateQueries({ queryKey: ["dashboard"] }));

  const update = useMutation({
    mutationFn: async (patch: Partial<Inquiry>) => {
      const { error } = await getSupabase().from("inquiries").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Inquiry updated"); refresh(); },
    onError: () => toast.error("Could not update the inquiry"),
  });
  const addNote = useMutation({
    mutationFn: async () => {
      const { error } = await getSupabase().from("inquiry_notes").insert({ inquiry_id: id, body: note.trim() });
      if (error) throw error;
    },
    onSuccess: () => { setNote(""); toast.success("Note added"); refresh(); },
    onError: () => toast.error("Could not add the note"),
  });
  const addTask = useMutation({
    mutationFn: async () => {
      const row = inquiry.data!;
      const { error } = await getSupabase().from("tasks").insert({
        title: taskTitle.trim(), inquiry_id: id, contact_id: row.contact_id, due_at: row.follow_up_at,
      });
      if (error) throw error;
    },
    onSuccess: () => { setTaskTitle(""); toast.success("Follow-up task created"); queryClient.invalidateQueries({ queryKey: ["tasks"] }); queryClient.invalidateQueries({ queryKey: ["dashboard"] }); },
    onError: () => toast.error("Could not create the task"),
  });
  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await getSupabase().from("inquiries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Inquiry deleted"); setConfirmDelete(false); onClose(); refresh(); },
    onError: () => toast.error("Could not delete the inquiry"),
  });

  const inq = inquiry.data;
  return (
    <Sheet open={Boolean(id)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{inq?.name ?? "Inquiry"}</SheetTitle>
          <SheetDescription>{inq ? `Received ${formatDateTime(inq.created_at)}` : "Loading…"}</SheetDescription>
        </SheetHeader>
        {inquiry.error && <ErrorState error={inquiry.error} />}
        {inquiry.data === null && <p className="mt-4 text-sm">This inquiry no longer exists.</p>}
        {inq && (
          <div className="mt-6 space-y-6 text-sm">
            <dl className="grid grid-cols-[7rem_1fr] gap-y-2">
              <dt className="text-muted-foreground">Email</dt><dd><a className="underline" href={`mailto:${inq.email}`}>{inq.email}</a></dd>
              <dt className="text-muted-foreground">Phone</dt><dd>{inq.phone ?? "—"}</dd>
              <dt className="text-muted-foreground">Company</dt><dd>{inq.company ?? "—"}</dd>
              <dt className="text-muted-foreground">Service</dt><dd>{inq.service ?? "—"}</dd>
              <dt className="text-muted-foreground">Source</dt><dd>{inq.source}</dd>
              <dt className="text-muted-foreground">Submitted from</dt>
              <dd className="break-all">{inq.page_url ? <a className="inline-flex items-center gap-1 underline" href={inq.page_url} target="_blank" rel="noreferrer noopener">{inq.page_url}<ExternalLink className="size-3" /></a> : "—"}</dd>
              {inq.contact_id && (<><dt className="text-muted-foreground">Contact</dt><dd><Link className="underline" to="/admin/contacts" search={{ q: inq.email }}>View contact record</Link></dd></>)}
            </dl>

            <div className="rounded-lg border border-border bg-muted/40 p-4">
              {inq.subject && <p className="mb-2 font-medium">{inq.subject}</p>}
              <p className="whitespace-pre-wrap">{inq.message}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={inq.status} onValueChange={(v) => update.mutate({ status: v as Inquiry["status"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{INQUIRY_STATUSES.map((s) => <SelectItem key={s} value={s}>{statusLabel[s]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={inq.priority} onValueChange={(v) => update.mutate({ priority: v as Inquiry["priority"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{INQUIRY_PRIORITIES.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="follow-up">Follow-up date</Label>
                <Input id="follow-up" type="datetime-local" defaultValue={toLocalInput(inq.follow_up_at)} key={inq.updated_at}
                  onBlur={(e) => { const next = fromLocalInput(e.target.value); if (next !== inq.follow_up_at) update.mutate({ follow_up_at: next }); }} />
              </div>
            </div>

            <section className="space-y-2">
              <h3 className="font-semibold">Create follow-up task</h3>
              <div className="flex gap-2">
                <Input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="e.g. Send proposal" aria-label="Task title" />
                <Button disabled={!taskTitle.trim() || addTask.isPending} onClick={() => addTask.mutate()}>Add</Button>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="font-semibold">Internal notes</h3>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Only admins can see notes." aria-label="New note" />
              <Button size="sm" disabled={!note.trim() || addNote.isPending} onClick={() => addNote.mutate()}>Add note</Button>
              <ul className="space-y-2">
                {notes.data?.map((n) => (
                  <li key={n.id} className="rounded-lg border border-border p-3">
                    <p className="whitespace-pre-wrap">{n.body}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(n.created_at)}</p>
                  </li>
                ))}
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold">History</h3>
              <ul className="space-y-1 text-muted-foreground">
                {history.data?.map((h) => (
                  <li key={h.id} className="flex justify-between gap-3">
                    <span>{h.action.replace(/_/g, " ")}{h.details["to"] ? ` → ${String(h.details["to"]).replace(/_/g, " ")}` : ""}</span>
                    <span className="shrink-0 text-xs">{formatDateTime(h.created_at)}</span>
                  </li>
                ))}
              </ul>
            </section>

            <div className="flex flex-wrap gap-2 border-t border-border pt-4">
              <Button variant="outline" size="sm" onClick={() => update.mutate({ archived: !inq.archived })}>
                {inq.archived ? <ArchiveRestore className="mr-2 size-4" /> : <Archive className="mr-2 size-4" />}
                {inq.archived ? "Restore" : "Archive"}
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setConfirmDelete(true)}><Trash2 className="mr-2 size-4" />Delete</Button>
            </div>
          </div>
        )}

        <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this inquiry?</AlertDialogTitle>
              <AlertDialogDescription>This permanently removes the inquiry, its notes and history. Archive it instead if you may need it later.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => remove.mutate()}>Delete permanently</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
}
