/**
 * Cliente de Better Auth para el navegador.
 *
 * Solo habla con nuestro propio `/api/auth`. La URL se fija con
 * NEXT_PUBLIC_APP_URL para que las peticiones se dirijan siempre al dominio
 * correcto; si no está definida, Better Auth usa el origen de la página, que
 * es lo razonable en desarrollo.
 *
 * Aquí no hay nada secreto: este archivo viaja al navegador.
 */
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
});

export const { signIn, signUp, signOut, useSession } = authClient;
