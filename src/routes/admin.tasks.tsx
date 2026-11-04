import { createFileRoute } from "@tanstack/react-router";
import { TasksPage } from "@/components/admin/TasksPage";

export const Route = createFileRoute("/admin/tasks")({ component: TasksPage });
