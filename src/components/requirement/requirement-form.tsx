"use client";

import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion } from "motion/react";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, fieldErrors, selectClass } from "@/components/site/field";
import { createRequirement } from "@/lib/api";
import { CATEGORIES, requirementSchema } from "@/lib/data";

export function RequirementForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const mutation = useMutation({
    mutationFn: createRequirement,
    onError: () => toast.error("Could not post your requirement. Try again."),
  });

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const result = requirementSchema.safeParse({
      title: f.get("title"),
      category: f.get("category"),
      quantity: f.get("quantity"),
      city: f.get("city"),
      budget: f.get("budget") || undefined,
      details: f.get("details") || undefined,
      name: f.get("name"),
      phone: f.get("phone"),
    });
    if (!result.success) return setErrors(fieldErrors(result.error.issues));
    setErrors({});
    mutation.mutate(result.data);
  };

  if (mutation.isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-3 rounded-3xl border border-border bg-card p-12 text-center"
      >
        <CheckCircle2 className="size-12 text-brand" />
        <h2 className="text-xl font-semibold">Requirement posted</h2>
        <p className="text-muted-foreground">
          {mutation.data.demo
            ? "Demo mode: Firebase is not configured, so nothing was saved."
            : "Matching suppliers will reach out to you shortly."}
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5 rounded-3xl border border-border bg-card p-6 sm:p-8">
      <Field label="What do you need?" error={errors.title}>
        <Input name="title" placeholder="e.g. 500 cotton t-shirts, 180 GSM" />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Category" error={errors.category}>
          <select name="category" defaultValue="" className={selectClass}>
            <option value="" disabled>Select…</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Quantity" error={errors.quantity}>
          <Input name="quantity" placeholder="e.g. 500 pieces" />
        </Field>
        <Field label="Delivery city" error={errors.city}>
          <Input name="city" autoComplete="address-level2" />
        </Field>
        <Field label="Budget (optional)" error={errors.budget}>
          <Input name="budget" placeholder="e.g. ₹1,00,000" />
        </Field>
      </div>
      <Field label="Details (optional)" error={errors.details}>
        <Textarea name="details" rows={3} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" error={errors.name}>
          <Input name="name" autoComplete="name" />
        </Field>
        <Field label="Mobile number" error={errors.phone}>
          <Input name="phone" type="tel" inputMode="numeric" maxLength={10} autoComplete="tel-national" />
        </Field>
      </div>
      <Button type="submit" className="h-11 w-full rounded-full text-base" disabled={mutation.isPending}>
        {mutation.isPending ? "Posting…" : "Post requirement"}
      </Button>
    </form>
  );
}
