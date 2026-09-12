import Link from "next/link";
import { ContactBand } from "@/components/contact-band";
import { Icon } from "@/components/icon";

export default function NotFound() {
  return (
    <>
      <div className="container">
        <nav className="breadcrumb" aria-label="Ruta de navegación">
          <Link href="/">Inicio</Link><span aria-hidden="true"> / </span><span aria-current="page">Página no encontrada</span>
        </nav>
        <section className="future-hero">
          <p className="future-status">Error 404</p>
          <h1>Esta página no está en nuestra ruta.</h1>
          <p>Puede que el enlace haya cambiado o que la dirección no sea correcta. Puedes volver al inicio o consultar con nuestro equipo.</p>
          <p><Link href="/" className="button button-blue">Volver al inicio<Icon name="arrow" /></Link></p>
          <p><Link href="/contacto" className="text-link">Contactar con Takcanarias<Icon name="arrow" /></Link></p>
        </section>
      </div>
      <ContactBand />
    </>
  );
}
