"use client";

/**
 * Alta de alumno.
 *
 * El formulario envía a una server action; la validación real vive allí. Lo
 * de aquí sirve para dos cosas: enseñar los campos del tutor cuando la fecha
 * de nacimiento indica que es menor, y avisar de errores obvios sin esperar
 * al servidor.
 *
 * La cuenta no queda activa al terminar: el centro tiene que comprobar los
 * datos y, si el alumno es menor, la autorización del tutor. El mensaje final
 * lo dice con esas palabras para que nadie se quede esperando.
 */

import { useActionState, useId, useState } from "react";
import Link from "next/link";
import { registrarAlumno, type EstadoRegistro } from "@/app/area-cliente/registro/acciones";
import { Icon } from "./icon";
import { site } from "@/content/site";

const ESTADO_INICIAL: EstadoRegistro = { ok: false };

/**
 * Copia de la función del servidor. Aquí solo decide qué campos se enseñan;
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
  const [fechaNacimiento, setFechaNacimiento] = useState("");

  const base = useId();
  const id = (campo: string) => `${base}-${campo}`;
  const idError = (campo: string) => `${base}-${campo}-error`;
  const idAyuda = (campo: string) => `${base}-${campo}-ayuda`;

  const errores = estado.errores ?? {};
  const edad = fechaNacimiento ? calcularEdad(fechaNacimiento) : null;
  const esMenor = edad !== null && edad >= 0 && edad < 18;

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

      <div className="form-field">
        <label className="form-label" htmlFor={id("nombre")}>
          Nombre y apellidos
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
          Fecha de nacimiento
        </label>
        <p className="form-hint" id={idAyuda("fechaNacimiento")}>
          Nos hace falta para saber si la cuenta necesita la autorización de un tutor.
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

      {esMenor && (
        <fieldset className="form-fieldset">
          <legend>Datos del padre, madre o tutor</legend>
          <p className="form-hint">
            Según la fecha que has puesto eres menor de edad. Necesitamos a quién dirigirnos. La cuenta no se activará
            hasta que el centro confirme la autorización del tutor; no basta con rellenar esto.
          </p>

          <div className="form-field">
            <label className="form-label" htmlFor={id("tutorNombre")}>
              Nombre y apellidos del tutor
            </label>
            <input
              className="form-input"
              id={id("tutorNombre")}
              name="tutorNombre"
              type="text"
              required
              maxLength={120}
              aria-invalid={errores.tutorNombre ? true : undefined}
              aria-describedby={describir("tutorNombre")}
            />
            {errores.tutorNombre && (
              <p className="form-error" id={idError("tutorNombre")}>
                {errores.tutorNombre}
              </p>
            )}
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor={id("tutorContacto")}>
              Teléfono o correo del tutor
            </label>
            <input
              className="form-input"
              id={id("tutorContacto")}
              name="tutorContacto"
              type="text"
              required
              maxLength={120}
              aria-invalid={errores.tutorContacto ? true : undefined}
              aria-describedby={describir("tutorContacto")}
            />
            {errores.tutorContacto && (
              <p className="form-error" id={idError("tutorContacto")}>
                {errores.tutorContacto}
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
          y acepto que el centro trate estos datos para gestionar mi alta como alumno.
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
