import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/admin/auth";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminLayout } from "@/components/admin/AdminLayout";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({ meta: [{ title: "Admin | ReckoMEDIA" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: () => (
    <AuthProvider>
      <AdminGuard>
        <AdminLayout>
          <Outlet />
        </AdminLayout>
      </AdminGuard>
    </AuthProvider>
  ),
});
