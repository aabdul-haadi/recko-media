import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/lib/admin/auth";

/** "admin" is shorthand for the admin account's email address. */
function toLoginEmail(value: string) {
  const v = value.trim().toLowerCase();
  return v.includes("@") ? v : `${v}@reckomedia.com`;
}

function AuthFrame({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-background p-8 shadow-sm">
        <div className="mb-8 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-foreground text-background">
            <Lock className="size-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">ReckoMEDIA Admin</p>
            <h1 className="text-xl font-semibold">{title}</h1>
          </div>
        </div>
        <p className="mb-6 text-sm text-muted-foreground">{subtitle}</p>
        {!isSupabaseConfigured() ? (
          <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
            Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to your environment.
          </p>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const { session, isAdmin, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session && isAdmin) navigate({ to: "/admin" });
  }, [loading, session, isAdmin, navigate]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const supabase = getSupabase();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: toLoginEmail(email), password });
    if (signInError) {
      setError("Incorrect email or password.");
      setBusy(false);
      return;
    }
    const { data: admin } = await supabase.rpc("is_admin");
    if (admin !== true) {
      await supabase.auth.signOut();
      setError("This account does not have admin access.");
      setBusy(false);
      return;
    }
    navigate({ to: "/admin" });
  }

  return (
    <AuthFrame title="Sign in" subtitle="Enter your admin credentials to manage the website and inquiries.">
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Username or email</Label>
          <Input id="email" type="text" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy && <Loader2 className="mr-2 size-4 animate-spin" />}Sign in
        </Button>
        <p className="text-center text-sm">
          <Link to="/admin/forgot-password" className="text-muted-foreground underline-offset-4 hover:underline">Forgot your password?</Link>
        </p>
      </form>
    </AuthFrame>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const { error: resetError } = await getSupabase().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    });
    setBusy(false);
    if (resetError) setError("We could not send the reset email. Please try again shortly.");
    else setSent(true);
  }

  return (
    <AuthFrame title="Reset password" subtitle="We will email you a link to choose a new password.">
      {sent ? (
        <p role="status" className="text-sm">If an admin account exists for that email, a reset link is on its way.</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy}>Send reset link</Button>
        </form>
      )}
      <p className="mt-4 text-center text-sm">
        <Link to="/admin/login" className="text-muted-foreground underline-offset-4 hover:underline">Back to sign in</Link>
      </p>
    </AuthFrame>
  );
}

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (password.length < 10) return setError("Use at least 10 characters.");
    if (password !== confirm) return setError("The passwords do not match.");
    setBusy(true);
    setError("");
    const { error: updateError } = await getSupabase().auth.updateUser({ password });
    setBusy(false);
    if (updateError) return setError(updateError.message);
    navigate({ to: "/admin" });
  }

  return (
    <AuthFrame title="Choose a new password" subtitle="Pick a strong password you do not use elsewhere.">
      {loading ? (
        <Loader2 className="size-5 animate-spin" aria-label="Loading" />
      ) : !session ? (
        <p role="alert" className="text-sm">
          This reset link is invalid or has expired. <Link to="/admin/forgot-password" className="underline">Request a new one</Link>.
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input id="password" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input id="confirm" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy}>Update password</Button>
        </form>
      )}
    </AuthFrame>
  );
}
