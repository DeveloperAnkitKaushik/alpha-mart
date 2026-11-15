"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, Copy, Menu, Plus } from "lucide-react";
import { toast } from "sonner";
import { ShopImage } from "@/components/shop/shop-image";
import { SHOP_CATEGORIES } from "@/lib/shop-data";

const BRANDS = ["Dell", "HP", "Lenovo", "Apple", "Acer", "Asus"];

interface NavItem {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
}


const NAV: NavItem[] = [
  { label: "MacBooks", href: "/collections/macbooks" },
  { label: "Laptops", href: "/collections/laptops", children: BRANDS.map((b) => ({ label: `${b} laptops`, href: `/collections/laptops?brand=${b}` })) },
  { label: "Desktops", href: "/collections/desktops" },
  { label: "Students", href: "/collections/all?max=19999", children: [{ label: "Under ₹20,000", href: "/collections/all?max=19999" }, { label: "Study laptops", href: "/collections/laptops" }] },
  { label: "Business", href: "/collections/laptops" },
  { label: "Gaming", href: "/collections/gaming-laptops" },
  { label: "More", href: "/requirement", children: [{ label: "Send a requirement", href: "/requirement" }, { label: "My enquiries", href: "/dashboard" }, { label: "Photo credits", href: "/credits" }] },
];

const CODE = "ALPHA500";

function AllCategories() {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-semibold text-navy transition hover:bg-cream"
      >
        <Menu className="size-4" /> All Categories
        <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="absolute top-full left-0 z-50 mt-2 w-[34rem] rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-border"
          >
            <ul className="grid grid-cols-3 gap-3">
              {SHOP_CATEGORIES.map((c) => (
                <li key={c.label}>
                  <Link href={`/collections/${c.slug}`} onClick={() => setOpen(false)} className="group block rounded-xl p-2 text-center transition hover:bg-cream">
                    <ShopImage name={c.image} className="mx-auto mb-2 aspect-[4/3] w-full rounded-lg" />
                    <span className="text-sm font-medium text-navy">{c.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function HeaderNav() {
  const copy = () => {
    navigator.clipboard?.writeText(CODE).catch(() => undefined);
    toast.success(`Code ${CODE} copied`, { description: "Mention it when you enquire." });
  };

  return (
    <div className="hidden border-b border-border bg-white md:block">
      <div className="container-x flex h-11 items-center justify-between gap-4">
        <AllCategories />
        <nav aria-label="Primary" className="flex items-center">
          {NAV.map((n) => (
            <div key={n.label} className="group relative">
              <Link
                href={n.href}
                className="flex items-center gap-1 px-3.5 py-2.5 text-sm font-semibold text-navy transition hover:text-ember"
              >
                {n.label}
                {n.children && <Plus className="size-3 transition-transform group-hover:rotate-45" />}
              </Link>
              {n.children && (
                <ul className="invisible absolute top-full left-0 z-50 min-w-48 translate-y-2 rounded-xl bg-white p-2 opacity-0 shadow-xl ring-1 ring-border transition duration-200 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                  {n.children.map((c) => (
                    <li key={c.label}>
                      <Link href={c.href} className="block rounded-lg px-3 py-2 text-sm text-navy transition hover:bg-cream">
                        {c.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </nav>
        <button
          type="button"
          onClick={copy}
          className="flex items-center gap-2 rounded-full bg-cream px-3 py-1 text-xs font-bold text-navy ring-1 ring-peach transition hover:bg-peach"
        >
          <span className="text-ember">₹500 OFF</span> {CODE}
          <Copy className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
