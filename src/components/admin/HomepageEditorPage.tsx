import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, ArrowCounterClockwise as RotateCcw, RocketLaunch as Rocket, FloppyDisk as Save } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getSupabase } from "@/lib/supabase";
import { useConfirm } from "./confirm";
import { contentDefaults, sectionDefs, type SectionData } from "@/lib/content/schema";
import { cn } from "@/lib/utils";
import { FieldEditor, findInvalidUrl } from "./FieldEditor";
import { ErrorState, PageHeader, formatDateTime } from "./shared";

type Row = { key: string; data: SectionData; enabled: boolean; updated_at?: string; published_at?: string };

const sameJson = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export function HomepageEditorPage() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [selected, setSelected] = useState(sectionDefs[0]!.key);
  const [form, setForm] = useState<SectionData>({});
  const [enabled, setEnabled] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [confirmPublish, setConfirmPublish] = useState(false);

  const def = sectionDefs.find((s) => s.key === selected)!;

  const drafts = useQuery({
    queryKey: ["content", "drafts"],
    queryFn: async () => {
      const { data, error } = await getSupabase().from("content_drafts").select("key,data,enabled,updated_at");
      if (error) throw error;
      return data as Row[];
    },
  });
  const published = useQuery({
    queryKey: ["content", "published"],
    queryFn: async () => {
      const { data, error } = await getSupabase().from("content_published").select("key,data,enabled,published_at");
      if (error) throw error;
      return data as Row[];
    },
  });

  const draftRow = drafts.data?.find((r) => r.key === selected);
  const publishedRow = published.data?.find((r) => r.key === selected);

  // Load the editor from draft, else published, else built-in copy.
  const loadedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!drafts.data || !published.data) return;
    if (loadedFor.current === selected && dirty) return; // never overwrite edits in progress
    loadedFor.current = selected;
    const source = draftRow ?? publishedRow;
    setForm({ ...contentDefaults[selected], ...(source?.data ?? {}) });
    setEnabled(source ? source.enabled : true);
    setDirty(false);
  }, [selected, drafts.data, published.data]); // eslint-disable-line react-hooks/exhaustive-deps

  const status = useMemo(() => {
    return Object.fromEntries(
      sectionDefs.map((s) => {
        const d = drafts.data?.find((r) => r.key === s.key);
        const p = published.data?.find((r) => r.key === s.key);
        if (d && (!p || !sameJson(d.data, p.data) || d.enabled !== p.enabled)) return [s.key, "unpublished"];
        if (p) return [s.key, "live"];
        return [s.key, "default"];
      }),
    ) as Record<string, "unpublished" | "live" | "default">;
  }, [drafts.data, published.data]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["content"] });
  };

  const saveDraft = useMutation({
    mutationFn: async () => {
      const bad = findInvalidUrl(def.fields, form);
      if (bad) throw new Error(`"${bad}" is not a valid link.`);
      const { error } = await getSupabase().from("content_drafts").upsert({ key: selected, data: form, enabled: def.toggleable ? enabled : true });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Draft saved. Visitors still see the published version."); setDirty(false); refresh(); },
    onError: (e: Error) => toast.error(e.message || "Could not save the draft."),
  });

  const publish = useMutation({
    mutationFn: async () => {
      await saveDraft.mutateAsync();
      const { error } = await getSupabase().rpc("publish_content", { p_key: selected });
      if (error) throw error;
    },
    onSuccess: () => { setConfirmPublish(false); toast.success("Published. The live website now shows these changes."); refresh(); },
    onError: (e: Error) => { setConfirmPublish(false); toast.error(e.message || "Could not publish."); },
  });

  async function choose(key: string) {
    if (key === selected) return;
    if (dirty && !(await confirm({ title: "Discard unsaved changes?", description: "You have edits in this section that are not saved.", confirmLabel: "Yes, discard", destructive: true }))) return;
    setSelected(key);
  }

  async function preview() {
    if (dirty) {
      if (!(await confirm({ title: "Save draft and preview?", description: "Your changes are saved as a draft (not published) so the preview can show them.", confirmLabel: "Yes, save & preview" }))) return;
      await saveDraft.mutateAsync().catch(() => undefined);
    }
    window.open("/?preview=draft", "_blank", "noopener");
  }

  async function discard() {
    if (!(await confirm({ title: "Revert to the published version?", description: "Edits in this form are replaced by what is live now. Your saved draft is kept until you save again.", confirmLabel: "Yes, revert", destructive: true }))) return;
    const source = publishedRow ?? undefined;
    setForm({ ...contentDefaults[selected], ...(source?.data ?? {}) });
    setEnabled(source ? source.enabled : true);
    setDirty(true);
    toast.info("Reverted to the published version. Save the draft to keep this.");
  }

  const set = (name: string, value: unknown) => { setForm((f) => ({ ...f, [name]: value })); setDirty(true); };
  const badge = (key: string) =>
    status[key] === "unpublished" ? <Badge className="bg-amber-500/15 text-amber-700" variant="secondary">Unpublished changes</Badge>
    : status[key] === "live" ? <Badge className="bg-emerald-500/15 text-emerald-700" variant="secondary">Live</Badge>
    : <Badge variant="secondary">Built-in</Badge>;

  const error = drafts.error ?? published.error;
  return (
    <>
      <PageHeader title="Homepage editor" description="Edit each section, preview your draft, then publish to the live website. No code deployment needed." />
      {error && <ErrorState error={error} />}
      <div className="grid gap-4 lg:grid-cols-[15rem_1fr] lg:gap-6">
        <nav aria-label="Homepage sections" className="admin-scroll-x -mx-3 px-3 pb-1 sm:mx-0 sm:px-0 lg:block lg:rounded-2xl lg:border lg:border-border lg:bg-white lg:shadow-sm lg:space-y-1 lg:self-start lg:overflow-visible lg:p-2">
          {sectionDefs.map((s) => (
            <button
              key={s.key} type="button" onClick={() => choose(s.key)} aria-current={selected === s.key}
              className={cn("flex shrink-0 flex-col items-start gap-1 lg:flex-row lg:items-center lg:justify-between rounded-xl border border-border bg-white px-3 py-2 text-left text-xs hover:bg-muted lg:w-full lg:border-transparent lg:bg-transparent lg:text-sm", selected === s.key && "border-indigo-300 bg-indigo-50 font-semibold text-indigo-900 lg:bg-indigo-50")}
            >
              <span>{s.label}</span>
              {badge(s.key)}
            </button>
          ))}
        </nav>

        <section className="admin-card min-w-0 p-4 sm:p-5 md:p-6">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">{def.label}</h2>
              <p className="text-sm text-muted-foreground">{def.description}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Draft saved: {formatDateTime(draftRow?.updated_at ?? null)} · Last published: {formatDateTime(publishedRow?.published_at ?? null)}
                {dirty && <span className="ml-2 font-medium text-amber-600">Unsaved changes</span>}
              </p>
            </div>
            {def.toggleable && (
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={enabled} onCheckedChange={(v) => { setEnabled(v); setDirty(true); }} aria-label="Show this section on the website" />
                Show on website
              </label>
            )}
          </div>

          <div className="space-y-5">
            {def.fields.map((field) => (
              <FieldEditor key={`${selected}-${field.name}`} idPrefix={selected} field={field} value={form[field.name]} onChange={(v) => set(field.name, v)} />
            ))}
          </div>

          <div className="sticky bottom-16 mt-8 flex flex-wrap gap-2 rounded-2xl border border-border bg-white/95 p-3 shadow-lg backdrop-blur lg:static lg:border-0 lg:border-t lg:bg-transparent lg:p-0 lg:pt-5 lg:shadow-none">
            <Button variant="outline" disabled={!dirty || saveDraft.isPending} onClick={async () => { if (await confirm({ title: "Save this draft?", description: "Visitors will not see it until you publish.", confirmLabel: "Yes, save draft" })) saveDraft.mutate(); }}><Save className="mr-2 size-4" />Save draft</Button>
            <Button variant="outline" onClick={preview}><Eye className="mr-2 size-4" />Preview</Button>
            <Button disabled={publish.isPending} onClick={() => setConfirmPublish(true)}><Rocket className="mr-2 size-4" />Publish</Button>
            {publishedRow && <Button variant="ghost" onClick={discard}><RotateCcw className="mr-2 size-4" />Revert to published</Button>}
          </div>
        </section>
      </div>

      <AlertDialog open={confirmPublish} onOpenChange={setConfirmPublish}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish “{def.label}”?</AlertDialogTitle>
            <AlertDialogDescription>This updates the live website immediately for all visitors. You can edit and republish at any time.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => publish.mutate()}>Publish now</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
