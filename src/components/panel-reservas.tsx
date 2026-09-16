"use client";

/**
 * Elegir hora y anular.
 *
 * Las fechas llegan como texto ISO y se formatean aquí, siempre en la hora de
 * Canarias. Si se dejara a la zona del navegador, un alumno de vacaciones en la
 * Península vería las horas corridas y se presentaría a destiempo.
 *
 * El botón se desactiva mientras se envía. No es cosmético: evita el doble clic,
 * que es la forma más fácil de intentar coger dos veces la misma hora.
 */

import { useActionState, useId, useState } from "react";
import { anularReserva, reservarHueco, type EstadoReserva } from "@/app/area-cliente/reservas/acciones";
import { Icon } from "./icon";

const ESTADO_INICIAL: EstadoReserva = { ok: false };

type Alumno = { id: string; nombre: string };
type Hueco = {
  id: string;
  ambito: string;
  inicio: string;
  fin: string;
  profesor: string | null;
  lugar: string | null;
  quedan: number;
};
type Reserva = {
  id: string;
  alumnoNombre: string;
  ambito: string;
  inicio: string;
  fin: string;
  lugar: string | null;
  anuladaPorElCentro: boolean;
  motivoCancelacion: string | null;
};

const ZONA = "Atlantic/Canary";

function dia(iso: string): string {
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "full", timeZone: ZONA }).format(new Date(iso));
}

function hora(iso: string): string {
  return new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: ZONA }).format(new Date(iso));
}

export function PanelReservas({
  alumnos,
  huecos,
  reservas,
}: {
  alumnos: Alumno[];
  huecos: Hueco[];
  reservas: Reserva[];
}) {
  const [estadoReserva, enviarReserva, reservando] = useActionState(reservarHueco, ESTADO_INICIAL);
  const [estadoAnular, enviarAnular, anulando] = useActionState(anularReserva, ESTADO_INICIAL);
  const [alumnoId, setAlumnoId] = useState(alumnos[0]?.id ?? "");

  const base = useId();

  // Agrupar por día para no soltar una lista larga de horas sueltas.
  const porDia = huecos.reduce<Record<string, Hueco[]>>((acc, h) => {
    const clave = dia(h.inicio);
    (acc[clave] ??= []).push(h);
    return acc;
  }, {});

  return (
    <>
      {reservas.length > 0 && (
        <section className="section" aria-labelledby="mis-horas">
          <div className="section-heading">
            <h2 id="mis-horas">Tus horas reservadas</h2>
            <p>Lo que tienes cogido de aquí en adelante.</p>
          </div>

          {estadoAnular.mensaje && (
            <p className="form-alert" role={estadoAnular.ok ? "status" : "alert"}>
              {estadoAnular.mensaje}
            </p>
          )}

          <div className="service-detail-grid">
            {reservas.map((r) => (
              <div className="info-block" key={r.id}>
                <h3>
                  {dia(r.inicio)}, {hora(r.inicio)}–{hora(r.fin)}
                </h3>
                <p>
                  {r.ambito} · {r.alumnoNombre}
                </p>
                {r.lugar && <p>Lugar: {r.lugar}</p>}

                {r.anuladaPorElCentro ? (
                  <p>
                    El centro ha anulado esta hora
                    {r.motivoCancelacion ? `: ${r.motivoCancelacion}` : "."} Te avisaremos para darte otra.
                  </p>
                ) : (
                  <form action={enviarAnular}>
                    <input type="hidden" name="reservaId" value={r.id} />
                    <button className="button button-white" type="submit" disabled={anulando} aria-busy={anulando}>
                      {anulando ? "Anulando…" : "Anular esta hora"}
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="section" aria-labelledby="horas-libres">
        <div className="section-heading">
          <h2 id="horas-libres">Horas libres</h2>
          <p>Quedan reservadas en el momento. No hace falta que llames para confirmar.</p>
        </div>

        {estadoReserva.mensaje && (
          <p className="form-alert" role={estadoReserva.ok ? "status" : "alert"}>
            {estadoReserva.mensaje}
          </p>
        )}

        {alumnos.length > 1 && (
          <div className="form-field">
            <label className="form-label" htmlFor={`${base}-alumno`}>
              ¿Para quién es la hora?
            </label>
            <select
              className="form-input"
              id={`${base}-alumno`}
              value={alumnoId}
              onChange={(e) => setAlumnoId(e.target.value)}
            >
              {alumnos.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </select>
          </div>
        )}

        {huecos.length === 0 ? (
          <div className="info-block">
            <h3>Ahora mismo no hay horas libres</h3>
            <p>
              Se van abriendo según el horario del centro. Vuelve a mirar en un rato o llámanos y te buscamos un hueco.
            </p>
          </div>
        ) : (
          Object.entries(porDia).map(([elDia, delDia]) => (
            <div key={elDia}>
              <h3>{elDia}</h3>
              <div className="service-detail-grid">
                {delDia.map((h) => (
                  <div className="info-block" key={h.id}>
                    <h3>
                      {hora(h.inicio)}–{hora(h.fin)}
                    </h3>
                    <p>{h.ambito}</p>
                    {h.profesor && <p>Con {h.profesor}</p>}
                    {h.lugar && <p>Lugar: {h.lugar}</p>}
                    <p>{h.quedan === 1 ? "Queda 1 plaza." : `Quedan ${h.quedan} plazas.`}</p>

                    <form action={enviarReserva}>
                      <input type="hidden" name="sesionId" value={h.id} />
                      <input type="hidden" name="alumnoId" value={alumnoId} />
                      <button
                        className="button button-blue"
                        type="submit"
                        disabled={reservando || !alumnoId}
                        aria-busy={reservando}
                      >
                        {reservando ? "Reservando…" : "Reservar esta hora"}
                        <Icon name="arrow" />
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </section>
    </>
  );
}
