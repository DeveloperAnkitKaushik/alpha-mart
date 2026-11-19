"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { DealCard } from "@/components/shop/deals";
import { SignInView } from "@/components/site/signin-view";
import { useSiteContent } from "@/components/site/site-content";
import { StateCard } from "@/components/site/state-card";
import { stateBtn } from "@/components/site/state-styles";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-store";
import { useFavorites } from "@/lib/store/client-data";

export function FavoritesView() {
  const ready = useAuth((s) => s.ready);
  const uid = useAuth((s) => s.user?.uid);
  const ids = useFavorites();
  const products = useSiteContent().products;

  if (!ready) return <Skeleton className="h-64" />;
  if (!uid) return <SignInView embedded />;
  const saved = products.filter((p) => ids.includes(p.id));
  if (saved.length === 0) {
    return (
      <StateCard icon={Heart} title="No favourites yet" body="Tap the heart on any laptop to save it here.">
        <Link href="/collections/all" className={stateBtn.primary}>
          Browse laptops
        </Link>
      </StateCard>
    );
  }
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {saved.map((d) => (
        <li key={d.id} className="flex">
          <DealCard deal={d} />
        </li>
      ))}
    </ul>
  );
}
