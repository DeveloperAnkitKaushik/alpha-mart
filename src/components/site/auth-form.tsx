"use client";

import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { authErrorMessage, resetPassword, signInWithEmail, signInWithGoogle, signUpWithEmail } from "@/lib/auth-store";

type Mode = "signin" | "signup";
type Busy = "google" | "email" | "reset" | null;

const STRENGTH = ["bg-[#EA4335]", "bg-[#FBBC05]", "bg-[#4285F4]", "bg-[#34A853]"];
const strength = (p: string) =>
  [p.length >= 6, p.length >= 10, /\d/.test(p), /[^A-Za-z0-9]/.test(p) || /[A-Z]/.test(p)].filter(Boolean).length;

export function GoogleLogo({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

const inputWrap =
  "group flex h-12 items-center gap-3 rounded-xl border border-border bg-white px-4 transition focus-within:border-[#4285F4] focus-within:ring-4 focus-within:ring-[#4285F4]/15";

export function AuthForm({ onSuccess }: { onSuccess?: () => void }) {
  const [mode, setMode] = useState<Mode>("signin");
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);

  const run = async (kind: Busy, action: () => Promise<unknown>, done?: () => void) => {
    setBusy(kind);
    setError(null);
    setInfo(null);
    try {
      await action();
      if (done) done();
      else {
        toast.success(mode === "signin" ? "Welcome back!" : "Account created. Welcome to Alpha Mart!");
        onSuccess?.();
      }
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void run("email", () => (mode === "signin" ? signInWithEmail(email.trim(), password) : signUpWithEmail(email.trim(), password)));
  };

  const onReset = () => {
    if (!email.trim()) return setError("Enter your email above, then tap Forgot password.");
    void run("reset", () => resetPassword(email.trim()), () => setInfo(`Reset link sent to ${email.trim()}. Check your inbox.`));
  };

  const score = strength(password);

  return (
    <div>
      <div role="tablist" className="relative grid grid-cols-2 rounded-xl bg-muted p-1">
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => {
              setMode(m);
              setError(null);
              setInfo(null);
            }}
            className={`relative z-10 rounded-lg py-2 text-sm font-semibold transition ${mode === m ? "text-navy" : "text-muted-foreground hover:text-foreground"}`}
          >
            {mode === m && <motion.span layoutId="auth-tab" className="absolute inset-0 -z-10 rounded-lg bg-white shadow-sm" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
            {m === "signin" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      <button
        type="button"
        disabled={busy !== null}
        onClick={() => void run("google", signInWithGoogle)}
        className="mt-5 flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-border bg-white text-sm font-semibold text-[#3c4043] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#f8fafd] hover:shadow-md disabled:opacity-60"
      >
        {busy === "google" ? <Loader2 className="size-5 animate-spin text-[#4285F4]" /> : <GoogleLogo />}
        Continue with Google
      </button>

      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> or with email <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={onSubmit} noValidate className="space-y-3">
        <label className={inputWrap}>
          <Mail className="size-4 text-muted-foreground transition group-focus-within:text-[#4285F4]" />
          <span className="sr-only">Email</span>
          <input type="email" required autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none" />
        </label>
        <label className={inputWrap}>
          <Lock className="size-4 text-muted-foreground transition group-focus-within:text-[#4285F4]" />
          <span className="sr-only">Password</span>
          <input
            type={show ? "text" : "password"}
            required
            minLength={6}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            placeholder={mode === "signin" ? "Your password" : "At least 6 characters"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
          <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"} className="text-muted-foreground transition hover:text-foreground">
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </label>

        <AnimatePresence initial={false} mode="wait">
          {mode === "signup" ? (
            <motion.div key="meter" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="flex gap-1.5 pt-1" aria-hidden>
                {STRENGTH.map((c, i) => (
                  <span key={c} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i < score ? c : "bg-muted"}`} />
                ))}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{["Too short", "Weak", "Okay", "Good", "Strong"][score]} password</p>
            </motion.div>
          ) : (
            <motion.div key="forgot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-right">
              <button type="button" onClick={onReset} className="text-xs font-semibold text-[#4285F4] hover:underline">
                {busy === "reset" ? "Sending…" : "Forgot password?"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {(error || info) && (
            <motion.p
              key={error ?? info}
              role={error ? "alert" : "status"}
              initial={{ opacity: 0, x: error ? -8 : 0 }}
              animate={{ opacity: 1, x: error ? [8, -6, 4, 0] : 0 }}
              exit={{ opacity: 0 }}
              className={`rounded-xl px-3 py-2 text-sm ${error ? "bg-[#EA4335]/10 text-[#c5221f]" : "bg-[#34A853]/10 text-[#137333]"}`}
            >
              {error ?? info}
            </motion.p>
          )}
        </AnimatePresence>

        <button
          type="submit"
          disabled={busy !== null}
          className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-navy text-sm font-bold text-white shadow-lg shadow-navy/20 transition hover:-translate-y-0.5 hover:bg-navy-deep disabled:opacity-60"
        >
          {busy === "email" ? <Loader2 className="size-4 animate-spin" /> : null}
          {mode === "signin" ? "Sign in" : "Create account"}
          {busy !== "email" && <ArrowRight className="size-4 transition group-hover:translate-x-1" />}
        </button>
      </form>

      <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="size-3.5 text-[#34A853]" /> Secured by Google Firebase. We never share your email.
      </p>
    </div>
  );
}
