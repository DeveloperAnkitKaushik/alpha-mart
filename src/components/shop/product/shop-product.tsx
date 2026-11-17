import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { AlphaTrust } from "@/components/shop/alpha-trust";
import { DealRail } from "@/components/shop/deals";
import { ServiceCoverage } from "@/components/shop/service-coverage";
import { ProductBuyBox } from "@/components/shop/product/product-buy-box";
import { ProductDetails } from "@/components/shop/product/product-details";
import { ProductGallery } from "@/components/shop/product/product-gallery";
import type { Deal } from "@/lib/shop-data";

export function ShopProduct({ deal, related }: { deal: Deal; related: Deal[] }) {
  return (
    <div className="bg-cream">
      <div className="container-x pt-6">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-navy">Home</Link>
          <ChevronRight className="size-3.5" />
          <Link href="/collections/laptops" className="hover:text-navy">Refurbished laptops</Link>
          <ChevronRight className="size-3.5" />
          <span className="line-clamp-1 font-medium text-foreground">{deal.name.split("|")[0].trim()}</span>
        </nav>

        <div className="mt-5 grid gap-8 lg:grid-cols-[1.05fr_1fr]">
          <div className="self-start lg:sticky lg:top-32">
            <ProductGallery deal={deal} />
          </div>
          <ProductBuyBox deal={deal} />
        </div>

        <div className="mt-10">
          <ProductDetails deal={deal} />
        </div>

        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-4 text-2xl font-extrabold text-navy">You may also like</h2>
            <DealRail deals={related} />
          </section>
        )}
      </div>
      <AlphaTrust />
      <ServiceCoverage />
    </div>
  );
}
