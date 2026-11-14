import { Hero } from "@/components/home/hero";
import { Trending } from "@/components/home/trending";
import { Industries } from "@/components/home/industries";
import { VisualSearchBanner } from "@/components/home/visual-search-banner";
import { Cta, Featured } from "@/components/home/sections";

export default function Home() {
  return (
    <>
      <div className="bg-gradient-to-b from-hero-from via-hero-from to-hero-to">
        <Hero />
        <Trending />
      </div>
      <Industries banner={<VisualSearchBanner />} />
      <Featured />
      <Cta />
    </>
  );
}
