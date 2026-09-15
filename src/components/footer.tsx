import Link from "next/link";
import Image from "next/image";
import { site } from "@/content/site";
import { Icon } from "./icon";

export function Footer() {
  return <footer className="site-footer">
    <div className="container">
      <div className="footer-main">
        <div><Link href="/" aria-label="Takcanarias, inicio"><Image className="footer-logo" src="/brand/takcanarias.svg" width={254} height={59} alt="Takcanarias" unoptimized /></Link><p>Personas que te acompañan.<br />En el aula y en la carretera.</p></div>
        <address>{site.address}<br />{site.locality}<br />{site.postalCode}<a href={site.maps} target="_blank" rel="noopener noreferrer">Cómo llegar <Icon name="external" /></a></address>
        <div className="footer-contact"><a href={site.phoneHref}>{site.phone}</a><a href={`mailto:${site.email}`}>{site.email}</a><span>{site.hours}</span></div>
      </div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} Takcanarias</span><nav aria-label="Enlaces del pie"><Link href="/contacto">Contacto</Link><Link href="/politica-privacidad">Privacidad</Link><Link href="/aviso-legal">Aviso legal</Link><a href={site.instagram} target="_blank" rel="noopener noreferrer">Instagram<Icon name="external" /></a></nav><span>Las Palmas de Gran Canaria</span></div>
    </div>
  </footer>;
}
