import { useEffect, useState, type FormEvent } from "react";
import { Link, useSearch, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash as Trash2, X } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getSupabase } from "@/lib/supabase";
import { useConfirm } from "./confirm";
import type { Contact, Inquiry } from "@/lib/admin/types";
import { CONTACT_STATUSES } from "@/lib/admin/types";
import { EmptyState, ErrorState, PAGE_SIZE, PageHeader, Pager, StatusBadge, formatDate, formatDateTime } from "./shared";

type Tag = { id: string; name: string };
type ContactRow = Contact & { contact_tags: { tags: Tag }[] };
type Draft = { id?: string; full_name: string; email: string; phone: string; company: string; status: Contact["status"]; notes: string };
const blank: Draft = { full_name: "", email: "", phone: "", company: "", status: "lead", notes: "" };

export function ContactsPage() {
  const search = useSearch({ from: "/admin/contacts" });
  const navigate = useNavigate();
  const [q, setQ] = useState(search.q);
  const [page, setPage] = useState(0);
  const [draft, setDraft] = useState<Draft | null>(null);
  useEffect(() => { setQ(search.q); setPage(0); }, [search.q]);

  const list = useQuery({
    queryKey: ["contacts", "list", q, page],
    queryFn: async () => {
      let query = getSupabase().from("contacts").select("*, contact_tags(tags(id,name))", { count: "exact" });
      const term = q.trim().replace(/[%,()]/g, " ");
      if (term) query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%,company.ilike.%${term}%`);
      const { data, error, count } = await query
        .order("last_interaction_at", { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
      if (error) throw error;
      return { rows: data as unknown as ContactRow[], total: count ?? 0 };
    },
    placeholderData: (previous) => previous,
  });

  const editing = draft ? list.data?.rows.find((r) => r.id === draft.id) : undefined;

  return (
    <>
      <PageHeader
        title="Contacts"
        description="People who have reached out, merged automatically by email address."
        actions={<Button size="sm" onClick={() => setDraft(blank)}><Plus className="mr-2 size-4" />New contact</Button>}
      />
      <Input
        className="mb-4 h-9 max-w-md" value={q} aria-label="Search contacts" placeholder="Search name, email, phone, company…"
        onChange={(e) => { setQ(e.target.value); setPage(0); navigate({ to: "/admin/contacts", search: { q: e.target.value }, replace: true }); }}
      />
      {list.error ? <ErrorState error={list.error} /> : list.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading contacts…</p>
      ) : list.data?.rows.length === 0 ? (
        <EmptyState title="No contacts found" hint="Contacts are created automatically from website inquiries, or add one manually." />
      ) : (
        <>
        <ul className="space-y-2 md:hidden">
          {list.data?.rows.map((c) => (
            <li key={c.id}>
              <button type="button" className="admin-card admin-card-hover block w-full p-3 text-left" onClick={() => setDraft({ id: c.id, full_name: c.full_name, email: c.email ?? "", phone: c.phone ?? "", company: c.company ?? "", status: c.status, notes: c.notes ?? "" })}>
                <span className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate font-semibold">{c.full_name}</span>
                  <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] capitalize text-indigo-700">{c.status}</span>
                </span>
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">{c.email ?? "No email"}{c.company ? ` · ${c.company}` : ""}</span>
                <span className="mt-2 flex flex-wrap items-center gap-1">
                  {c.contact_tags.map((t) => <Badge key={t.tags.id} variant="secondary">{t.tags.name}</Badge>)}
                  <span className="ml-auto text-[11px] text-muted-foreground">Last: {formatDate(c.last_interaction_at)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <div className="admin-card hidden overflow-x-auto md:block">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Name</TableHead><TableHead>Phone</TableHead><TableHead>Status</TableHead><TableHead>Tags</TableHead><TableHead>First contact</TableHead><TableHead>Last interaction</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {list.data?.rows.map((c) => (
                <TableRow key={c.id} className="cursor-pointer" onClick={() => setDraft({ id: c.id, full_name: c.full_name, email: c.email ?? "", phone: c.phone ?? "", company: c.company ?? "", status: c.status, notes: c.notes ?? "" })}>
                  <TableCell><span className="font-medium">{c.full_name}</span><div className="text-xs text-muted-foreground">{c.email ?? "No email"}{c.company ? ` · ${c.company}` : ""}</div></TableCell>
                  <TableCell>{c.phone ?? "—"}</TableCell>
                  <TableCell className="capitalize">{c.status}</TableCell>
                  <TableCell><div className="flex flex-wrap gap-1">{c.contact_tags.map((t) => <Badge key={t.tags.id} variant="secondary">{t.tags.name}</Badge>)}</div></TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(c.first_contact_at)}</TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(c.last_interaction_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        </>
      )}
      <Pager page={page} total={list.data?.total ?? 0} onPage={setPage} />
      <ContactSheet draft={draft} tags={editing?.contact_tags.map((t) => t.tags) ?? []} onClose={() => setDraft(null)} />
    </>
  );
}

function ContactSheet({ draft, tags, onClose }: { draft: Draft | null; tags: Tag[]; onClose: () => void }) {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [form, setForm] = useState<Draft>(blank);
  const [tagName, setTagName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  useEffect(() => { if (draft) setForm(draft); }, [draft]);
  const id = draft?.id;

  const inquiries = useQuery({
    queryKey: ["contacts", "inquiries", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await getSupabase().from("inquiries").select("*").eq("contact_id", id!).order("created_at", { ascending: false });
      if (error) throw error;
      return data as Inquiry[];
    },
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["contacts"] });

  const save = useMutation({
    mutationFn: async () => {
      const row = {
        full_name: form.full_name.trim(), email: form.email.trim() || null, phone: form.phone.trim() || null,
        company: form.company.trim() || null, status: form.status, notes: form.notes.trim() || null,
      };
      const { error } = id ? await getSupabase().from("contacts").update(row).eq("id", id) : await getSupabase().from("contacts").insert(row);
      if (error) throw error;
    },
    onSuccess: () => { toast.success(id ? "Contact saved" : "Contact created"); refresh(); onClose(); },
    onError: (error: { code?: string }) => toast.error(error.code === "23505" ? "A contact with that email already exists." : "Could not save the contact."),
  });
  const remove = useMutation({
    mutationFn: async () => { const { error } = await getSupabase().from("contacts").delete().eq("id", id!); if (error) throw error; },
    onSuccess: () => { toast.success("Contact deleted"); setConfirmDelete(false); refresh(); onClose(); },
    onError: () => toast.error("Could not delete the contact."),
  });
  const addTag = useMutation({
    mutationFn: async () => {
      const name = tagName.trim().toLowerCase();
      const supabase = getSupabase();
      const { data: existing } = await supabase.from("tags").select("id").eq("name", name).maybeSingle();
      let tagId = existing?.id as string | undefined;
      if (!tagId) {
        const { data, error } = await supabase.from("tags").insert({ name }).select("id").single();
        if (error) throw error;
        tagId = data.id as string;
      }
      const { error } = await supabase.from("contact_tags").upsert({ contact_id: id!, tag_id: tagId });
      if (error) throw error;
    },
    onSuccess: () => { setTagName(""); refresh(); },
    onError: () => toast.error("Could not add the tag."),
  });
  const removeTag = useMutation({
    mutationFn: async (tagId: string) => { const { error } = await getSupabase().from("contact_tags").delete().eq("contact_id", id!).eq("tag_id", tagId); if (error) throw error; },
    onSuccess: refresh,
    onError: () => toast.error("Could not remove the tag."),
  });

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (await confirm({ title: id ? "Save changes to this contact?" : "Create this contact?", description: form.full_name, confirmLabel: id ? "Yes, save" : "Yes, create" })) save.mutate();
  }
  const set = (patch: Partial<Draft>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <Sheet open={Boolean(draft)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{id ? form.full_name || "Contact" : "New contact"}</SheetTitle>
          <SheetDescription>{id ? "Edit details, tags and see inquiry history." : "Add a contact manually."}</SheetDescription>
        </SheetHeader>
        <form onSubmit={submit} className="mt-6 space-y-4 text-sm">
          <div className="space-y-2"><Label htmlFor="c-name">Full name</Label><Input id="c-name" required maxLength={200} value={form.full_name} onChange={(e) => set({ full_name: e.target.value })} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="c-email">Email</Label><Input id="c-email" type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="c-phone">Phone</Label><Input id="c-phone" value={form.phone} maxLength={50} onChange={(e) => set({ phone: e.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="c-company">Company</Label><Input id="c-company" value={form.company} maxLength={200} onChange={(e) => set({ company: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set({ status: v as Contact["status"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CONTACT_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2"><Label htmlFor="c-notes">Internal notes</Label><Textarea id="c-notes" value={form.notes} maxLength={10000} onChange={(e) => set({ notes: e.target.value })} /></div>
          <div className="flex gap-2">
            <Button type="submit" disabled={save.isPending}>{id ? "Save changes" : "Create contact"}</Button>
            {id && <Button type="button" variant="destructive" onClick={() => setConfirmDelete(true)}><Trash2 className="mr-2 size-4" />Delete</Button>}
          </div>
        </form>

        {id && (
          <div className="mt-8 space-y-6 text-sm">
            <section className="space-y-2">
              <h3 className="font-semibold">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => (
                  <Badge key={t.id} variant="secondary" className="gap-1">{t.name}
                    <button type="button" aria-label={`Remove tag ${t.name}`} onClick={async () => { if (await confirm({ title: `Remove tag “${t.name}”?`, confirmLabel: "Yes, remove" })) removeTag.mutate(t.id); }}><X className="size-3" /></button>
                  </Badge>
                ))}
              </div>
              <form className="flex gap-2" onSubmit={async (e) => { e.preventDefault(); if (tagName.trim() && (await confirm({ title: `Add tag “${tagName.trim()}”?`, confirmLabel: "Yes, add" }))) addTag.mutate(); }}>
                <Input value={tagName} maxLength={50} onChange={(e) => setTagName(e.target.value)} placeholder="Add a tag" aria-label="New tag" />
                <Button type="submit" variant="outline" disabled={!tagName.trim()}>Add</Button>
              </form>
            </section>
            <section className="space-y-2">
              <h3 className="font-semibold">Inquiry history</h3>
              {inquiries.data?.length === 0 && <p className="text-muted-foreground">No inquiries from this contact.</p>}
              <ul className="space-y-2">
                {inquiries.data?.map((i) => (
                  <li key={i.id}>
                    <Link to="/admin/inquiries" search={{ q: "", open: i.id }} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 hover:bg-muted/50">
                      <span className="min-w-0"><span className="block truncate">{i.subject ?? i.message}</span><span className="text-xs text-muted-foreground">{formatDateTime(i.created_at)}</span></span>
                      <StatusBadge status={i.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}

        <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this contact?</AlertDialogTitle>
              <AlertDialogDescription>The contact and its tasks are removed. Their past inquiries are kept but unlinked.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => remove.mutate()}>Delete contact</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
}
