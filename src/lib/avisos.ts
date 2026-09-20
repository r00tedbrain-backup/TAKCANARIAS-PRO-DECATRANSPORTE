import "server-only";
import { enviar, escapar } from "./telegram";

/**
 * Avisos al centro cuando pasa algo en las reservas.
 *
 * Dos reglas gobiernan este fichero.
 *
 * La primera: un aviso que falla NO puede tumbar una reserva. Si Resend está
 * caído o el bot de Telegram deja de responder, el alumno tiene que quedarse con
 * su hora igualmente. Por eso todo va envuelto en try/catch y nada de lo de aquí
 * lanza hacia arriba: como mucho deja rastro en el registro del servidor.
 *
 * La segunda: los avisos se mandan DESPUÉS de contestar al alumno, con `after`.
 * Si se enviaran antes, el alumno estaría mirando una pantalla parada mientras
 * se habla con dos servicios externos.
 *
 * Los canales son independientes y opcionales. Si no hay dirección de correo
 * configurada, no se manda correo. Si no hay bot, no se manda Telegram. Que
 * falte uno no impide el otro.
 */

import { Resend } from "resend";
import { empresa, site } from "@/content/site";

const REMITENTE = process.env.EMAIL_REMITENTE ?? "Takcanarias <no-responder@avisos.takcanarias.es>";
const ZONA = "Atlantic/Canary";

/** A quién avisa el centro. Admite varias direcciones separadas por comas. */
function destinatarios(): string[] {
  return (process.env.AVISOS_EMAIL_CENTRO ?? "")
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean);
}

export type DatosAviso = {
  /** "nueva" o "anulada". */
  tipo: "nueva" | "anulada";
  alumno: string;
  titular: string;
  titularEmail: string;
  ambito: string;
  inicio: Date;
  fin: Date;
  /** Quién lo hizo: el propio alumno o alguien del centro. */
  origen: "alumno" | "centro";
  /** Anulada sin la antelación que piden las normas: valorar el cobro. */
  fueraDePlazo?: boolean;
};

const AMBITOS: Record<string, string> = {
  cap: "Formación CAP",
  autoescuela: "Autoescuela",
  apoyo: "Clases de apoyo",
  puntos: "Recuperación de puntos",
};

function cuando(inicio: Date, fin: Date): string {
  const dia = new Intl.DateTimeFormat("es-ES", { dateStyle: "full", timeZone: ZONA }).format(inicio);
  const h1 = new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: ZONA }).format(inicio);
  const h2 = new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: ZONA }).format(fin);
  return `${dia}, de ${h1} a ${h2}`;
}

function resumen(d: DatosAviso): { asunto: string; lineas: string[] } {
  const accion = d.tipo === "nueva" ? "Nueva reserva" : "Reserva anulada";
  const porQuien = d.origen === "centro" ? " (anulada desde el centro)" : "";
  const lineas = [
    `${accion}${porQuien}`,
    `Alumno: ${d.alumno}`,
    `Cuándo: ${cuando(d.inicio, d.fin)}`,
    `Tipo: ${AMBITOS[d.ambito] ?? d.ambito}`,
    `Cuenta: ${d.titular} (${d.titularEmail})`,
  ];
  if (d.fueraDePlazo) {
    lineas.push("FUERA DE PLAZO: según las normas, esta práctica se puede cobrar.");
  }
  return { asunto: `${accion}: ${d.alumno} — ${cuando(d.inicio, d.fin)}`, lineas };
}

/* ------------------------------------------------------------------ */
/* Correo                                                              */
/* ------------------------------------------------------------------ */

