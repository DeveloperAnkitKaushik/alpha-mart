"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Inbox, RotateCw, WifiOff } from "lucide-react";
import { useStoreEnabled } from "@/components/store/store-flag";
import { StateCard } from "@/components/site/state-card";
import { stateBtn } from "@/components/site/state-styles";
import { BuyerSkeleton } from "./dashboard-skeleton";
import { relativeTime } from "@/lib/inbox";
import { KindBadge, StatusBadge } from "./badges";
import { useInbox, useNow } from "./use-inbox";

export function BuyerView({ uid }: { uid: string }) {
  const { items, error, retry } = useInbox({ uid });
  const now = useNow();
  const storeEnabled = useStoreEnabled();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl bg-navy-deep p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <h2 className="text-xl font-extrabold">Your enquiries</h2>
          <p className="mt-1 text-sm text-white/75">
            Our team updates the status here as they call you back.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {storeEnabled && (
            <Link
              href="/orders"
              className="inline-flex h-11 items-center justify-center rounded-full bg-white/10 px-5 text-sm font-bold text-white transition-colors hover:bg-white hover:text-navy-deep"
            >
              My orders
            </Link>
          )}
          <Link
            href="/collections/laptops"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-ember px-5 text-sm font-bold text-white transition-colors hover:bg-white hover:text-navy-deep"
          >
            Browse laptops <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>

      {error ? (
        <StateCard
          icon={WifiOff}
          tone="error"
          title="We couldn't load your enquiries"
          body="Check your connection and try again. Your enquiries are safe."
        >
          <button type="button" onClick={retry} className={stateBtn.primary}>
            <RotateCw className="size-4" /> Try again
          </button>
        </StateCard>
      ) : !items ? (
        <BuyerSkeleton />
      ) : items.length === 0 ? (
        <StateCard
          icon={Inbox}
          title="No enquiries yet"
          body="Tap Get best price or WhatsApp on any laptop and it will show up here with its status."
        >
          <Link href="/collections/laptops" className={stateBtn.primary}>
            Browse laptops <ArrowRight className="size-4" />
          </Link>
          <Link href="/requirement" className={stateBtn.ghost}>
            Send a requirement
          </Link>
        </StateCard>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence initial={false}>
            {items.map((i) => (
              <motion.li
                key={i.key}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col rounded-3xl bg-white p-5 shadow-sm ring-1 ring-border"
              >
                <div className="flex items-center justify-between gap-2">
                  <KindBadge kind={i.kind} />
                  <StatusBadge status={i.status} />
                </div>
                <p className="mt-3 font-bold text-navy-deep">{i.title}</p>
                <dl className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {i.fields
                    .filter(([k]) => k !== "Product" && k !== "Title")
                    .map(([k, v]) => (
                      <div key={k} className="flex gap-2">
                        <dt className="font-semibold">{k}:</dt>
                        <dd className="line-clamp-2">{v}</dd>
                      </div>
                    ))}
                </dl>
                <p className="mt-auto pt-4 text-xs text-muted-foreground">
                  {i.createdAt ? `Sent ${relativeTime(i.createdAt, now)}` : ""}
                </p>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
