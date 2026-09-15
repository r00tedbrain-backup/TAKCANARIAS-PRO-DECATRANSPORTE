import type { Metadata } from "next";
import Link from "next/link";
import { ContactBand } from "@/components/contact-band";
import { Icon } from "@/components/icon";
import { FormularioAcceso } from "@/components/formulario-acceso";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Acceso al área del alumno",
  description: "Entra en tu área del alumno de Takcanarias con tu correo y contraseña.",
  alternates: { canonical: `${site.url}/area-cliente/acceso` },
  robots: { index: false, follow: false },
};

export default function AccesoPage() {
  return (
    <>
      <div className="container">
        <nav className="breadcrumb" aria-label="Ruta de navegación">
          <Link href="/">Inicio</Link>
          <span aria-hidden="true"> / </span>
          <Link href="/area-cliente">Área de cliente</Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">Acceso</span>
        </nav>

        <header className="future-hero">
          <h1>Entra en tu área</h1>
          <p>
            Si el centro ya te ha creado una cuenta, accede con tu correo y tu contraseña. Aquí verás tus datos y las
            matrículas que tengas dadas de alta.
          </p>
        </header>

        <section className="section" aria-labelledby="acceso-heading">
          <div className="section-heading">
            <h2 id="acceso-heading">Tus datos de acceso</h2>
            <p>Los campos marcados son obligatorios. Si algo no cuadra, te lo indicamos justo debajo del campo.</p>
          </div>

          <FormularioAcceso />

          <div className="form-links">
            <p>
              <strong>¿Has olvidado la contraseña?</strong> Todavía no podemos enviarte un correo para restablecerla:
              el envío de correos del área aún no está configurado. Llámanos al{" "}
              <a className="text-link" href={site.phoneHref}>
                <Icon name="phone" />
                {site.phone}
              </a>{" "}
              o escribe a{" "}
              <a className="text-link" href={`mailto:${site.email}`}>
                {site.email}
                <Icon name="arrow" />
              </a>{" "}
              y lo resolvemos contigo.
            </p>
            <p>
              <Link className="text-link" href="/area-cliente/registro">
                ¿Aún no tienes cuenta?
                <Icon name="arrow" />
              </Link>
            </p>
            <p>
              <Link className="text-link" href="/contacto">
                Hablar con el centro
                <Icon name="arrow" />
              </Link>
            </p>
          </div>
        </section>
      </div>
      <ContactBand />
    </>
  );
}
