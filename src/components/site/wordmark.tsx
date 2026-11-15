import { cn } from "@/lib/utils";

// Text logo: "alpha" in the base colour, "mart" in the accent, and a small pulsing dot.
export function Wordmark({ tone = "dark", className }: { tone?: "dark" | "light"; className?: string }) {
  const light = tone === "light";
  return (
    <span className={cn("group/wm inline-flex items-baseline font-brand text-2xl leading-none font-extrabold tracking-tight lowercase select-none", className)}>
      <span className={light ? "text-white" : "text-navy"}>alpha</span>
      <span className={cn("transition-colors duration-300", light ? "text-amber-300 group-hover/wm:text-white" : "text-ember group-hover/wm:text-navy")}>mart</span>
      <span className={cn("ml-0.5 size-[0.32em] rounded-full transition-transform duration-300 group-hover/wm:scale-150", light ? "bg-amber-300" : "bg-ember")} aria-hidden />
    </span>
  );
}
