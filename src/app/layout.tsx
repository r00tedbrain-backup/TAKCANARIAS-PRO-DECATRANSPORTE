import type { Metadata } from "next";
import { Barlow_Condensed, Manrope } from "next/font/google";
import { Header } from "@/components/header";
import { BarraDeca } from "@/components/barra-deca";
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
    /**
     * Ya no se fuerza `noindex` para toda la web: el dominio real se indexa.
     *
     * Quien decide qué se rastrea es ahora `robots.ts`, y lo hace por dominio,
     * porque este mismo servidor atiende también el de pruebas con idéntico
     * contenido. Las pantallas que no deben salir en un buscador —el área
     * privada y la gestión del centro— llevan su propio `noindex` en su
     * página, que es donde tiene efecto de verdad.
     */
  icons: { icon: "/brand/favicon.png", apple: "/brand/favicon.png" },
  openGraph: { type: "website", locale: "es_ES", siteName: "Takcanarias", images: [{ url: `${site.url}/images/aula.webp`, width: 1600, height: 1200, alt: "Centro de formación Takcanarias" }] },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${manrope.variable} ${barlow.variable}`}
    >
      <body><a className="skip-link" href="#contenido">Saltar al contenido</a><Header /><BarraDeca /><main id="contenido" tabIndex={-1}>{children}</main><Footer /></body>
    </html>
  );
}
