"use client";

/**
 * Administración de cuentas. Solo la ve el administrador.
 *
 * Esconder esta sección NO es lo que la protege: cada acción vuelve a
 * comprobar el rol contra la base de datos. Una server action es un punto de
 * entrada como cualquier otro y se puede invocar sin pasar por esta pantalla.
 * Aquí se oculta para no ofrecer botones que van a fallar, nada más.
 */

import { useActionState, useId, useState } from "react";
import {
  cambiarRol,
  crearCuentaPersonal,
  restablecerContrasena,
  type EstadoCentro,
} from "@/app/centro/acciones";
import { Icon } from "./icon";

const INICIAL: EstadoCentro = { ok: false };

export type CuentaAdmin = {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  alta: string;
};

const ETIQUETA_ROL: Record<string, string> = {
  admin: "Administrador",
  centro: "Personal del centro",
  alumno: "Alumno",
};

function Aviso({ estado }: { estado: EstadoCentro }) {
  if (!estado.mensaje) return null;
  return (
    <p className="form-alert" role={estado.ok ? "status" : "alert"}>
      {estado.mensaje}
    </p>
  );
}

function fecha(iso: string): string {
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "short", timeZone: "Atlantic/Canary" }).format(
    new Date(iso),
  );
}

export function PanelAdmin({ cuentas, yoId }: { cuentas: CuentaAdmin[]; yoId: string }) {
  const [estCrear, accCrear, creando] = useActionState(crearCuentaPersonal, INICIAL);
  const [estRol, accRol, cambiando] = useActionState(cambiarRol, INICIAL);
  const [estClave, accClave, enviandoClave] = useActionState(restablecerContrasena, INICIAL);
  const [abierto, setAbierto] = useState(false);
  const idNombre = useId();
  const idEmail = useId();
  const idRol = useId();

  return (
    <section className="section" aria-labelledby="admin">
      <div className="section-heading">
        <h2 id="admin">Cuentas y accesos</h2>
        <p>Crear personal, cambiar roles y enviar enlaces para restablecer contraseñas.</p>
      </div>

      <p className="adm-nota">
        <Icon name="shield" />
        <span>
          Esta parte solo la ves tú. El personal del centro puede dar de alta alumnos, pero no crear más personal ni
          tocar contraseñas ajenas: si le roban una cuenta, el daño no se extiende.
        </span>
      </p>

      {/* Crear personal ------------------------------------------------ */}
      <div className="adm-bloque">
        <button
          className="adm-desplegar"
          type="button"
          aria-expanded={abierto}
          onClick={() => setAbierto((v) => !v)}
        >
          <span>Crear una cuenta de personal</span>
          <Icon name="chevron" />
        </button>

        {abierto && (
          <form action={accCrear} className="adm-form">
            <div className="field">
              <label htmlFor={idNombre}>Nombre y apellidos</label>
              <input id={idNombre} name="nombre" type="text" required maxLength={120} autoComplete="off" />
            </div>
            <div className="field">
              <label htmlFor={idEmail}>Correo</label>
              <input id={idEmail} name="email" type="email" required autoComplete="off" />
            </div>
            <div className="field">
              <label htmlFor={idRol}>Qué va a poder hacer</label>
              <select id={idRol} name="rol" defaultValue="centro" required>
                <option value="centro">Personal del centro — alumnos, horarios y reservas</option>
                <option value="admin">Administrador — además, cuentas y accesos</option>
              </select>
            </div>
            <p className="adm-pista">
              No eliges contraseña: le llega un correo para que ponga la suya. Nadie llega a conocer la clave de otra
              persona.
            </p>
            <button className="button button-blue" type="submit" disabled={creando}>
              {creando ? "Creando…" : "Crear cuenta"}
              <Icon name="arrow" />
            </button>
          </form>
        )}
        <Aviso estado={estCrear} />
      </div>

      {/* Cuentas existentes -------------------------------------------- */}
      <div className="adm-bloque">
        <h3>Cuentas ({cuentas.length})</h3>
        <Aviso estado={estRol} />
        <Aviso estado={estClave} />

        <div className="adm-lista">
          {cuentas.map((c) => {
            // Tu propia fila va bloqueada: quitarte el rol te deja fuera.
            const soyYo = c.id === yoId;

            return (
              <div className="adm-cuenta" key={c.id}>
                <div className="adm-quien">
                  <strong>
                    {c.nombre}
                    {soyYo && <span className="adm-yo">tú</span>}
                  </strong>
                  <span>{c.email}</span>
                  <span className="adm-alta">Alta el {fecha(c.alta)}</span>
                </div>

                <div className="adm-rol">
                  <span className={`adm-chapa adm-chapa-${c.rol}`}>{ETIQUETA_ROL[c.rol] ?? c.rol}</span>
                </div>

                <div className="adm-controles">
                  <form action={accRol} className="adm-cambio">
                    <input type="hidden" name="userId" value={c.id} />
                    <label className="sr-only" htmlFor={`rol-${c.id}`}>
                      Rol de {c.nombre}
                    </label>
                    <select id={`rol-${c.id}`} name="rol" defaultValue={c.rol} disabled={soyYo}>
                      <option value="alumno">Alumno</option>
                      <option value="centro">Personal del centro</option>
                      <option value="admin">Administrador</option>
                    </select>
                    <button
                      className="button button-white"
                      type="submit"
                      disabled={cambiando || soyYo}
                    >
                      Cambiar
                    </button>
                  </form>

                  <form action={accClave}>
                    <input type="hidden" name="userId" value={c.id} />
                    <button className="button button-white" type="submit" disabled={enviandoClave}>
                      Enviar enlace de contraseña
                    </button>
                  </form>
                </div>

                {soyYo && (
                  <p className="adm-motivo">
                    Tu propio rol no se toca desde aquí: te dejaría fuera. Si hace falta, que lo cambie otro
                    administrador.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
