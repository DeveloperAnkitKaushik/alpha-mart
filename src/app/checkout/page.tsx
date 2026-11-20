import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CheckoutView } from "@/components/store/checkout-view";
import { FormCardSkeleton } from "@/components/site/skeletons";

export const metadata = { title: "Checkout — Alpha Mart" };

export default function CheckoutPage() {
  if (process.env.STORE_ENABLED !== "true") notFound();
  return (
    <div className="container-x py-8">
      <h1 className="mb-6 text-2xl font-extrabold text-navy-deep">Checkout</h1>
      <Suspense fallback={<FormCardSkeleton />}>
        <CheckoutView />
      </Suspense>
    </div>
  );
}
