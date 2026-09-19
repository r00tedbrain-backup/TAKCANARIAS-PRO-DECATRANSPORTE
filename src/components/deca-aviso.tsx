import Link from "next/link";
import { Icon } from "./icon";
import { CuentaAtras } from "./cuenta-atras";

/**
 * Bloque de DeCA en la portada.
 *
 * El DeCA es obligatorio en el transporte público de mercancías desde el 5 de
 * octubre de 2026. Esa fecha es el argumento de venta, así que el texto la
 * usa, pero calculada: un "quedan 17 días" escrito a mano queda desfasado al
 * día siguiente y en cuanto pase la fecha se convierte en una mentira.
 *
 * Se distinguen tres momentos porque el mensaje que convence es distinto en
 * cada uno: antes hay margen para prepararse, en la última semana urge, y
 * después ya no es previsión sino obligación en vigor.
 *
 * El enlace va a /deca, una ruta de esta misma web que redirige a la
 * plataforma. Pasar por ahí no es un rodeo: esa redirección lleva el parámetro
 * que hace que la comisión de la venta se le apunte a Takcanarias. Enlazar
 * directamente al dominio de destino se vería igual y no se cobraría.
 */

/** Se exporta para que el hero y esta sección usen la misma fecha. Con dos
 *  copias, el día que se corrija una quedaría la otra mintiendo. */
export const OBLIGATORIO_DECA = "2026-10-05T00:00:00+01:00";
const OBLIGATORIO_DESDE = new Date(OBLIGATORIO_DECA);

function diasHasta(fecha: Date, hoy: Date): number {
  const unDia = 86_400_000;
  // Se compara a días completos para que no dependa de la hora a la que se
  // mire la página.
  const desde = Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate());
  const hasta = Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate());
  return Math.round((hasta - desde) / unDia);
}

export function DecaAviso() {
  const dias = diasHasta(OBLIGATORIO_DESDE, new Date());
  const enVigor = dias <= 0;

  const titular = enVigor ? (
    <>
      El DeCA ya es obligatorio.
      <br />
      Nosotros te lo emitimos.
    </>
  ) : (
    <>
      El DeCA será obligatorio.
      <br />
      Que no te pille sin él.
    </>
  );

  const aviso = enVigor
    ? "Obligatorio desde el 5 de octubre de 2026"
    : dias === 1
      ? "Obligatorio mañana, 5 de octubre"
      : `Obligatorio en ${dias} días · 5 de octubre de 2026`;

  return (
    <section className="deca-section" aria-labelledby="deca-heading">
      <div className="container deca-grid">
        <div className="deca-copy">
          <CuentaAtras limiteISO={OBLIGATORIO_DESDE.toISOString()} respaldo={aviso} />
          <h2 id="deca-heading">{titular}</h2>
          <p>
            El documento electrónico de control administrativo sustituye al albarán en papel en el transporte público
            de mercancías por carretera. Cada porte tiene que llevar el suyo.
          </p>
          <p>
            En Takcanarias lo emites desde miDeCApro, la plataforma con la que trabajamos. Nosotros te ayudamos a
            ponerla en marcha y a resolver las dudas del principio.
          </p>
          <div className="deca-acciones">
            <Link href="/deca" className="button button-white">
              Empezar con miDeCApro
              <Icon name="external" />
            </Link>
            <Link href="/contacto" className="text-link deca-consulta">
              Prefiero que me lo expliquéis
              <Icon name="arrow" />
            </Link>
          </div>
        </div>

        <ul className="deca-puntos">
          <li>
            <Icon name="check" />
            <span>
              <strong>Un DeCA por cada porte</strong>
              Se genera antes de empezar el transporte y viaja con la mercancía.
            </span>
          </li>
          <li>
            <Icon name="check" />
            <span>
              <strong>En el móvil, sin papeles</strong>
              En un control de carretera se enseña desde el teléfono.
            </span>
          </li>
          <li>
            <Icon name="check" />
            <span>
              <strong>Con nuestro acompañamiento</strong>
              Te damos de alta y te enseñamos a emitir el primero.
            </span>
          </li>
        </ul>
      </div>
    </section>
  );
}
