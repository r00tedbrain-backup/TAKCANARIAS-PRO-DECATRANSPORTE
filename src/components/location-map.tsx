import { site } from "@/content/site";
import { Icon } from "./icon";

export function LocationMap() {
  return <figure className="location-map">
    <iframe src={site.mapEmbed} title="Mapa de Takcanarias: calle Pintor Nicolás Massieu, 6, Las Palmas de Gran Canaria" width="1200" height="420" loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
    <figcaption><span><strong>{site.address}</strong><br />Lomo los Frailes · Mapa de Google Maps</span><a className="text-link" href={site.maps} target="_blank" rel="noopener noreferrer">Cómo llegar<Icon name="external" /></a></figcaption>
  </figure>;
}
