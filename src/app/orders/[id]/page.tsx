import { Suspense } from "react";
import { notFound } from "next/navigation";
import { OrderDetail } from "@/components/store/order-detail";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = { title: "Your order — Alpha Mart" };

async function Detail({ params }: { params: PageProps<"/orders/[id]">["params"] }) {
  const { id } = await params;
  return <OrderDetail orderId={id} />;
}

export default function OrderPage({ params }: PageProps<"/orders/[id]">) {
  if (process.env.STORE_ENABLED !== "true") notFound();
  return (
    <div className="container-x py-8">
      <h1 className="mb-6 text-2xl font-extrabold text-navy-deep">Your order</h1>
      <Suspense fallback={<Skeleton className="h-64" />}>
        <Detail params={params} />
      </Suspense>
    </div>
  );
}
