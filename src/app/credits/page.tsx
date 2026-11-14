import Link from "next/link";
import credits from "@/lib/photo-credits.json";
import { resolveSlug } from "@/lib/data";

export const metadata = { title: "Photo credits — Alpha Mart" };

const licenseLabel = (l: string) => l.replace(/^pdm/i, "Public domain").replace(/^cc0/i, "CC0").replace(/ 1\.0$/, "");

export default function CreditsPage() {
  const rows = Object.entries(credits as Record<string, { title: string | null; creator: string | null; license: string; url: string }>);
  return (
    <div className="mx-auto max-w-3xl px-4 pt-10 pb-24">
      <h1 className="text-3xl font-bold tracking-tight">Photo credits</h1>
      <p className="mt-2 mb-8 text-muted-foreground">
        Category photos are openly licensed and found through Wikimedia Commons and Openverse. Thank you to the photographers.
      </p>
      <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
        {rows.map(([slug, c]) => (
          <li key={slug} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">{resolveSlug(slug.split("~")[0])?.sub?.label ?? slug}</p>
              <p className="text-sm text-muted-foreground">
                “{c.title ?? "Untitled"}” by {c.creator ?? "unknown"}
              </p>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-brand">
                {licenseLabel(c.license)}
              </span>
              <Link href={c.url} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
                Source
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
