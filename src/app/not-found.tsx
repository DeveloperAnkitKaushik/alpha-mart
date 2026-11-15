import Link from "next/link";
import { ArrowRight, Home, Laptop } from "lucide-react";
import { stateBtn } from "@/components/site/state-styles";
import { SHOP_CATEGORIES } from "@/lib/shop-data";

export const metadata = { title: "Page not found — Alpha Mart" };

export default function NotFound() {
  return (
    <div className="bg-cream">
      <div className="container-x flex min-h-[65vh] flex-col items-center justify-center py-16 text-center">
        <div className="relative">
          <p className="font-brand text-[7rem] leading-none font-extrabold tracking-tighter text-navy/10 select-none sm:text-[10rem]" aria-hidden>
            404
          </p>
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid size-20 animate-float place-items-center rounded-3xl bg-white text-navy shadow-xl ring-1 ring-border">
              <Laptop className="size-9" aria-hidden />
            </span>
          </span>
        </div>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-navy-deep sm:text-4xl">This page is out for refurbishing</h1>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          The link may be old or mistyped. The laptops are still here, though.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/collections/laptops" className={stateBtn.primary}>
            Browse laptops <ArrowRight className="size-4" />
          </Link>
          <Link href="/" className={stateBtn.ghost}>
            <Home className="size-4" /> Go home
          </Link>
        </div>
        <ul className="mt-10 flex flex-wrap justify-center gap-2">
          {SHOP_CATEGORIES.map((c) => (
            <li key={c.slug}>
              <Link href={`/collections/${c.slug}`} className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-navy ring-1 ring-border transition hover:-translate-y-0.5 hover:ring-navy">
                {c.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
