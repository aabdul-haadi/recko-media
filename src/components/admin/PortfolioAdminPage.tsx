import { lazy, Suspense, useEffect, useRef, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Eye, Pencil, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PortfolioImage } from "@/components/portfolio/PortfolioImage";
import {
  cleanupPortfolio,
  deletePortfolio,
  portfolioKey,
  savePortfolio,
  swapPortfolio,
  titleFromFile,
  usePortfolio,
  usePortfolioCategories,
  type PortfolioCard,
  type PortfolioMetadata,
} from "@/lib/portfolio/portfolio";
import { getSupabase } from "@/lib/supabase";
import { useConfirm } from "./confirm";
import { ErrorState, PageHeader } from "./shared";
import "@/components/portfolio/portfolio.css";
import "./portfolio-admin.css";
const Lightbox = lazy(() => import("@/components/portfolio/PortfolioLightbox"));
type UploadState = { name: string; progress: number; state: string; error?: string };
const metadata = (item?: PortfolioCard): PortfolioMetadata => ({
  title: item?.title ?? "",
  alt: item?.alt ?? "",
  description: item?.description ?? "",
  category: item?.category ?? "Web",
  tags: item?.tags ?? [],
  status: item?.status ?? "draft",
});
export function PortfolioAdminPage() {
  const confirm = useConfirm();
  const client = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const list = usePortfolio(true, search, category);
  const categories = usePortfolioCategories();
  const items = list.data?.pages.flat() ?? [];
  const [editing, setEditing] = useState<PortfolioCard | null>(null);
  const [preview, setPreview] = useState<PortfolioCard | null>(null);
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const busyRef = useRef(false);
  const cancellation = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const returnFocus = useRef<HTMLElement | null>(null);
  const uploadInput = useRef<HTMLInputElement>(null);
  const refresh = () => client.invalidateQueries({ queryKey: portfolioKey });
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      cancellation.current?.abort();
    };
  }, []);
  const cleanup = async () => {
    try {
      await cleanupPortfolio();
    } catch (e) {
      toast.warning(e instanceof Error ? e.message : "Storage cleanup needs a retry.");
    }
  };
  useEffect(() => {
    void cleanupPortfolio().catch(() => {});
  }, []);
  async function run(
    title: string,
    description: string,
    action: () => Promise<unknown>,
    success: string,
  ) {
    if (busyRef.current) return;
    if (!(await confirm({ title, description, confirmLabel: "Yes, continue" }))) return;
    busyRef.current = true;
    setBusy(true);
    try {
      await action();
      toast.success(success);
      await refresh();
      await cleanup();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not complete this action.");
      await refresh();
    } finally {
      busyRef.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  async function upload(files: File[]) {
    if (!files.length || busyRef.current) return;
    if (files.length > 20) {
      toast.error("Upload up to 20 images at a time.");
      return;
    }
    if (
      !(await confirm({
        title: `Upload ${files.length} image${files.length === 1 ? "" : "s"}?`,
        description:
          "Images are optimized and saved as drafts. Preview and publish each when ready.",
        confirmLabel: "Yes, upload",
      }))
    )
      return;
    busyRef.current = true;
    setBusy(true);
    const controller = new AbortController();
    cancellation.current = controller;
    setUploads(files.map((f) => ({ name: f.name, progress: 0, state: "Waiting" })));
    let saved = 0;
    for (const [index, file] of files.entries()) {
      if (controller.signal.aborted) break;
      const update = (patch: Partial<UploadState>) =>
        mounted.current &&
        setUploads((old) => old.map((u, i) => (i === index ? { ...u, ...patch } : u)));
      try {
        const title = titleFromFile(file.name);
        await savePortfolio(
          { ...metadata(), title, alt: `${title} project preview` },
          file,
          undefined,
          (progress, state) => update({ progress, state }),
          controller.signal,
        );
        saved++;
        update({ progress: 100, state: "Saved as draft" });
      } catch (e) {
        update({
          state: "Failed",
          error: e instanceof Error ? e.message : "Upload failed. Retry this file.",
        });
      }
    }
    if (saved) toast.success(`${saved} image${saved === 1 ? "" : "s"} saved as drafts.`);
    if (controller.signal.aborted)
      toast.info("Upload stopped. Completed drafts are saved; remaining files can be retried.");
    await refresh();
    busyRef.current = false;
    if (mounted.current) setBusy(false);
  }
  async function publish(item: PortfolioCard) {
    await run(
      item.status === "published" ? "Unpublish this image?" : "Publish this image?",
      item.title,
      async () => {
        const result = await getSupabase()
          .from("portfolio_items")
          .update({ status: item.status === "published" ? "draft" : "published" })
          .eq("id", item.id)
          .eq("updated_at", item.updated_at)
          .select("id")
          .single();
        if (result.error)
          throw new Error("This image changed or could not be updated. Refresh and retry.");
      },
      item.status === "published" ? "Image unpublished." : "Image published to the website.",
    );
  }
  return (
    <>
      <PageHeader
        title="Portfolio"
        description="Your work, beautifully presented. Upload drafts, refine the details, then publish when ready."
        actions={
          <Button disabled={busy} onClick={() => uploadInput.current?.click()}>
            <UploadCloud className="mr-2 size-4" />
            Upload images
          </Button>
        }
      />
      <input
        ref={uploadInput}
        className="sr-only"
        aria-label="Upload portfolio images"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        disabled={busy}
        onChange={(e) => {
          void upload(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />
      <div
        className={"portfolio-dropzone " + (dragOver ? "is-over" : "")}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void upload(Array.from(e.dataTransfer.files));
        }}
      >
        <UploadCloud aria-hidden="true" />
        <h2>Make room for your next project.</h2>
        <p>
          Drop images here, or{" "}
          <button disabled={busy} onClick={() => uploadInput.current?.click()}>
            browse files
          </button>
        </p>
        <small>PNG, JPEG or WebP / Up to 20 MB each / 20 images per batch</small>
      </div>
      {uploads.length > 0 && (
        <section className="admin-card mb-6 p-4" aria-label="Upload progress">
          <div className="flex justify-between gap-3">
            <h2 className="font-semibold">Uploads</h2>
            {busy && (
              <Button variant="outline" size="sm" onClick={() => cancellation.current?.abort()}>
                Cancel remaining uploads
              </Button>
            )}
          </div>
          {uploads.map((u, i) => (
            <div key={i} className="portfolio-upload-row">
              <span>{u.name}</span>
              <progress value={u.progress} max={100} aria-label={`Upload ${u.name}`} />
              <small role={u.error ? "alert" : "status"}>{u.error ?? u.state}</small>
            </div>
          ))}
        </section>
      )}
      <div className="portfolio-admin-toolbar">
        <Input
          aria-label="Search portfolio"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          maxLength={100}
        />
        <select
          aria-label="Filter portfolio category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All categories</option>
          {categories.data?.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <Button
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() =>
            void run(
              "Retry storage cleanup?",
              "Remove unused files from deleted and replaced images. Active images are protected.",
              cleanupPortfolio,
              "Unused storage files cleaned up.",
            )
          }
        >
          Retry storage cleanup
        </Button>
      </div>
      {list.error && (
        <>
          <ErrorState error={list.error} />
          <Button variant="outline" onClick={() => list.refetch()}>
            Retry
          </Button>
        </>
      )}
      {list.isLoading && (
        <div className="portfolio-admin-grid" role="status" aria-label="Loading portfolio">
          {Array.from({ length: 6 }, (_, i) => (
            <div className="portfolio-skeleton" key={i} />
          ))}
        </div>
      )}
      {!list.isLoading && !list.error && !items.length && (
        <div className="admin-card p-10 text-center">
          <h2 className="font-semibold">
            {search || category ? "No matching projects" : "Your portfolio starts here"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Upload an image to create your first draft.
          </p>
        </div>
      )}
      <div className="portfolio-admin-grid">
        {items.map((item, i) => (
          <article
            className="admin-card portfolio-admin-card"
            key={`${item.id}-${item.updated_at}`}
          >
            <button
              className="portfolio-admin-preview"
              aria-label={`Preview ${item.title}`}
              onClick={(e) => {
                returnFocus.current = e.currentTarget;
                setPreview(item);
              }}
            >
              <PortfolioImage item={item} />
              <span>
                <Eye size={16} />
                Preview
              </span>
            </button>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <h2 className="min-w-0 break-words font-semibold">{item.title}</h2>
                <span className={"portfolio-status " + item.status}>{item.status}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{item.category}</p>
              <div className="portfolio-admin-actions">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={() => setEditing(item)}
                >
                  <Pencil className="mr-1 size-3" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" disabled={busy} onClick={() => publish(item)}>
                  {item.status === "published" ? "Unpublish" : "Publish"}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={busy || !!search || !!category || i === 0}
                  aria-label={`Move ${item.title} up`}
                  onClick={() =>
                    run(
                      "Move this project up?",
                      item.title,
                      () => swapPortfolio(item, items[i - 1]!),
                      "Order saved.",
                    )
                  }
                >
                  <ArrowUp className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={busy || !!search || !!category || i === items.length - 1}
                  aria-label={`Move ${item.title} down`}
                  onClick={() =>
                    run(
                      "Move this project down?",
                      item.title,
                      () => swapPortfolio(item, items[i + 1]!),
                      "Order saved.",
                    )
                  }
                >
                  <ArrowDown className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={busy}
                  aria-label={`Delete ${item.title}`}
                  onClick={() =>
                    run(
                      "Delete this portfolio image?",
                      "This removes the project from the website. Unpublish instead to keep a draft.",
                      () => deletePortfolio(item),
                      "Portfolio image deleted.",
                    )
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {(search || category) && (
        <p className="mt-4 text-xs text-muted-foreground">
          Clear filters to reorder the complete collection.
        </p>
      )}
      {list.hasNextPage && (
        <Button
          className="mt-6"
          variant="outline"
          disabled={list.isFetchingNextPage}
          onClick={() => list.fetchNextPage()}
        >
          {list.isFetchingNextPage ? "Loading..." : "Load more projects"}
        </Button>
      )}
      {editing && (
        <PortfolioEditor
          item={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            await refresh();
            await cleanup();
          }}
        />
      )}
      {preview && (
        <Suspense fallback={<p role="status">Opening preview...</p>}>
          <Lightbox
            items={[preview]}
            initialIndex={0}
            returnFocus={returnFocus.current}
            onClose={() => setPreview(null)}
          />
        </Suspense>
      )}
    </>
  );
}
function PortfolioEditor({
  item,
  onClose,
  onSaved,
}: {
  item: PortfolioCard;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const confirm = useConfirm();
  const [form, setForm] = useState(() => metadata(item));
  const [tags, setTags] = useState(item.tags.join(", "));
  const [file, setFile] = useState<File>();
  const [localUrl, setLocalUrl] = useState("");
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState("");
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const confirming = useRef(false);
  const [error, setError] = useState("");
  const set = (patch: Partial<PortfolioMetadata>) => setForm((old) => ({ ...old, ...patch }));
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setLocalUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  async function close() {
    if (busy || confirming.current) return;
    const dirty =
      file ||
      JSON.stringify({
        ...form,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      }) !== JSON.stringify(metadata(item));
    if (!dirty) {
      onClose();
      return;
    }
    confirming.current = true;
    const discard = await confirm({
      title: "Discard unsaved changes?",
      description: "Your saved project stays unchanged.",
      confirmLabel: "Yes, discard",
    });
    confirming.current = false;
    if (discard) onClose();
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busyRef.current || confirming.current) return;
    confirming.current = true;
    const accepted = await confirm({
      title: "Save portfolio changes?",
      description:
        form.status === "published"
          ? "The changes will appear on the website immediately."
          : "Saved as a draft, visible only in the admin.",
      confirmLabel: "Yes, save",
    });
    confirming.current = false;
    if (!accepted) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      await savePortfolio(
        {
          ...form,
          tags: [
            ...new Set(
              tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean),
            ),
          ],
        },
        file,
        item,
        (n, text) => {
          setProgress(n);
          setPhase(text);
        },
      );
      toast.success("Portfolio changes saved.");
      await onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save changes.");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  return (
    <Dialog open onOpenChange={(open) => !open && void close()}>
      <DialogContent
        className="portfolio-editor max-h-[90dvh] overflow-y-auto sm:max-w-xl"
        data-lenis-prevent
        onEscapeKeyDown={(e) => {
          if (busy || confirming.current) e.preventDefault();
        }}
        onInteractOutside={(e) => {
          if (busy || confirming.current) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Edit portfolio image</DialogTitle>
          <DialogDescription>
            Refine the story, replace the image, and choose when it goes live.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <fieldset disabled={busy} className="space-y-4">
            <img
              className="portfolio-editor-image"
              src={localUrl || item.thumbnail}
              alt={form.alt || item.title}
            />
            <div>
              <Label htmlFor="portfolio-replace">Replace image</Label>
              <Input
                id="portfolio-replace"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => setFile(e.target.files?.[0])}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                The original image stays active until the replacement is saved.
              </p>
            </div>
            <div>
              <Label htmlFor="portfolio-title">Title</Label>
              <Input
                id="portfolio-title"
                required
                maxLength={200}
                value={form.title}
                onChange={(e) => set({ title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="portfolio-alt">Image description (alt text)</Label>
              <Input
                id="portfolio-alt"
                required
                maxLength={300}
                value={form.alt}
                onChange={(e) => set({ alt: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="portfolio-description">Project description</Label>
              <Textarea
                id="portfolio-description"
                maxLength={3000}
                rows={3}
                value={form.description}
                onChange={(e) => set({ description: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="portfolio-category">Category</Label>
                <Input
                  id="portfolio-category"
                  required
                  maxLength={60}
                  value={form.category}
                  onChange={(e) => set({ category: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="portfolio-state">Visibility</Label>
                <select
                  id="portfolio-state"
                  className="portfolio-editor-select"
                  value={form.status}
                  onChange={(e) => set({ status: e.target.value as PortfolioMetadata["status"] })}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="portfolio-tags">Tags, separated by commas</Label>
              <Input
                id="portfolio-tags"
                maxLength={500}
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
          </fieldset>
          {busy && (
            <div role="status">
              <progress className="w-full" max={100} value={progress} />
              <p className="text-xs">{phase || "Saving changes..."}</p>
            </div>
          )}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <Button disabled={busy} type="submit">
              {busy ? "Saving..." : "Save changes"}
            </Button>
            <Button disabled={busy} type="button" variant="outline" onClick={() => void close()}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
