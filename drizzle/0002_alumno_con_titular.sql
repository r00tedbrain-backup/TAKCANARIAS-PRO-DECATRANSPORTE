-- Separar "cuenta" de "alumno".
--
-- Motivo: el centro da clases de apoyo desde los 6 años. La LOPDGDD fija en 14
-- años la edad mínima para consentir el tratamiento de los propios datos, así
-- que un menor de esa edad no puede tener cuenta propia. El modelo anterior
-- (perfil_alumno, uno por usuario) daba por hecho que quien se registra es el
-- alumno, y con niños pequeños eso no se sostiene.
--
-- A partir de aquí: la cuenta es de un adulto (el titular) y de ella cuelgan
-- uno o varios alumnos. Un adulto que se forma a sí mismo es un alumno más,
-- marcado con es_el_titular.
--
-- Matrículas, reservas y asistencia pasan a colgar del alumno. Si colgasen de
-- la cuenta, dos hermanos compartirían historial.
--
-- Estas tablas están vacías (comprobado antes de escribir esto), así que se
-- recrean en lugar de parchear columnas y constraints una a una.

DROP TABLE IF EXISTS "asistencia";--> statement-breakpoint
DROP TABLE IF EXISTS "reserva";--> statement-breakpoint
DROP TABLE IF EXISTS "matricula";--> statement-breakpoint
DROP TABLE IF EXISTS "perfil_alumno";--> statement-breakpoint

CREATE TABLE "alumno" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"titular_id" text NOT NULL,
	"es_el_titular" boolean DEFAULT false NOT NULL,
	"nombre" text NOT NULL,
	"apellidos" text,
	"fecha_nacimiento" date,
	"telefono" text,
	"consentimiento_tutor_en" timestamp,
	"validado_en" timestamp,
	"notas_centro" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "alumno" ADD CONSTRAINT "alumno_titular_id_user_id_fk"
	FOREIGN KEY ("titular_id") REFERENCES "public"."user"("id") ON DELETE cascade;--> statement-breakpoint
CREATE INDEX "alumno_por_titular" ON "alumno" USING btree ("titular_id");--> statement-breakpoint

CREATE TABLE "matricula" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"alumno_id" text NOT NULL,
	"curso_id" text NOT NULL,
	"estado" text DEFAULT 'activa' NOT NULL,
	"alta_en" timestamp DEFAULT now() NOT NULL,
	"baja_en" timestamp
);--> statement-breakpoint
ALTER TABLE "matricula" ADD CONSTRAINT "matricula_alumno_id_alumno_id_fk"
	FOREIGN KEY ("alumno_id") REFERENCES "public"."alumno"("id") ON DELETE cascade;--> statement-breakpoint
ALTER TABLE "matricula" ADD CONSTRAINT "matricula_curso_id_curso_id_fk"
	FOREIGN KEY ("curso_id") REFERENCES "public"."curso"("id") ON DELETE restrict;--> statement-breakpoint
CREATE UNIQUE INDEX "matricula_alumno_curso" ON "matricula" USING btree ("alumno_id","curso_id");--> statement-breakpoint
CREATE INDEX "matricula_por_alumno" ON "matricula" USING btree ("alumno_id");--> statement-breakpoint

CREATE TABLE "reserva" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"alumno_id" text NOT NULL,
	"sesion_id" text NOT NULL,
	"estado" text DEFAULT 'solicitada' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "reserva" ADD CONSTRAINT "reserva_alumno_id_alumno_id_fk"
	FOREIGN KEY ("alumno_id") REFERENCES "public"."alumno"("id") ON DELETE cascade;--> statement-breakpoint
ALTER TABLE "reserva" ADD CONSTRAINT "reserva_sesion_id_sesion_clase_id_fk"
	FOREIGN KEY ("sesion_id") REFERENCES "public"."sesion_clase"("id") ON DELETE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "reserva_alumno_sesion" ON "reserva" USING btree ("alumno_id","sesion_id");--> statement-breakpoint

CREATE TABLE "asistencia" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"alumno_id" text NOT NULL,
	"sesion_id" text NOT NULL,
	"presente" boolean NOT NULL,
	"registrado_por" text,
	"registrado_en" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "asistencia" ADD CONSTRAINT "asistencia_alumno_id_alumno_id_fk"
	FOREIGN KEY ("alumno_id") REFERENCES "public"."alumno"("id") ON DELETE cascade;--> statement-breakpoint
ALTER TABLE "asistencia" ADD CONSTRAINT "asistencia_sesion_id_sesion_clase_id_fk"
	FOREIGN KEY ("sesion_id") REFERENCES "public"."sesion_clase"("id") ON DELETE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "asistencia_alumno_sesion" ON "asistencia" USING btree ("alumno_id","sesion_id");
