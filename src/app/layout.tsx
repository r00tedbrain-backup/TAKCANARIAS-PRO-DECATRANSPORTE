import type { Metadata } from "next";
import { Barlow_Condensed, Manrope } from "next/font/google";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { site } from "@/content/site";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const barlow = Barlow_Condensed({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: "Takcanarias | Asesoría, autoescuela y formación en Gran Canaria", template: "%s | Takcanarias" },
  description: "Asesoría de transportes, gestión de tacógrafos, formación CAP, autoescuela y apoyo escolar en Las Palmas de Gran Canaria. Atención personal en Takcanarias.",
  // Preview remains non-indexable until content, legal details and domain are approved.
  robots: { index: false, follow: true },
  icons: { icon: `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/brand/favicon.png`, apple: `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/brand/favicon.png` },
  openGraph: { type: "website", locale: "es_ES", siteName: "Takcanarias", images: [{ url: `${site.url}/images/aula.webp`, width: 1600, height: 1200, alt: "Centro de formación Takcanarias" }] },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${manrope.variable} ${barlow.variable}`}
    >
      <body><a className="skip-link" href="#contenido">Saltar al contenido</a><Header /><main id="contenido" tabIndex={-1}>{children}</main><Footer /></body>
    </html>
  );
}
