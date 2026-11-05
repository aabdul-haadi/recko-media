import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getSupabase } from "@/lib/supabase";
import { useConfirm } from "./confirm";
import { TASK_STATUSES, type Task, type TaskStatus } from "@/lib/admin/types";
import { EmptyState, ErrorState, PageHeader, formatDateTime, fromLocalInput, toLocalInput } from "./shared";

type TaskRow = Task & { contacts: { full_name: string } | null; inquiries: { name: string } | null };

export function TasksPage() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [status, setStatus] = useState<string>("pending");
  const [when, setWhen] = useState("all");
  const [editing, setEditing] = useState<Partial<Task> | null>(null);

  const list = useQuery({
    queryKey: ["tasks", "list", status, when],
    queryFn: async () => {
      let query = getSupabase().from("tasks").select("*, contacts(full_name), inquiries(name)");
      if (status !== "all") query = query.eq("status", status);
      const now = new Date().toISOString();
      if (when === "overdue") query = query.lt("due_at", now).eq("status", "pending");
      if (when === "upcoming") query = query.gte("due_at", now);
      const { data, error } = await query.order("due_at", { ascending: true, nullsFirst: false }).limit(200);
      if (error) throw error;
      return data as unknown as TaskRow[];
    },
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const setTaskStatus = useMutation({
    mutationFn: async ({ id, next }: { id: string; next: TaskStatus }) => {
      const { error } = await getSupabase().from("tasks").update({ status: next }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: refresh,
    onError: () => toast.error("Could not update the task"),
  });
  const save = useMutation({
    mutationFn: async (task: Partial<Task>) => {
      const row = { title: task.title!.trim(), description: task.description?.trim() || null, due_at: task.due_at ?? null };
      const { error } = task.id ? await getSupabase().from("tasks").update(row).eq("id", task.id) : await getSupabase().from("tasks").insert(row);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Task saved"); setEditing(null); refresh(); },
    onError: () => toast.error("Could not save the task"),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await getSupabase().from("tasks").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Task deleted"); setEditing(null); refresh(); },
    onError: () => toast.error("Could not delete the task"),
  });

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!editing?.title?.trim()) return;
    if (await confirm({ title: editing.id ? "Save changes to this task?" : "Create this task?", description: editing.title, confirmLabel: "Yes, save" })) save.mutate(editing);
  }
  async function changeStatus(task: Task, next: TaskStatus) {
    const text = next === "completed" ? "Mark as completed?" : next === "cancelled" ? "Cancel this task?" : "Reopen this task?";
    if (await confirm({ title: text, description: task.title, confirmLabel: "Yes", destructive: next === "cancelled" })) setTaskStatus.mutate({ id: task.id, next });
  }

  return (
    <>
      <PageHeader
        title="Tasks & Follow-ups"
        description="Reminders tied to your contacts and inquiries."
        actions={<Button size="sm" onClick={() => setEditing({ title: "", description: "", due_at: null })}><Plus className="mr-2 size-4" />New task</Button>}
      />
      <div className="mb-4 flex flex-wrap gap-3">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-9 w-36" aria-label="Status"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {TASK_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={when} onValueChange={setWhen}>
          <SelectTrigger className="h-9 w-36" aria-label="Due date"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any date</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {list.error ? <ErrorState error={list.error} /> : list.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading tasks…</p>
      ) : list.data?.length === 0 ? (
        <EmptyState title="No tasks here" hint="Create a task, or add a follow-up from an inquiry." />
      ) : (
        <ul className="admin-card divide-y divide-border">
          {list.data?.map((task) => {
            const overdue = task.status === "pending" && task.due_at && new Date(task.due_at) < new Date();
            return (
              <li key={task.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 p-3 sm:gap-4 sm:p-4">
                <input
                  type="checkbox" className="size-4" aria-label={`Mark "${task.title}" completed`}
                  checked={task.status === "completed"}
                  onChange={(e) => changeStatus(task, e.target.checked ? "completed" : "pending")}
                />
                <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setEditing(task)}>
                  <span className={task.status !== "pending" ? "text-muted-foreground line-through" : "font-medium"}>{task.title}</span>
                  <span className="block text-xs text-muted-foreground">
                    {[task.contacts?.full_name, task.inquiries ? `Inquiry: ${task.inquiries.name}` : null].filter(Boolean).join(" · ") || "General"}
                  </span>
                </button>
                <span className={overdue ? "text-sm text-red-600" : "text-sm text-muted-foreground"}>{overdue ? "Overdue · " : ""}{formatDateTime(task.due_at)}</span>
                {task.status === "pending" && (
                  <Button variant="ghost" size="sm" onClick={() => changeStatus(task, "cancelled")}>Cancel</Button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit task" : "New task"}</DialogTitle>
            <DialogDescription>Set a due date to see it on the dashboard when it is overdue.</DialogDescription>
          </DialogHeader>
          {editing && (
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2"><Label htmlFor="t-title">Title</Label><Input id="t-title" required maxLength={300} value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="t-desc">Description</Label><Textarea id="t-desc" maxLength={5000} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="t-due">Due</Label><Input id="t-due" type="datetime-local" value={toLocalInput(editing.due_at ?? null)} onChange={(e) => setEditing({ ...editing, due_at: fromLocalInput(e.target.value) })} /></div>
              <div className="flex justify-between">
                <Button type="submit" disabled={save.isPending}>Save task</Button>
                {editing.id && <Button type="button" variant="destructive" onClick={async () => { if (await confirm({ title: "Delete this task?", description: "This cannot be undone.", confirmLabel: "Yes, delete", destructive: true })) remove.mutate(editing.id!); }}>Delete</Button>}
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
