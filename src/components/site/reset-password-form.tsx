"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { CheckCircle2, Eye, EyeOff, Loader2, Lock, TriangleAlert } from "lucide-react";
import { authErrorMessage, setNewPassword } from "@/lib/auth-store";

const panel = "mx-auto max-w-md rounded-3xl bg-white p-6 shadow-xl ring-1 ring-border sm:p-10";
const primaryBtn =
  "flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-navy text-sm font-bold text-white shadow-lg shadow-navy/20 transition hover:bg-navy-deep disabled:opacity-60";

function Notice({ ok, title, body }: { ok: boolean; title: string; body: string }) {
  const Icon = ok ? CheckCircle2 : TriangleAlert;
  return (
    <div className="text-center">
      <Icon className={`mx-auto size-12 ${ok ? "text-brand" : "text-ember"}`} />
      <h1 className="mt-3 text-2xl font-extrabold text-navy">{title}</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">{body}</p>
      <Link href="/signin" className={primaryBtn}>
        {ok ? "Sign in" : "Back to sign in"}
      </Link>
    </div>
  );
}

export function ResetPasswordForm({ token }: { token: string | null }) {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (password.length < 6) return setError("Use at least 6 characters for your password.");
    setBusy(true);
    setError(null);
    try {
      await setNewPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container-x py-10">
      <div className={panel}>
        {!token ? (
          <Notice ok={false} title="Link expired" body="This reset link is invalid or has expired. Ask for a new one from the sign-in page." />
        ) : done ? (
          <Notice ok title="Password updated" body="Sign in with your new password." />
        ) : (
          <form onSubmit={onSubmit} noValidate className="space-y-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-navy">Set a new password</h1>
              <p className="mt-1 text-sm text-muted-foreground">Choose a password with at least 6 characters.</p>
            </div>
            <label className="flex h-12 items-center gap-3 rounded-xl border border-border bg-white pl-4 transition focus-within:border-navy focus-within:ring-4 focus-within:ring-navy/15">
              <Lock className="size-4 text-muted-foreground" />
              <span className="sr-only">New password</span>
              <input
                type={show ? "text" : "password"}
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                aria-label={show ? "Hide password" : "Show password"}
                className="grid size-11 shrink-0 place-items-center text-muted-foreground transition hover:text-foreground"
              >
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </label>
            {error && (
              <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <button type="submit" disabled={busy} className={primaryBtn}>
              {busy && <Loader2 className="size-4 animate-spin" />}
              Update password
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
