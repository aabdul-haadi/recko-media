import { createFileRoute } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/admin/auth";
import { ForgotPasswordPage } from "@/components/admin/AuthPages";

export const Route = createFileRoute("/admin_/forgot-password")({
  ssr: false,
  head: () => ({ meta: [{ title: "Admin | ReckoMEDIA" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: () => (
    <AuthProvider>
      <ForgotPasswordPage />
    </AuthProvider>
  ),
});
