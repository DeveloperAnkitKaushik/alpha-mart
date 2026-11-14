"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { PackageSearch } from "lucide-react";
import { ProductCard } from "@/components/site/product-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Product } from "@/lib/data";

const PAGE = 24;

export function ProductGrid({ products, loading }: { products: Product[]; loading: boolean }) {
  const [shown, setShown] = useState(PAGE);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-80 rounded-2xl" />
        ))}
      </div>
    );
  }
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
        <PackageSearch className="size-10" />
        <p>No products match. Try a different filter, or post a requirement.</p>
      </div>
    );
  }
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {products.slice(0, shown).map((p) => (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
            >
              <ProductCard product={p} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {shown < products.length && (
        <div className="mt-8 flex justify-center">
          <Button variant="outline" onClick={() => setShown((n) => n + PAGE)}>
            Show more ({products.length - shown} left)
          </Button>
        </div>
      )}
    </>
  );
}
