import { Suspense } from "react";
import { CategoryView } from "@/components/search/category-view";

export default function CategoryPage({ params }: PageProps<"/category/[slug]">) {
  return (
    <Suspense>
      {params.then(({ slug }) => (
        <CategoryView slug={slug} />
      ))}
    </Suspense>
  );
}
