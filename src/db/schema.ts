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
import { pgTable, text, timestamp, boolean, integer, bigint, date, uniqueIndex, index } from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ */
/* Better Auth: nombres fijados por la librería                        */
/* ------------------------------------------------------------------ */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
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
  id: text("id").primaryKey(),
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
 */
export const rateLimit = pgTable("rateLimit", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  count: integer("count").notNull(),
  lastRequest: bigint("lastRequest", { mode: "number" }).notNull(),
});

/* ------------------------------------------------------------------ */
/* Takcanarias                                                         */
/* ------------------------------------------------------------------ */

/**
 * Datos del alumno que no son de autenticación.
 *
 * `consentimientoTutorEn` es la pieza legal: mientras sea null y el alumno
 * sea menor, la cuenta queda sin validar. Lo rellena el centro cuando
 * recibe la autorización, no el propio alumno.
 */
export const perfilAlumno = pgTable("perfil_alumno", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique().references(() => user.id, { onDelete: "cascade" }),
  telefono: text("telefono"),
  fechaNacimiento: date("fecha_nacimiento"),
  tutorNombre: text("tutor_nombre"),
  tutorContacto: text("tutor_contacto"),
  consentimientoTutorEn: timestamp("consentimiento_tutor_en"),
  // Lo valida el centro tras comprobar la identidad. Sin esto, solo puede ver su ficha.
  validadoEn: timestamp("validado_en"),
  notasCentro: text("notas_centro"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/** Ámbitos del centro. Sirve para saber qué ve cada alumno. */
export const AMBITOS = ["cap", "autoescuela", "apoyo", "puntos"] as const;
export type Ambito = (typeof AMBITOS)[number];

export const curso = pgTable("curso", {
  id: text("id").primaryKey(),
  nombre: text("nombre").notNull(),
  ambito: text("ambito").notNull(),
  descripcion: text("descripcion"),
  activo: boolean("activo").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const matricula = pgTable("matricula", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  cursoId: text("curso_id").notNull().references(() => curso.id, { onDelete: "restrict" }),
  estado: text("estado").default("activa").notNull(),
  altaEn: timestamp("alta_en").defaultNow().notNull(),
  bajaEn: timestamp("baja_en"),
}, (t) => [
  uniqueIndex("matricula_alumno_curso").on(t.userId, t.cursoId),
  index("matricula_por_alumno").on(t.userId),
]);

/**
 * Sesión concreta: una clase con fecha y hora.
 *
 * Todavía no se usa. Existe para que la reserva de agenda, cuando se
 * contrate, se apoye en alumnos y matrículas ya existentes.
 */
export const sesionClase = pgTable("sesion_clase", {
  id: text("id").primaryKey(),
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
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  sesionId: text("sesion_id").notNull().references(() => sesionClase.id, { onDelete: "cascade" }),
  estado: text("estado").default("solicitada").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [uniqueIndex("reserva_alumno_sesion").on(t.userId, t.sesionId)]);

/** Asistencia registrada por el centro, nunca por el alumno. */
export const asistencia = pgTable("asistencia", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  sesionId: text("sesion_id").notNull().references(() => sesionClase.id, { onDelete: "cascade" }),
  presente: boolean("presente").notNull(),
  registradoPor: text("registrado_por"),
  registradoEn: timestamp("registrado_en").defaultNow().notNull(),
}, (t) => [uniqueIndex("asistencia_alumno_sesion").on(t.userId, t.sesionId)]);
