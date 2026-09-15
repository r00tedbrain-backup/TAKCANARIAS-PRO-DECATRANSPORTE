/**
 * Punto de entrada de Better Auth.
 *
 * Todo lo que el cliente hace (entrar, cerrar sesión, leer la sesión) pasa
 * por aquí. La lógica vive en `src/lib/auth.ts`; este archivo solo la expone
 * como ruta HTTP.
 *
 * `force-dynamic` porque cada petición depende de sus cookies y cabeceras:
 * no hay nada que se pueda generar por adelantado.
 */
import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const { GET, POST } = toNextJsHandler(auth);
