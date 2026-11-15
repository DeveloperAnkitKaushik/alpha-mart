import Image from "next/image";
import CountUp from "@/components/CountUp";
import { Reveal } from "@/components/site/reveal";

const STATS = [
  { to: 12500, suffix: "+", label: "Devices given a second life" },
  { to: 140, suffix: " t", label: "CO₂ emissions avoided" },
  { to: 28, suffix: " t", label: "E-waste kept out of landfill" },
];

export function Impact() {
  return (
    <section className="container-x my-6">
      <Reveal>
        <div className="relative isolate grid gap-10 overflow-hidden rounded-3xl p-8 text-white sm:p-14 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <Image src="/hero/hero-recycle.jpg" alt="" fill unoptimized sizes="1500px" className="-z-20 object-cover" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy-deep/95 via-navy-deep/85 to-navy-deep/55" />
          <div>
            <p className="text-xs font-bold tracking-widest text-ember">THE IMPACT</p>
            <h2 className="mt-3 text-4xl leading-[1.05] font-extrabold tracking-tight sm:text-6xl">
              Great tech deserves a <span className="text-ember">second life.</span>
            </h2>
            <p className="mt-5 max-w-md text-white/75">
              Every refurbished laptop we sell is one less in a landfill. Here is what that adds up to.
            </p>
          </div>
          <dl className="divide-y divide-white/20 border-y border-white/20">
            {STATS.map((s) => (
              <div key={s.label} className="flex items-baseline justify-between gap-4 py-5">
                <dt className="text-sm text-white/75 sm:text-base">{s.label}</dt>
                <dd className="text-4xl font-black tabular-nums sm:text-5xl">
                  <CountUp to={s.to} suffix={s.suffix} separator="," duration={2} />
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </Reveal>
    </section>
  );
}
