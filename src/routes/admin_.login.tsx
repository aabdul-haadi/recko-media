import { createFileRoute } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/admin/auth";
import { LoginPage } from "@/components/admin/AuthPages";

export const Route = createFileRoute("/admin_/login")({
  ssr: false,
  head: () => ({ meta: [{ title: "Admin | ReckoMEDIA" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: () => (
    <AuthProvider>
      <LoginPage />
    </AuthProvider>
  ),
});
