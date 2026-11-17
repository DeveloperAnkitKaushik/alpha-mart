import { Suspense } from "react";
import { ProductSkeleton } from "@/components/site/skeletons";
import { notFound } from "next/navigation";
import { ShopProduct } from "@/components/shop/product/shop-product";
import { getSiteContent } from "@/lib/site-content-server";

async function Product({ params }: { params: PageProps<"/product/[id]">["params"] }) {
  const [{ id }, { products }] = await Promise.all([params, getSiteContent()]);
  const deal = products.find((d) => d.id === id);
  if (!deal) notFound();
  return <ShopProduct deal={deal} related={products.filter((d) => d.id !== id)} />;
}

export default function ProductPage({ params }: PageProps<"/product/[id]">) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <Product params={params} />
    </Suspense>
  );
}
