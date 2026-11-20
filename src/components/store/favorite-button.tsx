"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useStoreEnabled } from "@/components/store/store-flag";
import { useAuth } from "@/lib/auth-store";
import { toggleFavorite, useIsFavorite } from "@/lib/store/client-data";

function HeartToggle({ productId, className }: { productId: string; className: string }) {
  const saved = useIsFavorite(productId);
  const router = useRouter();

  const onClick = () => {
    const user = useAuth.getState().user;
    if (!user) return router.push("/signin");
    toggleFavorite(user.uid, productId).catch(() => toast.error("Couldn't update favourites. Try again."));
  };

  return (
    <button
      type="button"
      aria-label={saved ? "Remove from favourites" : "Save to favourites"}
      aria-pressed={saved}
      onClick={onClick}
      className={`grid size-11 place-items-center rounded-full bg-white/90 text-navy shadow-sm ring-1 ring-border transition hover:bg-white focus-visible:ring-2 focus-visible:ring-navy focus-visible:outline-none ${className}`}
    >
      <Heart className={`size-5 ${saved ? "fill-ember text-ember" : ""}`} />
    </button>
  );
}

export function FavoriteButton({ productId, className = "" }: { productId: string; className?: string }) {
  return useStoreEnabled() ? <HeartToggle productId={productId} className={className} /> : null;
}
