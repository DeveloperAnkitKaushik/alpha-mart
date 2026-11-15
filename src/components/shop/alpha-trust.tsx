import { Reveal } from "@/components/site/reveal";

const CARDS = [
  {
    n: "1",
    tone: "from-rose-500 to-rose-700",
    title: ["Like-New", "Performance", "Promise"],
    body: "Every device passes 40 checks before listing. If one fails later, we fix or replace it.",
  },
  {
    n: "2",
    tone: "from-blue-500 to-navy",
    title: ["6 Months", "Hassle-Free", "Warranty"],
    body: "Hardware faults covered, with support on call or WhatsApp. No fine print.",
  },
  {
    n: "3",
    tone: "from-amber-400 to-amber-600",
    title: ["Fair Price", "Match", "Promise"],
    body: "Same spec, same condition, lower price from a certified seller? Tell us and we match it.",
  },
];

export function AlphaTrust() {
  return (
    <section id="why" className="container-x scroll-mt-28 py-12">
      <Reveal className="mb-5 flex items-center justify-between gap-4 rounded-2xl bg-white px-6 py-4 shadow-sm ring-1 ring-border">
        <div>
          <h2 className="text-lg font-extrabold text-navy sm:text-xl">AlphaTrust by Alpha Mart</h2>
          <p className="text-sm text-muted-foreground">Because your peace of mind should be the standard</p>
        </div>
      </Reveal>
      <div className="grid gap-5 md:grid-cols-3">
        {CARDS.map((c, i) => (
          <Reveal key={c.n} delay={i * 0.1}>
            <article className={`group relative isolate flex h-full min-h-80 flex-col overflow-hidden rounded-3xl bg-gradient-to-br p-8 text-white shadow-lg transition duration-300 hover:-translate-y-1.5 hover:shadow-2xl ${c.tone}`}>
              <span
                aria-hidden
                className="absolute -right-4 -bottom-16 -z-10 text-[16rem] leading-none font-black text-white/15 transition duration-500 group-hover:scale-110"
              >
                {c.n}
              </span>
              <h3 className="text-3xl leading-tight font-extrabold">
                {c.title.map((line, j) => (
                  <span key={line} className={`block ${j === 1 ? "text-white/85" : ""}`}>
                    {line}
                  </span>
                ))}
              </h3>
              <span className="my-5 h-px w-24 bg-white/40" />
              <p className="max-w-xs text-sm leading-relaxed text-white/90">{c.body}</p>
              <p className="mt-auto pt-6 text-right text-[11px] font-semibold tracking-wide text-white/70">AlphaTrust · Alpha Mart</p>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
