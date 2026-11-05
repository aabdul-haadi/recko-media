import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Eye, Plus, Star, Trash as Trash2 } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getSupabase } from "@/lib/supabase";
import { useConfirm } from "./confirm";
import { SERVICE_CATEGORIES, type ServiceCategory } from "@/lib/content/schema";
import { URL_PATTERN } from "./FieldEditor";
import { EmptyState, ErrorState, PageHeader } from "./shared";

type Service = {
  id: string; slug: string; category: ServiceCategory; title: string; summary: string; details: string | null;
  features: string[]; price: string | null; icon: string | null; image_url: string | null; image_alt: string | null;
  cta_label: string | null; cta_url: string | null; featured: boolean; status: "draft" | "published"; sort_order: number;
  seo_title: string | null; seo_description: string | null;
};
type Draft = Omit<Service, "id" | "features"> & { id?: string; features: string };

const label = { creative: "Creative", growth: "Growth", technology: "Technology" } as const;
const slugify = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100);

const blank = (category: ServiceCategory, order: number): Draft => ({
  slug: "", category, title: "", summary: "", details: "", features: "", price: "", icon: "", image_url: "", image_alt: "",
  cta_label: "", cta_url: "", featured: false, status: "draft", sort_order: order, seo_title: "", seo_description: "",
});

