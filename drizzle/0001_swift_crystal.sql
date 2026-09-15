ALTER TABLE "account" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;--> statement-breakpoint
ALTER TABLE "asistencia" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;--> statement-breakpoint
ALTER TABLE "curso" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;--> statement-breakpoint
ALTER TABLE "matricula" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;--> statement-breakpoint
ALTER TABLE "perfil_alumno" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;--> statement-breakpoint
ALTER TABLE "rateLimit" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;--> statement-breakpoint
ALTER TABLE "reserva" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;--> statement-breakpoint
ALTER TABLE "sesion_clase" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;--> statement-breakpoint
ALTER TABLE "verification" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;