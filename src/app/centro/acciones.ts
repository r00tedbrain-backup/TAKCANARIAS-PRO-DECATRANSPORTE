"use server";

/**
 * Acciones del centro.
 *
 * Todas empiezan igual: comprobando que quien llama es del centro. No es
 * repetición inútil. Una server action es un punto de entrada como cualquier
 * otro: se puede invocar sin pasar por la página que la pintó, así que proteger
 * la página no protege la acción.
 */

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { and, eq, sql } from "drizzle-orm";
import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { alumno, horarioSemanal, reserva, sesionClase, user } from "@/db/schema";
import { usuarioDelCentro } from "@/lib/centro";
import { AMBITOS } from "@/db/schema";

export type EstadoCentro = { ok: boolean; mensaje?: string };

const SIN_PERMISO: EstadoCentro = { ok: false, mensaje: "No tienes permiso para hacer esto." };

/** "HH:MM" en formato de 24 horas. Rechaza 25:00 y 12:60. */
const HORA = /^([01]\d|2[0-3]):([0-5]\d)$/;

function texto(formData: FormData, campo: string): string {
  const valor = formData.get(campo);
  return typeof valor === "string" ? valor.trim() : "";
}

export async function anadirFranja(_previo: EstadoCentro, formData: FormData): Promise<EstadoCentro> {
  if (!(await usuarioDelCentro())) return SIN_PERMISO;

  const ambito = texto(formData, "ambito");
  const diaSemana = Number(texto(formData, "diaSemana"));
  const horaInicio = texto(formData, "horaInicio");
  const horaFin = texto(formData, "horaFin");
  const plazas = Number(texto(formData, "plazas"));

  if (!AMBITOS.includes(ambito as (typeof AMBITOS)[number])) {
    return { ok: false, mensaje: "Ese tipo de clase no es válido." };
  }
  if (!Number.isInteger(diaSemana) || diaSemana < 1 || diaSemana > 7) {
    return { ok: false, mensaje: "Elige un día de la semana." };
  }
  if (!HORA.test(horaInicio) || !HORA.test(horaFin)) {
    return { ok: false, mensaje: "Las horas se escriben como 09:00 o 16:30." };
  }
  if (horaFin <= horaInicio) {
    // Comparar como texto funciona porque el formato es fijo "HH:MM".
    return { ok: false, mensaje: "La hora de fin tiene que ser posterior a la de inicio." };
  }
  if (!Number.isInteger(plazas) || plazas < 1 || plazas > 50) {
    return { ok: false, mensaje: "Las plazas tienen que ser un número entre 1 y 50." };
  }

  await db.insert(horarioSemanal).values({ ambito, diaSemana, horaInicio, horaFin, plazas });
  revalidatePath("/centro");
  return { ok: true, mensaje: "Franja añadida al horario." };
}

export async function borrarFranja(_previo: EstadoCentro, formData: FormData): Promise<EstadoCentro> {
  if (!(await usuarioDelCentro())) return SIN_PERMISO;

  const id = texto(formData, "franjaId");
  if (!id) return { ok: false, mensaje: "Falta indicar la franja." };

  await db.delete(horarioSemanal).where(eq(horarioSemanal.id, id));
  revalidatePath("/centro");
  return {
    ok: true,
    mensaje: "Franja quitada del horario. Las horas ya generadas siguen en pie; anúlalas una a una si hace falta.",
  };
}

/**
 * Crea las horas concretas de las próximas semanas a partir del horario.
 *
 * El cálculo lo hace Postgres a propósito. Canarias cambia la hora en marzo y
 * en octubre, y "las cuatro de la tarde" no son el mismo instante en enero que
 * en julio. `AT TIME ZONE` aplica la regla correcta para cada fecha; hacerlo a
 * mano en JavaScript significa equivocarse dos veces al año.
 *
 * `ON CONFLICT DO NOTHING` se apoya en el índice único de ámbito, inicio y fin:
 * se puede lanzar tantas veces como se quiera sin duplicar nada.
 */