export function ServicesAdminPage() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [toDelete, setToDelete] = useState<Service | null>(null);

  const list = useQuery({
    queryKey: ["services", "admin"],
    queryFn: async () => {
      const { data, error } = await getSupabase().from("services").select("*").order("category").order("sort_order");
      if (error) throw error;
      return data as Service[];
    },
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["services"] });

  const patch = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<Service> }) => {
      const { error } = await getSupabase().from("services").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: refresh,
    onError: () => toast.error("Could not update the service."),
  });
  const swap = useMutation({
    mutationFn: async ({ a, b }: { a: Service; b: Service }) => {
      const supabase = getSupabase();
      const first = await supabase.from("services").update({ sort_order: b.sort_order }).eq("id", a.id);
      const second = await supabase.from("services").update({ sort_order: a.sort_order }).eq("id", b.id);
      if (first.error || second.error) throw new Error("reorder");
    },
    onSuccess: () => { toast.success("Order updated. The website follows this order."); refresh(); },
    onError: () => { toast.error("Could not reorder."); refresh(); },
  });
  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await getSupabase().from("services").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Service deleted"); setToDelete(null); refresh(); },
    onError: () => toast.error("Could not delete the service."),
  });

  const nextOrder = (category: ServiceCategory) => Math.max(0, ...(list.data ?? []).filter((s) => s.category === category).map((s) => s.sort_order)) + 1;

  return (
    <>
      <PageHeader
        title="Services"
        description="Everything here is shown on the website. Published services appear on the homepage and Services page."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => window.open("/services?preview=draft", "_blank", "noopener")}><Eye className="mr-2 size-4" />Preview all</Button>
            <Button size="sm" onClick={() => setDraft(blank("creative", nextOrder("creative")))}><Plus className="mr-2 size-4" />New service</Button>
          </>
        }
      />
      {list.error && <ErrorState error={list.error} />}
      {list.isLoading && <p className="text-sm text-muted-foreground">Loading services…</p>}
      {SERVICE_CATEGORIES.map((category) => {
        const items = (list.data ?? []).filter((s) => s.category === category);
        return (
          <section key={category} className="mb-8">
            <h2 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground"><span className="size-2 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500" />{label[category]}</h2>
            {items.length === 0 ? (
              <EmptyState title={`No ${label[category].toLowerCase()} services`} hint="Add one with “New service”." />
            ) : (
              <ul className="admin-card divide-y divide-border">
                {items.map((service, index) => (
                  <li key={service.id} className="flex flex-wrap items-center gap-2 p-3 sm:gap-3 sm:p-4">
                    <div className="flex flex-col">
                      <Button variant="ghost" size="icon" className="size-6" aria-label={`Move ${service.title} up`} disabled={index === 0 || swap.isPending} onClick={async () => { if (await confirm({ title: "Move this service up?", description: `“${service.title}” will appear earlier on the website.`, confirmLabel: "Yes, move" })) swap.mutate({ a: service, b: items[index - 1]! }); }}><ArrowUp className="size-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="size-6" aria-label={`Move ${service.title} down`} disabled={index === items.length - 1 || swap.isPending} onClick={async () => { if (await confirm({ title: "Move this service down?", description: `“${service.title}” will appear later on the website.`, confirmLabel: "Yes, move" })) swap.mutate({ a: service, b: items[index + 1]! }); }}><ArrowDown className="size-3.5" /></Button>
                    </div>
                    <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setDraft({ ...service, features: service.features.join("\n") })}>
                      <span className="block font-medium">{service.title}</span>
                      <span className="block truncate text-sm text-muted-foreground">{service.summary}</span>
                    </button>
                    <Button variant="ghost" size="icon" aria-label={service.featured ? "Remove from featured" : "Mark as featured"} aria-pressed={service.featured} onClick={async () => { if (await confirm({ title: service.featured ? "Remove from featured?" : "Mark as featured?", description: service.title, confirmLabel: "Yes" })) patch.mutate({ id: service.id, values: { featured: !service.featured } }); }}>
                      <Star className={service.featured ? "size-4 text-amber-500" : "size-4"} weight={service.featured ? "fill" : "duotone"} />
                    </Button>
                    <Badge variant="secondary" className={service.status === "published" ? "bg-emerald-500/15 text-emerald-700" : ""}>{service.status === "published" ? "Published" : "Draft"}</Badge>
                    <Switch checked={service.status === "published"} aria-label={`Publish ${service.title}`} onCheckedChange={async (v) => { if (await confirm({ title: v ? "Publish this service?" : "Unpublish this service?", description: v ? `“${service.title}” will appear on the live website immediately.` : `“${service.title}” will be removed from the live website immediately.`, confirmLabel: v ? "Yes, publish" : "Yes, unpublish" })) patch.mutate({ id: service.id, values: { status: v ? "published" : "draft" } }, { onSuccess: () => toast.success(v ? "Published to the website" : "Removed from the website") }); }} />
                    <Button variant="ghost" size="icon" aria-label={`Delete ${service.title}`} onClick={() => setToDelete(service)}><Trash2 className="size-4" /></Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}

      <ServiceSheet draft={draft} nextOrder={nextOrder} onClose={() => setDraft(null)} onSaved={refresh} />

      <AlertDialog open={Boolean(toDelete)} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{toDelete?.title}”?</AlertDialogTitle>
            <AlertDialogDescription>It disappears from the website immediately and cannot be recovered. Unpublish it instead to keep it as a draft.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => toDelete && remove.mutate(toDelete.id)}>Delete permanently</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ServiceSheet({ draft, nextOrder, onClose, onSaved }: { draft: Draft | null; nextOrder: (c: ServiceCategory) => number; onClose: () => void; onSaved: () => void }) {
  const confirm = useConfirm();
  const [form, setForm] = useState<Draft | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { setForm(draft); setSlugTouched(Boolean(draft?.id)); setError(""); }, [draft]);

  const save = useMutation({
    mutationFn: async (f: Draft) => {
      const clean = (v: string | null) => (v && v.trim() ? v.trim() : null);
      const row = {
        slug: f.slug.trim(), category: f.category, title: f.title.trim(), summary: f.summary.trim(),
        details: clean(f.details), features: f.features.split("\n").map((l) => l.trim()).filter(Boolean),
        price: clean(f.price), icon: clean(f.icon), image_url: clean(f.image_url), image_alt: clean(f.image_alt),
        cta_label: clean(f.cta_label), cta_url: clean(f.cta_url), featured: f.featured, status: f.status,
        sort_order: f.sort_order, seo_title: clean(f.seo_title), seo_description: clean(f.seo_description),
      };
      const { error: err } = f.id ? await getSupabase().from("services").update(row).eq("id", f.id) : await getSupabase().from("services").insert(row);
      if (err) throw err;
    },
    onSuccess: () => { toast.success("Service saved"); onSaved(); onClose(); },
    onError: (e: { code?: string }) => setError(e.code === "23505" ? "Another service already uses that URL slug." : "Could not save the service. Check the fields and try again."),
  });

  if (!form) return <Sheet open={false}><SheetContent /></Sheet>;
  const set = (patch: Partial<Draft>) => setForm((f) => (f ? { ...f, ...patch } : f));

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!form) return;
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(form.slug)) return setError("The URL slug may only contain lowercase letters, numbers and hyphens.");
    if (form.cta_url && !URL_PATTERN.test(form.cta_url.trim())) return setError("The button link must be a full address, a path starting with /, #section, mailto: or tel:.");
    if (form.image_url && !/^(\/|https:\/\/)/i.test(form.image_url.trim())) return setError("The image address must start with / or https://.");
    setError("");
    const live = form.status === "published";
    if (await confirm({ title: form.id ? "Save changes to this service?" : "Create this service?", description: live ? "It is published, so the change goes live on the website immediately." : "It is a draft, so visitors will not see it yet.", confirmLabel: "Yes, save" })) save.mutate(form);
  }

  return (
    <Sheet open={Boolean(draft)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{form.id ? "Edit service" : "New service"}</SheetTitle>
          <SheetDescription>Changes go live as soon as the service is published.</SheetDescription>
        </SheetHeader>
        <form onSubmit={submit} className="mt-6 space-y-4 text-sm">
          <div className="space-y-2"><Label htmlFor="s-title">Name</Label>
            <Input id="s-title" required maxLength={200} value={form.title} onChange={(e) => set({ title: e.target.value, ...(slugTouched ? {} : { slug: slugify(e.target.value) }) })} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => set({ category: v as ServiceCategory, ...(form.id ? {} : { sort_order: nextOrder(v as ServiceCategory) }) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SERVICE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{label[c]}</SelectItem>)}</SelectContent>
              </Select></div>
            <div className="space-y-2"><Label htmlFor="s-slug">URL slug</Label>
              <Input id="s-slug" required value={form.slug} onChange={(e) => { setSlugTouched(true); set({ slug: e.target.value }); }} /></div>
          </div>
          <div className="space-y-2"><Label htmlFor="s-summary">Short description</Label>
            <Textarea id="s-summary" required maxLength={500} value={form.summary} onChange={(e) => set({ summary: e.target.value })} /></div>
          <div className="space-y-2"><Label htmlFor="s-details">Detailed description</Label>
            <Textarea id="s-details" rows={5} maxLength={20000} value={form.details ?? ""} onChange={(e) => set({ details: e.target.value })} /></div>
          <div className="space-y-2"><Label htmlFor="s-features">Benefits & features</Label>
            <Textarea id="s-features" rows={4} value={form.features} onChange={(e) => set({ features: e.target.value })} />
            <p className="text-xs text-muted-foreground">One per line.</p></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="s-price">Pricing (optional)</Label><Input id="s-price" maxLength={100} value={form.price ?? ""} onChange={(e) => set({ price: e.target.value })} placeholder="From $500 / month" /></div>
            <div className="space-y-2"><Label htmlFor="s-icon">Icon name (optional)</Label><Input id="s-icon" maxLength={50} value={form.icon ?? ""} onChange={(e) => set({ icon: e.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="s-cta">Button text</Label><Input id="s-cta" maxLength={100} value={form.cta_label ?? ""} onChange={(e) => set({ cta_label: e.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="s-cta-url">Button link</Label><Input id="s-cta-url" value={form.cta_url ?? ""} onChange={(e) => set({ cta_url: e.target.value })} placeholder="/contact" /></div>
            <div className="space-y-2"><Label htmlFor="s-img">Featured image address</Label><Input id="s-img" value={form.image_url ?? ""} onChange={(e) => set({ image_url: e.target.value })} placeholder="https://…" /></div>
            <div className="space-y-2"><Label htmlFor="s-alt">Image description (alt text)</Label><Input id="s-alt" maxLength={300} value={form.image_alt ?? ""} onChange={(e) => set({ image_alt: e.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="s-seo-t">SEO title</Label><Input id="s-seo-t" maxLength={120} value={form.seo_title ?? ""} onChange={(e) => set({ seo_title: e.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="s-seo-d">SEO description</Label><Input id="s-seo-d" maxLength={320} value={form.seo_description ?? ""} onChange={(e) => set({ seo_description: e.target.value })} /></div>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2"><Switch checked={form.status === "published"} onCheckedChange={(v) => set({ status: v ? "published" : "draft" })} />Published</label>
            <label className="flex items-center gap-2"><Switch checked={form.featured} onCheckedChange={(v) => set({ featured: v })} />Featured</label>
          </div>
          {error && <p role="alert" className="text-destructive">{error}</p>}
          <div className="flex gap-2"><Button type="submit" disabled={save.isPending}>{form.id ? "Save changes" : "Create service"}</Button><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button></div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
