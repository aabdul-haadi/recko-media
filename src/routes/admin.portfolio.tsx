import { createFileRoute } from "@tanstack/react-router";
import { PortfolioAdminPage } from "@/components/admin/PortfolioAdminPage";
export const Route = createFileRoute("/admin/portfolio")({ component: PortfolioAdminPage });
