/**
 * Esquema del área de alumnos.
 *
 * Dos bloques. El primero son las tablas que necesita Better Auth y cuyos
 * nombres no se pueden cambiar. El segundo son las nuestras.
 *
 * Las tablas de cursos, sesiones y reservas se crean ahora aunque la reserva
 * de agenda todavía no esté contratada: así el día que se active no hay que
 * migrar datos de alumnos ya registrados.
 *
 * Sobre menores: parte del alumnado de clases de apoyo lo es. La fecha de
 * nacimiento y los datos del tutor viven aquí, y sin el consentimiento
 * registrado la cuenta no debe poder usarse. No guardamos DNI ni dirección
 * del alumno: no hacen falta para esto.
 */
import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, boolean, integer, bigint, date, uniqueIndex, index } from "drizzle-orm/pg-core";

/**
 * Identificador primario.
 *
 * El valor por defecto lo pone Postgres: Better Auth inserta estas filas
 * mandando `default` en la columna id, y sin esto la base las rechazaba. Con
 * el default aquí, el alta funciona sin depender del comportamiento interno
 * de la librería.
 */
const idPrimario = () => text("id").primaryKey().default(sql`gen_random_uuid()::text`);

/* ------------------------------------------------------------------ */
/* Better Auth: nombres fijados por la librería                        */
/* ------------------------------------------------------------------ */

export const user = pgTable("user", {
  id: idPrimario(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const session = pgTable("session", {
  id: idPrimario(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: idPrimario(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const verification = pgTable("verification", {
  id: idPrimario(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Control de intentos, exigido por `rateLimit.storage: "database"` en auth.ts.
 * Sin esta tabla el límite no se aplica y el acceso queda expuesto a fuerza
 * bruta. Nombres de campo fijados por Better Auth.
 *
 * El `id` lleva valor por defecto a propósito: Better Auth inserta estas filas
 * sin rellenarlo y Postgres las rechazaba, lo que hacía fallar toda la API de
 * autenticación. Generándolo aquí, la inserción funciona sin depender de cómo
 * se comporte la librería por dentro.
 */
export const rateLimit = pgTable("rateLimit", {
  id: idPrimario(),
  key: text("key").notNull().unique(),
  count: integer("count").notNull(),
  lastRequest: bigint("lastRequest", { mode: "number" }).notNull(),
});

/* ------------------------------------------------------------------ */
/* Takcanarias                                                         */
/* ------------------------------------------------------------------ */

/**
 * El alumno: la persona que recibe la formación.
 *
 * No es lo mismo que la cuenta. El centro imparte clases de apoyo desde los 6
 * años, y la ley española no deja que un menor de 14 autorice por sí mismo el
 * uso de sus datos. Un niño de 6 años, por tanto, no puede tener cuenta: existe
 * como alumno colgando de la cuenta de su padre, madre o tutor.
 *
 * `titularId` es quien gestiona la cuenta:
 *   - Adulto que se forma él mismo -> es su propia cuenta, `esElTitular` = true.
 *   - Menor -> la cuenta del tutor, `esElTitular` = false.
 *
 * Un titular puede tener varios alumnos a su cargo (varios hijos).
 *
 * Matrículas, reservas y asistencia cuelgan del alumno, NO de la cuenta: si no,
 * los datos de dos hermanos acabarían mezclados bajo el mismo usuario.
 */
export const alumno = pgTable("alumno", {
  id: idPrimario(),
  titularId: text("titular_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  esElTitular: boolean("es_el_titular").default(false).notNull(),
  nombre: text("nombre").notNull(),
  apellidos: text("apellidos"),
  fechaNacimiento: date("fecha_nacimiento"),
  telefono: text("telefono"),
  /**
   * Fecha en que el centro registra la autorización firmada del tutor.
   * Hoy se recoge en papel, y así seguirá: esto solo deja constancia de que
   * existe. Sin ella, un alumno menor no debe considerarse dado de alta.
   */
  consentimientoTutorEn: timestamp("consentimiento_tutor_en"),
  // Lo comprueba administración. Hasta entonces, la ficha es solo una solicitud.
  validadoEn: timestamp("validado_en"),
  notasCentro: text("notas_centro"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [index("alumno_por_titular").on(t.titularId)]);

/** Ámbitos del centro. Sirve para saber qué ve cada alumno. */
export const AMBITOS = ["cap", "autoescuela", "apoyo", "puntos"] as const;
export type Ambito = (typeof AMBITOS)[number];

export const curso = pgTable("curso", {
  id: idPrimario(),
  nombre: text("nombre").notNull(),
  ambito: text("ambito").notNull(),
  descripcion: text("descripcion"),
  activo: boolean("activo").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const matricula = pgTable("matricula", {
  id: idPrimario(),
  alumnoId: text("alumno_id").notNull().references(() => alumno.id, { onDelete: "cascade" }),
  cursoId: text("curso_id").notNull().references(() => curso.id, { onDelete: "restrict" }),
  estado: text("estado").default("activa").notNull(),
  altaEn: timestamp("alta_en").defaultNow().notNull(),
  bajaEn: timestamp("baja_en"),
}, (t) => [
  uniqueIndex("matricula_alumno_curso").on(t.alumnoId, t.cursoId),
  index("matricula_por_alumno").on(t.alumnoId),
]);

/**
 * Sesión concreta: una clase con fecha y hora.
 *
 * Todavía no se usa. Existe para que la reserva de agenda, cuando se
 * contrate, se apoye en alumnos y matrículas ya existentes.
 */
export const sesionClase = pgTable("sesion_clase", {
  id: idPrimario(),
  cursoId: text("curso_id").notNull().references(() => curso.id, { onDelete: "cascade" }),
  inicio: timestamp("inicio", { withTimezone: true }).notNull(),
  fin: timestamp("fin", { withTimezone: true }).notNull(),
  plazas: integer("plazas").default(1).notNull(),
  profesor: text("profesor"),
  lugar: text("lugar"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [index("sesion_por_curso_inicio").on(t.cursoId, t.inicio)]);

/** Reserva de una sesión. Sin uso hasta que se contrate la agenda. */
export const reserva = pgTable("reserva", {
  id: idPrimario(),
  alumnoId: text("alumno_id").notNull().references(() => alumno.id, { onDelete: "cascade" }),
  sesionId: text("sesion_id").notNull().references(() => sesionClase.id, { onDelete: "cascade" }),
  estado: text("estado").default("solicitada").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [uniqueIndex("reserva_alumno_sesion").on(t.alumnoId, t.sesionId)]);

/** Asistencia registrada por el centro, nunca por el alumno. */
export const asistencia = pgTable("asistencia", {
  id: idPrimario(),
  alumnoId: text("alumno_id").notNull().references(() => alumno.id, { onDelete: "cascade" }),
  sesionId: text("sesion_id").notNull().references(() => sesionClase.id, { onDelete: "cascade" }),
  presente: boolean("presente").notNull(),
  registradoPor: text("registrado_por"),
  registradoEn: timestamp("registrado_en").defaultNow().notNull(),
}, (t) => [uniqueIndex("asistencia_alumno_sesion").on(t.alumnoId, t.sesionId)]);
