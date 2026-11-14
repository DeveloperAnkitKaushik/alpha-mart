import { Suspense } from "react";
import { SearchView } from "@/components/search/search-view";

export const metadata = { title: "Products — Alpha Mart" };

export default function SearchPage() {
  return (
    <Suspense>
      <SearchView />
    </Suspense>
  );
}
