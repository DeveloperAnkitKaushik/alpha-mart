"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Menu, Mic, Phone, Search, User } from "lucide-react";
import { toast } from "sonner";
import { HeaderNav } from "@/components/site/header-nav";
import { Wordmark } from "@/components/site/wordmark";
import { MobileMenu } from "@/components/site/mobile-menu";
import { useAuth } from "@/lib/auth-store";

const iconBtn =
  "grid size-10 place-items-center rounded-full text-white transition hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none";

function AuthButton() {
  const isSignedIn = useAuth((s) => s.user !== null);
  return (
    <Link href={isSignedIn ? "/dashboard" : "/signin"} aria-label={isSignedIn ? "My account" : "Sign in"} className={iconBtn}>
      <User className="size-5" />
    </Link>
  );
}

export function SiteHeader() {
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [term, setTerm] = useState("");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    router.push(term.trim() ? `/collections/all?q=${encodeURIComponent(term.trim())}` : "/collections/all");
  };

  return (
    <header className="sticky top-0 z-50 shadow-md">
      <div className="bg-skyblue text-white">
        <div className="container-x grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2 py-2.5 md:grid-cols-[auto_minmax(0,40rem)_auto] md:justify-between">
          <div className="flex items-center gap-1">
            <button type="button" aria-label="Open menu" onClick={() => setMenu(true)} className={`${iconBtn} md:hidden`}>
              <Menu className="size-6" />
            </button>
            <Link href="/" aria-label="Alpha Mart home" className="rounded-lg px-1 py-1">
              <Wordmark tone="light" className="text-[1.7rem]" />
            </Link>
          </div>

          <form
            onSubmit={onSubmit}
            role="search"
            className="order-last col-span-3 flex h-11 items-center gap-2 rounded-full bg-white pr-1.5 pl-4 text-foreground shadow-inner focus-within:ring-2 focus-within:ring-ember md:order-none md:col-span-1"
          >
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              aria-label="Search"
              placeholder="What are you looking for.."
              className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {term && (
              <button type="button" onClick={() => setTerm("")} className="px-2 text-xs text-muted-foreground transition hover:text-foreground">
                Clear
              </button>
            )}
            <button
              type="button"
              aria-label="Voice search"
              onClick={() => toast.info("Voice search coming soon")}
              className="grid size-8 shrink-0 place-items-center rounded-full bg-navy text-white transition hover:bg-navy-deep"
            >
              <Mic className="size-4" />
            </button>
          </form>

          <div className="flex items-center justify-end gap-1">
            <a
              href="https://wa.me/?text=Hi%20Alpha%20Mart"
              target="_blank"
              rel="noopener noreferrer"
              className="mr-2 hidden items-center gap-2 rounded-lg px-2 py-1 text-left text-[11px] leading-tight transition hover:bg-white/15 lg:flex"
            >
              <Phone className="size-5" />
              <span>
                Our Sales / Support
                <br />
                <strong className="text-xs">Chat on WhatsApp</strong>
              </span>
            </a>
            <AuthButton />
          </div>
        </div>
      </div>
      <HeaderNav />
      <MobileMenu open={menu} onClose={() => setMenu(false)} />
    </header>
  );
}
