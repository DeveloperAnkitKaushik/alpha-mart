import { Suspense } from "react";
import { ProductSkeleton } from "@/components/site/skeletons";
import { notFound } from "next/navigation";
import { ShopProduct } from "@/components/shop/product/shop-product";
import { DEALS } from "@/lib/shop-data";

export default function ProductPage({ params }: PageProps<"/product/[id]">) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      {params.then(({ id }) => {
        const deal = DEALS.find((d) => d.id === id);
        if (!deal) notFound();
        return <ShopProduct deal={deal} />;
      })}
    </Suspense>
  );
}
