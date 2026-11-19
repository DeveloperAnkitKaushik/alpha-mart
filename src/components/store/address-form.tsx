"use client";

import { useState, type FormEvent } from "react";
import { Field, fieldErrors } from "@/components/site/field";
import { Input } from "@/components/ui/input";
import { addressSchema, type Address } from "@/lib/store/schemas";

export const ADDRESS_FORM_ID = "address-form";

const FIELDS: { name: keyof Address; label: string; autoComplete: string; inputMode?: "numeric" | "tel"; maxLength?: number }[] = [
  { name: "name", label: "Full name", autoComplete: "name" },
  { name: "phone", label: "Mobile number", autoComplete: "tel-national", inputMode: "tel", maxLength: 10 },
  { name: "line1", label: "Address line 1", autoComplete: "address-line1" },
  { name: "line2", label: "Address line 2 (optional)", autoComplete: "address-line2" },
  { name: "city", label: "City", autoComplete: "address-level2" },
  { name: "state", label: "State", autoComplete: "address-level1" },
  { name: "pincode", label: "PIN code", autoComplete: "postal-code", inputMode: "numeric", maxLength: 6 },
];

const MESSAGES: Partial<Record<keyof Address, string>> = {
  name: "Enter your full name",
  phone: "Enter a 10-digit Indian mobile number",
  line1: "Enter your address",
  city: "Enter your city",
  state: "Enter your state",
  pincode: "Enter a valid 6-digit PIN code",
};

export function AddressForm({ initial, onSubmit }: { initial: Address | null; onSubmit: (address: Address) => void }) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const result = addressSchema.safeParse(Object.fromEntries(FIELDS.map((x) => [x.name, f.get(x.name)])));
    if (!result.success) {
      const raw = fieldErrors(result.error.issues);
      return setErrors(Object.fromEntries(Object.keys(raw).map((k) => [k, MESSAGES[k as keyof Address] ?? raw[k]])));
    }
    setErrors({});
    onSubmit(result.data);
  };

  return (
    <form id={ADDRESS_FORM_ID} onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
      {FIELDS.map((x) => (
        <div key={x.name} className={x.name === "line1" || x.name === "line2" ? "sm:col-span-2" : ""}>
          <Field label={x.label} error={errors[x.name]}>
            <Input
              name={x.name}
              defaultValue={initial?.[x.name] ?? ""}
              autoComplete={x.autoComplete}
              inputMode={x.inputMode}
              maxLength={x.maxLength}
              aria-invalid={Boolean(errors[x.name])}
              className="h-11"
            />
          </Field>
        </div>
      ))}
    </form>
  );
}
