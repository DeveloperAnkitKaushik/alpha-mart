"use client";

import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, fieldErrors } from "@/components/site/field";
import { createLead } from "@/lib/api";
import { cn } from "@/lib/utils";
import { leadSchema, type Product } from "@/lib/data";

export function LeadDialog({ product, className }: { product: Product; className?: string }) {
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: createLead,
    onSuccess: ({ demo }) => {
      toast.success(`Request sent to ${product.supplier.name}`, {
        description: demo ? "Demo mode: Firebase is not configured, nothing was saved." : "They will contact you shortly.",
      });
      setOpen(false);
    },
    onError: () => toast.error("Could not send your request. Try again."),
  });

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const result = leadSchema.safeParse({
      productId: product.id,
      supplierId: product.supplier.id,
      name: f.get("name"),
      phone: f.get("phone"),
      quantity: f.get("quantity"),
      message: f.get("message") || undefined,
    });
    if (!result.success) return setErrors(fieldErrors(result.error.issues));
    setErrors({});
    mutation.mutate(result.data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="lg" className={cn("h-11 w-full rounded-full text-base", className)} />}>
        Get best price
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Get best price</DialogTitle>
          <DialogDescription>{product.name}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Field label="Your name" error={errors.name}>
            <Input name="name" autoComplete="name" />
          </Field>
          <Field label="Mobile number" error={errors.phone}>
            <Input name="phone" type="tel" inputMode="numeric" maxLength={10} autoComplete="tel-national" />
          </Field>
          <Field label={`Quantity (${product.unit})`} error={errors.quantity}>
            <Input name="quantity" defaultValue={product.moq.split(" ")[0]} />
          </Field>
          <Field label="Message (optional)" error={errors.message}>
            <Textarea name="message" rows={3} />
          </Field>
          <Button type="submit" className="h-10 w-full" disabled={mutation.isPending}>
            {mutation.isPending ? "Sending…" : "Send enquiry"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
