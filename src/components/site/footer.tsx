import Link from "next/link";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { FooterQuote } from "@/components/site/footer-quote";
import { Reveal } from "@/components/site/reveal";
import { BUSINESS } from "@/lib/business";

const LINKS = [
  { label: "Laptops", href: "/collections/laptops" },
  { label: "Desktops", href: "/collections/desktops" },
  { label: "MacBooks", href: "/collections/macbooks" },
  { label: "Gaming Laptops", href: "/collections/gaming-laptops" },
  { label: "Contact", href: "/requirement" },
];

const POLICIES = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Refunds", href: "/refunds" },
  { label: "Shipping", href: "/shipping" },
];

const CONTACT = [
  { icon: MessageCircle, label: "Chat on WhatsApp", href: "https://wa.me/?text=Hi%20Alpha%20Mart" },
  { icon: Mail, label: "Email us", href: `mailto:${BUSINESS.email}` },
  { icon: Phone, label: "Request a callback", href: "/requirement" },
];

function Bracket({ side }: { side: "left" | "right" }) {
  const shape = side === "left" ? "rounded-l-2xl border-l" : "rounded-r-2xl border-r";
  return (
    <span className={`flex items-center ${side === "right" ? "flex-row-reverse" : ""}`} aria-hidden>
      <span className={`h-36 w-28 border-y border-navy/30 bg-[radial-gradient(oklch(0.4_0.12_258/0.35)_1px,transparent_1px)] bg-[size:10px_10px] ${shape}`} />
      <span className="h-px w-8 bg-navy/30" />
    </span>
  );
}

export function Footer() {
  return (
    <footer className="relative isolate overflow-hidden bg-gradient-to-b from-cream via-sky-100 to-navy pt-20 text-navy-deep">
      <div className="container-x">
        <div className="grid gap-12 md:grid-cols-[1fr_auto_1fr] md:items-center">
          <div>
            <ul className="flex gap-3">
              {CONTACT.map((c) => (
                <li key={c.label}>
                  <a
                    href={c.href}
                    aria-label={c.label}
                    {...(c.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="grid size-11 place-items-center rounded-full ring-1 ring-navy-deep/40 transition duration-300 hover:-translate-y-1 hover:bg-navy-deep hover:text-white"
                  >
                    <c.icon className="size-5" />
                  </a>
                </li>
              ))}
            </ul>
            <a href={`mailto:${BUSINESS.email}`} className="mt-7 block text-lg font-medium underline-offset-4 hover:underline">
              {BUSINESS.email}
            </a>
            <p className="mt-1 text-sm text-navy-deep/80">{BUSINESS.phone}</p>
            <p className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-navy-deep/80">
              <MapPin className="mt-0.5 size-4 shrink-0" />
              <span>
                {BUSINESS.legalName}
                <br />
                {BUSINESS.address}
                <br />
                GSTIN: {BUSINESS.gstin}
              </span>
            </p>
          </div>

          <div className="flex items-center justify-center">
            <span className="hidden xl:block">
              <Bracket side="left" />
            </span>
            <FooterQuote />
            <span className="hidden xl:block">
              <Bracket side="right" />
            </span>
          </div>

          <nav aria-label="Footer" className="md:justify-self-end">
            <ul className="space-y-2 md:text-right">
              {LINKS.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="group relative inline-block text-xl font-medium transition-transform duration-300 hover:translate-x-1 md:text-2xl md:hover:-translate-x-1">
                    {l.label}
                    <span className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-navy-deep transition-transform duration-300 group-hover:scale-x-100" />
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-xs font-bold tracking-widest text-navy-deep/80 uppercase">Policies</p>
            <ul className="mt-1 flex flex-wrap gap-x-4 text-sm text-navy-deep/80 md:justify-end">
              {POLICIES.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="inline-block py-3 underline-offset-4 hover:text-navy-deep hover:underline">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-between gap-3 text-xs text-white/85">
          <Link href="/credits" className="underline underline-offset-4 hover:text-white">
            Photo credits
          </Link>
          <p>© Alpha Mart. Demo project. All rights reserved.</p>
          <Link href="/dashboard" className="underline underline-offset-4 hover:text-white">
            My enquiries
          </Link>
        </div>
      </div>

      <div aria-hidden className="pointer-events-none mt-6 overflow-hidden text-center select-none">
        <Reveal>
          <p className="-mb-[2.8vw] bg-gradient-to-b from-white/70 to-white/5 bg-clip-text font-brand text-[19vw] leading-[0.85] font-extrabold tracking-tighter text-transparent">
            alphamart
          </p>
        </Reveal>
      </div>
    </footer>
  );
}
