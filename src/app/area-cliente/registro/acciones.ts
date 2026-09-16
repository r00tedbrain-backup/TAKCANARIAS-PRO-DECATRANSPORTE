"use server";

/**
 * Alta de cuenta.
 *
 * Quien se registra es el titular de la cuenta, y puede no ser el alumno. El
 * centro da clases de apoyo desde los 6 años, y la ley no deja que un menor de
 * 14 autorice por sí mismo el uso de sus datos, así que un niño no puede tener
 * cuenta: se le da de alta como alumno colgando de la cuenta de su tutor.
 *
 * De ahí las dos vías del formulario: "la formación es para mí" y "apunto a un
 * menor a mi cargo". En ambos casos se crea una cuenta y una ficha de alumno;
 * lo que cambia es de quién son los datos de esa ficha.
 *
 * Todo ocurre aquí, en el servidor, y en este orden: validar, crear la cuenta
 * con Better Auth y guardar la ficha. El navegador nunca envía un identificador
 * de usuario; el id sale de la respuesta de Better Auth. Si se aceptara un id
 * del cliente, cualquiera podría colgar alumnos de la cuenta de otro.
 *
 * La ficha nace sin validar y sin consentimiento: esos dos sellos los pone el
 * centro a mano cuando comprueba la identidad y, si el alumno es menor, recibe
 * la autorización firmada. El registro no los puede otorgar.
 *
 * La validación del cliente es solo comodidad. La que cuenta es esta.
 */

import { APIError } from "better-auth/api";
import { auth, REGISTRO_ABIERTO } from "@/lib/auth";
import { db } from "@/db";
import { alumno } from "@/db/schema";

export type EstadoRegistro = {
  ok: boolean;
  mensaje?: string;
  errores?: Record<string, string>;
};

const MIN_PASSWORD = 10;

/**
 * Edad mínima para tener cuenta propia.
 *
 * No es un número elegido por nosotros: la LOPDGDD fija en 14 años la edad a
 * partir de la cual una persona puede consentir el tratamiento de sus datos.
 * Por debajo, el consentimiento lo da quien ejerce la tutela.
 */
const EDAD_MINIMA_CUENTA = 14;

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
  const privacidad = formData.get("privacidad") === "on";

  // Vía elegida. Cualquier valor que no sea "menor" se trata como "mi": ante un
  // dato manipulado, la opción segura es la que no crea fichas de terceros.
  const paraMenor = texto(formData, "paraQuien") === "menor";
  const menorNombre = texto(formData, "menorNombre");
  const menorApellidos = texto(formData, "menorApellidos");
  const menorFechaNacimiento = texto(formData, "menorFechaNacimiento");

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
  const edadTitular = fechaNacimiento ? calcularEdad(fechaNacimiento, hoy) : null;
  if (!fechaNacimiento) errores.fechaNacimiento = "Indica tu fecha de nacimiento.";
  else if (edadTitular === null) errores.fechaNacimiento = "Esa fecha no es válida.";
  else if (edadTitular > 120) errores.fechaNacimiento = "Revisa la fecha: el año no parece correcto.";
  else if (edadTitular < EDAD_MINIMA_CUENTA) {
    errores.fechaNacimiento = `Para abrir una cuenta hay que tener al menos ${EDAD_MINIMA_CUENTA} años. Si el alumno es más pequeño, la cuenta debe crearla su padre, madre o tutor.`;
  }

  if (telefono && !/^[+\d][\d\s().-]{6,19}$/.test(telefono)) {
    errores.telefono = "Ese teléfono no parece correcto. Puedes dejarlo en blanco.";
  }

  // Datos del menor. Solo se miran si se ha elegido esa vía, para no bloquear
  // el alta de un adulto por campos que ni siquiera ha visto.
  let edadMenor: number | null = null;
  if (paraMenor) {
    if (!menorNombre) errores.menorNombre = "Escribe el nombre del alumno.";
    else if (menorNombre.length > 120) errores.menorNombre = "El nombre es demasiado largo.";

    if (menorApellidos.length > 160) errores.menorApellidos = "Los apellidos son demasiado largos.";

    edadMenor = menorFechaNacimiento ? calcularEdad(menorFechaNacimiento, hoy) : null;
    if (!menorFechaNacimiento) errores.menorFechaNacimiento = "Indica la fecha de nacimiento del alumno.";
    else if (edadMenor === null) errores.menorFechaNacimiento = "Esa fecha no es válida.";
    else if (edadMenor > 120) errores.menorFechaNacimiento = "Revisa la fecha: el año no parece correcto.";
    else if (edadMenor >= 18) {
      // Un adulto es responsable de sus propios datos. Que otra persona le abra
      // la ficha por su cuenta no es algo que debamos permitir aquí.
      errores.menorFechaNacimiento = "Esa persona ya es mayor de edad, así que tiene que crear su propia cuenta.";
    }
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
    await db.insert(alumno).values(
      paraMenor
        ? {
            titularId: userId,
            esElTitular: false,
            nombre: menorNombre,
            apellidos: menorApellidos || null,
            fechaNacimiento: menorFechaNacimiento,
            // El del tutor: el centro llama a un adulto, no al niño.
            telefono: telefono || null,
            consentimientoTutorEn: null,
            validadoEn: null,
          }
        : {
            titularId: userId,
            esElTitular: true,
            nombre,
            fechaNacimiento,
            telefono: telefono || null,
            consentimientoTutorEn: null,
            validadoEn: null,
          },
    );
  } catch {
    // La cuenta existe pero le falta la ficha. Decirlo, no disimularlo.
    return {
      ok: false,
      mensaje:
        "Hemos creado tu cuenta, pero no hemos podido guardar el resto de los datos. Llama al centro y lo completamos nosotros.",
    };
  }

  return {
    ok: true,
    mensaje: paraMenor
      ? "Cuenta creada. Antes de dar de alta al alumno, el centro necesita la autorización firmada. Te avisaremos."
      : "Cuenta creada. El centro tiene que comprobar tus datos antes de activarla. Te avisaremos.",
  };
}
