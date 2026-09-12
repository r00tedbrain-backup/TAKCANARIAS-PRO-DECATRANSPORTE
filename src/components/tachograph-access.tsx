import { site } from "@/content/site";
import { Icon } from "./icon";

export function TachographAccess() {
  return <aside className="tachograph-access" aria-label="Acceso a descarga de tarjeta del conductor">
    <div className="tachograph-access-copy"><Icon name="download" /><div><h3>Descarga de tarjeta del conductor</h3><p>Abre Tachomat de VDO, descarga los datos de tu tarjeta e imprime el recibo. Si necesitas ayuda con el equipo o el lector, habla con asesoría.</p></div></div>
    <div className="tachograph-access-actions"><a href={site.cardDownload} className="button button-blue" target="_blank" rel="noopener noreferrer">Descargar tarjeta en VDO<Icon name="external" /></a><span>Plataforma externa · Se abre en otra pestaña</span></div>
  </aside>;
}
