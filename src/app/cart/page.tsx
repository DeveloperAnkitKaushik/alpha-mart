import { notFound } from "next/navigation";
import { CartView } from "@/components/store/cart-view";

export const metadata = { title: "Your cart — Alpha Mart" };

export default function CartPage() {
  if (process.env.STORE_ENABLED !== "true") notFound();
  return (
    <div className="container-x py-8">
      <h1 className="mb-6 text-2xl font-extrabold text-navy-deep">Your cart</h1>
      <CartView />
    </div>
  );
}
