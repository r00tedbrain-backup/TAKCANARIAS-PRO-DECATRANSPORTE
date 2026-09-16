"use server";

/**
 * Reservar y anular huecos.
 *
 * Dos cosas se hacen aquí y ninguna es negociable.
 *
 * La primera: comprobar que el alumno para el que se reserva cuelga de la
 * cuenta de quien lo pide. El identificador del alumno llega del navegador
 * —hace falta, porque un tutor puede tener varios hijos— y por tanto no es de
 * fiar. Sin esta comprobación, cambiar un valor en el formulario permitiría
 * reservar en nombre de cualquiera.
 *
 * La segunda: que dos alumnos no se queden con la misma plaza. Mirar cuántas
 * quedan y luego insertar no basta: entre lo uno y lo otro puede colarse otro
 * que haga exactamente lo mismo, y los dos ven hueco libre. Por eso todo va
 * dentro de una transacción que bloquea la fila del hueco, de modo que las
 * peticiones sobre ese mismo hueco se atienden de una en una.
 */

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { and, count, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { alumno, reserva, sesionClase } from "@/db/schema";

export type EstadoReserva = { ok: boolean; mensaje?: string };

/**
 * Confirma que ese alumno es de esta cuenta. Devuelve null si no lo es.
 *
 * La consulta filtra a la vez por alumno y por titular: si el alumno existe
 * pero es de otra familia, no hay resultado. No se distingue entre "no existe"
 * y "no es tuyo" a propósito, para no confirmar qué identificadores son reales.
 */
async function alumnoDeLaCuenta(alumnoId: string, titularId: string) {
  const [fila] = await db
    .select({ id: alumno.id, nombre: alumno.nombre })
    .from(alumno)
    .where(and(eq(alumno.id, alumnoId), eq(alumno.titularId, titularId)))
    .limit(1);
  return fila ?? null;
}

export async function reservarHueco(_previo: EstadoReserva, formData: FormData): Promise<EstadoReserva> {
  const sesion = await auth.api.getSession({ headers: await headers() });
  if (!sesion) return { ok: false, mensaje: "Tu sesión ha caducado. Entra de nuevo para reservar." };

  const alumnoId = String(formData.get("alumnoId") ?? "");
  const sesionId = String(formData.get("sesionId") ?? "");
  if (!alumnoId || !sesionId) return { ok: false, mensaje: "Falta indicar el alumno o la hora." };

  const elAlumno = await alumnoDeLaCuenta(alumnoId, sesion.user.id);
  if (!elAlumno) return { ok: false, mensaje: "Ese alumno no está en tu cuenta." };

  try {
    const resultado = await db.transaction(async (tx) => {
      // Bloquea la fila del hueco hasta el final de la transacción. A partir de
      // aquí, cualquier otro que vaya a por este mismo hueco espera su turno.
      const [hueco] = await tx
        .select()
        .from(sesionClase)
        .where(eq(sesionClase.id, sesionId))
        .limit(1)
        .for("update");

      if (!hueco) return { ok: false, mensaje: "Esa hora ya no está disponible." };
      if (hueco.canceladaEn) {
        return { ok: false, mensaje: "El centro ha anulado esa hora." };
      }
      if (hueco.inicio.getTime() <= Date.now()) {
        return { ok: false, mensaje: "Esa hora ya ha pasado." };
      }

      const [ocupacion] = await tx
        .select({ tomadas: count() })
        .from(reserva)
        .where(and(eq(reserva.sesionId, sesionId), eq(reserva.estado, "activa")));

      if (ocupacion.tomadas >= hueco.plazas) {
        return { ok: false, mensaje: "Se acaban de agotar las plazas de esa hora. Elige otra." };
      }

      await tx.insert(reserva).values({ alumnoId, sesionId, estado: "activa" });
      return { ok: true, mensaje: `Hora reservada para ${elAlumno.nombre}.` };
    });

    if (resultado.ok) revalidatePath("/area-cliente/reservas");
    return resultado;
  } catch (error) {
    // El índice único salta si ya tenía esa misma hora cogida. Es el único
    // error esperable aquí, y conviene decirlo tal cual en vez de "ha fallado".
    if (error instanceof Error && error.message.includes("reserva_alumno_sesion")) {
      return { ok: false, mensaje: "Ese alumno ya tiene reservada esa hora." };
    }
    return { ok: false, mensaje: "No hemos podido reservar. Inténtalo de nuevo en un momento." };
  }
}

export async function anularReserva(_previo: EstadoReserva, formData: FormData): Promise<EstadoReserva> {
  const sesion = await auth.api.getSession({ headers: await headers() });
  if (!sesion) return { ok: false, mensaje: "Tu sesión ha caducado. Entra de nuevo." };

  const reservaId = String(formData.get("reservaId") ?? "");
  if (!reservaId) return { ok: false, mensaje: "Falta indicar la reserva." };

  // Se busca la reserva junto con su alumno y se exige que el alumno sea de
  // esta cuenta. Así, un identificador de reserva ajeno no encuentra nada.
  const [fila] = await db
    .select({ id: reserva.id, inicio: sesionClase.inicio, estado: reserva.estado })
    .from(reserva)
    .innerJoin(alumno, eq(reserva.alumnoId, alumno.id))
    .innerJoin(sesionClase, eq(reserva.sesionId, sesionClase.id))
    .where(and(eq(reserva.id, reservaId), eq(alumno.titularId, sesion.user.id)))
    .limit(1);

  if (!fila) return { ok: false, mensaje: "Esa reserva no es tuya o ya no existe." };
  if (fila.estado === "anulada") return { ok: false, mensaje: "Esa reserva ya estaba anulada." };
  if (fila.inicio.getTime() <= Date.now()) {
    return { ok: false, mensaje: "Esa hora ya ha pasado; no se puede anular. Llama al centro." };
  }

  await db
    .update(reserva)
    .set({ estado: "anulada", anuladaEn: new Date() })
    .where(eq(reserva.id, reservaId));

  revalidatePath("/area-cliente/reservas");
  return { ok: true, mensaje: "Reserva anulada. La hora vuelve a quedar libre." };
}
