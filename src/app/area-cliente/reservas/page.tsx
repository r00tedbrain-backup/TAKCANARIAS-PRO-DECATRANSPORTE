import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, asc, count, eq, gt, isNull } from "drizzle-orm";
import { ContactBand } from "@/components/contact-band";
import { Icon } from "@/components/icon";
import { PanelReservas } from "@/components/panel-reservas";
import { auth } from "@/lib/auth";
import { anulacionEnPlazo, HORAS_MINIMAS_ANTELACION } from "@/lib/politica";
import { db } from "@/db";
import { alumno, reserva, sesionClase } from "@/db/schema";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Reservar hora",
  description: "Reserva de horas para alumnos de Takcanarias.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const AMBITOS: Record<string, string> = {
  cap: "Formación CAP",
  autoescuela: "Autoescuela",
  apoyo: "Clases de apoyo",
  puntos: "Recuperación de puntos",
};

export default async function ReservasPage() {
  const sesion = await auth.api.getSession({ headers: await headers() });
  if (!sesion) redirect("/area-cliente/acceso");

  const userId = sesion.user.id;
  const ahora = new Date();

  // Solo se ofrecen horas a los alumnos ya validados por el centro: mientras la
  // ficha esté pendiente, no hay nada que reservar.
  const alumnos = await db
    .select({ id: alumno.id, nombre: alumno.nombre, apellidos: alumno.apellidos, validadoEn: alumno.validadoEn })
    .from(alumno)
    .where(eq(alumno.titularId, userId))
    .orderBy(asc(alumno.createdAt));

  const validados = alumnos.filter((a) => a.validadoEn);

  // Horas futuras no anuladas, con cuántas plazas lleva tomadas cada una. El
  // left join cuenta cero cuando todavía no la ha cogido nadie.
  const huecos = await db
    .select({
      id: sesionClase.id,
      ambito: sesionClase.ambito,
      inicio: sesionClase.inicio,
      fin: sesionClase.fin,
      plazas: sesionClase.plazas,
      profesor: sesionClase.profesor,
      lugar: sesionClase.lugar,
      tomadas: count(reserva.id),
    })
    .from(sesionClase)
    .leftJoin(reserva, and(eq(reserva.sesionId, sesionClase.id), eq(reserva.estado, "activa")))
    .where(and(gt(sesionClase.inicio, ahora), isNull(sesionClase.canceladaEn)))
    .groupBy(sesionClase.id)
    .orderBy(asc(sesionClase.inicio))
    .limit(80);

  // Las reservas de esta cuenta. El filtro por titular es lo que impide ver las
  // de otras familias.
  const misReservas = await db
    .select({
      id: reserva.id,
      alumnoNombre: alumno.nombre,
      ambito: sesionClase.ambito,
      inicio: sesionClase.inicio,
      fin: sesionClase.fin,
      lugar: sesionClase.lugar,
      canceladaEn: sesionClase.canceladaEn,
      motivoCancelacion: sesionClase.motivoCancelacion,
    })
    .from(reserva)
    .innerJoin(alumno, eq(reserva.alumnoId, alumno.id))
    .innerJoin(sesionClase, eq(reserva.sesionId, sesionClase.id))
    .where(and(eq(alumno.titularId, userId), eq(reserva.estado, "activa"), gt(sesionClase.inicio, ahora)))
    .orderBy(asc(sesionClase.inicio));

  const libres = huecos
    .filter((h) => h.tomadas < h.plazas)
    .map((h) => ({
      id: h.id,
      ambito: AMBITOS[h.ambito] ?? h.ambito,
      inicio: h.inicio.toISOString(),
      fin: h.fin.toISOString(),
      profesor: h.profesor,
      lugar: h.lugar,
      quedan: h.plazas - h.tomadas,
    }));

  return (
    <>
      <div className="container">
        <nav className="breadcrumb" aria-label="Ruta de navegación">
          <Link href="/">Inicio</Link>
          <span aria-hidden="true"> / </span>
          <Link href="/area-cliente/panel">Tu área</Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">Reservar hora</span>
        </nav>

        <header className="future-hero">
          <h1>Reservar hora</h1>
          <p>
            Elige una hora libre y queda reservada al momento. Si luego no puedes, anúlala desde aquí y la hora vuelve
            a quedar disponible para otro alumno.
          </p>
          <p>
            Las anulaciones son gratis avisando con {HORAS_MINIMAS_ANTELACION} horas y en horario de oficina, de lunes
            a viernes de 8:00 a 20:00. Fuera de ese plazo la práctica se puede cobrar: un sábado no vale para anular la
            del lunes, porque los horarios ya están cerrados.
          </p>
        </header>

        {validados.length === 0 ? (
          <section className="section">
            <div className="info-block">
              <h3>Todavía no puedes reservar</h3>
              <p>
                {alumnos.length === 0
                  ? "Tu cuenta aún no tiene ninguna ficha de alumno."
                  : "El centro tiene que validar la ficha antes de que puedas coger horas. Te avisaremos en cuanto esté."}
              </p>
              <p>
                <a className="text-link" href={site.phoneHref}>
                  <Icon name="phone" />
                  {site.phone}
                </a>
              </p>
            </div>
          </section>
        ) : (
          <PanelReservas
            alumnos={validados.map((a) => ({
              id: a.id,
              nombre: a.apellidos ? `${a.nombre} ${a.apellidos}` : a.nombre,
            }))}
            huecos={libres}
            reservas={misReservas.map((r) => ({
              id: r.id,
              alumnoNombre: r.alumnoNombre,
              ambito: AMBITOS[r.ambito] ?? r.ambito,
              inicio: r.inicio.toISOString(),
              fin: r.fin.toISOString(),
              lugar: r.lugar,
              anuladaPorElCentro: Boolean(r.canceladaEn),
              motivoCancelacion: r.motivoCancelacion,
              // Calculado aqui, en el servidor, para que el aviso se vea ANTES
              // de pulsar. La accion lo recalcula al ejecutar: esto solo avisa.
              anularSeriaFueraDePlazo: !anulacionEnPlazo(r.inicio),
            }))}
          />
        )}

        <section className="section" aria-labelledby="ayuda-heading">
          <div className="section-heading">
            <h2 id="ayuda-heading">¿No encuentras hueco?</h2>
            <p>Si no ves ninguna hora que te venga bien, llámanos y lo miramos.</p>
          </div>
          <p>
            <a className="text-link" href={site.phoneHref}>
              <Icon name="phone" />
              {site.phone}
            </a>
          </p>
        </section>
      </div>
      <ContactBand />
    </>
  );
}
