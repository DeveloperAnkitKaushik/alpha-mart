"use client";

import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion } from "motion/react";
import { CheckCircle2, MessageCircle, PhoneCall } from "lucide-react";
import { createRequirement } from "@/lib/api";
import { requirementSchema } from "@/lib/data";

export function FooterQuote() {
  const [error, setError] = useState("");
  const mutation = useMutation({
    mutationFn: (phone: string) =>
      createRequirement({
        title: "Callback request from footer",
        category: "electronics",
        quantity: "1",
        city: "Not specified",
        name: "Callback request",
        phone,
      }),
    onError: () => setError("Could not send. Please try again."),
  });

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const phone = String(new FormData(e.currentTarget).get("phone") ?? "");
    const parsed = requirementSchema.shape.phone.safeParse(phone);
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    setError("");
    mutation.mutate(parsed.data);
  };

  return (
    <div className="w-full max-w-sm rounded-2xl bg-white/80 p-5 text-left shadow-xl ring-1 ring-white backdrop-blur">
      {mutation.isSuccess ? (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-3 py-3">
          <CheckCircle2 className="size-9 shrink-0 text-emerald-600" />
          <div>
            <p className="font-semibold text-navy-deep">Request received</p>
            <p className="text-sm text-navy-deep/70">
              {mutation.data.demo ? "Demo mode: nothing was saved." : "We will call you back shortly."}
            </p>
          </div>
        </motion.div>
      ) : (
        <>
          <p className="flex items-center gap-2 text-lg font-bold text-navy-deep">
            <PhoneCall className="size-5 text-ember" /> Get a free quote
          </p>
          <p className="mt-1 text-sm text-navy-deep/70">Leave your number and we will call you back.</p>
          <form onSubmit={onSubmit} noValidate className="mt-4 flex gap-2">
            <input
              name="phone"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              autoComplete="tel-national"
              aria-label="Mobile number"
              aria-invalid={error ? true : undefined}
              placeholder="10-digit mobile number"
              className="h-11 min-w-0 flex-1 rounded-lg border border-navy-deep/20 bg-white px-3 text-sm outline-none transition focus:border-navy focus:ring-3 focus:ring-navy/20"
            />
            <button
              type="submit"
              disabled={mutation.isPending}
              className="h-11 shrink-0 rounded-lg bg-navy-deep px-4 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-60"
            >
              {mutation.isPending ? "Sending…" : "Call me"}
            </button>
          </form>
          {error && (
            <p role="alert" className="mt-2 text-xs text-destructive">
              {error}
            </p>
          )}
          <a
            href="https://wa.me/?text=Hi%20Alpha%20Mart%2C%20I%20would%20like%20a%20quote."
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:underline"
          >
            <MessageCircle className="size-3.5" /> Or chat on WhatsApp
          </a>
        </>
      )}
    </div>
  );
}
