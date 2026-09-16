import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ContactBand } from "@/components/contact-band";
import { Icon } from "@/components/icon";
import { auth, REGISTRO_ABIERTO } from "@/lib/auth";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Área del alumno",
  description: "Entra en tu área privada de Takcanarias para consultar tu ficha y reservar horas.",
};

// Mira si hay sesión, así que no se puede generar por adelantado.
export const dynamic = "force-dynamic";

export default async function AreaClientePage() {
  // Quien ya ha entrado no tiene nada que hacer en la portada del área.
  const sesion = await auth.api.getSession({ headers: await headers() });
  if (sesion) redirect("/area-cliente/panel");

  return (
    <>
      <div className="container">
        <nav className="breadcrumb" aria-label="Ruta de navegación">
          <Link href="/">Inicio</Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">Área del alumno</span>
        </nav>

        <header className="future-hero">
          <h1>Tu área del alumno</h1>
          <p>
            Consulta tu ficha, la de tus hijos si los tienes a tu cargo, y reserva tus horas sin tener que llamar.
          </p>
          <p>
            <Link className="button button-blue" href="/area-cliente/acceso">
              Entrar
              <Icon name="arrow" />
            </Link>
          </p>
        </header>

        <section className="section" aria-labelledby="que-puedes-hacer">
          <div className="section-heading">
            <h2 id="que-puedes-hacer">Qué puedes hacer aquí</h2>
          </div>

          <div className="service-detail-grid">
            <div className="info-block">
              <h3>Reservar tus horas</h3>
              <p>
                Ves las horas libres y coges la que te venga bien. Queda reservada en el momento. Si luego no puedes,
                la anulas desde aquí y vuelve a quedar libre para otro alumno.
              </p>
            </div>
            <div className="info-block">
              <h3>Consultar tu ficha</h3>
              <p>Lo que el centro tiene registrado a tu nombre y tus matrículas.</p>
            </div>
            <div className="info-block">
              <h3>Si tienes hijos en el centro</h3>
              <p>
                Con una sola cuenta llevas a todos. Cada uno mantiene su ficha y sus horas por separado, sin mezclarse.
              </p>
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="como-entrar">
          <div className="section-heading">
            <h2 id="como-entrar">¿Todavía no tienes cuenta?</h2>
          </div>
          <div className="info-block">
            {REGISTRO_ABIERTO ? (
              <>
                <p>Puedes crearla tú mismo. El centro la revisa antes de activarla.</p>
                <p>
                  <Link className="button button-blue" href="/area-cliente/registro">
                    Crear cuenta
                    <Icon name="arrow" />
                  </Link>
                </p>
              </>
            ) : (
              <>
                <h3>Las cuentas todavía las damos de alta nosotros</h3>
                <p>
                  Estamos empezando con esto y preferimos ir dando de alta a los alumnos poco a poco. Llámanos o pásate
                  por el centro y te creamos la tuya.
                </p>
                <p>
                  <a className="text-link" href={site.phoneHref}>
                    <Icon name="phone" />
                    {site.phone}
                  </a>
                </p>
              </>
            )}
          </div>
        </section>

        <section className="section" aria-labelledby="otros-accesos">
          <div className="section-heading">
            <h2 id="otros-accesos">Otros accesos</h2>
            <p>Estos son independientes de tu cuenta y funcionan como siempre.</p>
          </div>
          <div className="service-detail-grid">
            <div className="info-block">
              <h3>Descarga de tarjeta</h3>
              <p>Acceso a Tachomat para la descarga de tarjeta de tacógrafo.</p>
              <p>
                <Link className="text-link" href="/descarga-tarjeta">
                  Ir a descarga de tarjeta
                  <Icon name="arrow" />
                </Link>
              </p>
            </div>
            <div className="info-block">
              <h3>Plataforma GPS</h3>
              <p>Acceso a la plataforma de localización de vehículos.</p>
              <p>
                <Link className="text-link" href="/plataforma-gps">
                  Ir a la plataforma GPS
                  <Icon name="arrow" />
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
      <ContactBand />
    </>
  );
}
