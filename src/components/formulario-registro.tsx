"use client";

/**
 * Alta de cuenta.
 *
 * Quien rellena esto es siempre un adulto, y la primera pregunta es para quién
 * es la formación. Va arriba del todo a propósito: cambia el sentido de todos
 * los campos que vienen detrás. Si es para un menor, los datos personales de
 * abajo son los del tutor y aparece un bloque aparte para los del alumno.
 *
 * La validación real vive en la server action. Lo de aquí sirve para enseñar
 * los campos que tocan y avisar de errores obvios sin esperar al servidor.
 *
 * La cuenta no queda activa al terminar: el centro tiene que comprobar los
 * datos y, si el alumno es menor, la autorización firmada. El mensaje final lo
 * dice con esas palabras para que nadie se quede esperando.
 */

import { useActionState, useId, useState } from "react";
import Link from "next/link";
import { registrarAlumno, type EstadoRegistro } from "@/app/area-cliente/registro/acciones";
import { Icon } from "./icon";
import { site } from "@/content/site";

const ESTADO_INICIAL: EstadoRegistro = { ok: false };

/** Mismo valor que en el servidor: lo fija la LOPDGDD, no nosotros. */
const EDAD_MINIMA_CUENTA = 14;

/**
 * Copia de la función del servidor. Aquí solo decide qué avisos se enseñan;
 * quien valida el alta es `acciones.ts`.
 */
function calcularEdad(fechaISO: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaISO)) return null;
  const nacimiento = new Date(`${fechaISO}T00:00:00Z`);
  if (Number.isNaN(nacimiento.getTime())) return null;

  const hoy = new Date();
  let edad = hoy.getUTCFullYear() - nacimiento.getUTCFullYear();
  const meses = hoy.getUTCMonth() - nacimiento.getUTCMonth();
  if (meses < 0 || (meses === 0 && hoy.getUTCDate() < nacimiento.getUTCDate())) edad -= 1;
  return edad;
}

