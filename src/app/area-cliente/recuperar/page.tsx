import type { Metadata } from "next";
import Link from "next/link";
import { ContactBand } from "@/components/contact-band";
import { Icon } from "@/components/icon";
import { FormularioRecuperar } from "@/components/formulario-recuperar";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Recuperar la contraseña del área del alumno",
  description: "Pide un enlace para poner una contraseña nueva en tu área del alumno de Takcanarias.",
  alternates: { canonical: `${site.url}/area-cliente/recuperar` },
  robots: { index: false, follow: false },
};

export default function RecuperarPage() {
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
          <span aria-current="page">Recuperar la contraseña</span>
        </nav>

        <header className="future-hero">
          <h1>¿Has olvidado la contraseña?</h1>
          <p>
            Escribe el correo con el que entras y te mandamos un enlace para poner una contraseña nueva. No hace falta
            que recuerdes la anterior.
          </p>
        </header>

        <section className="section" aria-labelledby="recuperar-heading">
          <div className="section-heading">
            <h2 id="recuperar-heading">Tu correo</h2>
            <p>
              Por seguridad te damos siempre la misma respuesta, tengas cuenta o no. Así nadie puede usar esta página
              para averiguar quién está dado de alta.
            </p>
          </div>

          <FormularioRecuperar />

          <div className="form-links">
            <p>
              <Link className="text-link" href="/area-cliente/acceso">
                Volver al acceso
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
