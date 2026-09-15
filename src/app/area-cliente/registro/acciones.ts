"use server";

/**
 * Alta de alumno.
 *
 * Todo ocurre aquí, en el servidor, y en este orden: validar, crear la cuenta
 * con Better Auth y guardar el perfil. El navegador nunca envía un
 * identificador de usuario; el id sale de la respuesta de Better Auth. Si se
 * aceptara un id del cliente, cualquiera podría escribir sobre el perfil de
 * otra persona.
 *
 * La cuenta nace sin validar y sin consentimiento de tutor: esos dos sellos
 * los pone el centro a mano cuando comprueba la identidad y, si el alumno es
 * menor, recibe la autorización firmada. El registro no los puede otorgar.
 *
 * La validación del cliente es solo comodidad. La que cuenta es esta.
 */

import { randomUUID } from "node:crypto";
import { APIError } from "better-auth/api";
import { auth, REGISTRO_ABIERTO } from "@/lib/auth";
import { db } from "@/db";
import { perfilAlumno } from "@/db/schema";

export type EstadoRegistro = {
  ok: boolean;
  mensaje?: string;
  errores?: Record<string, string>;
};

const MIN_PASSWORD = 10;

/**
 * Edad en años cumplidos. Se calcula en UTC para que cliente y servidor
 * coincidan. Duplicada a propósito en el formulario: aquella solo decide qué
 * campos se enseñan, esta es la que decide si el alta es válida.
 */
function calcularEdad(fechaISO: string, hoy: Date): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaISO)) return null;
  const nacimiento = new Date(`${fechaISO}T00:00:00Z`);
  if (Number.isNaN(nacimiento.getTime())) return null;
  if (nacimiento.getTime() > hoy.getTime()) return null;

  let edad = hoy.getUTCFullYear() - nacimiento.getUTCFullYear();
  const meses = hoy.getUTCMonth() - nacimiento.getUTCMonth();
  if (meses < 0 || (meses === 0 && hoy.getUTCDate() < nacimiento.getUTCDate())) edad -= 1;
  return edad;
}

function texto(formData: FormData, campo: string): string {
  const valor = formData.get(campo);
  return typeof valor === "string" ? valor.trim() : "";
}

export async function registrarAlumno(_estadoPrevio: EstadoRegistro, formData: FormData): Promise<EstadoRegistro> {
  if (!REGISTRO_ABIERTO) {
    return { ok: false, mensaje: "El registro no está abierto. Ponte en contacto con el centro para darte de alta." };
  }

  const nombre = texto(formData, "nombre");
  const email = texto(formData, "email").toLowerCase();
  const password = typeof formData.get("password") === "string" ? (formData.get("password") as string) : "";
  const confirmacion = typeof formData.get("confirmacion") === "string" ? (formData.get("confirmacion") as string) : "";
  const fechaNacimiento = texto(formData, "fechaNacimiento");
  const telefono = texto(formData, "telefono");
  const tutorNombre = texto(formData, "tutorNombre");
  const tutorContacto = texto(formData, "tutorContacto");
  const privacidad = formData.get("privacidad") === "on";

  const errores: Record<string, string> = {};

  if (!nombre) errores.nombre = "Escribe tu nombre y apellidos.";
  else if (nombre.length > 120) errores.nombre = "El nombre es demasiado largo.";

  if (!email) errores.email = "Escribe tu correo electrónico.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errores.email = "Ese correo no parece completo. Revisa que incluya la arroba y el dominio.";

  if (!password) errores.password = "Escribe una contraseña.";
  else if (password.length < MIN_PASSWORD) errores.password = `La contraseña necesita al menos ${MIN_PASSWORD} caracteres.`;
  else if (password.length > 128) errores.password = "La contraseña no puede pasar de 128 caracteres.";

  if (!confirmacion) errores.confirmacion = "Repite la contraseña.";
  else if (password && confirmacion !== password) errores.confirmacion = "Las dos contraseñas no coinciden.";

  const hoy = new Date();
  const edad = fechaNacimiento ? calcularEdad(fechaNacimiento, hoy) : null;
  if (!fechaNacimiento) errores.fechaNacimiento = "Indica tu fecha de nacimiento.";
  else if (edad === null) errores.fechaNacimiento = "Esa fecha no es válida.";
  else if (edad > 120) errores.fechaNacimiento = "Revisa la fecha: el año no parece correcto.";

  if (telefono && !/^[+\d][\d\s().-]{6,19}$/.test(telefono)) {
    errores.telefono = "Ese teléfono no parece correcto. Puedes dejarlo en blanco.";
  }

  const esMenor = edad !== null && edad < 18;
  if (esMenor) {
    if (!tutorNombre) errores.tutorNombre = "Al ser menor de edad, necesitamos el nombre de tu padre, madre o tutor.";
    if (!tutorContacto) errores.tutorContacto = "Necesitamos un teléfono o correo de contacto del tutor.";
  }

  if (!privacidad) errores.privacidad = "Tienes que aceptar la información de privacidad para continuar.";

  if (Object.keys(errores).length > 0) {
    return { ok: false, errores, mensaje: "Revisa los campos marcados." };
  }

  let userId: string;
  try {
    const resultado = await auth.api.signUpEmail({
      body: { name: nombre, email, password },
    });
    userId = resultado.user.id;
  } catch (error) {
    if (error instanceof APIError) {
      const codigo = error.body?.code;
      if (codigo === "USER_ALREADY_EXISTS") {
        return {
          ok: false,
          errores: { email: "Ya existe una cuenta con ese correo. Entra con ella o llama al centro si no la reconoces." },
          mensaje: "Revisa los campos marcados.",
        };
      }
      return { ok: false, mensaje: error.body?.message ?? "No hemos podido crear la cuenta. Inténtalo de nuevo." };
    }
    return { ok: false, mensaje: "No hemos podido crear la cuenta. Inténtalo de nuevo en unos minutos." };
  }

  try {
    await db.insert(perfilAlumno).values({
      id: randomUUID(),
      userId,
      telefono: telefono || null,
      fechaNacimiento,
      tutorNombre: esMenor ? tutorNombre : null,
      tutorContacto: esMenor ? tutorContacto : null,
      // El centro rellena estos dos tras comprobar identidad y autorización.
      consentimientoTutorEn: null,
      validadoEn: null,
    });
  } catch {
    // La cuenta existe pero le falta la ficha. Decirlo, no disimularlo.
    return {
      ok: false,
      mensaje:
        "Hemos creado tu cuenta, pero no hemos podido guardar el resto de tus datos. Llama al centro y lo completamos nosotros.",
    };
  }

  return {
    ok: true,
    mensaje: esMenor
      ? "Cuenta creada. Antes de activarla, el centro tiene que confirmar la autorización de tu padre, madre o tutor. Te avisaremos."
      : "Cuenta creada. El centro tiene que comprobar tus datos antes de activarla. Te avisaremos.",
  };
}
