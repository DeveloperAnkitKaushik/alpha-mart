import { HeroCarousel } from "@/components/shop/hero-carousel";
import { TrustStrip } from "@/components/shop/trust-strip";
import { SaleBanner } from "@/components/shop/sale-banner";
import { Deals } from "@/components/shop/deals";
import { ShopByBudget, ShopByCategory } from "@/components/shop/browse";
import { LiveBanner } from "@/components/shop/live-banner";
import { NewDrops } from "@/components/shop/new-drops";
import { AlphaTrust } from "@/components/shop/alpha-trust";
import { ServiceCoverage } from "@/components/shop/service-coverage";
import { Impact } from "@/components/shop/impact";
import { Faq } from "@/components/shop/faq";

export default function Home() {
  return (
    <div className="bg-cream">
      <HeroCarousel />
      <TrustStrip />
      <SaleBanner />
      <Deals />
      <ShopByCategory />
      <LiveBanner />
      <NewDrops />
      <ShopByBudget />
      <AlphaTrust />
      <ServiceCoverage />
      <Impact />
      <Faq />
    </div>
  );
}
