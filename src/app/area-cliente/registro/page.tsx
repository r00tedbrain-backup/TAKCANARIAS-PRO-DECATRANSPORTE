import type { Metadata } from "next";
import Link from "next/link";
import { ContactBand } from "@/components/contact-band";
import { Icon } from "@/components/icon";
import { FormularioRegistro } from "@/components/formulario-registro";
import { REGISTRO_ABIERTO } from "@/lib/auth";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Alta en el área del alumno",
  description: "Información sobre el alta de alumnos en el área privada de Takcanarias.",
  alternates: { canonical: `${site.url}/area-cliente/registro` },
  robots: { index: false, follow: false },
};

// Depende de una variable de entorno y, si el alta está abierta, de la base
// de datos. No hay nada que generar por adelantado.
export const dynamic = "force-dynamic";

export default function RegistroPage() {
  return (
    <>
      <div className="container">
        <nav className="breadcrumb" aria-label="Ruta de navegación">
          <Link href="/">Inicio</Link>
          <span aria-hidden="true"> / </span>
          <Link href="/area-cliente">Área de cliente</Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">Alta</span>
        </nav>

        {REGISTRO_ABIERTO ? (
          <>
            <header className="future-hero">
              <h1>Crea tu cuenta</h1>
              <p>
                Rellena tus datos y crea la cuenta. Después el centro comprueba la información antes de activarla: no
                podrás entrar hasta que te avisemos.
              </p>
            </header>

            <section className="section" aria-labelledby="registro-heading">
              <div className="section-heading">
                <h2 id="registro-heading">Tus datos</h2>
                <p>
                  Solo pedimos lo necesario para identificarte y poder avisarte. Si eres menor de edad, te pediremos
                  también a quién dirigirnos.
                </p>
              </div>

              <FormularioRegistro />

              <div className="form-links">
                <p>
                  <Link className="text-link" href="/area-cliente/acceso">
                    ¿Ya tienes cuenta? Entra aquí
                    <Icon name="arrow" />
                  </Link>
                </p>
              </div>
            </section>
          </>
        ) : (
          <>
            <header className="future-hero">
              <h1>El alta todavía no está abierta</h1>
              <p className="future-status">En preparación · No disponible todavía</p>
              <p>
                Aún no se pueden crear cuentas desde la web. No es un fallo ni una lista de espera: sencillamente el
                alta no está activa y no queremos guardar datos de alumnos antes de tiempo.
              </p>
              <p>
                Buena parte de nuestro alumnado es menor de edad, así que hasta que los textos legales y el
                procedimiento de autorización estén cerrados, las altas las hacemos en el centro, hablando contigo.
              </p>
              <a href={site.phoneHref} className="button button-blue">
                <Icon name="phone" />
                Llamar al {site.phone}
              </a>
            </header>

            <section className="section" aria-labelledby="alternativa-heading">
              <div className="section-heading">
                <h2 id="alternativa-heading">Cómo darte de alta mientras tanto</h2>
                <p>Con una llamada o un correo lo resolvemos. Te atiende una persona del centro.</p>
              </div>

              <div className="service-detail-grid">
                <div className="info-block">
                  <h3>Por teléfono</h3>
                  <p>Horario de atención: {site.hours} (hora de Canarias).</p>
                  <p>
                    <a className="text-link" href={site.phoneHref}>
                      <Icon name="phone" />
                      {site.phone}
                    </a>
                  </p>
                </div>
                <div className="info-block">
                  <h3>Por correo</h3>
                  <p>Cuéntanos qué necesitas y te respondemos desde administración.</p>
                  <p>
                    <a className="text-link" href={`mailto:${site.email}`}>
                      {site.email}
                      <Icon name="arrow" />
                    </a>
                  </p>
                </div>
                <div className="info-block">
                  <h3>En el centro</h3>
                  <address>
                    {site.address}
                    <br />
                    {site.locality}
                    <br />
                    {site.postalCode}
                  </address>
                </div>
              </div>

              <div className="form-links">
                <p>
                  <Link className="text-link" href="/area-cliente/acceso">
                    Si el centro ya te ha creado una cuenta, entra aquí
                    <Icon name="arrow" />
                  </Link>
                </p>
                <p>
                  <Link className="text-link" href="/contacto">
                    Ver todos los contactos del centro
                    <Icon name="arrow" />
                  </Link>
                </p>
              </div>
            </section>
          </>
        )}
      </div>
      <ContactBand />
    </>
  );
}
