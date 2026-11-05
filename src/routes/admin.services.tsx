import { createFileRoute } from "@tanstack/react-router";
import { ServicesAdminPage } from "@/components/admin/ServicesAdminPage";

export const Route = createFileRoute("/admin/services")({ component: ServicesAdminPage });
