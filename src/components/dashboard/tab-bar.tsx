"use client";

import { Tabs } from "@base-ui/react/tabs";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Segmented tab bar with a sliding highlight. Place inside a base-ui <Tabs.Root>.
export function TabBar({ tabs, size = "lg", label }: { tabs: { value: string; label: string; icon?: LucideIcon }[]; size?: "lg" | "sm"; label: string }) {
  return (
    <Tabs.List aria-label={label} className="relative inline-flex max-w-full gap-1 overflow-x-auto rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-border [scrollbar-width:none]">
      <Tabs.Indicator className="absolute top-(--active-tab-top) left-(--active-tab-left) h-(--active-tab-height) w-(--active-tab-width) rounded-xl bg-navy shadow-md transition-all duration-300 ease-out" />
      {tabs.map(({ value, label: text, icon: Icon }) => (
        <Tabs.Tab
          key={value}
          value={value}
          className={cn(
            "relative z-10 inline-flex shrink-0 items-center gap-2 rounded-xl font-bold whitespace-nowrap text-navy/60 transition-colors outline-none not-data-active:hover:bg-cream not-data-active:hover:text-navy focus-visible:ring-2 focus-visible:ring-ember data-active:text-white",
            size === "lg" ? "h-11 px-6 text-sm" : "h-11 px-4 text-sm",
          )}
        >
          {Icon && <Icon className="size-4" aria-hidden />}
          {text}
        </Tabs.Tab>
      ))}
    </Tabs.List>
  );
}
