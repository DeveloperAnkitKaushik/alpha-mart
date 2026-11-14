"use client";

import { ArrowRight, Bookmark, History, ScanSearch, Sparkles } from "lucide-react";
import { toast } from "sonner";

const soon = () => toast.info("Visual search coming soon");

const ACTIONS = [
  { icon: ScanSearch, label: "Visual Search" },
  { icon: History, label: "Search History" },
  { icon: Bookmark, label: "Saved Products" },
];

export function VisualSearchBanner() {
  return (
    <section className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8 py-6">
      <div className="relative isolate flex flex-col gap-6 overflow-hidden rounded-2xl bg-gradient-to-br from-hero-from to-hero-to p-6 text-white sm:p-10 lg:flex-row lg:items-center lg:justify-between">
        <div className="absolute -top-20 -right-10 -z-10 size-72 animate-float rounded-full bg-brand/30 blur-[90px]" aria-hidden />
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold tracking-widest text-white/80 uppercase">
            <Sparkles className="size-3.5" /> Advanced AI visual search
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Find Products Instantly</h2>
          <p className="mt-2 max-w-md text-sm text-white/80">
            Upload any product image and discover matching items from verified suppliers across India.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {ACTIONS.map((a) => (
              <button
                key={a.label}
                type="button"
                onClick={soon}
                className="flex items-center gap-1.5 rounded-lg border border-white/30 px-3 py-1.5 text-xs font-medium transition hover:bg-white/15"
              >
                <a.icon className="size-3.5" /> {a.label}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={soon}
          className="group flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-semibold text-hero-from shadow-xl transition hover:-translate-y-0.5"
        >
          Search any image with Lens
          <ArrowRight className="size-4 transition group-hover:translate-x-1" />
        </button>
      </div>
    </section>
  );
}
