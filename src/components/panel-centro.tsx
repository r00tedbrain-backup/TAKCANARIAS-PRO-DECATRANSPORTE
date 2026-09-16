"use client";

/**
 * Pantalla de gestión del centro.
 *
 * Es de uso interno y se maneja a diario, así que prima ver mucho de un vistazo
 * sobre que quede bonito. Todo va en una sola página para no obligar a navegar
 * entre pantallas mientras se atiende el teléfono.
 *
 * Las fechas se formatean en hora de Canarias, no en la del navegador.
 */

import { useActionState, useId, useState } from "react";
import {
  anadirFranja,
  crearCuentaAlumno,
  anularHora,
  anularReservaDesdeCentro,
  borrarFranja,
  generarHoras,
  validarAlumno,
  type EstadoCentro,
} from "@/app/centro/acciones";
import { Icon } from "./icon";
import { AyudaPanel } from "./ayuda-panel";

const INICIAL: EstadoCentro = { ok: false };
const ZONA = "Atlantic/Canary";

const DIAS = [
  { valor: 1, nombre: "Lunes" },
  { valor: 2, nombre: "Martes" },
  { valor: 3, nombre: "Miércoles" },
  { valor: 4, nombre: "Jueves" },
  { valor: 5, nombre: "Viernes" },
  { valor: 6, nombre: "Sábado" },
  { valor: 7, nombre: "Domingo" },
];

const AMBITOS = [
  { valor: "autoescuela", nombre: "Autoescuela" },
  { valor: "cap", nombre: "Formación CAP" },
  { valor: "apoyo", nombre: "Clases de apoyo" },
  { valor: "puntos", nombre: "Recuperación de puntos" },
];

const nombreAmbito = (v: string) => AMBITOS.find((a) => a.valor === v)?.nombre ?? v;
const nombreDia = (v: number) => DIAS.find((d) => d.valor === v)?.nombre ?? String(v);

function fechaHora(iso: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: ZONA,
  }).format(new Date(iso));
}

function soloHora(iso: string): string {
  return new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: ZONA }).format(new Date(iso));
}

type Franja = { id: string; ambito: string; diaSemana: number; horaInicio: string; horaFin: string; plazas: number };
type Hora = { id: string; ambito: string; inicio: string; fin: string; plazas: number; tomadas: number; anulada: boolean };
type ReservaFila = { id: string; alumno: string; titular: string; titularEmail: string; ambito: string; inicio: string; fin: string };
type Cuenta = {
  id: string;
  nombre: string;
  email: string;
  correoVerificado: boolean;
  esDelCentro: boolean;
  alta: string;
  alumnos: string;
};
type Pendiente = {
  id: string;
  nombre: string;
  fechaNacimiento: string | null;
  esElTitular: boolean;
  telefono: string | null;
  tieneAutorizacion: boolean;
  titular: string;
  titularEmail: string;
};

function Aviso({ estado }: { estado: EstadoCentro }) {
  if (!estado.mensaje) return null;
  return (
    <p className="form-alert" role={estado.ok ? "status" : "alert"}>
      {estado.mensaje}
    </p>
  );
}

