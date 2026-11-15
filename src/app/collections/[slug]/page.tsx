import { Suspense } from "react";
import { CollectionSkeleton } from "@/components/site/skeletons";
import { CollectionView } from "@/components/shop/collection/collection-view";

export default function CollectionPage({ params }: PageProps<"/collections/[slug]">) {
  return <Suspense fallback={<CollectionSkeleton />}>{params.then(({ slug }) => <CollectionView slug={slug} />)}</Suspense>;
}
