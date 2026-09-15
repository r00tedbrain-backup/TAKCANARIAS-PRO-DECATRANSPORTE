/**
 * Conexión a Postgres.
 *
 * La base vive en su propio contenedor, separada de la del DeCA: aquí hay
 * datos de alumnos, parte de ellos menores, y no deben compartir sistema con
 * la documentación de transporte de las empresas.
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

declare global {
  var __pool: Pool | undefined;
}

/**
 * El pool se crea la primera vez que se usa, no al importar el módulo.
 *
 * Importa para el build: Next carga estas páginas para recopilar sus datos, y
 * si aquí se exigiera DATABASE_URL de entrada, compilar la imagen obligaría a
 * tener credenciales reales a mano. Así la variable solo hace falta al
 * arrancar, que es cuando de verdad se conecta.
 */
function obtenerPool(): Pool {
  if (global.__pool) return global.__pool;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Falta la variable de entorno DATABASE_URL");
  const pool = new Pool({ connectionString, max: 10, idleTimeoutMillis: 30_000 });
  // En desarrollo Next recarga los módulos; sin esto se abrirían pools de más.
  global.__pool = pool;
  return pool;
}

type Db = ReturnType<typeof drizzle<typeof schema>>;
let instancia: Db | undefined;

function obtenerDb(): Db {
  if (!instancia) instancia = drizzle(obtenerPool(), { schema });
  return instancia;
}

// Nada de esto se ejecuta hasta la primera consulta real.
export const db = new Proxy({} as Db, {
  get(_, prop) {
    const actual = obtenerDb();
    const valor = Reflect.get(actual, prop);
    return typeof valor === "function" ? valor.bind(actual) : valor;
  },
});
