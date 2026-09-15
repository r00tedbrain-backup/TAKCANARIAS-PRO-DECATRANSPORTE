import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { ContactBand } from "@/components/contact-band";
import { Icon } from "@/components/icon";
import { BotonCerrarSesion } from "@/components/boton-cerrar-sesion";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { curso, matricula, perfilAlumno } from "@/db/schema";
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

  // Las dos consultas filtran por el id de la sesión. Es la única forma de
  // entrar aquí: no hay ningún parámetro de usuario en la URL ni en el body.
  const [perfil] = await db.select().from(perfilAlumno).where(eq(perfilAlumno.userId, userId)).limit(1);

  const matriculas = await db
    .select({
      id: matricula.id,
      estado: matricula.estado,
      altaEn: matricula.altaEn,
      cursoNombre: curso.nombre,
      cursoAmbito: curso.ambito,
      cursoDescripcion: curso.descripcion,
    })
    .from(matricula)
    .innerJoin(curso, eq(matricula.cursoId, curso.id))
    .where(eq(matricula.userId, userId))
    .orderBy(desc(matricula.altaEn));

  const validado = Boolean(perfil?.validadoEn);
  const esperaTutor = Boolean(perfil?.tutorNombre) && !perfil?.consentimientoTutorEn;

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
            Esta es tu ficha en el centro. Solo se ven tus datos y, si las tienes, tus matrículas. Nada más: el aula
            online, las reservas y el seguimiento de prácticas todavía no están en marcha.
          </p>
          <BotonCerrarSesion />
        </header>

        <section className="section" aria-labelledby="datos-heading">
          <div className="section-heading">
            <h2 id="datos-heading">Tus datos</h2>
            <p>Si algo no es correcto, dínoslo y lo cambiamos desde el centro.</p>
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
            {perfil?.telefono && (
              <div className="info-block">
                <h3>Teléfono</h3>
                <p>{perfil.telefono}</p>
              </div>
            )}
            <div className="info-block">
              <h3>Estado de tu ficha</h3>
              {!perfil ? (
                <p>
                  Tu cuenta existe, pero todavía no tiene ficha de alumno asociada. Avísanos y la completamos nosotros.
                </p>
              ) : validado ? (
                <p>Ficha validada por el centro el {fecha(perfil.validadoEn)}.</p>
              ) : (
                <p>Pendiente de validar. El centro comprueba tus datos antes de activar el acceso completo.</p>
              )}
              {esperaTutor && (
                <p>
                  Además, falta que confirmemos la autorización de tu padre, madre o tutor. Hasta entonces la ficha
                  sigue pendiente.
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="matriculas-heading">
          <div className="section-heading">
            <h2 id="matriculas-heading">Tus matrículas</h2>
            <p>Lo que el centro tiene dado de alta a tu nombre.</p>
          </div>

          {matriculas.length === 0 ? (
            <div className="info-block">
              <h3>No tienes ninguna matrícula registrada</h3>
              <p>
                No aparece ningún curso a tu nombre en el sistema. Si creías tener uno, puede que todavía no lo hayamos
                dado de alta aquí: llámanos y lo comprobamos.
              </p>
              <p>
                <a className="text-link" href={site.phoneHref}>
                  <Icon name="phone" />
                  {site.phone}
                </a>
              </p>
            </div>
          ) : (
            <div className="service-detail-grid">
              {matriculas.map((m) => (
                <div className="info-block" key={m.id}>
                  <h3>{m.cursoNombre}</h3>
                  <p>{AMBITOS[m.cursoAmbito] ?? m.cursoAmbito}</p>
                  {m.cursoDescripcion && <p>{m.cursoDescripcion}</p>}
                  <p>
                    Estado: {m.estado}. Alta: {fecha(m.altaEn)}.
                  </p>
                </div>
              ))}
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
