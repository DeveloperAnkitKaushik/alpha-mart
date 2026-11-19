import { notFound } from "next/navigation";
import { OrdersList } from "@/components/store/orders-list";

export const metadata = { title: "My orders — Alpha Mart" };

export default function OrdersPage() {
  if (process.env.STORE_ENABLED !== "true") notFound();
  return (
    <div className="container-x py-8">
      <h1 className="mb-6 text-2xl font-extrabold text-navy-deep">My orders</h1>
      <OrdersList />
    </div>
  );
}
