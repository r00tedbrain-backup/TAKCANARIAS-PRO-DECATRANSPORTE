"use client";

/**
 * Pantalla de gestión del centro.
 *
 * La usan personas mayores que no son informáticas. La primera versión lo
 * metía todo en una sola página: 13 pantallas de scroll, 76 formularios y 60
 * botones "Quitar" seguidos. Lo que se mira cada mañana, quién viene, quedaba
 * a 8 pantallas de distancia. No era "un poco liado": no se encontraba nada.
 *
 * Ahora hay una portada con botones grandes y UNA tarea por pantalla. Las
 * acciones del servidor son exactamente las mismas, con sus mismas
 * comprobaciones: aquí solo cambia cómo se ordena y cómo se ve.
 *
 * La pantalla activa vive en el `#` de la dirección y no en un estado interno,
 * por dos motivos:
 *
 * - El botón "atrás" del navegador funciona. Es lo primero que pulsa alguien
 *   que se ha perdido, y con un estado interno le sacaría del panel entero.
 * - Los nombres (`#horario`, `#alta`, `#pendientes`, `#quien-viene`) son los
 *   mismos anclajes que ya usaba la guía de puesta en marcha, así que sus
 *   enlaces siguen llevando al sitio correcto sin tocarlos.
 *
 * Se lee con `useSyncExternalStore`, igual que el reloj de la cuenta atrás: la
 * dirección es un dato que vive fuera de React y cambia por su cuenta.
 *
 * Las fechas se formatean en hora de Canarias, no en la del navegador.
 */

import { useActionState, useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
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
import { GuiaCentro } from "./guia-centro";
import { BotonCerrarSesion } from "./boton-cerrar-sesion";

const INICIAL: EstadoCentro = { ok: false };
const ZONA = "Atlantic/Canary";

const DIAS = [
  { valor: 1, nombre: "Lunes", corto: "Lun" },
  { valor: 2, nombre: "Martes", corto: "Mar" },
  { valor: 3, nombre: "Miércoles", corto: "Mié" },
  { valor: 4, nombre: "Jueves", corto: "Jue" },
  { valor: 5, nombre: "Viernes", corto: "Vie" },
  { valor: 6, nombre: "Sábado", corto: "Sáb" },
  { valor: 7, nombre: "Domingo", corto: "Dom" },
];

const AMBITOS = [
  { valor: "autoescuela", nombre: "Autoescuela" },
  { valor: "cap", nombre: "Formación CAP" },
  { valor: "apoyo", nombre: "Clases de apoyo" },
  { valor: "puntos", nombre: "Recuperación de puntos" },
];

const nombreAmbito = (v: string) => AMBITOS.find((a) => a.valor === v)?.nombre ?? v;

/** Día en Canarias como AAAA-MM-DD, para agrupar por día sin líos de zona. */
function diaClave(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA }).format(new Date(iso));
}

function fechaLarga(iso: string): string {
  return new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long", timeZone: ZONA }).format(
    new Date(iso),
  );
}

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