export async function generarHoras(_previo: EstadoCentro, formData: FormData): Promise<EstadoCentro> {
  if (!(await usuarioDelCentro())) return SIN_PERMISO;

  const semanas = Number(texto(formData, "semanas"));
  if (!Number.isInteger(semanas) || semanas < 1 || semanas > 12) {
    return { ok: false, mensaje: "Indica entre 1 y 12 semanas." };
  }

  const resultado = await db.execute(sql`
    INSERT INTO sesion_clase (ambito, inicio, fin, plazas)
    SELECT
      h.ambito,
      ((d.dia + h.hora_inicio::time) AT TIME ZONE 'Atlantic/Canary'),
      ((d.dia + h.hora_fin::time)    AT TIME ZONE 'Atlantic/Canary'),
      h.plazas
    FROM horario_semanal h
    CROSS JOIN LATERAL (
      SELECT generate_series(
        (now() AT TIME ZONE 'Atlantic/Canary')::date + 1,
        -- El cast a int es obligatorio: el número de días viaja como parámetro
        -- y, sin tipo, Postgres no sabe qué "date + ?" aplicar y aborta con
        -- "operator is not unique".
        (now() AT TIME ZONE 'Atlantic/Canary')::date + (${semanas * 7})::int,
        interval '1 day'
      )::date AS dia
    ) d
    WHERE h.activo
      AND EXTRACT(ISODOW FROM d.dia) = h.dia_semana
    ON CONFLICT DO NOTHING
  `);

  revalidatePath("/centro");
  revalidatePath("/area-cliente/reservas");
  const creadas = resultado.rowCount ?? 0;
  return {
    ok: true,
    mensaje:
      creadas === 0
        ? "No se ha creado ninguna hora nueva: ya estaban todas generadas."
        : `Creadas ${creadas} horas nuevas. Las que ya existían se han dejado como estaban.`,
  };
}

/** Anula una hora concreta. Las reservas se conservan para poder avisar a quien la tenía. */
export async function anularHora(_previo: EstadoCentro, formData: FormData): Promise<EstadoCentro> {
  if (!(await usuarioDelCentro())) return SIN_PERMISO;

  const id = texto(formData, "sesionId");
  const motivo = texto(formData, "motivo");
  if (!id) return { ok: false, mensaje: "Falta indicar la hora." };
  if (motivo.length > 200) return { ok: false, mensaje: "El motivo es demasiado largo." };

  const [afectada] = await db
    .select({ id: sesionClase.id })
    .from(sesionClase)
    .where(and(eq(sesionClase.id, id), sql`${sesionClase.canceladaEn} IS NULL`))
    .limit(1);

  if (!afectada) return { ok: false, mensaje: "Esa hora no existe o ya estaba anulada." };

  await db
    .update(sesionClase)
    .set({ canceladaEn: new Date(), motivoCancelacion: motivo || null })
    .where(eq(sesionClase.id, id));

  revalidatePath("/centro");
  revalidatePath("/area-cliente/reservas");
  return {
    ok: true,
    mensaje: "Hora anulada. Quien la tuviera reservada la verá marcada, pero conviene avisarle igualmente.",
  };
}

/** Da por buena la ficha de un alumno. Hasta entonces no puede reservar. */
export async function validarAlumno(_previo: EstadoCentro, formData: FormData): Promise<EstadoCentro> {
  if (!(await usuarioDelCentro())) return SIN_PERMISO;

  const id = texto(formData, "alumnoId");
  const conAutorizacion = formData.get("conAutorizacion") === "on";
  if (!id) return { ok: false, mensaje: "Falta indicar el alumno." };

  const ahora = new Date();
  await db
    .update(alumno)
    .set({
      validadoEn: ahora,
      updatedAt: ahora,
      // Solo se sella la autorización si se marca expresamente. Dejarlo
      // automático convertiría este botón en una firma en blanco.
      ...(conAutorizacion ? { consentimientoTutorEn: ahora } : {}),
    })
    .where(eq(alumno.id, id));

  revalidatePath("/centro");
  return { ok: true, mensaje: "Ficha validada. El alumno ya puede reservar." };
}

/** Anula la reserva de un alumno desde el centro. */
export async function anularReservaDesdeCentro(_previo: EstadoCentro, formData: FormData): Promise<EstadoCentro> {
  if (!(await usuarioDelCentro())) return SIN_PERMISO;

  const id = texto(formData, "reservaId");
  if (!id) return { ok: false, mensaje: "Falta indicar la reserva." };

  await db
    .update(reserva)
    .set({ estado: "anulada", anuladaEn: new Date() })
    .where(and(eq(reserva.id, id), eq(reserva.estado, "activa")));

  revalidatePath("/centro");
  revalidatePath("/area-cliente/reservas");
  return { ok: true, mensaje: "Reserva anulada. La hora vuelve a quedar libre." };
}

