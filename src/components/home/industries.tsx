import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { CategoryTile } from "@/components/site/category-tile";
import { Reveal } from "@/components/site/reveal";
import { CATEGORIES, SUBCATEGORIES } from "@/lib/data";

export function Industries({ banner, bannerAfter = 2 }: { banner?: ReactNode; bannerAfter?: number }) {
  return (
    <section className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8 pt-10">
      <Reveal>
        <h2 className="text-2xl font-bold tracking-tight">Explore by Industry</h2>
      </Reveal>
      <div className="mt-6 space-y-8">
        {CATEGORIES.map((c, idx) => (
          <Fragment key={c.id}>
            <div>
              <Reveal className="mb-3 flex items-end justify-between border-b border-border pb-2">
                <h3 className="text-base font-semibold">{c.label}</h3>
                <Link
                  href={`/category/${c.id}`}
                  className="flex items-center gap-1 text-sm font-medium text-brand hover:underline"
                >
                  View all <ArrowRight className="size-4" />
                </Link>
              </Reveal>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {SUBCATEGORIES[c.id].map((label, i) => (
                  <Reveal key={label} delay={i * 0.05}>
                    <CategoryTile label={label} category={c.id} />
                  </Reveal>
                ))}
              </div>
            </div>
            {idx === bannerAfter && banner ? <div className="-mx-4">{banner}</div> : null}
          </Fragment>
        ))}
      </div>
    </section>
  );
}
