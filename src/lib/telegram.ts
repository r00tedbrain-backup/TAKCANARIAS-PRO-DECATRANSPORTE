/**
 * Telegram: solo salida.
 *
 * El bot no escucha. No hay webhook, no hay endpoint público, no se procesa
 * ningún mensaje entrante. Esto no es una limitación que arrastremos: es la
 * decisión de diseño que cumple el requisito de que el bot no se pueda "abrir"
 * desde otra conversación. Si no escucha a nadie, no hay a quién filtrar ni
 * puerta que blindar.
 *
 * La única vez que se leen mensajes entrantes es al vincular, y desde el panel:
 * se pregunta a Telegram quién le ha escrito, se enseña la lista al centro y el
 * centro elige. Después de eso, los mensajes que llegan se ignoran para siempre.
 *
 * Reparto de responsabilidades:
 *   - El TOKEN vive en el .env. Es un secreto.
 *   - El DESTINO vive en la base. No es un secreto, y el centro debe poder
 *     cambiarlo desde el panel sin tocar el servidor.
 */
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { telegramEnlace } from "@/db/schema";

const API = "https://api.telegram.org";
const CORTE_MS = 8000;

export type Enlace = {
  chatId: string | null;
  chatTitulo: string | null;
  chatTipo: string | null;
  vinculadoEn: Date | null;
  ultimoEnvioEn: Date | null;
  ultimoError: string | null;
};

export type Candidato = {
  chatId: string;
  titulo: string;
  tipo: string;
  /** Para avisar de que un chat privado es mala idea como destino. */
  esPrivado: boolean;
};

export function hayToken(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN);
}

/** Estado actual del enlace. Siempre devuelve algo: la fila 1 se crea en la migración. */
export async function leerEnlace(): Promise<Enlace> {
  const [fila] = await db.select().from(telegramEnlace).where(eq(telegramEnlace.id, 1)).limit(1);
  return {
    chatId: fila?.chatId ?? null,
    chatTitulo: fila?.chatTitulo ?? null,
    chatTipo: fila?.chatTipo ?? null,
    vinculadoEn: fila?.vinculadoEn ?? null,
    ultimoEnvioEn: fila?.ultimoEnvioEn ?? null,
    ultimoError: fila?.ultimoError ?? null,
  };
}

/** Llamada a la API del bot. Nunca deja una petición colgada. */
async function llamar(metodo: string, cuerpo?: unknown): Promise<Record<string, unknown>> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("Falta TELEGRAM_BOT_TOKEN en el servidor.");

  const r = await fetch(`${API}/bot${token}/${metodo}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo ?? {}),
    signal: AbortSignal.timeout(CORTE_MS),
  });

  const datos = (await r.json().catch(() => ({}))) as Record<string, unknown>;
  if (!r.ok || datos.ok !== true) {
    const desc = typeof datos.description === "string" ? datos.description : `HTTP ${r.status}`;
    throw new Error(desc);
  }
  return datos;
}

/** Nombre y usuario del bot, para que el panel pueda decir a quién hay que invitar. */
export async function identidadDelBot(): Promise<{ nombre: string; usuario: string }> {
  const d = await llamar("getMe");
  const r = (d.result ?? {}) as Record<string, unknown>;
  return { nombre: String(r.first_name ?? "?"), usuario: String(r.username ?? "?") };
}

/**
 * Conversaciones que han escrito al bot recientemente.
 *
 * Telegram solo guarda los mensajes sin recoger unas 24 horas, así que esto
 * enseña lo reciente y nada más. Es justo lo que hace falta: el centro escribe
 * en su grupo y acto seguido pulsa buscar.
 */
export async function buscarCandidatos(): Promise<Candidato[]> {
  const d = await llamar("getUpdates", { limit: 100, timeout: 0 });
  const updates = Array.isArray(d.result) ? d.result : [];

  const porId = new Map<string, Candidato>();
  for (const u of updates as Record<string, unknown>[]) {
    const m = (u.message ?? u.channel_post ?? u.my_chat_member ?? {}) as Record<string, unknown>;
    const c = (m.chat ?? {}) as Record<string, unknown>;
    if (c.id === undefined || c.id === null) continue;

    const id = String(c.id);
    const tipo = String(c.type ?? "?");
    const titulo =
      (c.title as string) ||
      [c.first_name, c.last_name].filter(Boolean).join(" ") ||
      (c.username as string) ||
      id;

    porId.set(id, { chatId: id, titulo, tipo, esPrivado: tipo === "private" });
  }
  return [...porId.values()];
}

/** Guarda el destino. Solo se llama desde el panel, tras elegirlo una persona. */
export async function vincular(
  c: { chatId: string; titulo: string; tipo: string },
  quien: string,
): Promise<void> {
  await db
    .update(telegramEnlace)
    .set({
      chatId: c.chatId,
      chatTitulo: c.titulo,
      chatTipo: c.tipo,
      vinculadoEn: new Date(),
      vinculadoPor: quien,
      ultimoError: null,
    })
    .where(eq(telegramEnlace.id, 1));
}

/** Deja el bot sin destino: a partir de aquí no envía nada a ninguna parte. */
export async function desvincular(): Promise<void> {
  await db
    .update(telegramEnlace)
    .set({
      chatId: null,
      chatTitulo: null,
      chatTipo: null,
      vinculadoEn: null,
      vinculadoPor: null,
      ultimoError: null,
    })
    .where(eq(telegramEnlace.id, 1));
}

/** Caracteres que MarkdownV2 obliga a escapar. Sin esto, un punto tumba el envío. */
export function escapar(texto: string): string {
  return texto.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, (c) => `\\${c}`);
}

/**
 * Envía al chat vinculado, y solo a ese.
 *
 * El destino no se pasa por parámetro a propósito: si se pudiera elegir desde
 * fuera, un fallo en cualquier punto del código podría mandar datos de alumnos
 * a otra conversación. Aquí solo hay un destino posible, el de la base.
 *
 * Devuelve false si no está configurado, que no es un error: es el estado
 * normal mientras el centro no lo haya vinculado.
 */
export async function enviar(texto: string): Promise<boolean> {
  if (!hayToken()) return false;
  const { chatId } = await leerEnlace();
  if (!chatId) return false;

  try {
    await llamar("sendMessage", {
      chat_id: chatId,
      text: texto,
      parse_mode: "MarkdownV2",
      disable_notification: false,
    });
    await db
      .update(telegramEnlace)
      .set({ ultimoEnvioEn: new Date(), ultimoError: null })
      .where(eq(telegramEnlace.id, 1));
    return true;
  } catch (e) {
    // El fallo se deja anotado para que el panel pueda mostrarlo, pero se
    // vuelve a lanzar: quien llama decide si le importa. En los avisos de
    // reserva no importa, y por eso allí se traga.
    const motivo = e instanceof Error ? e.message : "error desconocido";
    await db
      .update(telegramEnlace)
      .set({ ultimoError: motivo.slice(0, 300) })
      .where(eq(telegramEnlace.id, 1))
      .catch(() => {});
    throw e;
  }
}
