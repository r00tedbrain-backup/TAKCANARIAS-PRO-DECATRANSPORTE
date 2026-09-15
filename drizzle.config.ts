import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  // Genera el SQL y se revisa antes de aplicarlo: en esta base hay datos de
  // alumnos, parte de ellos menores. Nada de cambios automáticos a ciegas.
  strict: true,
  verbose: true,
} satisfies Config;
