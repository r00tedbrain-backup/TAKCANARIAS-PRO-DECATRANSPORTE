"use client";

/**
 * Petición del enlace para cambiar la contraseña.
 *
 * Regla que manda en los mensajes: la respuesta es SIEMPRE la misma, exista o
 * no una cuenta con ese correo. Si cambiara, cualquiera podría usar este
 * formulario para averiguar quién es alumno del centro.
 *
 * Better Auth ya lo resuelve en el servidor: cuando el correo no existe
 * devuelve 200 con el mismo cuerpo que cuando sí, y además simula el trabajo
 * que habría hecho para no delatarse por el tiempo de respuesta. Aquí solo
 * hay que no estropearlo, así que el texto de confirmación es una constante y
 * no se decide con nada que dependa del correo escrito.
 *
 * Los errores que sí se muestran (demasiados intentos, fallo de conexión)
 * hablan de la petición, no de la cuenta, así que no cuentan nada de nadie.
 */

import { useId, useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Icon } from "./icon";
import { site } from "@/content/site";

/**
 * A dónde lleva el enlace del correo. Va como ruta del propio sitio: Better
 * Auth la comprueba contra los orígenes de confianza antes de aceptarla.
 */
const DESTINO = "/area-cliente/nueva-contrasena";

export function FormularioRecuperar() {
  const idEmail = useId();

  const [email, setEmail] = useState("");
  const [errorEmail, setErrorEmail] = useState<string | null>(null);
  const [avisoGeneral, setAvisoGeneral] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function alEnviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setAvisoGeneral(null);

    const limpio = email.trim();
    if (!limpio) {
      setErrorEmail("Escribe tu correo electrónico.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(limpio)) {
      setErrorEmail("Ese correo no parece completo. Revisa que incluya la arroba y el dominio.");
      return;
    }
    setErrorEmail(null);

    setEnviando(true);
    try {
      const { error } = await authClient.requestPasswordReset({
        email: limpio.toLowerCase(),
        redirectTo: DESTINO,
      });

      if (error) {
        // Ninguno de estos casos depende de si la cuenta existe: el servidor
        // responde 200 tanto si la encuentra como si no.
        if (error.status === 429) {
          setAvisoGeneral("Has pedido el enlace demasiadas veces seguidas. Espera un minuto y vuelve a intentarlo.");
        } else {
          setAvisoGeneral(
            `No hemos podido enviar el correo. Inténtalo dentro de un rato o llámanos al ${site.phone} y lo resolvemos contigo.`,
          );
        }
        return;
      }

      setEnviado(true);
    } catch {
      setAvisoGeneral("No hemos podido conectar con el servidor. Revisa tu conexión y vuelve a intentarlo.");
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <div className="form-panel">
        <p className="form-alert" role="status">
          Si existe una cuenta con ese correo, te hemos enviado un mensaje con un enlace para poner una contraseña
          nueva.
        </p>
        <p>
          El enlace vale durante una hora. Si no te llega en unos minutos, mira en la carpeta de correo no deseado.
        </p>
        <p>
          ¿Nada? Puede que el correo no sea el que tenemos guardado. Llámanos al{" "}
          <a className="text-link" href={site.phoneHref}>
            <Icon name="phone" />
            {site.phone}
          </a>{" "}
          o escribe a{" "}
          <a className="text-link" href={`mailto:${site.email}`}>
            {site.email}
            <Icon name="arrow" />
          </a>{" "}
          y lo miramos.
        </p>
        <div className="form-links">
          <p>
            <Link className="text-link" href="/area-cliente/acceso">
              Volver al acceso
              <Icon name="arrow" />
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <form className="form-panel" onSubmit={alEnviar} noValidate>
      {avisoGeneral && (
        <p className="form-alert" role="alert">
          {avisoGeneral}
        </p>
      )}

      <div className="form-field">
        <label className="form-label" htmlFor={idEmail}>
          Correo electrónico
        </label>
        <p className="form-hint" id={`${idEmail}-ayuda`}>
          El mismo que usas para entrar en tu área.
        </p>
        <input
          className="form-input"
          id={idEmail}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={errorEmail ? true : undefined}
          aria-describedby={errorEmail ? `${idEmail}-ayuda ${idEmail}-error` : `${idEmail}-ayuda`}
        />
        {errorEmail && (
          <p className="form-error" id={`${idEmail}-error`} role="alert">
            {errorEmail}
          </p>
        )}
      </div>

      <div className="form-actions">
        <button className="button button-blue" type="submit" disabled={enviando} aria-busy={enviando}>
          {enviando ? "Enviando…" : "Enviarme el enlace"}
          <Icon name="arrow" />
        </button>
      </div>
    </form>
  );
}
