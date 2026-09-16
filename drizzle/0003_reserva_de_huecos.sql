-- Reserva de huecos por parte del alumno.
--
-- El centro llevaba la agenda de prácticas en papel y pidió que reservaran
-- ellos directamente. De ahí dos cambios:
--
-- 1. horario_semanal: describen una vez cómo es una semana normal y los huecos
--    se generan desde ahí. Pedirles que los creen uno a uno sería cambiarles un
--    trabajo manual por otro.
--
-- 2. sesion_clase deja de exigir curso. Una práctica de coche no pertenece a
--    ningún curso; lo que siempre tiene es un ámbito. Se añade también
--    cancelada_en para festivos y averías, sin borrar el hueco.
--
-- Estas tablas están vacías, así que sesion_clase se recrea en lugar de ir
-- parcheando columnas. reserva y asistencia cuelgan de ella, así que caen y se
-- vuelven a crear con ella.

CREATE TABLE "horario_semanal" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"ambito" text NOT NULL,
	"dia_semana" integer NOT NULL,
	"hora_inicio" text NOT NULL,
	"hora_fin" text NOT NULL,
	"plazas" integer DEFAULT 1 NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX "horario_por_ambito_dia" ON "horario_semanal" USING btree ("ambito","dia_semana");--> statement-breakpoint

DROP TABLE IF EXISTS "asistencia";--> statement-breakpoint
DROP TABLE IF EXISTS "reserva";--> statement-breakpoint
DROP TABLE IF EXISTS "sesion_clase";--> statement-breakpoint

CREATE TABLE "sesion_clase" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"ambito" text NOT NULL,
	"curso_id" text,
	"inicio" timestamp with time zone NOT NULL,
	"fin" timestamp with time zone NOT NULL,
	"plazas" integer DEFAULT 1 NOT NULL,
	"profesor" text,
	"lugar" text,
	"cancelada_en" timestamp,
	"motivo_cancelacion" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "sesion_clase" ADD CONSTRAINT "sesion_clase_curso_id_curso_id_fk"
	FOREIGN KEY ("curso_id") REFERENCES "public"."curso"("id") ON DELETE cascade;--> statement-breakpoint
CREATE INDEX "sesion_por_ambito_inicio" ON "sesion_clase" USING btree ("ambito","inicio");--> statement-breakpoint
CREATE UNIQUE INDEX "sesion_unica_por_franja" ON "sesion_clase" USING btree ("ambito","inicio","fin");--> statement-breakpoint

CREATE TABLE "reserva" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"alumno_id" text NOT NULL,
	"sesion_id" text NOT NULL,
	"estado" text DEFAULT 'activa' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"anulada_en" timestamp
);--> statement-breakpoint
ALTER TABLE "reserva" ADD CONSTRAINT "reserva_alumno_id_alumno_id_fk"
	FOREIGN KEY ("alumno_id") REFERENCES "public"."alumno"("id") ON DELETE cascade;--> statement-breakpoint
ALTER TABLE "reserva" ADD CONSTRAINT "reserva_sesion_id_sesion_clase_id_fk"
	FOREIGN KEY ("sesion_id") REFERENCES "public"."sesion_clase"("id") ON DELETE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "reserva_alumno_sesion" ON "reserva" USING btree ("alumno_id","sesion_id");--> statement-breakpoint
CREATE INDEX "reserva_por_sesion" ON "reserva" USING btree ("sesion_id");--> statement-breakpoint

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
