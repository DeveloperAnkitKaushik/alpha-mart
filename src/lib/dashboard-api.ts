export const STATUSES = ["new", "contacted", "quoted", "won", "lost"] as const;
export type Status = (typeof STATUSES)[number];
export type Kind = "lead" | "requirement" | "callback";
export type Coll = "leads" | "requirements";
type NameOf = (productId: string) => string;

export const CALLBACK_TITLE = "Callback request from footer";

export interface InboxItem {
  key: string;
  id: string;
  coll: Coll;
  kind: Kind;
  name: string;
  phone: string;
  title: string;
  status: Status;
  notes: string;
  createdAt: number;
  fields: [string, string][];
}

interface BaseRow {
  id: string;
  name: string;
  phone: string;
  quantity: string;
  status: Status;
  notes: string;
  createdAt: Date;
}
export interface LeadRow extends BaseRow {
  productId: string;
  message: string | null;
}
export interface RequirementRow extends BaseRow {
  title: string;
  category: string;
  city: string;
  budget: string | null;
  details: string | null;
}
export type InboxRows = { leads: LeadRow[]; requirements: RequirementRow[] };

const present = (pairs: [string, string | null][]) => pairs.filter((p): p is [string, string] => Boolean(p[1]));

const common = (coll: Coll, r: BaseRow) => ({
  key: `${coll}/${r.id}`,
  id: r.id,
  coll,
  name: r.name,
  phone: r.phone,
  status: r.status,
  notes: r.notes,
  createdAt: r.createdAt.getTime(),
});

function leadItem(r: LeadRow, nameOf: NameOf): InboxItem {
  const product = nameOf(r.productId);
  return {
    ...common("leads", r),
    kind: "lead",
    title: product,
    fields: present([["Product", product], ["Quantity", r.quantity], ["Message", r.message]]),
  };
}

function requirementItem(r: RequirementRow): InboxItem {
  return {
    ...common("requirements", r),
    kind: r.title === CALLBACK_TITLE ? "callback" : "requirement",
    title: r.title,
    fields: present([
      ["Title", r.title],
      ["Category", r.category],
      ["Quantity", r.quantity],
      ["City", r.city],
      ["Budget", r.budget],
      ["Details", r.details],
    ]),
  };
}

export const toItems = (rows: InboxRows, nameOf: NameOf): InboxItem[] =>
  [...rows.leads.map((r) => leadItem(r, nameOf)), ...rows.requirements.map(requirementItem)].sort((a, b) => b.createdAt - a.createdAt);
