/**
 * Normas del centro sobre las anulaciones.
 *
 * La regla, tal como la dictó el centro: anular una práctica sin coste exige
 * avisar con antelación Y hacerlo en horario laboral. Su ejemplo literal: "no
 * vale un sábado o domingo para un lunes, porque los horarios están cerrados".
 * El sentido es que el aviso tiene que llegar cuando hay alguien que pueda
 * reaccionar y ofrecer esa hora a otro alumno.
 *
 * Una anulación fuera de plazo NO se bloquea: se registra marcada como tardía
 * y se avisa al alumno de que la práctica se puede cobrar. Al centro le sirve
 * más saber que el alumno no va a venir, aunque la cobre, que enterarse cuando
 * el coche ya está esperando en la puerta.
 */

/**
 * El centro dijo "24h/48h", que es ambiguo. Se aplica 24 mientras no
 * confirmen; para pasar a 48 basta con cambiar este número.
 */
export const HORAS_MINIMAS_ANTELACION = 24;

const ZONA = "Atlantic/Canary";

/** Lunes a viernes, de 8:00 a 20:00, en hora de Canarias. */
export function esHorarioLaboral(instante: Date): boolean {
  const partes = new Intl.DateTimeFormat("es-ES", {
    timeZone: ZONA,
    weekday: "short",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instante);

  const dia = partes.find((p) => p.type === "weekday")?.value ?? "";
  const hora = Number(partes.find((p) => p.type === "hour")?.value ?? "-1");

  const laborable = ["lun", "mar", "mié", "jue", "vie"].some((d) => dia.startsWith(d));
  return laborable && hora >= 8 && hora < 20;
}

/**
 * ¿Esta anulación está dentro de plazo?
 *
 * Las dos condiciones a la vez: antelación suficiente y momento laborable.
 * Con eso, el ejemplo del centro sale solo: para una práctica del lunes a las
 * 10:00, el domingo quedan más de 24 horas pero no es horario laboral, así que
 * el último momento válido es el viernes a las 20:00.
 */
export function anulacionEnPlazo(inicioClase: Date, ahora: Date = new Date()): boolean {
  const horasDeMargen = (inicioClase.getTime() - ahora.getTime()) / 3_600_000;
  return horasDeMargen >= HORAS_MINIMAS_ANTELACION && esHorarioLaboral(ahora);
}
