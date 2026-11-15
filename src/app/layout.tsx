import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist_Mono, Urbanist } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/site/providers";
import { SiteHeader } from "@/components/site/site-header";
import { Footer } from "@/components/site/footer";
import { Toaster } from "@/components/ui/sonner";

const urbanist = Urbanist({
  variable: "--font-urbanist",
  subsets: ["latin"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Alpha Mart — Certified refurbished laptops & PCs",
  description: "Quality-tested refurbished laptops, desktops and MacBooks with a 6 month warranty. Enquire or chat on WhatsApp for the best price.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${urbanist.variable} ${bricolage.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Providers>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <Footer />
          <Toaster theme="light" />
        </Providers>
      </body>
    </html>
  );
}