/** "Hoy", "Mañana" o la fecha con el día de la semana. */
function etiquetaDia(clave: string, iso: string, hoy: string, manana: string): string {
  if (clave === hoy) return "Hoy";
  if (clave === manana) return "Mañana";
  const texto = fechaLarga(iso);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function agruparPorDia<T extends { inicio: string }>(filas: T[]): { clave: string; iso: string; filas: T[] }[] {
  const grupos = new Map<string, { clave: string; iso: string; filas: T[] }>();
  for (const f of filas) {
    const clave = diaClave(f.inicio);
    const g = grupos.get(clave) ?? { clave, iso: f.inicio, filas: [] };
    g.filas.push(f);
    grupos.set(clave, g);
  }
  return [...grupos.values()];
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

/**
 * Pregunta antes de borrar. Con botones grandes es fácil pulsar sin querer, y
 * anular la clase de un alumno no se deshace con otro clic.
 */
function confirmar(pregunta: string) {
  return (e: { preventDefault: () => void }) => {
    if (!window.confirm(pregunta)) e.preventDefault();
  };
}

// ── Pantalla activa, leída del # de la dirección ─────────────────────────────

const VISTAS = ["inicio", "quien-viene", "alta", "pendientes", "horario", "horas", "cuentas", "ajustes", "ayuda"] as const;
type Vista = (typeof VISTAS)[number];

/** Anclajes antiguos que siguen llevando a su pantalla nueva. */
const ALIAS: Record<string, Vista> = { generar: "horario", proximas: "horas" };

function leerVista(): Vista {
  const h = window.location.hash.slice(1);
  if ((VISTAS as readonly string[]).includes(h)) return h as Vista;
  return ALIAS[h] ?? "inicio";
}

function suscribirHash(alCambiar: () => void): () => void {
  window.addEventListener("hashchange", alCambiar);
  return () => window.removeEventListener("hashchange", alCambiar);
}

const enElServidorSiempreInicio = (): Vista => "inicio";

// ── Piezas pequeñas ──────────────────────────────────────────────────────────

function Aviso({ estado }: { estado: EstadoCentro }) {
  if (!estado.mensaje) return null;
  return (
    <p className={`pc-aviso ${estado.ok ? "bien" : "mal"}`} role={estado.ok ? "status" : "alert"}>
      {estado.mensaje}
    </p>
  );
}

/** Cabecera de cada pantalla, con su botón grande para volver. */
function Pantalla({ titulo, explicacion, children }: { titulo: string; explicacion?: string; children: ReactNode }) {
  const titular = useRef<HTMLHeadingElement>(null);

  // Al entrar en una pantalla, el lector de pantalla tiene que oír dónde está.
  // El foco va al título; el desplazamiento arriba lo hace el panel.
  useEffect(() => {
    titular.current?.focus();
  }, []);

  return (
    <section className="pc-pantalla">
      <a className="pc-volver" href="#inicio">
        <Icon name="arrow" className="pc-volver-flecha" />
        Volver al inicio
      </a>
      <h2 className="pc-titulo" ref={titular} tabIndex={-1}>
        {titulo}
      </h2>
      {explicacion && <p className="pc-explica">{explicacion}</p>}
      {children}
    </section>
  );
}

type Boton = {
  vista: Vista;
  titulo: string;
  detalle: string;
  icono: Parameters<typeof Icon>[0]["name"];
  numero?: number;
  urgente?: boolean;
};

// ── Panel ────────────────────────────────────────────────────────────────────

export function PanelCentro({
  responsable,
  totales,
  franjas,
  horas,
  reservas,
  pendientes,
  cuentas,
  hoy,
  manana,
  ajustes,
}: {
  responsable: string;
  totales: { alumnos: number; validados: number };
  franjas: Franja[];
  horas: Hora[];
  reservas: ReservaFila[];
  pendientes: Pendiente[];
  cuentas: Cuenta[];
  /** AAAA-MM-DD en Canarias, calculado en el servidor: el reloj no se lee en el render. */
  hoy: string;
  manana: string;
  /** Telegram y cuentas y accesos, que vienen ya montados desde la página. */
  ajustes: ReactNode;
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

  const vista = useSyncExternalStore(suscribirHash, leerVista, enElServidorSiempreInicio);

  // Cada pantalla empieza arriba. Sin esto, al cambiar de pantalla se quedaba
  // el desplazamiento de la anterior y parecía que no había pasado nada.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [vista]);

  const horasAbiertas = horas.filter((h) => !h.anulada);
  const horasVisibles = verAnuladas ? horas : horasAbiertas;
  const reservasHoy = reservas.filter((r) => diaClave(r.inicio) === hoy).length;

  const pasosHechos = [franjas.length > 0, horasAbiertas.length > 0, totales.alumnos > 0, reservas.length > 0];
  const puestaEnMarchaHecha = pasosHechos.every(Boolean);

  const botones: Boton[] = [
    {
      vista: "quien-viene",
      titulo: "Quién viene",
      detalle:
        reservas.length === 0
          ? "Nadie ha reservado todavía"
          : `${reservasHoy === 0 ? "Nadie hoy" : reservasHoy === 1 ? "1 clase hoy" : `${reservasHoy} clases hoy`} · ${reservas.length} en total`,
      icono: "car",
      numero: reservasHoy,
    },
    {
      vista: "pendientes",
      titulo: "Fichas por revisar",
      detalle:
        pendientes.length === 0
          ? "Ninguna pendiente"
          : "Sin revisar no pueden reservar",
      icono: "document",
      numero: pendientes.length,
      urgente: pendientes.length > 0,
    },
    { vista: "alta", titulo: "Dar de alta a un alumno", detalle: "Le llega un correo para entrar", icono: "user" },
    {
      vista: "horario",
      titulo: "Horario de la semana",
      detalle: franjas.length === 0 ? "Sin horario todavía" : `${franjas.length} horas a la semana`,
      icono: "book",
    },
    {
      vista: "horas",
      titulo: "Anular una clase",
      detalle: "Festivos, coche en el taller, bajas",
      icono: "close",
    },
    {
      vista: "cuentas",
      titulo: "Alumnos dados de alta",
      detalle: `${totales.alumnos} alumnos · ${totales.validados} revisados`,
      icono: "graduate",
    },
    { vista: "ajustes", titulo: "Avisos y accesos", detalle: "Telegram y cuentas del personal", icono: "shield" },
    { vista: "ayuda", titulo: "¿Cómo funciona esto?", detalle: "Explicado paso a paso", icono: "book" },
  ];

  return (
    <div className="pc">
      <header className="pc-cabecera">
        <div>
          <p className="pc-saludo">Hola, {responsable}</p>
          <h1 className="pc-h1">Gestión del centro</h1>
        </div>
        <BotonCerrarSesion />
      </header>

      {/* ── PORTADA ───────────────────────────────────────────────────────── */}
      {vista === "inicio" && (
        <>
          <p className="pc-explica">¿Qué quieres hacer? Pulsa en un recuadro.</p>

          <nav className="pc-botones" aria-label="Apartados del panel">
            {botones.map((b) => (
              <a key={b.vista} href={`#${b.vista}`} className={`pc-boton${b.urgente ? " urgente" : ""}`}>
                <span className="pc-boton-icono">
                  <Icon name={b.icono} />
                </span>
                <span className="pc-boton-texto">
                  <span className="pc-boton-titulo">{b.titulo}</span>
                  <span className="pc-boton-detalle">{b.detalle}</span>
                </span>
                {b.numero !== undefined && b.numero > 0 && (
                  <span className="pc-boton-numero" aria-label={`${b.numero}`}>
                    {b.numero}
                  </span>
                )}
              </a>
            ))}
          </nav>

          {/* La guía solo mientras falte algo por montar. Una vez todo en
              marcha, en la portada estorba: está en "¿Cómo funciona esto?". */}
          {!puestaEnMarchaHecha && (
            <GuiaCentro
              hayHorario={pasosHechos[0]}
              hayHorasAbiertas={pasosHechos[1]}
              hayAlumnos={pasosHechos[2]}
              hayReservas={pasosHechos[3]}
              fichasPendientes={pendientes.length}
            />
          )}
        </>
      )}

      {/* ── QUIÉN VIENE ───────────────────────────────────────────────────── */}
      {vista === "quien-viene" && (
        <Pantalla titulo="Quién viene" explicacion="Las clases reservadas de hoy en adelante, ordenadas por día.">
          <Aviso estado={estAnulRes} />
          {reservas.length === 0 ? (
            <p className="pc-vacio">Nadie ha reservado todavía.</p>
          ) : (
            agruparPorDia(reservas).map((g) => (
              <div className="pc-dia" key={g.clave}>
                <h3 className={`pc-dia-titulo${g.clave === hoy ? " hoy" : ""}`}>
                  {etiquetaDia(g.clave, g.iso, hoy, manana)}
                  <span>{g.filas.length === 1 ? "1 clase" : `${g.filas.length} clases`}</span>
                </h3>
                <ul className="pc-lista">
                  {g.filas.map((r) => (
                    <li className="pc-fila" key={r.id}>
                      <span className="pc-hora">
                        {soloHora(r.inicio)}
                        <small>a {soloHora(r.fin)}</small>
                      </span>
                      <span className="pc-fila-texto">
                        <strong>{r.alumno}</strong>
                        <span>
                          {nombreAmbito(r.ambito)}
                          {r.titular !== r.alumno && ` · cuenta de ${r.titular}`}
                        </span>
                      </span>
                      <form action={accAnulRes}>
                        <input type="hidden" name="reservaId" value={r.id} />
                        <button
                          className="pc-btn-secundario"
                          type="submit"
                          disabled={anulandoRes}
                          onClick={confirmar(`¿Anular la clase de ${r.alumno} a las ${soloHora(r.inicio)}?`)}
                        >
                          Anular
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </Pantalla>
      )}

      {/* ── FICHAS POR REVISAR ────────────────────────────────────────────── */}
      {vista === "pendientes" && (
        <Pantalla
          titulo="Fichas por revisar"
          explicacion="Mientras una ficha esté sin revisar, ese alumno no puede reservar clases."
        >
          <Aviso estado={estValidar} />
          {pendientes.length === 0 ? (
            <p className="pc-vacio">
              <Icon name="check" /> No hay ninguna ficha pendiente.
            </p>
          ) : (
            <div className="pc-tarjetas">
              {pendientes.map((p) => (
                <div className="pc-tarjeta" key={p.id}>
                  <h3>{p.nombre}</h3>
                  {!p.esElTitular && <p className="pc-marca">Menor · a cargo de {p.titular}</p>}
                  {p.fechaNacimiento && <p>Nacido el {p.fechaNacimiento}</p>}
                  {p.telefono && <p>Teléfono: {p.telefono}</p>}
                  <p>Correo: {p.titularEmail}</p>

                  <form action={accValidar}>
                    <input type="hidden" name="alumnoId" value={p.id} />
                    {!p.esElTitular && !p.tieneAutorizacion && (
                      <label className="pc-check" htmlFor={`${base}-aut-${p.id}`}>
                        <input id={`${base}-aut-${p.id}`} name="conAutorizacion" type="checkbox" />
                        Tengo la autorización firmada del tutor
                      </label>
                    )}
                    <button className="pc-btn" type="submit" disabled={validando} aria-busy={validando}>
                      <Icon name="check" />
                      {validando ? "Revisando…" : "Ficha revisada, dar el visto bueno"}
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </Pantalla>
      )}

      {/* ── DAR DE ALTA ───────────────────────────────────────────────────── */}
      {vista === "alta" && (
        <Pantalla
          titulo="Dar de alta a un alumno"
          explicacion="Al alumno le llega un correo para que elija su contraseña. Nadie del centro llega a verla."
        >
          <Aviso estado={estCrear} />

          <form className="pc-form" action={accCrear}>
            <label className="pc-check grande" htmlFor={`${base}-menor`}>
              <input
                id={`${base}-menor`}
                name="esMenor"
                type="checkbox"
                checked={altaParaMenor}
                onChange={(e) => setAltaParaMenor(e.target.checked)}
              />
              Es un menor: la cuenta la lleva su padre, madre o tutor
            </label>

            <div className="pc-campo">
              <label htmlFor={`${base}-nombre`}>{altaParaMenor ? "Nombre del padre, madre o tutor" : "Nombre y apellidos"}</label>
              <input id={`${base}-nombre`} name="nombre" type="text" required maxLength={120} />
            </div>

            <div className="pc-campo">
              <label htmlFor={`${base}-email`}>Correo {altaParaMenor ? "del tutor" : "del alumno"}</label>
              <p className="pc-pista">Ahí llegará el enlace para entrar. Revisa que esté bien escrito.</p>
              <input id={`${base}-email`} name="email" type="email" required />
            </div>

            <div className="pc-campo">
              <label htmlFor={`${base}-tel`}>
                Teléfono <span className="pc-opcional">(si quieres)</span>
              </label>
              <input id={`${base}-tel`} name="telefono" type="tel" />
            </div>

            {altaParaMenor ? (
              <>
                <div className="pc-campo">
                  <label htmlFor={`${base}-nalum`}>Nombre del alumno</label>
                  <input id={`${base}-nalum`} name="nombreAlumno" type="text" maxLength={120} />
                </div>
                <div className="pc-campo">
                  <label htmlFor={`${base}-aalum`}>
                    Apellidos del alumno <span className="pc-opcional">(si quieres)</span>
                  </label>
                  <input id={`${base}-aalum`} name="apellidosAlumno" type="text" maxLength={160} />
                </div>
                <div className="pc-campo">
                  <label htmlFor={`${base}-fnac`}>Fecha de nacimiento del alumno</label>
                  <input id={`${base}-fnac`} name="fechaNacimiento" type="date" />
                </div>
              </>
            ) : (
              <div className="pc-campo">
                <label htmlFor={`${base}-fnac`}>
                  Fecha de nacimiento <span className="pc-opcional">(si quieres)</span>
                </label>
                <input id={`${base}-fnac`} name="fechaNacimiento" type="date" />
              </div>
            )}

            <button className="pc-btn" type="submit" disabled={creando} aria-busy={creando}>
              {creando ? "Creando la cuenta…" : "Dar de alta y enviarle el correo"}
              <Icon name="arrow" />
            </button>
          </form>
        </Pantalla>
      )}

      {/* ── HORARIO ───────────────────────────────────────────────────────── */}
      {vista === "horario" && (
        <Pantalla
          titulo="Horario de la semana"
          explicacion="Así es una semana normal. Se pone una vez y se repite sola. Los alumnos solo ven las horas que abras en el paso 2."
        >
          <Aviso estado={estBorrar} />

          {franjas.length === 0 ? (
            <p className="pc-vacio">Todavía no hay horario. Añade la primera hora aquí abajo.</p>
          ) : (
            <CuadriculaHorario franjas={franjas} accBorrar={accBorrar} borrando={borrando} />
          )}

          <details className="pc-desplegable">
            <summary>
              <Icon name="chevron" /> Añadir una hora al horario
            </summary>
            <Aviso estado={estAnadir} />
            <form className="pc-form" action={accAnadir}>
              <div className="pc-fila-campos">
                <div className="pc-campo">
                  <label htmlFor={`${base}-dia`}>Día</label>
                  <select id={`${base}-dia`} name="diaSemana" defaultValue="1">
                    {DIAS.map((d) => (
                      <option key={d.valor} value={d.valor}>
                        {d.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="pc-campo">
                  <label htmlFor={`${base}-ini`}>Desde</label>
                  <input id={`${base}-ini`} name="horaInicio" type="time" required defaultValue="16:00" />
                </div>
                <div className="pc-campo">
                  <label htmlFor={`${base}-fin`}>Hasta</label>
                  <input id={`${base}-fin`} name="horaFin" type="time" required defaultValue="17:00" />
                </div>
              </div>
              <div className="pc-fila-campos">
                <div className="pc-campo">
                  <label htmlFor={`${base}-ambito`}>Tipo de clase</label>
                  <select id={`${base}-ambito`} name="ambito" defaultValue="autoescuela">
                    {AMBITOS.map((a) => (
                      <option key={a.valor} value={a.valor}>
                        {a.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="pc-campo">
                  <label htmlFor={`${base}-plazas`}>Clases a la vez</label>
                  <input id={`${base}-plazas`} name="plazas" type="number" min={1} max={50} required defaultValue={1} />
                  <p className="pc-pista">En autoescuela, los coches disponibles.</p>
                </div>
              </div>
              <button className="pc-btn" type="submit" disabled={anadiendo} aria-busy={anadiendo}>
                {anadiendo ? "Añadiendo…" : "Añadir al horario"}
              </button>
            </form>
          </details>

          <div className="pc-paso2">
            <h3>Paso 2 · Abrir las horas para que los alumnos reserven</h3>
            <p>
              Convierte el horario en clases concretas de las próximas semanas. Se puede pulsar las veces que haga falta:
              lo que ya está abierto no se duplica.
            </p>
            <Aviso estado={estGenerar} />
            <form className="pc-form en-linea" action={accGenerar}>
              <div className="pc-campo">
                <label htmlFor={`${base}-semanas`}>Semanas por delante</label>
                <input id={`${base}-semanas`} name="semanas" type="number" min={1} max={12} required defaultValue={4} />
              </div>
              <button className="pc-btn" type="submit" disabled={generando} aria-busy={generando}>
                {generando ? "Abriendo…" : "Abrir horas"}
                <Icon name="arrow" />
              </button>
            </form>
          </div>
        </Pantalla>
      )}

      {/* ── ANULAR UNA CLASE ──────────────────────────────────────────────── */}
      {vista === "horas" && (
        <Pantalla
          titulo="Anular una clase"
          explicacion="Busca el día y pulsa «Anular» en la hora que no se pueda dar. Si alguien la tenía reservada, lo verá marcado."
        >
          <Aviso estado={estAnular} />

          <label className="pc-check" htmlFor={`${base}-ver-anuladas`}>
            <input
              id={`${base}-ver-anuladas`}
              type="checkbox"
              checked={verAnuladas}
              onChange={(e) => setVerAnuladas(e.target.checked)}
            />
            Enseñar también las que ya están anuladas
          </label>

          {horasVisibles.length === 0 ? (
            <p className="pc-vacio">No hay clases abiertas. Ábrelas desde «Horario de la semana».</p>
          ) : (
            agruparPorDia(horasVisibles).map((g) => {
              const ocupadas = g.filas.reduce((n, h) => n + (h.anulada ? 0 : h.tomadas), 0);
              return (
                <details className="pc-dia-plegable" key={g.clave} open={g.clave === hoy}>
                  <summary>
                    <Icon name="chevron" />
                    <span className="pc-dia-nombre">{etiquetaDia(g.clave, g.iso, hoy, manana)}</span>
                    <span className="pc-dia-resumen">
                      {g.filas.length} {g.filas.length === 1 ? "hora" : "horas"} ·{" "}
                      {ocupadas === 0 ? "ninguna reservada" : `${ocupadas} reservada${ocupadas === 1 ? "" : "s"}`}
                    </span>
                  </summary>
                  <ul className="pc-lista">
                    {g.filas.map((h) => {
                      const llena = h.tomadas >= h.plazas;
                      return (
                        <li className={`pc-fila${h.anulada ? " apagada" : ""}`} key={h.id}>
                          <span className="pc-hora">
                            {soloHora(h.inicio)}
                            <small>a {soloHora(h.fin)}</small>
                          </span>
                          <span className="pc-fila-texto">
                            <strong>{nombreAmbito(h.ambito)}</strong>
                            <span className={llena && !h.anulada ? "pc-lleno" : ""}>
                              {h.anulada
                                ? "Anulada"
                                : `${h.tomadas} de ${h.plazas} ${h.plazas === 1 ? "plaza" : "plazas"} reservadas${llena ? " · completa" : ""}`}
                            </span>
                          </span>
                          {!h.anulada && (
                            <form action={accAnular} className="pc-anular">
                              <input type="hidden" name="sesionId" value={h.id} />
                              <input
                                name="motivo"
                                type="text"
                                maxLength={200}
                                placeholder="Motivo (si quieres)"
                                aria-label={`Motivo para anular ${fechaHora(h.inicio)}`}
                              />
                              <button
                                className="pc-btn-secundario"
                                type="submit"
                                disabled={anulando}
                                onClick={confirmar(
                                  h.tomadas > 0
                                    ? `Esta hora la tiene reservada ${h.tomadas === 1 ? "1 alumno" : `${h.tomadas} alumnos`}. ¿Anularla igualmente?`
                                    : `¿Anular la clase de las ${soloHora(h.inicio)}?`,
                                )}
                              >
                                Anular
                              </button>
                            </form>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </details>
              );
            })
          )}
        </Pantalla>
      )}

      {/* ── ALUMNOS DADOS DE ALTA ─────────────────────────────────────────── */}
      {vista === "cuentas" && (
        <Pantalla
          titulo="Alumnos dados de alta"
          explicacion="Una cuenta puede tener varios alumnos: los hermanos van juntos en la del padre o la madre."
        >
          {cuentas.length === 0 ? (
            <p className="pc-vacio">Todavía no hay ninguna cuenta.</p>
          ) : (
            <ul className="pc-lista">
              {cuentas.map((c) => (
                <li className="pc-fila" key={c.id}>
                  <span className="pc-fila-texto">
                    <strong>
                      {c.nombre}
                      {c.esDelCentro && <span className="pc-marca en-linea">Personal del centro</span>}
                    </strong>
                    <span>{c.email}</span>
                    <span>
                      {c.alumnos ? `Alumnos: ${c.alumnos}` : c.esDelCentro ? "" : "Sin ningún alumno todavía"}
                      {!c.correoVerificado && " · aún no ha entrado"}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Pantalla>
      )}

      {/* ── AJUSTES ───────────────────────────────────────────────────────── */}
      {vista === "ajustes" && (
        <Pantalla titulo="Avisos y accesos" explicacion="Cosas que se configuran una vez y luego no hace falta tocar.">
          {ajustes}
        </Pantalla>
      )}

      {/* ── AYUDA ─────────────────────────────────────────────────────────── */}
      {vista === "ayuda" && (
        <Pantalla titulo="¿Cómo funciona esto?">
          <GuiaCentro
            hayHorario={pasosHechos[0]}
            hayHorasAbiertas={pasosHechos[1]}
            hayAlumnos={pasosHechos[2]}
            hayReservas={pasosHechos[3]}
            fichasPendientes={pendientes.length}
          />
          <AyudaPanel />
        </Pantalla>
      )}
    </div>
  );
}

/**
 * El horario como una cuadrícula de días por horas, que es como lo tiene la
 * gente en la cabeza. Antes eran 60 tarjetas seguidas, una por hora, cada una
 * con su botón "Quitar".
 */
function CuadriculaHorario({
  franjas,
  accBorrar,
  borrando,
}: {
  franjas: Franja[];
  accBorrar: (formData: FormData) => void;
  borrando: boolean;
}) {
  const horasInicio = [...new Set(franjas.map((f) => f.horaInicio))].sort();
  const diasConClase = new Set(franjas.map((f) => f.diaSemana));
  // Los días sin ninguna clase se esconden: siete columnas cuando se trabaja
  // de lunes a viernes solo añaden dos columnas vacías que hay que mirar.
  const dias = DIAS.filter((d) => diasConClase.has(d.valor));
  // Si todo el horario es de un solo tipo, repetir "Autoescuela" en cada
  // casilla es ruido: lo que cambia de una a otra es cuántos coches hay.
  const variosTipos = new Set(franjas.map((f) => f.ambito)).size > 1;
  const cuantos = (f: Franja) =>
    f.ambito === "autoescuela"
      ? f.plazas === 1 ? "1 coche" : `${f.plazas} coches`
      : f.plazas === 1 ? "1 a la vez" : `${f.plazas} a la vez`;

  return (
    <div className="pc-cuadricula-marco">
      <table className="pc-cuadricula">
        <thead>
          <tr>
            <th scope="col">
              <span className="sr-only">Hora</span>
            </th>
            {dias.map((d) => (
              <th scope="col" key={d.valor}>
                <span className="pc-dia-largo">{d.nombre}</span>
                <span className="pc-dia-corto" aria-hidden="true">
                  {d.corto}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {horasInicio.map((hi) => (
            <tr key={hi}>
              <th scope="row">{hi}</th>
              {dias.map((d) => {
                const aqui = franjas.filter((f) => f.diaSemana === d.valor && f.horaInicio === hi);
                return (
                  <td key={d.valor}>
                    {aqui.map((f) => (
                      <div className="pc-celda" key={f.id}>
                        <span className={`pc-celda-texto${f.plazas > 1 ? " varios" : ""}`}>
                          {cuantos(f)}
                          {variosTipos && <small>{nombreAmbito(f.ambito)}</small>}
                        </span>
                        <form action={accBorrar}>
                          <input type="hidden" name="franjaId" value={f.id} />
                          <button
                            className="pc-quitar"
                            type="submit"
                            disabled={borrando}
                            aria-label={`Quitar ${d.nombre} ${f.horaInicio}–${f.horaFin}, ${nombreAmbito(f.ambito)}`}
                            title="Quitar del horario"
                            onClick={confirmar(`¿Quitar ${d.nombre} a las ${f.horaInicio} del horario?`)}
                          >
                            <Icon name="close" />
                          </button>
                        </form>
                      </div>
                    ))}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
