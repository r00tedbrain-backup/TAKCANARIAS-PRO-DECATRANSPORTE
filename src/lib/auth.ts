/**
 * Autenticación del área de alumnos.
 *
 * El registro está cerrado por defecto y solo se abre con
 * AREA_ALUMNO_REGISTRO_ABIERTO=1. Mientras la titular no facilite razón
 * social, NIF y apruebe los textos legales, no se deben guardar datos de
 * alumnos reales: buena parte son menores.
 *
 * Verificación de correo: se exige, pero el envío todavía no está montado
 * (falta decidir proveedor). Hasta entonces el registro permanece cerrado,
 * así que no hay cuentas colgadas sin poder validar.
 */
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";

export const REGISTRO_ABIERTO = process.env.AREA_ALUMNO_REGISTRO_ABIERTO === "1";

/**
 * Durante `next build` no hay credenciales reales: Next carga estos módulos
 * solo para recopilar las rutas. En ese caso se usa un valor de relleno.
 *
 * Al arrancar el servidor la variable SIEMPRE es obligatoria, así que un
 * despliegue mal configurado falla de inmediato en vez de quedarse con un
 * secreto de relleno.
 */
const EN_COMPILACION = process.env.NEXT_PHASE === "phase-production-build";

function requerido(nombre: string): string {
  const valor = process.env[nombre];
  if (valor) return valor;
  if (!EN_COMPILACION) throw new Error(`Falta la variable de entorno ${nombre}`);
  // `.invalid` está reservado y no resuelve nunca (RFC 2606): si este valor
  // llegara a ejecutarse por error, falla en vez de apuntar a algún sitio.
  return nombre.endsWith("URL")
    ? "https://compilacion.invalid"
    : `relleno-de-compilacion-${nombre}`;
}

if (!EN_COMPILACION && process.env.NODE_ENV === "production") {
  const secreto = process.env.BETTER_AUTH_SECRET ?? "";
  if (secreto.length < 32 || secreto.startsWith("relleno-de-compilacion")) {
    throw new Error("BETTER_AUTH_SECRET debe ser un secreto real de 32 caracteres o más");
  }
}

export const auth = betterAuth({
  appName: "Takcanarias",
  baseURL: requerido("BETTER_AUTH_URL"),
  secret: requerido("BETTER_AUTH_SECRET"),
  database: drizzleAdapter(db, { provider: "pg", schema }),

  emailAndPassword: {
    enabled: true,
    // Better Auth exige 8; subimos el mínimo y dejamos margen para frases largas.
    minPasswordLength: 10,
    maxPasswordLength: 128,
    requireEmailVerification: true,
    autoSignIn: false,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },

  // Sin esto, cualquier origen podría lanzar peticiones autenticadas.
  trustedOrigins: [requerido("BETTER_AUTH_URL")],

  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    database: { generateId: "uuid" },
  },

  rateLimit: {
    enabled: true,
    window: 60,
    max: 20,
    storage: "database",
  },
});

export type Sesion = typeof auth.$Infer.Session;
