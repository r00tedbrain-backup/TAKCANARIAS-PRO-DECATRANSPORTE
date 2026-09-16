import type { Metadata } from "next";
import Link from "next/link";
import { and, asc, count, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { PanelCentro } from "@/components/panel-centro";
import { exigirCentro } from "@/lib/centro";
import { db } from "@/db";
import { alumno, horarioSemanal, reserva, sesionClase, user } from "@/db/schema";

/**
 * El título es genérico a propósito.
 *
 * Next resuelve los metadatos antes de ejecutar la página, así que quien no
 * tiene permiso recibe un 307 cuyo encabezado todavía lleva el título. Con un
 * nombre neutro, esa respuesta no delata que exista una zona de gestión.
 */
export const metadata: Metadata = {
  title: "Takcanarias",
  description: "Takcanarias.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function CentroPage() {
  // Corta el paso antes de consultar nada. Quien no sea del centro no llega
  // siquiera a que se ejecuten las consultas de abajo.
  const responsable = await exigirCentro();

  const ahora = new Date();

  const franjas = await db
    .select()
    .from(horarioSemanal)
    .orderBy(asc(horarioSemanal.diaSemana), asc(horarioSemanal.horaInicio));

  // Próximas horas con su ocupación, para ver de un vistazo qué está lleno.
  const horas = await db
    .select({
      id: sesionClase.id,
      ambito: sesionClase.ambito,
      inicio: sesionClase.inicio,
      fin: sesionClase.fin,
      plazas: sesionClase.plazas,
      canceladaEn: sesionClase.canceladaEn,
      tomadas: count(reserva.id),
    })
    .from(sesionClase)
    .leftJoin(reserva, and(eq(reserva.sesionId, sesionClase.id), eq(reserva.estado, "activa")))
    .where(gt(sesionClase.inicio, ahora))
    .groupBy(sesionClase.id)
    .orderBy(asc(sesionClase.inicio))
    .limit(60);

  // Quién ha reservado qué, de aquí en adelante.
  const reservas = await db
    .select({
      id: reserva.id,
      alumnoNombre: alumno.nombre,
      alumnoApellidos: alumno.apellidos,
      titularNombre: user.name,
      titularEmail: user.email,
      ambito: sesionClase.ambito,
      inicio: sesionClase.inicio,
      fin: sesionClase.fin,
      pedidaEn: reserva.createdAt,
    })
    .from(reserva)
    .innerJoin(alumno, eq(reserva.alumnoId, alumno.id))
    .innerJoin(user, eq(alumno.titularId, user.id))
    .innerJoin(sesionClase, eq(reserva.sesionId, sesionClase.id))
    .where(and(eq(reserva.estado, "activa"), gt(sesionClase.inicio, ahora)))
    .orderBy(asc(sesionClase.inicio))
    .limit(80);

  // Fichas que esperan revisión. Es lo que bloquea que un alumno pueda reservar.
  const pendientes = await db
    .select({
      id: alumno.id,
      nombre: alumno.nombre,
      apellidos: alumno.apellidos,
      fechaNacimiento: alumno.fechaNacimiento,
      esElTitular: alumno.esElTitular,
      telefono: alumno.telefono,
      consentimientoTutorEn: alumno.consentimientoTutorEn,
      titularNombre: user.name,
      titularEmail: user.email,
      creadaEn: alumno.createdAt,
    })
    .from(alumno)
    .innerJoin(user, eq(alumno.titularId, user.id))
    .where(isNull(alumno.validadoEn))
    .orderBy(desc(alumno.createdAt))
    .limit(50);

  const [totales] = await db
    .select({
      alumnos: count(alumno.id),
      validados: sql<number>`count(*) FILTER (WHERE ${alumno.validadoEn} IS NOT NULL)`,
    })
    .from(alumno);

  return (
    <div className="container">
      <nav className="breadcrumb" aria-label="Ruta de navegación">
        <Link href="/">Inicio</Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">Gestión del centro</span>
      </nav>

      <PanelCentro
        responsable={responsable.nombre}
        totales={{ alumnos: Number(totales?.alumnos ?? 0), validados: Number(totales?.validados ?? 0) }}
        franjas={franjas.map((f) => ({
          id: f.id,
          ambito: f.ambito,
          diaSemana: f.diaSemana,
          horaInicio: f.horaInicio,
          horaFin: f.horaFin,
          plazas: f.plazas,
        }))}
        horas={horas.map((h) => ({
          id: h.id,
          ambito: h.ambito,
          inicio: h.inicio.toISOString(),
          fin: h.fin.toISOString(),
          plazas: h.plazas,
          tomadas: h.tomadas,
          anulada: Boolean(h.canceladaEn),
        }))}
        reservas={reservas.map((r) => ({
          id: r.id,
          alumno: r.alumnoApellidos ? `${r.alumnoNombre} ${r.alumnoApellidos}` : r.alumnoNombre,
          titular: r.titularNombre,
          titularEmail: r.titularEmail,
          ambito: r.ambito,
          inicio: r.inicio.toISOString(),
          fin: r.fin.toISOString(),
        }))}
        pendientes={pendientes.map((p) => ({
          id: p.id,
          nombre: p.apellidos ? `${p.nombre} ${p.apellidos}` : p.nombre,
          fechaNacimiento: p.fechaNacimiento,
          esElTitular: p.esElTitular,
          telefono: p.telefono,
          tieneAutorizacion: Boolean(p.consentimientoTutorEn),
          titular: p.titularNombre,
          titularEmail: p.titularEmail,
        }))}
      />
    </div>
  );
}
