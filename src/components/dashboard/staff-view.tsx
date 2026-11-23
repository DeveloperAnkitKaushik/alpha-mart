"use client";

import { useCallback, useDeferredValue, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Boxes, LayoutGrid, LineChart, PackageCheck, RotateCw, ServerCrash, TicketPercent } from "lucide-react";
import { Tabs } from "@base-ui/react/tabs";
import { TabBar } from "./tab-bar";
import { ItemsView } from "./items/items-view";
import { StateCard } from "@/components/site/state-card";
import { stateBtn } from "@/components/site/state-styles";
import { DashboardSkeleton } from "./dashboard-skeleton";
import { useStoreEnabled } from "@/components/store/store-flag";
import { CouponsTab } from "./store/coupons-tab";
import { OrdersTab } from "./store/orders-tab";
import { StockTab } from "./store/stock-tab";
import type { InboxItem, Status } from "@/lib/dashboard-api";
import { updateInboxItem } from "@/lib/inbox-actions";
import { downloadCsv, filterItems, type InboxFilter } from "@/lib/inbox";
import { ActivityChart } from "./activity-chart";
import { DetailDrawer } from "./detail-drawer";
import { InboxTable } from "./inbox-table";
import { InboxToolbar } from "./inbox-toolbar";
import { KpiCards } from "./kpi-cards";
import { INBOX_KEY, useInbox, useNow } from "./use-inbox";

const INITIAL_FILTER: InboxFilter = { term: "", kind: "all", status: "all", sort: "newest" };

const TOP_TABS = [
  { value: "dashboard", label: "Dashboard", icon: LineChart },
  { value: "items", label: "Items", icon: LayoutGrid },
];
const STORE_TABS = [
  { value: "orders", label: "Orders", icon: PackageCheck },
  { value: "stock", label: "Stock", icon: Boxes },
  { value: "coupons", label: "Coupons", icon: TicketPercent },
];

// Dashboard = enquiry numbers and inbox; Items = everything shown on the storefront.
export function StaffView() {
  const store = useStoreEnabled();
  return (
    <Tabs.Root defaultValue="dashboard">
      <TabBar label="Admin sections" tabs={store ? [...TOP_TABS, ...STORE_TABS] : TOP_TABS} />
      <Tabs.Panel value="dashboard" className="mt-6 outline-none">
        <Inbox />
      </Tabs.Panel>
      <Tabs.Panel value="items" className="mt-6 outline-none">
        <ItemsView />
      </Tabs.Panel>
      {store && (
        <>
          <Tabs.Panel value="orders" className="mt-6 outline-none"><OrdersTab /></Tabs.Panel>
          <Tabs.Panel value="stock" className="mt-6 outline-none"><StockTab /></Tabs.Panel>
          <Tabs.Panel value="coupons" className="mt-6 outline-none"><CouponsTab /></Tabs.Panel>
        </>
      )}
    </Tabs.Root>
  );
}

function Inbox() {
  const { items, error, retry } = useInbox("staff");
  const now = useNow();
  const [filter, setFilter] = useState(INITIAL_FILTER);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const deferredFilter = useDeferredValue(filter);
  const queryClient = useQueryClient();

  const shown = useMemo(() => (items ? filterItems(items, deferredFilter) : []), [items, deferredFilter]);
  const open = items?.find((i) => i.key === openKey) ?? null;

  const onStatus = useCallback(
    (item: InboxItem, status: Status) => {
      updateInboxItem(item.coll, item.id, { status, notes: item.notes })
        .then(() => queryClient.invalidateQueries({ queryKey: INBOX_KEY }))
        .catch(() => toast.error("Could not update status. Check your staff access."));
    },
    [queryClient],
  );

  if (error) {
    return (
      <StateCard
        icon={ServerCrash}
        tone="error"
        title="We couldn't load the inbox"
        body="Something went wrong talking to our servers, or your admins entry is missing. Try again."
      >
        <button type="button" onClick={retry} className={stateBtn.primary}>
          <RotateCw className="size-4" /> Try again
        </button>
      </StateCard>
    );
  }
  if (!items) {
    return (
      <DashboardSkeleton withHeader={false} />
    );
  }

  return (
    <div className="space-y-6">
      <KpiCards items={items} />
      <ActivityChart items={items} now={now} />
      <section aria-labelledby="inbox-title" className="space-y-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="inbox-title" className="text-xl font-extrabold text-navy-deep">Inbox</h2>
          <p className="text-sm font-semibold text-muted-foreground" aria-live="polite">
            {shown.length} of {items.length}
          </p>
        </div>
        <InboxToolbar
          filter={filter}
          onChange={(patch) => setFilter((f) => ({ ...f, ...patch }))}
          shown={shown.length}
          onExport={() => downloadCsv(shown)}
        />
        <InboxTable items={shown} now={now} onOpen={setOpenKey} onStatus={onStatus} />
      </section>
      <DetailDrawer item={open} onClose={() => setOpenKey(null)} />
    </div>
  );
}
