import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { CircleNotch as Loader2 } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "@/lib/admin/auth";
import { AuthFrame } from "./AuthFrame";

/** "admin" is shorthand for the admin account's email address. */
function toLoginEmail(value: string) {
  const v = value.trim().toLowerCase();
  return v.includes("@") ? v : `${v}@reckomedia.com`;
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
    <AuthFrame title="Sign in">
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
    <AuthFrame title="Reset password">
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
    <AuthFrame title="Choose a new password">
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
