import type { Metadata } from "next";
import Link from "next/link";
import { ContactBand } from "@/components/contact-band";
import { Icon } from "@/components/icon";
import { FormularioNuevaContrasena } from "@/components/formulario-nueva-contrasena";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Poner una contraseña nueva",
  description: "Elige una contraseña nueva para tu área del alumno de Takcanarias.",
  alternates: { canonical: `${site.url}/area-cliente/nueva-contrasena` },
  robots: { index: false, follow: false },
};

/**
 * A esta página se llega desde el enlace del correo, que trae el token en la
 * URL. Better Auth lo comprueba antes de mandarnos aquí: si vale, redirige
 * con `?token=…`; si está caducado o ya se usó, con `?error=INVALID_TOKEN`.
 *
 * Nunca hay nada que generar por adelantado, porque el contenido depende
 * entero de esos parámetros.
 */
type Busqueda = { [clave: string]: string | string[] | undefined };

/**
 * Los parámetros repetidos (`?token=a&token=b`) llegan como lista. No es algo
 * que produzca nuestro enlace, así que se descarta en vez de adivinar cuál.
 */
function textoSimple(valor: string | string[] | undefined): string | null {
  return typeof valor === "string" && valor.trim() !== "" ? valor : null;
}

export default async function NuevaContrasenaPage({ searchParams }: { searchParams: Promise<Busqueda> }) {
  const parametros = await searchParams;
  const token = textoSimple(parametros.token);
  const errorEnlace = textoSimple(parametros.error);

  return (
    <>
      <div className="container">
        <nav className="breadcrumb" aria-label="Ruta de navegación">
          <Link href="/">Inicio</Link>
          <span aria-hidden="true"> / </span>
          <Link href="/area-cliente">Área de cliente</Link>
          <span aria-hidden="true"> / </span>
          <Link href="/area-cliente/acceso">Acceso</Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">Contraseña nueva</span>
        </nav>

        {token ? (
          <>
            <header className="future-hero">
              <h1>Elige tu contraseña nueva</h1>
              <p>
                Escríbela dos veces para asegurarnos de que no hay ninguna errata. Cuando la guardes, podrás entrar con
                ella enseguida.
              </p>
            </header>

            <section className="section" aria-labelledby="nueva-heading">
              <div className="section-heading">
                <h2 id="nueva-heading">Tu contraseña</h2>
                <p>Los dos campos son obligatorios. Si algo no cuadra, te lo decimos justo debajo del campo.</p>
              </div>

              <FormularioNuevaContrasena token={token} />
            </section>
          </>
        ) : (
          <>
            <header className="future-hero">
              <h1>Este enlace no sirve</h1>
              <p>
                {errorEnlace
                  ? "El enlace del correo ha caducado o ya se había usado. Los enlaces valen una hora y solo se pueden usar una vez."
                  : "Has llegado aquí sin un enlace válido. A esta página se entra desde el correo que te mandamos, no directamente."}
              </p>
              <p>No pasa nada: pide otro enlace y te llega uno nuevo al momento.</p>
              <Link href="/area-cliente/recuperar" className="button button-blue">
                Pedir otro enlace
                <Icon name="arrow" />
              </Link>
            </header>

            <section className="section" aria-labelledby="ayuda-heading">
              <div className="section-heading">
                <h2 id="ayuda-heading">Si sigue sin funcionar</h2>
                <p>Llámanos o escríbenos y lo resolvemos contigo desde el centro.</p>
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
                  <p>Cuéntanos qué te pasa y te respondemos desde administración.</p>
                  <p>
                    <a className="text-link" href={`mailto:${site.email}`}>
                      {site.email}
                      <Icon name="arrow" />
                    </a>
                  </p>
                </div>
              </div>

              <div className="form-links">
                <p>
                  <Link className="text-link" href="/area-cliente/acceso">
                    Volver al acceso
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
