"use client";

import { useState, type FormEvent, type ReactElement } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/site/field";
import { signInWithEmail, signInWithGoogle, signUpWithEmail } from "@/lib/auth-store";

type Mode = "signin" | "signup";

export function AuthDialog({ trigger, label = "Sign in" }: { trigger: ReactElement; label?: string }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("signin");
  const [pending, setPending] = useState(false);

  const run = async (action: () => Promise<unknown>) => {
    setPending(true);
    try {
      await action();
      setOpen(false);
    } catch {
      toast.error(mode === "signin" ? "Sign-in failed. Check your details." : "Could not create the account.");
    } finally {
      setPending(false);
    }
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email"));
    const password = String(f.get("password"));
    void run(() => (mode === "signin" ? signInWithEmail(email, password) : signUpWithEmail(email, password)));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger}>{label}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "signin" ? "Welcome back" : "Create your account"}</DialogTitle>
          <DialogDescription>Sign in to track enquiries and see buyer requirements.</DialogDescription>
        </DialogHeader>
        <Button variant="outline" className="h-10 w-full" disabled={pending} onClick={() => void run(signInWithGoogle)}>
          Continue with Google
        </Button>
        <p className="text-center text-xs text-muted-foreground">or use email</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Email">
            <Input name="email" type="email" required autoComplete="email" />
          </Field>
          <Field label="Password">
            <Input
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
            />
          </Field>
          <Button type="submit" className="h-10 w-full" disabled={pending}>
            {mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>
        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="text-center text-sm text-muted-foreground hover:text-foreground"
        >
          {mode === "signin" ? "New here? Create an account" : "Have an account? Sign in"}
        </button>
      </DialogContent>
    </Dialog>
  );
}
