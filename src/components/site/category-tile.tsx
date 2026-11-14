import Image from "next/image";
import Link from "next/link";
import {
  Cog,
  Cpu,
  FlaskConical,
  Hammer,
  Package,
  Shirt,
  Stethoscope,
  Wheat,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SUB_IMAGES } from "@/lib/sub-images";
import { slugify, type CategoryId } from "@/lib/data";

const VISUALS: Record<CategoryId, { icon: LucideIcon; tint: string }> = {
  machinery: { icon: Cog, tint: "from-violet-500 to-indigo-600" },
  electronics: { icon: Cpu, tint: "from-cyan-400 to-sky-600" },
  apparel: { icon: Shirt, tint: "from-pink-400 to-rose-600" },
  food: { icon: Wheat, tint: "from-amber-400 to-orange-600" },
  building: { icon: Hammer, tint: "from-zinc-400 to-slate-600" },
  chemicals: { icon: FlaskConical, tint: "from-lime-400 to-emerald-600" },
  packaging: { icon: Package, tint: "from-orange-400 to-red-500" },
  medical: { icon: Stethoscope, tint: "from-blue-400 to-blue-700" },
};

function Visual({ slug, category, className }: { slug: string; category: CategoryId; className: string }) {
  const photo = SUB_IMAGES[slug]?.[0];
  const { icon: Icon, tint } = VISUALS[category];
  return (
    <span className={cn("relative block overflow-hidden", className)}>
      {photo ? (
        <Image
          src={photo}
          alt=""
          fill
          unoptimized
          sizes="200px"
          className="object-cover transition duration-500 group-hover:scale-110"
        />
      ) : (
        <span
          className={`grid size-full place-items-center bg-gradient-to-br ${tint} text-white transition duration-500 group-hover:scale-110`}
        >
          <Icon className="size-1/2" />
        </span>
      )}
    </span>
  );
}

export function CategoryTile({
  label,
  category,
  variant = "card",
}: {
  label: string;
  category: CategoryId;
  variant?: "card" | "compact";
}) {
  const slug = slugify(label);
  const href = `/category/${slug}`;

  if (variant === "compact") {
    return (
      <Link
        href={href}
        className="group flex h-full flex-col items-center gap-2.5 rounded-lg bg-white p-4 text-center text-zinc-900 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
      >
        <Visual slug={slug} category={category} className="size-16 rounded-full" />
        <span className="line-clamp-2 text-sm leading-tight font-semibold">{label}</span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-lg hover:shadow-brand/10"
    >
      <Visual slug={slug} category={category} className="h-28 w-full" />
      <span className="line-clamp-2 p-3 text-center text-sm leading-tight font-medium">{label}</span>
    </Link>
  );
}

export { VISUALS as CATEGORY_VISUALS };
