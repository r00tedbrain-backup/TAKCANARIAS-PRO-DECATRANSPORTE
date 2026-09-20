import "server-only";

/**
 * Quién es del centro.
 *
 * El rol NO se lee de la sesión: se consulta contra la base de datos en cada
 * petición. La sesión es un dato que viaja en una cookie y puede quedarse
 * antigua; si a alguien se le retira el permiso, seguiría entrando hasta que
 * caducara. Consultando la tabla, el permiso se retira en el acto.
 *
 * Esta comprobación tiene que ir en CADA página y en CADA acción del centro,
 * no solo al pintar el menú. Esconder un botón no impide que alguien envíe el
 * formulario a mano.
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema";

export type Rol = "alumno" | "centro" | "admin";

export type UsuarioCentro = { id: string; nombre: string; email: string; rol: Rol; esAdmin: boolean };

/** Roles que ven el panel. El admin es personal además de administrador. */
const PERSONAL: readonly string[] = ["centro", "admin"];

/** Devuelve el usuario si es personal del centro; null en cualquier otro caso. */
export async function usuarioDelCentro(): Promise<UsuarioCentro | null> {
  const sesion = await auth.api.getSession({ headers: await headers() });
  if (!sesion) return null;

  const [fila] = await db
    .select({ id: user.id, nombre: user.name, email: user.email, rol: user.rol })
    .from(user)
    .where(eq(user.id, sesion.user.id))
    .limit(1);

  if (!fila || !PERSONAL.includes(fila.rol)) return null;
  return {
    id: fila.id,
    nombre: fila.nombre,
    email: fila.email,
    rol: fila.rol as Rol,
    esAdmin: fila.rol === "admin",
  };
}

/**
 * Solo el administrador.
 *
 * Aparte de `usuarioDelCentro` a propósito. Crear cuentas de personal, cambiar
 * roles y restablecer contraseñas ajenas son operaciones que permiten
 * ascenderse y perpetuarse: si las pudiera hacer cualquiera del centro, robar
 * una sola cuenta del personal bastaría para fabricar más y no salir nunca.
 */
export async function usuarioAdmin(): Promise<UsuarioCentro | null> {
  const u = await usuarioDelCentro();
  return u?.esAdmin ? u : null;
}

/**
 * Para páginas. Saca de aquí a quien no sea del centro.
 *
 * A quien no ha entrado se le manda al acceso; a quien ha entrado pero no es
 * del centro, a su panel. No se le enseña un "no tienes permiso" porque no
 * hace falta que sepa que esta parte existe.
 */
export async function exigirCentro(): Promise<UsuarioCentro> {
  const delCentro = await usuarioDelCentro();
  if (!delCentro) {
    const sesion = await auth.api.getSession({ headers: await headers() });
    redirect(sesion ? "/area-cliente/panel" : "/area-cliente/acceso");
  }
  return delCentro;
}
