import { NextResponse } from "next/server";

/**
 * Derivación a miDeCApro, la plataforma con la que Takcanarias emite el DeCA.
 *
 * El `?ref=takcanarias` es lo que hace que la comisión de esa venta se le
 * apunte a Takcanarias. El destino valida contra una lista cerrada de canales
 * y descarta en silencio cualquier variante —mayúsculas, guiones,
 * abreviaturas—, registrando la venta como directa. Si se toca esta cadena se
 * deja de cobrar y nada avisa: no hay error ni aviso, solo deja de entrar
 * dinero.
 *
 * Se hace aquí y no con `redirects()` en next.config por una razón concreta:
 * aquella devuelve 307 cuando el redirección es temporal, y el equipo de
 * miDeCApro pide 302 exacto para sus comprobaciones. Los dos son temporales y
 * ninguno se queda cacheado, pero el número importa si alguien lo verifica de
 * forma automática.
 *
 * Temporal (302) y no permanente (301) a propósito: un 301 se queda guardado
 * en el navegador casi para siempre, así que si el destino cambiara, quien ya
 * hubiera pasado por aquí seguiría yendo al sitio antiguo sin forma de
 * corregirlo desde el servidor. Un 301 además traspasaría autoridad de
 * búsqueda a un dominio que no es nuestro.
 *
 * Aquí es también donde habría que registrar el clic el día que se quiera
 * medir cuántas derivaciones salen de la web.
 */

const DESTINO = "https://app.midecapro.com/?ref=takcanarias";

// Depende de nada que se pueda pregenerar, y conviene que no se cachee.
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.redirect(DESTINO, 302);
}
