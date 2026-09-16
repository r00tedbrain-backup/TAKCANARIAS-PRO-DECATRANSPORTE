import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { desc, eq, inArray } from "drizzle-orm";
import { ContactBand } from "@/components/contact-band";
import { Icon } from "@/components/icon";
import { BotonCerrarSesion } from "@/components/boton-cerrar-sesion";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { alumno, curso, matricula } from "@/db/schema";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Tu área del alumno",
  description: "Área privada del alumno de Takcanarias.",
  robots: { index: false, follow: false },
};

// Depende de la cookie de sesión: nunca se puede generar por adelantado.
export const dynamic = "force-dynamic";

const AMBITOS: Record<string, string> = {
  cap: "Formación CAP",
  autoescuela: "Autoescuela",
  apoyo: "Clases de apoyo",
  puntos: "Recuperación de puntos",
};

function fecha(valor: Date | null): string | null {
  if (!valor) return null;
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "long", timeZone: "Atlantic/Canary" }).format(valor);
}

export default async function PanelPage() {
  const sesion = await auth.api.getSession({ headers: await headers() });
  if (!sesion) redirect("/area-cliente/acceso");

  const userId = sesion.user.id;

  // Punto de partida: los alumnos que cuelgan de esta cuenta. Todo lo demás se
  // deriva de aquí, así que basta con que este filtro sea correcto para que
  // nadie vea fichas ajenas. No hay ningún identificador en la URL ni en el
  // body que pueda alterar esta consulta.
  const alumnos = await db.select().from(alumno).where(eq(alumno.titularId, userId)).orderBy(alumno.createdAt);

  // Matrículas de esos alumnos y solo de esos. Con la lista vacía ni se
  // pregunta: `inArray` con un array vacío genera SQL que no queremos.
  const ids = alumnos.map((a) => a.id);
  const matriculas = ids.length
    ? await db
        .select({
          id: matricula.id,
          alumnoId: matricula.alumnoId,
          estado: matricula.estado,
          altaEn: matricula.altaEn,
          cursoNombre: curso.nombre,
          cursoAmbito: curso.ambito,
          cursoDescripcion: curso.descripcion,
        })
        .from(matricula)
        .innerJoin(curso, eq(matricula.cursoId, curso.id))
        .where(inArray(matricula.alumnoId, ids))
        .orderBy(desc(matricula.altaEn))
    : [];

  const matriculasDe = (alumnoId: string) => matriculas.filter((m) => m.alumnoId === alumnoId);

  // Si la única ficha es la del propio titular, hablarle de "tus datos". Si
  // tiene menores a su cargo, el lenguaje cambia por completo.
  const soloElTitular = alumnos.length === 1 && alumnos[0].esElTitular;

  return (
    <>
      <div className="container">
        <nav className="breadcrumb" aria-label="Ruta de navegación">
          <Link href="/">Inicio</Link>
          <span aria-hidden="true"> / </span>
          <Link href="/area-cliente">Área de cliente</Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">Tu área</span>
        </nav>

        <header className="future-hero">
          <h1>Hola, {sesion.user.name}</h1>
          <p>
            {soloElTitular
              ? "Esta es tu ficha en el centro. Solo se ven tus datos y, si las tienes, tus matrículas."
              : "Aquí ves las fichas que tienes a tu cargo y sus matrículas."}{" "}
            Nada más: el aula online, las reservas y el seguimiento de prácticas todavía no están en marcha.
          </p>
          <BotonCerrarSesion />
        </header>

        <section className="section" aria-labelledby="cuenta-heading">
          <div className="section-heading">
            <h2 id="cuenta-heading">Tu cuenta</h2>
            <p>Los datos con los que entras. Si algo no es correcto, dínoslo y lo cambiamos desde el centro.</p>
          </div>

          <div className="service-detail-grid">
            <div className="info-block">
              <h3>Nombre</h3>
              <p>{sesion.user.name}</p>
            </div>
            <div className="info-block">
              <h3>Correo</h3>
              <p>{sesion.user.email}</p>
              <p>{sesion.user.emailVerified ? "Correo verificado." : "Correo pendiente de verificar."}</p>
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="alumnos-heading">
          <div className="section-heading">
            <h2 id="alumnos-heading">{soloElTitular ? "Tus datos como alumno" : "Alumnos a tu cargo"}</h2>
            <p>
              {soloElTitular
                ? "Lo que el centro tiene registrado a tu nombre."
                : "Para dar de alta a otra persona, llámanos: de momento las altas nuevas las hacemos nosotros."}
            </p>
          </div>

          {alumnos.length === 0 ? (
            <div className="info-block">
              <h3>Tu cuenta todavía no tiene ninguna ficha de alumno</h3>
              <p>La cuenta existe, pero no hay nadie dado de alta en ella. Avísanos y lo completamos nosotros.</p>
              <p>
                <a className="text-link" href={site.phoneHref}>
                  <Icon name="phone" />
                  {site.phone}
                </a>
              </p>
            </div>
          ) : (
            <div className="service-detail-grid">
              {alumnos.map((a) => {
                const suyas = matriculasDe(a.id);
                const esperaAutorizacion = !a.esElTitular && !a.consentimientoTutorEn;

                return (
                  <div className="info-block" key={a.id}>
                    <h3>
                      {a.nombre}
                      {a.apellidos ? ` ${a.apellidos}` : ""}
                    </h3>
                    {!a.esElTitular && <p>Alumno a tu cargo.</p>}
                    {a.telefono && <p>Teléfono de contacto: {a.telefono}</p>}

                    {a.validadoEn ? (
                      <p>Ficha validada por el centro el {fecha(a.validadoEn)}.</p>
                    ) : (
                      <p>Pendiente de validar. El centro comprueba los datos antes de activar el acceso completo.</p>
                    )}

                    {esperaAutorizacion && (
                      <p>
                        Falta que registremos tu autorización firmada como tutor. Hasta entonces la ficha sigue
                        pendiente.
                      </p>
                    )}

                    {suyas.length === 0 ? (
                      <p>Sin matrículas registradas.</p>
                    ) : (
                      <ul>
                        {suyas.map((m) => (
                          <li key={m.id}>
                            {m.cursoNombre} — {AMBITOS[m.cursoAmbito] ?? m.cursoAmbito}. Estado: {m.estado}. Alta:{" "}
                            {fecha(m.altaEn)}.
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="section" aria-labelledby="ayuda-heading">
          <div className="section-heading">
            <h2 id="ayuda-heading">¿Necesitas algo más?</h2>
            <p>
              Las reservas de clases, el seguimiento de prácticas y la asistencia a cursos se siguen gestionando
              hablando con el centro. Aquí todavía no se pueden hacer.
            </p>
          </div>
          <p>
            <a className="text-link" href={site.phoneHref}>
              <Icon name="phone" />
              {site.phone}
            </a>
          </p>
          <p>
            <a className="text-link" href={`mailto:${site.email}`}>
              {site.email}
              <Icon name="arrow" />
            </a>
          </p>
          <p>
            <Link className="text-link" href="/contacto">
              Ver todos los contactos del centro
              <Icon name="arrow" />
            </Link>
          </p>
        </section>
      </div>
      <ContactBand />
    </>
  );
}
