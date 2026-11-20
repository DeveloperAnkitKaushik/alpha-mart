import { notFound } from "next/navigation";
import { FavoritesView } from "@/components/store/favorites-view";

export const metadata = { title: "Favourites — Alpha Mart" };

export default function FavoritesPage() {
  if (process.env.STORE_ENABLED !== "true") notFound();
  return (
    <div className="container-x py-8">
      <h1 className="mb-6 text-2xl font-extrabold text-navy-deep">Favourites</h1>
      <FavoritesView />
    </div>
  );
}
