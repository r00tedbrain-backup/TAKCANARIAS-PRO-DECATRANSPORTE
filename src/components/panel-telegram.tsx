"use client";

/**
 * Sección del panel para atar los avisos a una conversación de Telegram.
 *
 * Lo importante que debe quedar claro al leer la pantalla: el bot no escucha.
 * No responde a nadie, ni siquiera al grupo vinculado. Solo deja avisos. Por
 * eso no hay nada que "proteger" de otras conversaciones: no existe forma de
 * hablarle y que haga algo.
 *
 * El flujo es: escribir /start en el grupo, pulsar buscar, elegir de la lista.
 * Se elige de una lista en vez de escribir el identificador a mano porque el
 * chat_id es un número largo y negativo, y un dígito mal copiado manda los
 * avisos a la nada sin avisar de nada.
 */

import { useActionState } from "react";
import {
  buscarChatsTelegram,
  desvincularTelegram,
  probarTelegram,
  vincularChatTelegram,
  type EstadoTelegram,
} from "@/app/centro/acciones";
import type { Enlace } from "@/lib/telegram";
import { Icon } from "./icon";

const INICIAL: EstadoTelegram = { ok: false, candidatos: [] };

function fecha(d: Date | string | null): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Atlantic/Canary",
  }).format(new Date(d));
}

function Aviso({ estado }: { estado: EstadoTelegram }) {
  if (!estado.mensaje) return null;
  return (
    <p className="form-alert" role={estado.ok ? "status" : "alert"}>
      {estado.mensaje}
    </p>
  );
}

export function PanelTelegram({ enlace, hayToken, bot }: { enlace: Enlace; hayToken: boolean; bot: string | null }) {
  const [estBuscar, accBuscar, buscando] = useActionState(buscarChatsTelegram, INICIAL);
  const [estVincular, accVincular, vinculando] = useActionState(vincularChatTelegram, INICIAL);
  const [estDesvincular, accDesvincular, desvinculando] = useActionState(desvincularTelegram, INICIAL);
  const [estProbar, accProbar, probando] = useActionState(probarTelegram, INICIAL);

  const vinculado = Boolean(enlace.chatId);

  return (
    <section className="section" aria-labelledby="telegram">
      <div className="section-heading">
        <h2 id="telegram">Avisos por Telegram</h2>
        <p>
          Cuando un alumno reserva o anula una hora, el bot deja un aviso en la conversación que elijas aquí. Solo en
          esa.
        </p>
      </div>

      {/* Que el bot no escuche no es un detalle técnico: es lo que hace que no
          haga falta protegerlo de nadie. Se dice en la pantalla, no solo en el
          código, porque es la garantía que el centro está pidiendo. */}
      <p className="tg-nota">
        <Icon name="shield" />
        <span>
          El bot <strong>solo envía</strong>. No lee mensajes ni responde a nadie, tampoco en el grupo vinculado. Aunque
          alguien lo encuentre y le escriba, no puede consultar ni cambiar nada.
        </span>
      </p>

      {!hayToken ? (
        <div className="info-block">
          <h3>Falta configurar el bot en el servidor</h3>
          <p>No hay token. Esto se arregla en el servidor, no desde aquí. Avisa a quien lleva la web.</p>
        </div>
      ) : (
        <>
          <div className="tg-estado" data-vinculado={vinculado ? "si" : "no"}>
            <div>
              <p className="tg-etiqueta">Estado</p>
              <p className="tg-valor">{vinculado ? "Vinculado" : "Sin vincular"}</p>
            </div>
            <div>
              <p className="tg-etiqueta">Conversación</p>
              <p className="tg-valor">{enlace.chatTitulo ?? "—"}</p>
            </div>
            <div>
              <p className="tg-etiqueta">Último aviso enviado</p>
              <p className="tg-valor">{fecha(enlace.ultimoEnvioEn)}</p>
            </div>
          </div>

          {enlace.ultimoError && (
            <p className="form-alert" role="alert">
              El último intento falló: {enlace.ultimoError}
            </p>
          )}

          {!vinculado && (
            <ol className="tg-pasos">
              <li>Crea un grupo en Telegram con quien deba enterarse de las reservas.</li>
              <li>
                Añade al grupo el bot {bot ? <strong>@{bot}</strong> : "de Takcanarias"}.
              </li>
              <li>
                Escribe en el grupo <code>/start</code>. Tiene que ser eso exactamente: el bot no lee los mensajes
                normales, solo los que van dirigidos a él.
              </li>
              <li>Vuelve aquí y pulsa buscar.</li>
            </ol>
          )}

          <div className="tg-acciones">
            <form action={accBuscar}>
              <button className="button button-blue" type="submit" disabled={buscando}>
                {buscando ? "Buscando…" : vinculado ? "Cambiar de conversación" : "Buscar conversación"}
                <Icon name="arrow" />
              </button>
            </form>

            {vinculado && (
              <>
                <form action={accProbar}>
                  <button className="button button-white" type="submit" disabled={probando}>
                    {probando ? "Enviando…" : "Enviar una prueba"}
                  </button>
                </form>
                <form action={accDesvincular}>
                  <button className="button button-white" type="submit" disabled={desvinculando}>
                    {desvinculando ? "Quitando…" : "Dejar de enviar"}
                  </button>
                </form>
              </>
            )}
          </div>

          <Aviso estado={estBuscar} />
          <Aviso estado={estVincular} />
          <Aviso estado={estDesvincular} />
          <Aviso estado={estProbar} />

          {estBuscar.candidatos.length > 0 && (
            <div className="tg-lista">
              <h3>Elige a cuál mandar los avisos</h3>
              {estBuscar.candidatos.map((c) => (
                <form action={accVincular} className="tg-candidato" key={c.chatId}>
                  <input type="hidden" name="chatId" value={c.chatId} />
                  <input type="hidden" name="titulo" value={c.titulo} />
                  <input type="hidden" name="tipo" value={c.tipo} />
                  <div>
                    <strong>{c.titulo}</strong>
                    <span>{c.esPrivado ? "Conversación privada" : "Grupo"}</span>
                    {/* Un privado deja los avisos en el móvil de una sola
                        persona. El día que esté de baja, nadie los ve. */}
                    {c.esPrivado && <span className="tg-ojo">Mejor un grupo: si esa persona falta, nadie se entera.</span>}
                  </div>
                  <button className="button button-blue" type="submit" disabled={vinculando}>
                    Usar esta
                  </button>
                </form>
              ))}
            </div>
          )}

          <p className="tg-recordatorio">
            En el aviso solo va el nombre de pila, el tipo de clase y la hora. Ni apellidos, ni teléfono, ni correo: un
            grupo se reenvía y acaba en móviles que no controlamos. La ficha completa está en este panel, detrás de tu
            contraseña.
          </p>
        </>
      )}
    </section>
  );
}
