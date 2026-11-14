"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Camera, LayoutGrid, LogOut, MapPin, MessageSquare, Search, Store, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthDialog } from "@/components/site/auth-dialog";
import { signOutUser, useAuth } from "@/lib/auth-store";
import { isFirebaseConfigured } from "@/lib/firebase";
import { CITIES } from "@/lib/data";

const NAV = [
  { href: "/search", label: "Products", icon: LayoutGrid },
  { href: "/dashboard", label: "Sell", icon: Store },
  { href: "/dashboard", label: "Messages", icon: MessageSquare },
];

const itemClass =
  "flex flex-col items-center gap-0.5 rounded-lg px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-brand/10 hover:text-brand";

function AuthItem() {
  const isSignedIn = useAuth((s) => s.user !== null);
  if (!isFirebaseConfigured) return null;
  return isSignedIn ? (
    <button type="button" onClick={() => signOutUser()} className={itemClass}>
      <LogOut className="size-5" />
      Sign out
    </button>
  ) : (
    <AuthDialog
      label=""
      trigger={
        <button type="button" className={itemClass}>
          <User className="size-5" />
          Sign in
        </button>
      }
    />
  );
}

export function SiteHeader() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const p = new URLSearchParams();
    if (q.trim()) p.set("q", q.trim());
    if (city) p.set("city", city);
    router.push(`/search?${p.toString()}`);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[90rem] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <Image src="/logo-wordmark.png" alt="Alpha Mart" width={108} height={36} priority className="h-9 w-auto" />
        </Link>

        <form
          onSubmit={onSubmit}
          className="order-last flex w-full items-center gap-2 md:order-none md:w-auto md:flex-1"
        >
          <label className="relative hidden shrink-0 sm:block">
            <MapPin className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-red-500" />
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              aria-label="City"
              className="h-10 w-36 appearance-none rounded-lg border border-border bg-card pr-2 pl-8 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
            >
              <option value="">All India</option>
              {CITIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <div className="flex h-10 flex-1 items-center overflow-hidden rounded-lg border border-border bg-card focus-within:border-brand focus-within:ring-3 focus-within:ring-ring/30">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search products"
              placeholder="Enter product / service to search"
              className="h-10 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent"
            />
            <button
              type="button"
              aria-label="Search by image"
              onClick={() => toast.info("Visual search coming soon")}
              className="grid h-10 w-10 shrink-0 place-items-center text-brand transition hover:bg-brand/10"
            >
              <Camera className="size-5" />
            </button>
            <button
              type="submit"
              aria-label="Search"
              className="grid h-10 w-12 shrink-0 place-items-center bg-brand text-primary-foreground transition hover:brightness-110"
            >
              <Search className="size-5" />
            </button>
          </div>
        </form>

        <Button
          variant="outline"
          className="hidden h-10 border-brand/40 text-brand hover:bg-brand/10 lg:inline-flex"
          nativeButton={false}
          render={<Link href="/requirement" />}
        >
          Get Best Price
        </Button>

        <nav aria-label="Primary" className="ml-auto flex items-center md:ml-0">
          {NAV.map((n) => (
            <Link key={n.label} href={n.href} className={`${itemClass} hidden sm:flex`}>
              <n.icon className="size-5" />
              {n.label}
            </Link>
          ))}
          <AuthItem />
        </nav>
      </div>
    </header>
  );
}
