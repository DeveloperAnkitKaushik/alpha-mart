import { Suspense } from "react";
import { ProductView } from "@/components/search/product-view";

export default function ProductPage({ params }: PageProps<"/product/[id]">) {
  return (
    <Suspense>
      {params.then(({ id }) => (
        <ProductView id={id} />
      ))}
    </Suspense>
  );
}
