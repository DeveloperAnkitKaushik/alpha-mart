import Image from "next/image";
import Link from "next/link";
import { CATEGORIES } from "@/lib/data";

export function Footer() {
  return (
    <footer className="border-t border-border/60 px-4 py-12">
      <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
        <div className="space-y-3">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Image src="/logo-wordmark.png" alt="Alpha Mart" width={108} height={36} priority className="h-9 w-auto" />
          </Link>
          <p className="max-w-xs text-sm text-muted-foreground">
            Connecting Indian buyers with verified manufacturers, wholesalers and exporters.
          </p>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-medium">Categories</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {CATEGORIES.slice(0, 5).map((c) => (
              <li key={c.id}>
                <Link href={`/category/${c.id}`} className="hover:text-foreground">
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-medium">Explore</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/search" className="hover:text-foreground">All products</Link></li>
            <li><Link href="/requirement" className="hover:text-foreground">Post a requirement</Link></li>
            <li><Link href="/dashboard" className="hover:text-foreground">Dashboard</Link></li>
            <li><Link href="/credits" className="hover:text-foreground">Photo credits</Link></li>
          </ul>
        </div>
      </div>
      <p className="mx-auto mt-10 max-w-5xl text-xs text-muted-foreground">
        © Alpha Mart. Demo project.
      </p>
    </footer>
  );
}