async function porCorreo(d: DatosAviso): Promise<void> {
  const para = destinatarios();
  const clave = process.env.RESEND_API_KEY;
  if (para.length === 0 || !clave) return; // Canal no configurado: no es un error.

  const { asunto, lineas } = resumen(d);
  const html = `<!doctype html>
<html lang="es"><body style="margin:0;padding:24px;background:#faf8f4;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:#191e56">
  <div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #dcdfe8;border-radius:4px;padding:32px">
    <p style="margin:0 0 4px;font-size:12px;letter-spacing:.18em;color:#585d6c">TAKCANARIAS</p>
    <h1 style="margin:0 0 18px;font-size:22px;line-height:1.3">${lineas[0]}</h1>
    ${lineas
      .slice(1)
      .map((l) => `<p style="margin:0 0 8px;font-size:15px;line-height:1.6">${l}</p>`)
      .join("")}
    <hr style="border:0;border-top:1px solid #dcdfe8;margin:22px 0 16px">
    <p style="margin:0;font-size:12px;color:#585d6c">
      Aviso automático del área del alumno.<br>
      ${empresa.razonSocial} · ${site.phone}
    </p>
  </div>
</body></html>`;

  const { error } = await new Resend(clave).emails.send({
    from: REMITENTE,
    to: para,
    subject: asunto,
    html,
    text: lineas.join("\n"),
  });
  if (error) throw new Error(error.message);
}

/* ------------------------------------------------------------------ */
/* Telegram                                                            */
/* ------------------------------------------------------------------ */

/**
 * Escapa el texto para el modo MarkdownV2 de Telegram.
 *
 * Telegram rechaza el mensaje entero si encuentra uno de estos caracteres sin
 * escapar, y los nombres de personas llevan guiones y puntos a menudo. Sin esto,
 * un alumno llamado "M. Ángel Pérez-López" haría fallar el aviso.
 */
const escaparTelegram = escapar;

/**
 * Telegram es SOLO DE SALIDA y con los datos al mínimo.
 *
 * De salida: aquí únicamente se llama a `sendMessage`. No hay webhook, no se
 * leen mensajes y el bot no puede ejecutar nada sobre la aplicación. Aunque
 * alguien se colara en el grupo o el token se filtrara, no podría tocar una
 * reserva ni consultar la base de datos: por este canal no entra nada.
 *
 * Al mínimo: un grupo de Telegram es un sitio poco controlado —se reenvía, se
 * añade gente, queda en el móvil de cualquiera— así que no se manda correo,
 * teléfono, apellidos ni identificadores. Solo el nombre de pila, el tipo de
 * clase y la hora, que es lo que hace falta para saber qué ha pasado. Quien
 * necesite la ficha completa la tiene en el panel, detrás de su contraseña.
 */
async function porTelegram(d: DatosAviso): Promise<void> {
  // Solo el nombre de pila: "María Suárez Pérez" viaja como "María".
  const nombreCorto = d.alumno.trim().split(/\s+/)[0];
  const titulo = d.tipo === "nueva" ? "Nueva reserva" : "Reserva anulada";
  const lineas = [
    `${titulo}${d.origen === "centro" ? " (desde el centro)" : ""}${d.fueraDePlazo ? " FUERA DE PLAZO" : ""}`,
    `${nombreCorto} · ${AMBITOS[d.ambito] ?? d.ambito}`,
    cuando(d.inicio, d.fin),
    "Los datos completos, en el panel.",
  ];

  const texto = `*${escaparTelegram(lineas[0])}*\n${lineas.slice(1).map(escaparTelegram).join("\n")}`;

  // El destino no se decide aquí: lo pone `enviar` leyéndolo de la base. Si el
  // centro no ha vinculado ninguna conversación, devuelve false y no pasa nada.
  await enviar(texto);
}

/* ------------------------------------------------------------------ */
/* Punto de entrada                                                    */
/* ------------------------------------------------------------------ */

/**
 * Avisa por los canales que estén configurados.
 *
 * Nunca lanza. Los dos canales se intentan por separado a propósito: que
 * Telegram falle no debe impedir que salga el correo, ni al revés.
 */
export async function avisarAlCentro(d: DatosAviso): Promise<void> {
  const resultados = await Promise.allSettled([porCorreo(d), porTelegram(d)]);

  for (const [i, r] of resultados.entries()) {
    if (r.status === "rejected") {
      const canal = i === 0 ? "correo" : "Telegram";
      // Se deja constancia, pero no se propaga: la reserva ya está hecha.
      console.error(`[avisos] No se pudo avisar al centro por ${canal}:`, r.reason);
    }
  }
}
