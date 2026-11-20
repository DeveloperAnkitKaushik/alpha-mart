import type { ReactNode } from "react";

export function PolicyPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <div className="container-x pt-10 pb-24">
      <article className="mx-auto max-w-3xl space-y-4 leading-relaxed text-muted-foreground [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-navy [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-6 [&_strong]:text-foreground">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
        <p className="text-sm">Last updated: {updated}</p>
        {children}
      </article>
    </div>
  );
}
