/**
 * Guía paso a paso del panel del centro.
 *
 * No es un texto fijo: mira el estado real —si hay horario, si hay horas
 * abiertas, si hay alumnos, si hay reservas— y marca qué está hecho y qué
 * toca ahora. Así el primer día guía la puesta en marcha, y cuando todo rueda
 * se convierte en un resumen de un vistazo.
 *
 * Siempre visible y sin botón de cerrar, a propósito: una guía que se puede
 * quitar se quita el primer día y luego nadie recuerda cómo se abría. Cuando
 * todo está en marcha ocupa poco y no estorba.
 *
 * Los enlaces son anclas a las secciones de esta misma página: no hay que
 * aprenderse ninguna navegación.
 */

import { Icon } from "./icon";

type Paso = {
  titulo: string;
  hecho: boolean;
  /** Qué hacer, dicho para quien no ha visto esto nunca. */
  indicacion: string;
  /** Ancla de la sección de esta misma página donde se hace. */
  ancla: string;
};

export function GuiaCentro({
  hayHorario,
  hayHorasAbiertas,
  hayAlumnos,
  hayReservas,
  fichasPendientes,
}: {
  hayHorario: boolean;
  hayHorasAbiertas: boolean;
  hayAlumnos: boolean;
  hayReservas: boolean;
  fichasPendientes: number;
}) {
  const pasos: Paso[] = [
    {
      titulo: "Poner el horario de la semana",
      hecho: hayHorario,
      indicacion:
        "Describe una semana normal: qué días dais clase, a qué horas y cuántas a la vez. Se hace una sola vez y se repite sola.",
      ancla: "#horario",
    },
    {
      titulo: "Abrir horas para los alumnos",
      hecho: hayHorasAbiertas,
      indicacion:
        "Convierte ese horario en horas concretas de las próximas semanas. Hasta que no lo pulses, los alumnos no ven nada que reservar.",
      ancla: "#generar",
    },
    {
      titulo: "Dar de alta a los alumnos",
      hecho: hayAlumnos,
      indicacion:
        "Con su nombre y su correo. A cada uno le llega un enlace para elegir su contraseña; vosotros nunca la veis.",
      ancla: "#alta",
    },
    {
      titulo: "Los alumnos reservan solos",
      hecho: hayReservas,
      indicacion:
        "A partir de aquí este panel es para mirar quién viene y anular cuando haga falta. Este paso se completa solo, con la primera reserva.",
      ancla: "#quien-viene",
    },
  ];

  const todoEnMarcha = pasos.every((p) => p.hecho);
  const actual = pasos.findIndex((p) => !p.hecho);

  return (
    <section className="guia" aria-labelledby="guia-heading">
      <h2 id="guia-heading">{todoEnMarcha ? "Todo en marcha" : "Puesta en marcha, paso a paso"}</h2>
      <p className="guia-intro">
        {todoEnMarcha
          ? "Los cuatro pasos están hechos. Esta guía se queda aquí por si algún día hay que repetir alguno."
          : "El orden importa: cada paso necesita el anterior. La guía marca sola lo que ya está hecho."}
      </p>

      <ol className="guia-pasos">
        {pasos.map((p, i) => {
          const estado = p.hecho ? "hecha" : i === actual ? "actual" : "pendiente";
          return (
            <li className={`guia-paso ${estado}`} key={p.titulo}>
              <span className="guia-marca" aria-hidden="true">
                {p.hecho ? <Icon name="check" /> : i + 1}
              </span>
              <div>
                <p className="guia-titulo">
                  {p.titulo}
                  {estado === "actual" && <span className="guia-ahora"> — este es el siguiente</span>}
                </p>
                <p className="guia-texto">{p.indicacion}</p>
                {!p.hecho && (
                  <a className="text-link" href={p.ancla}>
                    Ir al apartado
                    <Icon name="arrow" />
                  </a>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {fichasPendientes > 0 && (
        <p className="guia-aviso">
          Además: {fichasPendientes === 1 ? "hay 1 ficha esperando" : `hay ${fichasPendientes} fichas esperando`} tu
          revisión. Mientras no se validen, esos alumnos no pueden reservar.{" "}
          <a className="text-link" href="#pendientes">
            Revisarlas
            <Icon name="arrow" />
          </a>
        </p>
      )}
    </section>
  );
}
