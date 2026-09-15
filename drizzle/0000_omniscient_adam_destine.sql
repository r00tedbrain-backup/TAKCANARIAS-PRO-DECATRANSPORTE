CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asistencia" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"sesion_id" text NOT NULL,
	"presente" boolean NOT NULL,
	"registrado_por" text,
	"registrado_en" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "curso" (
	"id" text PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"ambito" text NOT NULL,
	"descripcion" text,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matricula" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"curso_id" text NOT NULL,
	"estado" text DEFAULT 'activa' NOT NULL,
	"alta_en" timestamp DEFAULT now() NOT NULL,
	"baja_en" timestamp
);
--> statement-breakpoint
CREATE TABLE "perfil_alumno" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"telefono" text,
	"fecha_nacimiento" date,
	"tutor_nombre" text,
	"tutor_contacto" text,
	"consentimiento_tutor_en" timestamp,
	"validado_en" timestamp,
	"notas_centro" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "perfil_alumno_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "rateLimit" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"count" integer NOT NULL,
	"lastRequest" bigint NOT NULL,
	CONSTRAINT "rateLimit_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "reserva" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"sesion_id" text NOT NULL,
	"estado" text DEFAULT 'solicitada' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sesion_clase" (
	"id" text PRIMARY KEY NOT NULL,
	"curso_id" text NOT NULL,
	"inicio" timestamp with time zone NOT NULL,
	"fin" timestamp with time zone NOT NULL,
	"plazas" integer DEFAULT 1 NOT NULL,
	"profesor" text,
	"lugar" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asistencia" ADD CONSTRAINT "asistencia_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asistencia" ADD CONSTRAINT "asistencia_sesion_id_sesion_clase_id_fk" FOREIGN KEY ("sesion_id") REFERENCES "public"."sesion_clase"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matricula" ADD CONSTRAINT "matricula_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matricula" ADD CONSTRAINT "matricula_curso_id_curso_id_fk" FOREIGN KEY ("curso_id") REFERENCES "public"."curso"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "perfil_alumno" ADD CONSTRAINT "perfil_alumno_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reserva" ADD CONSTRAINT "reserva_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reserva" ADD CONSTRAINT "reserva_sesion_id_sesion_clase_id_fk" FOREIGN KEY ("sesion_id") REFERENCES "public"."sesion_clase"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sesion_clase" ADD CONSTRAINT "sesion_clase_curso_id_curso_id_fk" FOREIGN KEY ("curso_id") REFERENCES "public"."curso"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "asistencia_alumno_sesion" ON "asistencia" USING btree ("user_id","sesion_id");--> statement-breakpoint
CREATE UNIQUE INDEX "matricula_alumno_curso" ON "matricula" USING btree ("user_id","curso_id");--> statement-breakpoint
CREATE INDEX "matricula_por_alumno" ON "matricula" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "reserva_alumno_sesion" ON "reserva" USING btree ("user_id","sesion_id");--> statement-breakpoint
CREATE INDEX "sesion_por_curso_inicio" ON "sesion_clase" USING btree ("curso_id","inicio");