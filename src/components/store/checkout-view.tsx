"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { SignInView } from "@/components/site/signin-view";
import { Skeleton } from "@/components/ui/skeleton";
import { ADDRESS_FORM_ID, AddressForm } from "@/components/store/address-form";
import { EmptyCart, TotalsCard, useCartReady, useTotals } from "@/components/store/cart-shared";
import { useAuth } from "@/lib/auth-store";
import { formatPrice } from "@/lib/data";
import { useCart } from "@/lib/store/cart-store";
import { createOrder } from "@/lib/store/checkout-actions";
import { loadProfile, saveProfile } from "@/lib/store/client-data";
import { couponCodeSchema, type Address } from "@/lib/store/schemas";

function Checkout({ uid }: { uid: string }) {
  const lines = useCart((s) => s.lines);
  const raw = useSearchParams().get("code");
  const parsed = raw ? couponCodeSchema.safeParse(raw) : null;
  const code = parsed?.success ? parsed.data : null;
  const result = useTotals(lines, code);
  const profile = useQuery({ queryKey: ["profile", uid], queryFn: () => loadProfile().catch(() => null) });
  const [paying, setPaying] = useState(false);

  const pay = async (address: Address) => {
    if (!useAuth.getState().user || paying) return;
    setPaying(true);
    try {
      await saveProfile(address).catch(() => {});
      const order = await createOrder(lines, code, address);
      if (order.ok) {
        window.location.href = order.checkoutUrl;
        return;
      }
      toast.error(order.error);
    } catch {
      toast.error("Couldn't start the payment. Try again.");
    }
    setPaying(false);
  };

  if (lines.length === 0) return <EmptyCart />;
  const total = result.totals?.total;
  const canPay = total !== undefined && !result.couponError && !paying;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <section className="rounded-3xl bg-white p-5 ring-1 ring-border">
        <h2 className="mb-4 text-lg font-extrabold text-navy-deep">Delivery address</h2>
        {profile.isPending ? <Skeleton className="h-64" /> : <AddressForm initial={profile.data ?? null} onSubmit={(a) => void pay(a)} />}
      </section>
      <TotalsCard result={result}>
        {result.couponError && <p role="alert" className="mt-3 text-sm text-destructive">{result.couponError} Go back to the cart to fix the coupon.</p>}
        <button
          type="submit"
          form={ADDRESS_FORM_ID}
          disabled={!canPay}
          className="mt-5 h-12 w-full rounded-xl bg-ember font-bold text-white disabled:bg-muted disabled:text-muted-foreground"
        >
          {paying ? "Redirecting…" : total !== undefined ? `Pay ${formatPrice(total)} with PhonePe` : "Pay with PhonePe"}
        </button>
      </TotalsCard>
    </div>
  );
}

export function CheckoutView() {
  const ready = useCartReady();
  const authReady = useAuth((s) => s.ready);
  const uid = useAuth((s) => s.user?.uid ?? null);

  if (!ready || !authReady) return null;
  if (!uid) return <SignInView embedded />;
  return <Checkout uid={uid} />;
}
