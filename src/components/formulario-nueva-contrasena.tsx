"use client";

/**
 * Cambio de contraseña con el token que llega por correo.
 *
 * Aquí no hay que ocultar nada: quien llega a esta pantalla lo hace desde un
 * enlace que solo ha podido recibir la persona dueña del buzón, así que los
 * errores se pueden explicar tal cual.
 *
 * El mínimo de 10 caracteres es el mismo que exige el servidor
 * (`minPasswordLength` en src/lib/auth.ts). Se comprueba también aquí para no
 * hacer un viaje de ida y vuelta por algo que se ve en el momento, pero quien
 * manda es el servidor.
 *
 * El token se gasta al usarlo: si el envío sale bien, este formulario ya no
 * sirve otra vez y por eso se sustituye por el aviso de que está hecho.
 */

import { useId, useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Icon } from "./icon";
import { site } from "@/content/site";

/** Coincide con minPasswordLength / maxPasswordLength de src/lib/auth.ts. */
const MINIMO = 10;
const MAXIMO = 128;

type Errores = { password?: string; confirmacion?: string };

export function FormularioNuevaContrasena({ token }: { token: string }) {
  const idPassword = useId();
  const idConfirmacion = useId();

  const [password, setPassword] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [errores, setErrores] = useState<Errores>({});
  const [avisoGeneral, setAvisoGeneral] = useState<string | null>(null);
  const [enlaceCaducado, setEnlaceCaducado] = useState(false);
  const [hecho, setHecho] = useState(false);
  const [enviando, setEnviando] = useState(false);

  function validar(): Errores {
    const nuevos: Errores = {};

    if (!password) nuevos.password = "Escribe la contraseña nueva.";
    else if (password.length < MINIMO) nuevos.password = `La contraseña tiene que tener al menos ${MINIMO} caracteres.`;
    else if (password.length > MAXIMO) nuevos.password = `La contraseña no puede pasar de ${MAXIMO} caracteres.`;

    if (!confirmacion) nuevos.confirmacion = "Repite la contraseña nueva.";
    else if (password && confirmacion !== password)
      nuevos.confirmacion = "Las dos contraseñas no coinciden. Revísalas y vuelve a escribirlas.";

    return nuevos;
  }

  async function alEnviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setAvisoGeneral(null);

    const nuevos = validar();
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;

    setEnviando(true);
    try {
      const { error } = await authClient.resetPassword({
        newPassword: password,
        token,
      });

      if (error) {
        if (error.code === "INVALID_TOKEN") {
          // El enlace ya se había usado o se pasó la hora de validez.
          setEnlaceCaducado(true);
        } else if (error.code === "PASSWORD_TOO_SHORT") {
          setErrores({ password: `La contraseña tiene que tener al menos ${MINIMO} caracteres.` });
        } else if (error.code === "PASSWORD_TOO_LONG") {
          setErrores({ password: `La contraseña no puede pasar de ${MAXIMO} caracteres.` });
        } else if (error.status === 429) {
          setAvisoGeneral("Has hecho demasiados intentos seguidos. Espera un minuto y vuelve a probar.");
        } else {
          setAvisoGeneral("No hemos podido cambiar la contraseña. Inténtalo de nuevo dentro de un rato.");
        }
        return;
      }

      setHecho(true);
    } catch {
      setAvisoGeneral("No hemos podido conectar con el servidor. Revisa tu conexión y vuelve a intentarlo.");
    } finally {
      setEnviando(false);
    }
  }

  if (hecho) {
    return (
      <div className="form-panel">
        <p className="form-alert" role="status">
          Listo, tu contraseña ya está cambiada. Entra con ella y con tu correo de siempre.
        </p>
        <div className="form-links">
          <p>
            <Link className="text-link" href="/area-cliente/acceso">
              Ir al acceso
              <Icon name="arrow" />
            </Link>
          </p>
        </div>
      </div>
    );
  }

  if (enlaceCaducado) {
    return (
      <div className="form-panel">
        <p className="form-alert" role="alert">
          Este enlace ya no vale. Solo se puede usar una vez y caduca al cabo de una hora.
        </p>
        <p>Pide otro y te mandamos uno nuevo al correo.</p>
        <div className="form-links">
          <p>
            <Link className="text-link" href="/area-cliente/recuperar">
              Pedir otro enlace
              <Icon name="arrow" />
            </Link>
          </p>
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
        <label className="form-label" htmlFor={idPassword}>
          Contraseña nueva
        </label>
        <p className="form-hint" id={`${idPassword}-ayuda`}>
          Mínimo {MINIMO} caracteres. Una frase que recuerdes funciona mejor que una palabra corta con símbolos.
        </p>
        <input
          className="form-input"
          id={idPassword}
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={MINIMO}
          maxLength={MAXIMO}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={errores.password ? true : undefined}
          aria-describedby={
            errores.password ? `${idPassword}-ayuda ${idPassword}-error` : `${idPassword}-ayuda`
          }
        />
        {errores.password && (
          <p className="form-error" id={`${idPassword}-error`} role="alert">
            {errores.password}
          </p>
        )}
      </div>

      <div className="form-field">
        <label className="form-label" htmlFor={idConfirmacion}>
          Repite la contraseña nueva
        </label>
        <input
          className="form-input"
          id={idConfirmacion}
          name="confirmacion"
          type="password"
          autoComplete="new-password"
          required
          maxLength={MAXIMO}
          value={confirmacion}
          onChange={(e) => setConfirmacion(e.target.value)}
          aria-invalid={errores.confirmacion ? true : undefined}
          aria-describedby={errores.confirmacion ? `${idConfirmacion}-error` : undefined}
        />
        {errores.confirmacion && (
          <p className="form-error" id={`${idConfirmacion}-error`} role="alert">
            {errores.confirmacion}
          </p>
        )}
      </div>

      <div className="form-actions">
        <button className="button button-blue" type="submit" disabled={enviando} aria-busy={enviando}>
          {enviando ? "Guardando…" : "Guardar la contraseña"}
          <Icon name="arrow" />
        </button>
      </div>

      <div className="form-links">
        <p>
          ¿Algún problema? Llámanos al{" "}
          <a className="text-link" href={site.phoneHref}>
            <Icon name="phone" />
            {site.phone}
          </a>
        </p>
      </div>
    </form>
  );
}
