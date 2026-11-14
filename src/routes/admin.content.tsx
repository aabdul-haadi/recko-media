import { createFileRoute } from "@tanstack/react-router";
import { ContentEditorPage } from "@/components/admin/ContentEditorPage";

export const Route = createFileRoute("/admin/content")({ component: ContentEditorPage });
