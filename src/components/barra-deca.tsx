"use client";

/**
 * Barra de urgencia del DeCA, debajo del menú y en todas las páginas públicas.
 *
 * Por qué existe habiendo ya tres menciones al DeCA en la portada: las tres
 * están por debajo del pliegue o compiten con la llamada principal, y ninguna
 * dice qué hacer. Un aviso sin verbo asusta y no convierte. Esta barra tiene
 * una sola función: que quien entre vea la fecha y el botón sin hacer scroll.
 *
 * El enlace va a /deca, no al dominio de miDeCApro. Ese rodeo es el que lleva
 * el parámetro de atribución: enlazar directo se vería igual y no se cobraría.
 *
 * Decisiones que parecen detalles y no lo son:
 *
 * - NO es pegajosa. Una barra que persigue al usuario se come un tercio de la
 *   pantalla del móvil en todas las páginas. Se ve al entrar, que es cuando
 *   hace falta, y luego deja trabajar.
 * - NO se puede cerrar. Son trece días. Un aspa convierte la urgencia en un
 *   estorbo que se quita una vez y no vuelve a verse nunca.
 * - NO aparece en el área privada ni en la gestión del centro. Ahí la gente
 *   viene a trabajar, no a comprar, y un contador de ventas dentro de una
 *   herramienta interna resta seriedad.
 *
 * El texto no dice "DeCA obligatorio", que no significa nada para quien no
 * sabe qué es, sino lo que le pasa: el papel deja de valer. Y la frase de "no
 * hay periodo de gracia" es literal del Ministerio, está sostenida en el
 * artículo del blog. No se adorna ni se inventan sanciones.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CuentaAtras } from "./cuenta-atras";
import { OBLIGATORIO_DECA } from "./deca-aviso";

/** Pantallas donde la barra sobra: se entra a trabajar, no a contratar. */
const RUTAS_PRIVADAS = ["/area-cliente", "/centro"];

/** Flecha manuscrita que señala el botón.
 *
 *  La clienta pidió una mano tipo cursor, y se intentó: primero una manecilla
 *  hecha con rectángulos y después otra con los dedos plegados. Ninguna se
 *  lee. Se probaron las tres juntas en pantalla, al tamaño real, y a 50
 *  píxeles de ancho las dos manos parecían un mando a distancia. Una mano
 *  necesita detalle y ahí no cabe. La flecha se entiende al instante.
 *
 *  Tampoco se usa el botón rojo con brillo y el cursor de Windows del boceto
 *  original, y la razón no es de gusto: ese par de elementos es la firma
 *  visual de los botones falsos de descarga. En la web de una asesoría levanta
 *  la guardia justo cuando hace falta confianza.
 *
 *  El trazo imita el del logotipo, que ya es manuscrito, así que señala con
 *  ganas pero parece puesto a propósito y no descargado.
 *
 *  Va en SVG por tres motivos concretos: pesa un kilobyte, se mantiene nítida
 *  en pantallas de alta densidad, y hereda el color con `currentColor`, así que
 *  cambiar el tono de la barra no obliga a reexportar ninguna imagen. */
function FlechaSenalando() {
  return (
    <svg
      className="bdeca-flecha"
      viewBox="0 0 96 46"
      fill="none"
      stroke="currentColor"
      strokeWidth="4.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M4 8c6 19 24 29 50 30" />
      <path d="M40 27l15 11" />
      <path d="M38 44l17-6" />
    </svg>
  );
}

export function BarraDeca() {
  const ruta = usePathname();
  if (RUTAS_PRIVADAS.some((privada) => ruta.startsWith(privada))) return null;

  return (
    <aside className="bdeca" aria-label="Aviso: el DeCA pasa a ser obligatorio">
      <div className="container bdeca-inner">
        <div className="bdeca-copy">
          <p className="bdeca-etiqueta">
            <span className="bdeca-punto" aria-hidden="true" />
            No hay periodo de gracia
          </p>
          {/* El texto está escrito para ser cierto antes y después del 5 de
              octubre. Aquí hubo una rama que cambiaba el titular al pasar la
              fecha, y se quitó: obligaba a mirar el reloj dentro del render,
              lo que desajusta la hidratación, y además el servidor genera esta
              página una sola vez, así que se habría quedado congelada en el
              texto viejo hasta el siguiente despliegue. Un titular que no
              caduca no necesita ninguna de las dos cosas. */}
          <p className="bdeca-titular">
            Desde el 5 de octubre, el papel <strong>deja de valer</strong>.
          </p>
        </div>

        <div className="bdeca-reloj">
          <CuentaAtras
            limiteISO={OBLIGATORIO_DECA}
            respaldo="Obligatorio desde el 5 de octubre de 2026"
            variante="barra"
          />
        </div>

        <div className="bdeca-accion">
          {/* La mano y el "pincha aquí" son decoración que señala: el destino
              real lo dice el texto del botón, que es lo que lee un lector de
              pantalla. Por eso van ocultos para accesibilidad y no forman
              parte del enlace. */}
          <span className="bdeca-senal" aria-hidden="true">
            <span className="bdeca-pincha">pincha aquí</span>
            <FlechaSenalando />
          </span>
          <Link href="/deca" className="bdeca-boton">
            Saca tu DeCA
          </Link>
          <Link href="/blog/deca-documento-control-digital-obligatorio-2026" className="bdeca-duda">
            ¿Esto me afecta a mí?
          </Link>
        </div>
      </div>
    </aside>
  );
}