export function PanelCentro({
  responsable,
  totales,
  franjas,
  horas,
  reservas,
  pendientes,
  cuentas,
}: {
  responsable: string;
  totales: { alumnos: number; validados: number };
  franjas: Franja[];
  horas: Hora[];
  reservas: ReservaFila[];
  pendientes: Pendiente[];
  cuentas: Cuenta[];
}) {
  const [estAnadir, accAnadir, anadiendo] = useActionState(anadirFranja, INICIAL);
  const [estBorrar, accBorrar, borrando] = useActionState(borrarFranja, INICIAL);
  const [estGenerar, accGenerar, generando] = useActionState(generarHoras, INICIAL);
  const [estAnular, accAnular, anulando] = useActionState(anularHora, INICIAL);
  const [estValidar, accValidar, validando] = useActionState(validarAlumno, INICIAL);
  const [estAnulRes, accAnulRes, anulandoRes] = useActionState(anularReservaDesdeCentro, INICIAL);
  const [estCrear, accCrear, creando] = useActionState(crearCuentaAlumno, INICIAL);

  const base = useId();
  const [verAnuladas, setVerAnuladas] = useState(false);
  const [altaParaMenor, setAltaParaMenor] = useState(false);
  const horasVisibles = verAnuladas ? horas : horas.filter((h) => !h.anulada);

  return (
    <>
      <header className="future-hero">
        <h1>Gestión del centro</h1>
        <p>
          {responsable}. {totales.alumnos} alumnos registrados, {totales.validados} validados.
          {pendientes.length > 0 && ` ${pendientes.length} fichas esperando revisión.`}
        </p>
      </header>

      <section className="section" aria-labelledby="alta">
        <div className="section-heading">
          <h2 id="alta">Dar de alta a un alumno</h2>
          <p>
            Se le enviará un correo para que elija su contraseña. Nadie del centro llega a ver la contraseña de un
            alumno, tampoco nosotros.
          </p>
        </div>

        <Aviso estado={estCrear} />

        <form className="form-panel" action={accCrear}>
          <div className="form-field form-checkbox">
            <input
              id={`${base}-menor`}
              name="esMenor"
              type="checkbox"
              checked={altaParaMenor}
              onChange={(e) => setAltaParaMenor(e.target.checked)}
            />
            <label className="form-label" htmlFor={`${base}-menor`}>
              El alumno es menor y la cuenta es de su padre, madre o tutor
            </label>
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor={`${base}-nombre`}>
              {altaParaMenor ? "Nombre del tutor" : "Nombre y apellidos"}
            </label>
            <input className="form-input" id={`${base}-nombre`} name="nombre" type="text" required maxLength={120} />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor={`${base}-email`}>
              Correo {altaParaMenor ? "del tutor" : "del alumno"}
            </label>
            <p className="form-hint">Ahí llegará el enlace para entrar. Comprueba que está bien escrito.</p>
            <input className="form-input" id={`${base}-email`} name="email" type="email" required />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor={`${base}-tel`}>
              Teléfono <span className="form-optional">(opcional)</span>
            </label>
            <input className="form-input" id={`${base}-tel`} name="telefono" type="tel" />
          </div>

          {altaParaMenor ? (
            <>
              <div className="form-field">
                <label className="form-label" htmlFor={`${base}-nalum`}>
                  Nombre del alumno
                </label>
                <input className="form-input" id={`${base}-nalum`} name="nombreAlumno" type="text" maxLength={120} />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor={`${base}-aalum`}>
                  Apellidos del alumno <span className="form-optional">(opcional)</span>
                </label>
                <input className="form-input" id={`${base}-aalum`} name="apellidosAlumno" type="text" maxLength={160} />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor={`${base}-fnac`}>
                  Fecha de nacimiento del alumno
                </label>
                <input className="form-input" id={`${base}-fnac`} name="fechaNacimiento" type="date" />
              </div>
            </>
          ) : (
            <div className="form-field">
              <label className="form-label" htmlFor={`${base}-fnac`}>
                Fecha de nacimiento <span className="form-optional">(opcional)</span>
              </label>
              <input className="form-input" id={`${base}-fnac`} name="fechaNacimiento" type="date" />
            </div>
          )}

          <div className="form-actions">
            <button className="button button-blue" type="submit" disabled={creando} aria-busy={creando}>
              {creando ? "Creando la cuenta…" : "Crear cuenta y avisar"}
              <Icon name="arrow" />
            </button>
          </div>
        </form>
      </section>

      {pendientes.length > 0 && (
        <section className="section" aria-labelledby="pendientes">
          <div className="section-heading">
            <h2 id="pendientes">Fichas por revisar</h2>
            <p>Mientras una ficha esté sin validar, ese alumno no puede reservar horas.</p>
          </div>
          <Aviso estado={estValidar} />

          <div className="fichas-rejilla">
            {pendientes.map((p) => (
              <div className="ficha aviso" key={p.id}>
                <h3>{p.nombre}</h3>
                {!p.esElTitular && <p>Menor a cargo de {p.titular}.</p>}
                {p.fechaNacimiento && <p>Nacido el {p.fechaNacimiento}</p>}
                {p.telefono && <p>Teléfono: {p.telefono}</p>}
                <p>Cuenta: {p.titularEmail}</p>

                <form action={accValidar}>
                  <input type="hidden" name="alumnoId" value={p.id} />
                  {!p.esElTitular && !p.tieneAutorizacion && (
                    <div className="form-field form-checkbox">
                      <input id={`${base}-aut-${p.id}`} name="conAutorizacion" type="checkbox" />
                      <label className="form-label" htmlFor={`${base}-aut-${p.id}`}>
                        Tengo la autorización firmada del tutor
                      </label>
                    </div>
                  )}
                  <button className="button button-blue" type="submit" disabled={validando} aria-busy={validando}>
                    {validando ? "Validando…" : "Validar ficha"}
                  </button>
                </form>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="section" aria-labelledby="horario">
        <div className="section-heading">
          <h2 id="horario">Horario habitual de la semana</h2>
          <p>
            Describe aquí cómo es una semana normal. Desde esto se crean las horas concretas que ven los alumnos; no
            hace falta meterlas una a una.
          </p>
        </div>

        <Aviso estado={estAnadir} />
        <Aviso estado={estBorrar} />

        <form className="form-panel" action={accAnadir}>
          <div className="form-field">
            <label className="form-label" htmlFor={`${base}-ambito`}>
              Tipo de clase
            </label>
            <select className="form-input" id={`${base}-ambito`} name="ambito" defaultValue="autoescuela">
              {AMBITOS.map((a) => (
                <option key={a.valor} value={a.valor}>
                  {a.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor={`${base}-dia`}>
              Día
            </label>
            <select className="form-input" id={`${base}-dia`} name="diaSemana" defaultValue="1">
              {DIAS.map((d) => (
                <option key={d.valor} value={d.valor}>
                  {d.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor={`${base}-ini`}>
              De
            </label>
            <input className="form-input" id={`${base}-ini`} name="horaInicio" type="time" required defaultValue="16:00" />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor={`${base}-fin`}>
              A
            </label>
            <input className="form-input" id={`${base}-fin`} name="horaFin" type="time" required defaultValue="17:00" />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor={`${base}-plazas`}>
              Clases a la vez
            </label>
            <p className="form-hint">En autoescuela, cuántos coches tenéis disponibles en esa franja.</p>
            <input
              className="form-input"
              id={`${base}-plazas`}
              name="plazas"
              type="number"
              min={1}
              max={50}
              required
              defaultValue={1}
            />
          </div>

          <div className="form-actions">
            <button className="button button-blue" type="submit" disabled={anadiendo} aria-busy={anadiendo}>
              {anadiendo ? "Añadiendo…" : "Añadir franja"}
              <Icon name="arrow" />
            </button>
          </div>
        </form>

        {franjas.length === 0 ? (
          <div className="info-block">
            <h3>Todavía no hay horario</h3>
            <p>Añade las franjas de arriba y después genera las horas.</p>
          </div>
        ) : (
          <div className="fichas-rejilla">
            {franjas.map((f) => (
              <div className="ficha" key={f.id}>
                <h3>
                  {nombreDia(f.diaSemana)} {f.horaInicio}–{f.horaFin}
                </h3>
                <p>
                  {nombreAmbito(f.ambito)} · {f.plazas === 1 ? "1 clase" : `${f.plazas} clases`} a la vez
                </p>
                <form action={accBorrar}>
                  <input type="hidden" name="franjaId" value={f.id} />
                  <button className="button button-white" type="submit" disabled={borrando} aria-busy={borrando}>
                    Quitar
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="section" aria-labelledby="generar">
        <div className="section-heading">
          <h2 id="generar">Abrir horas para los alumnos</h2>
          <p>
            Crea las horas concretas de las próximas semanas a partir del horario de arriba. Se puede repetir sin miedo:
            las que ya existan se dejan como están.
          </p>
        </div>

        <Aviso estado={estGenerar} />

        <form className="form-panel" action={accGenerar}>
          <div className="form-field">
            <label className="form-label" htmlFor={`${base}-semanas`}>
              ¿Cuántas semanas por delante?
            </label>
            <input
              className="form-input"
              id={`${base}-semanas`}
              name="semanas"
              type="number"
              min={1}
              max={12}
              required
              defaultValue={4}
            />
          </div>
          <div className="form-actions">
            <button className="button button-blue" type="submit" disabled={generando} aria-busy={generando}>
              {generando ? "Abriendo horas…" : "Abrir horas"}
              <Icon name="arrow" />
            </button>
          </div>
        </form>
      </section>

      <section className="section" aria-labelledby="proximas">
        <div className="section-heading">
          <h2 id="proximas">Próximas horas</h2>
          <p>Ocupación de cada hora. Si anulas una, quien la tuviera cogida la verá marcada.</p>
        </div>

        <Aviso estado={estAnular} />

        <div className="form-field form-checkbox">
          <input
            id={`${base}-ver-anuladas`}
            type="checkbox"
            checked={verAnuladas}
            onChange={(e) => setVerAnuladas(e.target.checked)}
          />
          <label className="form-label" htmlFor={`${base}-ver-anuladas`}>
            Mostrar también las anuladas
          </label>
        </div>

        {horasVisibles.length === 0 ? (
          <div className="info-block">
            <h3>No hay horas abiertas</h3>
            <p>Genera las horas desde el apartado de arriba.</p>
          </div>
        ) : (
          <div className="fichas-rejilla">
            {horasVisibles.map((h) => (
              <div className={`ficha${h.anulada ? " apagada" : h.tomadas >= h.plazas ? " aviso" : ""}`} key={h.id}>
                <h3>
                  {fechaHora(h.inicio)}–{soloHora(h.fin)}
                </h3>
                <p>{nombreAmbito(h.ambito)}</p>
                <p>
                  {h.tomadas} de {h.plazas} {h.plazas === 1 ? "plaza" : "plazas"} ocupadas
                  {h.tomadas >= h.plazas ? " · completa" : ""}
                </p>
                {h.anulada ? (
                  <p>Anulada.</p>
                ) : (
                  <form action={accAnular}>
                    <input type="hidden" name="sesionId" value={h.id} />
                    <input
                      className="form-input"
                      name="motivo"
                      type="text"
                      maxLength={200}
                      placeholder="Motivo (opcional)"
                      aria-label="Motivo de la anulación"
                    />
                    <button className="button button-white" type="submit" disabled={anulando} aria-busy={anulando}>
                      Anular esta hora
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="section" aria-labelledby="cuentas-heading">
        <div className="section-heading">
          <h2 id="cuentas-heading">Cuentas dadas de alta</h2>
          <p>
            {cuentas.length === 1 ? "1 cuenta" : `${cuentas.length} cuentas`} en total. Una cuenta puede tener varios
            alumnos: los hermanos van juntos bajo la del padre o la madre.
          </p>
        </div>

        {cuentas.length === 0 ? (
          <div className="ficha">
            <h3>Todavía no hay ninguna cuenta</h3>
            <p>Crea la primera desde el formulario de arriba.</p>
          </div>
        ) : (
          <div className="fichas-rejilla">
            {cuentas.map((c) => (
              <div className={`ficha${c.esDelCentro ? "" : c.alumnos ? "" : " aviso"}`} key={c.id}>
                <h3>{c.nombre}</h3>
                <p className="destacado">{c.email}</p>
                {c.esDelCentro && <p className="destacado">Personal del centro</p>}
                <p>{c.alumnos ? `Alumnos: ${c.alumnos}` : "Sin ninguna ficha de alumno"}</p>
                <p>
                  Alta: {fechaHora(c.alta)}
                  {c.correoVerificado ? "" : " · correo sin verificar"}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="section" aria-labelledby="quien-viene">
        <div className="section-heading">
          <h2 id="quien-viene">Quién viene</h2>
          <p>Reservas de aquí en adelante.</p>
        </div>

        <Aviso estado={estAnulRes} />

        {reservas.length === 0 ? (
          <div className="info-block">
            <h3>Nadie ha reservado todavía</h3>
          </div>
        ) : (
          <div className="fichas-rejilla">
            {reservas.map((r) => (
              <div className="ficha" key={r.id}>
                <h3>
                  {fechaHora(r.inicio)}–{soloHora(r.fin)}
                </h3>
                <p>
                  {r.alumno} · {nombreAmbito(r.ambito)}
                </p>
                <p>
                  Cuenta de {r.titular} ({r.titularEmail})
                </p>
                <form action={accAnulRes}>
                  <input type="hidden" name="reservaId" value={r.id} />
                  <button className="button button-white" type="submit" disabled={anulandoRes} aria-busy={anulandoRes}>
                    Anular reserva
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>

      <AyudaPanel />
    </>
  );
}