export function FormularioRegistro() {
  const [estado, enviar, pendiente] = useActionState(registrarAlumno, ESTADO_INICIAL);
  const [paraMenor, setParaMenor] = useState(false);
  const [fechaNacimiento, setFechaNacimiento] = useState("");

  const base = useId();
  const id = (campo: string) => `${base}-${campo}`;
  const idError = (campo: string) => `${base}-${campo}-error`;
  const idAyuda = (campo: string) => `${base}-${campo}-ayuda`;

  const errores = estado.errores ?? {};
  const edad = fechaNacimiento ? calcularEdad(fechaNacimiento) : null;
  const demasiadoJoven = edad !== null && edad >= 0 && edad < EDAD_MINIMA_CUENTA;

  const describir = (campo: string, ayuda = false) =>
    [ayuda ? idAyuda(campo) : null, errores[campo] ? idError(campo) : null].filter(Boolean).join(" ") || undefined;

  if (estado.ok) {
    return (
      <div className="form-panel">
        <p className="form-alert" role="status">
          {estado.mensaje}
        </p>
        <p>
          Mientras tanto, si necesitas algo puedes llamarnos al{" "}
          <a className="text-link" href={site.phoneHref}>
            <Icon name="phone" />
            {site.phone}
          </a>{" "}
          o escribir a{" "}
          <a className="text-link" href={`mailto:${site.email}`}>
            {site.email}
            <Icon name="arrow" />
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form className="form-panel" action={enviar} noValidate>
      {estado.mensaje && (
        <p className="form-alert" role="alert">
          {estado.mensaje}
        </p>
      )}

      <fieldset className="form-fieldset">
        <legend>¿Para quién es la formación?</legend>
        <p className="form-hint">
          La cuenta la abre siempre una persona adulta. Si el alumno es menor, se le da de alta desde la cuenta de su
          padre, madre o tutor.
        </p>

        <div className="form-field form-checkbox">
          <input
            id={id("paraMi")}
            name="paraQuien"
            type="radio"
            value="mi"
            checked={!paraMenor}
            onChange={() => setParaMenor(false)}
          />
          <label className="form-label" htmlFor={id("paraMi")}>
            Para mí
          </label>
        </div>

        <div className="form-field form-checkbox">
          <input
            id={id("paraMenor")}
            name="paraQuien"
            type="radio"
            value="menor"
            checked={paraMenor}
            onChange={() => setParaMenor(true)}
          />
          <label className="form-label" htmlFor={id("paraMenor")}>
            Para un menor a mi cargo
          </label>
        </div>
      </fieldset>

      <div className="form-field">
        <label className="form-label" htmlFor={id("nombre")}>
          {paraMenor ? "Tu nombre y apellidos (padre, madre o tutor)" : "Nombre y apellidos"}
        </label>
        <input
          className="form-input"
          id={id("nombre")}
          name="nombre"
          type="text"
          autoComplete="name"
          required
          maxLength={120}
          aria-invalid={errores.nombre ? true : undefined}
          aria-describedby={describir("nombre")}
        />
        {errores.nombre && (
          <p className="form-error" id={idError("nombre")}>
            {errores.nombre}
          </p>
        )}
      </div>

      <div className="form-field">
        <label className="form-label" htmlFor={id("email")}>
          Correo electrónico
        </label>
        <input
          className="form-input"
          id={id("email")}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          aria-invalid={errores.email ? true : undefined}
          aria-describedby={describir("email")}
        />
        {errores.email && (
          <p className="form-error" id={idError("email")}>
            {errores.email}
          </p>
        )}
      </div>

      <div className="form-field">
        <label className="form-label" htmlFor={id("password")}>
          Contraseña
        </label>
        <p className="form-hint" id={idAyuda("password")}>
          Mínimo 10 caracteres. Una frase que recuerdes funciona mejor que una palabra corta con símbolos.
        </p>
        <input
          className="form-input"
          id={id("password")}
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
          maxLength={128}
          aria-invalid={errores.password ? true : undefined}
          aria-describedby={describir("password", true)}
        />
        {errores.password && (
          <p className="form-error" id={idError("password")}>
            {errores.password}
          </p>
        )}
      </div>

      <div className="form-field">
        <label className="form-label" htmlFor={id("confirmacion")}>
          Repite la contraseña
        </label>
        <input
          className="form-input"
          id={id("confirmacion")}
          name="confirmacion"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={errores.confirmacion ? true : undefined}
          aria-describedby={describir("confirmacion")}
        />
        {errores.confirmacion && (
          <p className="form-error" id={idError("confirmacion")}>
            {errores.confirmacion}
          </p>
        )}
      </div>

      <div className="form-field">
        <label className="form-label" htmlFor={id("fechaNacimiento")}>
          Tu fecha de nacimiento
        </label>
        <p className="form-hint" id={idAyuda("fechaNacimiento")}>
          Es la de quien abre la cuenta. Hacen falta {EDAD_MINIMA_CUENTA} años cumplidos para tener cuenta propia.
        </p>
        <input
          className="form-input"
          id={id("fechaNacimiento")}
          name="fechaNacimiento"
          type="date"
          autoComplete="bday"
          required
          value={fechaNacimiento}
          onChange={(e) => setFechaNacimiento(e.target.value)}
          aria-invalid={errores.fechaNacimiento ? true : undefined}
          aria-describedby={describir("fechaNacimiento", true)}
        />
        {errores.fechaNacimiento && (
          <p className="form-error" id={idError("fechaNacimiento")}>
            {errores.fechaNacimiento}
          </p>
        )}
        {demasiadoJoven && !errores.fechaNacimiento && (
          <p className="form-error">
            Con esa fecha no se puede abrir una cuenta. Pídeselo a tu padre, madre o tutor: desde su cuenta puede darte
            de alta como alumno.
          </p>
        )}
      </div>

      <div className="form-field">
        <label className="form-label" htmlFor={id("telefono")}>
          Teléfono <span className="form-optional">(opcional)</span>
        </label>
        <p className="form-hint" id={idAyuda("telefono")}>
          Solo para poder avisarte si hay algún cambio. Puedes dejarlo en blanco.
        </p>
        <input
          className="form-input"
          id={id("telefono")}
          name="telefono"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          aria-invalid={errores.telefono ? true : undefined}
          aria-describedby={describir("telefono", true)}
        />
        {errores.telefono && (
          <p className="form-error" id={idError("telefono")}>
            {errores.telefono}
          </p>
        )}
      </div>

      {paraMenor && (
        <fieldset className="form-fieldset">
          <legend>Datos del alumno</legend>
          <p className="form-hint">
            El alta no se completa hasta que el centro reciba tu autorización firmada. Rellenar esto no basta; te
            diremos cómo hacerla llegar.
          </p>

          <div className="form-field">
            <label className="form-label" htmlFor={id("menorNombre")}>
              Nombre del alumno
            </label>
            <input
              className="form-input"
              id={id("menorNombre")}
              name="menorNombre"
              type="text"
              required
              maxLength={120}
              aria-invalid={errores.menorNombre ? true : undefined}
              aria-describedby={describir("menorNombre")}
            />
            {errores.menorNombre && (
              <p className="form-error" id={idError("menorNombre")}>
                {errores.menorNombre}
              </p>
            )}
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor={id("menorApellidos")}>
              Apellidos del alumno <span className="form-optional">(opcional)</span>
            </label>
            <input
              className="form-input"
              id={id("menorApellidos")}
              name="menorApellidos"
              type="text"
              maxLength={160}
              aria-invalid={errores.menorApellidos ? true : undefined}
              aria-describedby={describir("menorApellidos")}
            />
            {errores.menorApellidos && (
              <p className="form-error" id={idError("menorApellidos")}>
                {errores.menorApellidos}
              </p>
            )}
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor={id("menorFechaNacimiento")}>
              Fecha de nacimiento del alumno
            </label>
            <input
              className="form-input"
              id={id("menorFechaNacimiento")}
              name="menorFechaNacimiento"
              type="date"
              required
              aria-invalid={errores.menorFechaNacimiento ? true : undefined}
              aria-describedby={describir("menorFechaNacimiento")}
            />
            {errores.menorFechaNacimiento && (
              <p className="form-error" id={idError("menorFechaNacimiento")}>
                {errores.menorFechaNacimiento}
              </p>
            )}
          </div>
        </fieldset>
      )}

      <div className="form-field form-checkbox">
        <input
          id={id("privacidad")}
          name="privacidad"
          type="checkbox"
          required
          aria-invalid={errores.privacidad ? true : undefined}
          aria-describedby={describir("privacidad")}
        />
        <label className="form-label" htmlFor={id("privacidad")}>
          He leído la{" "}
          <Link className="text-link" href="/politica-privacidad">
            información de privacidad
          </Link>{" "}
          y acepto que el centro trate estos datos para gestionar el alta
          {paraMenor ? " del alumno que indico" : " como alumno"}.
        </label>
        {errores.privacidad && (
          <p className="form-error" id={idError("privacidad")}>
            {errores.privacidad}
          </p>
        )}
      </div>

      <div className="form-actions">
        <button className="button button-blue" type="submit" disabled={pendiente} aria-busy={pendiente}>
          {pendiente ? "Creando la cuenta…" : "Crear cuenta"}
          <Icon name="arrow" />
        </button>
      </div>
    </form>
  );
}
