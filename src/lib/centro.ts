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

export type UsuarioCentro = { id: string; nombre: string; email: string };

/** Devuelve el usuario si es del centro; null en cualquier otro caso. */
export async function usuarioDelCentro(): Promise<UsuarioCentro | null> {
  const sesion = await auth.api.getSession({ headers: await headers() });
  if (!sesion) return null;

  const [fila] = await db
    .select({ id: user.id, nombre: user.name, email: user.email, rol: user.rol })
    .from(user)
    .where(eq(user.id, sesion.user.id))
    .limit(1);

  if (!fila || fila.rol !== "centro") return null;
  return { id: fila.id, nombre: fila.nombre, email: fila.email };
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
