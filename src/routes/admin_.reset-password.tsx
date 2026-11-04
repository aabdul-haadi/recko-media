import { createFileRoute } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/admin/auth";
import { ResetPasswordPage } from "@/components/admin/AuthPages";

export const Route = createFileRoute("/admin_/reset-password")({
  ssr: false,
  head: () => ({ meta: [{ title: "Admin | ReckoMEDIA" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: () => (
    <AuthProvider>
      <ResetPasswordPage />
    </AuthProvider>
  ),
});
