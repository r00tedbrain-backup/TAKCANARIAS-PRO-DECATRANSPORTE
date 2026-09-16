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
import { betterAuth, APIError } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { enviarBienvenidaDelCentro, enviarRestablecer, enviarVerificacion } from "./email";
import * as schema from "@/db/schema";

export const REGISTRO_ABIERTO = process.env.AREA_ALUMNO_REGISTRO_ABIERTO === "1";

/**
 * ¿La petición la hace alguien del centro?
 *
 * Se resuelve leyendo la sesión que viaja en las cabeceras y comprobando el rol
 * contra la base de datos. Cualquier fallo se trata como "no": ante la duda,
 * con el registro cerrado, no se da de alta a nadie.
 */
async function laPeticionVieneDelCentro(cabeceras: Headers | undefined): Promise<boolean> {
  if (!cabeceras) return false;
  try {
    const sesion = await auth.api.getSession({ headers: cabeceras });
    if (!sesion) return false;

    const [quien] = await db
      .select({ rol: schema.user.rol })
      .from(schema.user)
      .where(eq(schema.user.id, sesion.user.id))
      .limit(1);

    return quien?.rol === "centro";
  } catch {
    return false;
  }
}

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
    /**
     * El mismo enlace sirve para dos situaciones distintas, y el texto no puede
     * ser el mismo en ambas.
     *
     * Si la cuenta se acaba de crear, quien la recibe es un alumno al que el
     * centro ha dado de alta: no ha pedido nada y no tiene contraseña que
     * cambiar. Decirle "has pedido cambiar tu contraseña" le haría pensar que
     * alguien está trasteando con su cuenta.
     *
     * Se distingue por la antigüedad de la cuenta. Un alta del centro dispara
     * este envío en el mismo segundo; una petición de olvido llega siempre
     * mucho después.
     */
    sendResetPassword: async ({ user, url }) => {
      const recienCreada = Date.now() - new Date(user.createdAt).getTime() < 2 * 60 * 1000;
      if (recienCreada) await enviarBienvenidaDelCentro(user.email, user.name, url);
      else await enviarRestablecer(user.email, user.name, url);
    },
    resetPasswordTokenExpiresIn: 60 * 60,
    // Quien cambia la contraseña suele hacerlo porque sospecha que alguien
    // tiene acceso. Cerrar las demás sesiones es justo lo que espera.
    revokeSessionsOnPasswordReset: true,
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await enviarVerificacion(user.email, user.name, url);
    },
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

  /**
   * El cierre del registro se aplica aquí, en el servidor.
   *
   * Ocultar el formulario no basta: la API de alta sigue siendo pública y
   * responde a cualquiera que la llame directamente. Comprobado en pruebas,
   * donde se creó una cuenta con el formulario ya oculto.
   *
   * Con el registro cerrado queda una excepción: el propio centro. "Cerrado"
   * significa que no se puede dar de alta cualquiera desde la calle, no que el
   * centro no pueda matricular a un alumno. La excepción se comprueba mirando
   * la sesión de quien hace la petición contra la base de datos, no con una
   * marca que viaje en la llamada: un dato que llega de fuera lo puede poner
   * cualquiera, y aquí se está decidiendo quién entra en el sistema.
   */
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (!ctx.path.startsWith("/sign-up") || REGISTRO_ABIERTO) return;

      if (await laPeticionVieneDelCentro(ctx.headers)) return;

      throw new APIError("FORBIDDEN", {
        message: "El registro de alumnos todavía no está abierto. Contacta con el centro.",
        code: "REGISTRO_CERRADO",
      });
    }),
  },

  rateLimit: {
    enabled: true,
    window: 60,
    max: 20,
    storage: "database",
  },
});

export type Sesion = typeof auth.$Infer.Session;
