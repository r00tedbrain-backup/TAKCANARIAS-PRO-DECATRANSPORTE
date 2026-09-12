import { site } from "@/content/site";
import { Icon } from "./icon";

export function ContactBand() {
  return <section className="contact-band"><div className="container contact-band-inner"><div><h2>¿Por dónde empezamos?</h2><p>Cuéntanos qué necesitas. Te orientamos personalmente.</p></div><a href={site.whatsapp} className="button button-white" target="_blank" rel="noopener noreferrer">Hablemos por WhatsApp<Icon name="external" /></a></div></section>;
}