/**
 * Alta de un alumno hecha por el centro.
 *
 * Es la vía normal de dar de alta: el registro público está cerrado porque
 * prefieren controlar ellos quién entra.
 *
 * NO se genera una contraseña para mandársela al alumno. Una contraseña
 * enviada por correo queda escrita para siempre en dos buzones y la gente no
 * la cambia nunca. En su lugar, la cuenta nace con una contraseña aleatoria
 * larga que no conoce nadie —ni el centro— y al alumno le llega un enlace para
 * poner la suya. El centro nunca ve la contraseña de nadie, que es como debe
 * ser.
 *
 * El correo se marca como verificado: lo ha comprobado el centro al dar el
 * alta, y hacer que el alumno confirme un correo que le acaban de dar en
 * mostrador sobra.
 */
export async function crearCuentaAlumno(_previo: EstadoCentro, formData: FormData): Promise<EstadoCentro> {
  if (!(await usuarioDelCentro())) return SIN_PERMISO;

  const nombre = texto(formData, "nombre");
  const email = texto(formData, "email").toLowerCase();
  const telefono = texto(formData, "telefono");
  const fechaNacimiento = texto(formData, "fechaNacimiento");
  const esMenor = formData.get("esMenor") === "on";
  const nombreAlumno = texto(formData, "nombreAlumno");
  const apellidosAlumno = texto(formData, "apellidosAlumno");

  if (!nombre) return { ok: false, mensaje: "Escribe el nombre de la persona titular de la cuenta." };
  if (nombre.length > 120) return { ok: false, mensaje: "El nombre es demasiado largo." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, mensaje: "Ese correo no es válido." };
  if (telefono && !/^[+\d][\d\s().-]{6,19}$/.test(telefono)) {
    return { ok: false, mensaje: "Ese teléfono no parece correcto." };
  }
  if (fechaNacimiento && !/^\d{4}-\d{2}-\d{2}$/.test(fechaNacimiento)) {
    return { ok: false, mensaje: "La fecha de nacimiento no es válida." };
  }
  if (esMenor && !nombreAlumno) {
    return { ok: false, mensaje: "Si la cuenta es para un menor, escribe el nombre del alumno." };
  }

  // Aleatoria y larga. No se guarda, no se enseña y no se envía: solo existe
  // para que la cuenta no quede sin contraseña hasta que el alumno ponga la suya.
  const provisional = randomBytes(24).toString("base64url");

  let userId: string;
  try {
    // Se pasan las cabeceras de quien está en el panel: es lo que permite al
    // hook de Better Auth ver que este alta la hace el centro y dejarla pasar
    // aunque el registro público esté cerrado.
    const creado = await auth.api.signUpEmail({
      body: { name: nombre, email, password: provisional },
      headers: await headers(),
    });
    userId = creado.user.id;
  } catch (error) {
    if (error instanceof APIError) {
      if (error.body?.code === "USER_ALREADY_EXISTS") {
        return { ok: false, mensaje: "Ya existe una cuenta con ese correo." };
      }
      return { ok: false, mensaje: error.body?.message ?? "No se ha podido crear la cuenta." };
    }
    return { ok: false, mensaje: "No se ha podido crear la cuenta. Inténtalo de nuevo." };
  }

  const ahora = new Date();

  // El correo lo ha comprobado el centro al dar el alta.
  await db.update(user).set({ emailVerified: true, updatedAt: ahora }).where(eq(user.id, userId));

  // La ficha del alumno, ya validada: la está creando el propio centro.
  await db.insert(alumno).values(
    esMenor
      ? {
          titularId: userId,
          esElTitular: false,
          nombre: nombreAlumno,
          apellidos: apellidosAlumno || null,
          fechaNacimiento: fechaNacimiento || null,
          telefono: telefono || null,
          validadoEn: ahora,
        }
      : {
          titularId: userId,
          esElTitular: true,
          nombre,
          fechaNacimiento: fechaNacimiento || null,
          telefono: telefono || null,
          validadoEn: ahora,
        },
  );

  // Enlace para que ponga su contraseña. Si el correo fallara, la cuenta queda
  // creada igualmente y se puede reenviar desde la pantalla de acceso, así que
  // no se deshace nada: se avisa y se sigue.
  let avisoCorreo = "Le hemos enviado un correo para que ponga su contraseña.";
  try {
    await auth.api.requestPasswordReset({
      body: { email, redirectTo: "/area-cliente/nueva-contrasena" },
      headers: await headers(),
    });
  } catch {
    avisoCorreo =
      "La cuenta está creada, pero no hemos podido enviarle el correo. Dile que entre en «He olvidado mi contraseña».";
  }

  revalidatePath("/centro");
  return { ok: true, mensaje: `Cuenta creada para ${esMenor ? nombreAlumno : nombre}. ${avisoCorreo}` };
}
