import { Sparkles } from "lucide-react";
import { Reveal } from "@/components/site/reveal";

export function SectionHeading({ title, accent, sub, light }: { title: string; accent?: string; sub?: string; light?: boolean }) {
  return (
    <Reveal className="mb-8 text-center">
      <Sparkles className="mx-auto mb-1 size-5 text-ember" aria-hidden />
      <h2 className={`text-3xl font-extrabold tracking-tight sm:text-4xl ${light ? "text-white" : "text-navy"}`}>
        {title} {accent && <span className="text-emerald-600">{accent}</span>}
      </h2>
      {sub && <p className={`mt-1 text-sm ${light ? "text-white/70" : "text-muted-foreground"}`}>{sub}</p>}
    </Reveal>
  );
}
