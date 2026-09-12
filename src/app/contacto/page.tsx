import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ContactBand } from "@/components/contact-band";
import { Icon } from "@/components/icon";
import { site } from "@/content/site";
import { LocationMap } from "@/components/location-map";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Contacta con administración, asesoría, formación y clases de Takcanarias por teléfono, correo o WhatsApp. Visítanos en Las Palmas de Gran Canaria.",
  alternates: { canonical: `${site.url}/contacto` },
};

const departments = [
  { name: "Administración", description: "Información general y gestiones con el centro.", phone: site.phone, phoneHref: site.phoneHref, email: site.email },
  { name: "Asesoría de transportes", description: "Consultas de transporte, tacógrafos y ayuda con tus accesos. El correo se atiende a través de administración.", phone: "657 898 928", phoneHref: "tel:+34657898928", email: site.email },
  { name: "Formación CAP", description: "Próximas convocatorias, modalidades, horarios, plazas y asistencia. Atención telefónica a través del centro.", phone: site.phone, phoneHref: site.phoneHref, email: "formacion@takcanarias.es" },
  { name: "Clases de apoyo", description: "Grupos, asignaturas, horarios y seguimiento del alumno.", phone: "663 232 358", phoneHref: "tel:+34663232358", email: "clases@takcanarias.es" },
  { name: "Dirección", description: "Atención directa y consultas por WhatsApp. También puedes pedir orientación para contactar con la autoescuela.", phone: "609 365 012", phoneHref: "tel:+34609365012", email: "direccion@takcanarias.es", whatsapp: site.whatsapp },
];

export default function ContactPage() {
  return (
    <>
      <div className="container">
        <nav className="breadcrumb" aria-label="Ruta de navegación">
          <Link href="/">Inicio</Link><span aria-hidden="true"> / </span><span aria-current="page">Contacto</span>
        </nav>
        <header className="detail-hero">
          <div className="detail-copy">
            <h1>Contacto</h1>
            <p>Al otro lado, tu equipo. Cuéntanos qué necesitas y te ayudamos a dar el siguiente paso.</p>
            <a href={site.phoneHref} className="button button-blue"><Icon name="phone" />Llamar al {site.phone}</a>
          </div>
          <div className="detail-media">
            <Image src="/images/centro.webp" alt="Espacio de enseñanza del centro Takcanarias" fill sizes="(max-width: 800px) 100vw, 50vw" loading="eager" style={{ objectFit: "cover" }} />
          </div>
        </header>
        <section className="section" aria-labelledby="departments-heading">
          <div className="section-heading">
            <h2 id="departments-heading">Habla con quien necesitas</h2>
            <p>Elige tu departamento. Los enlaces de correo abren tu aplicación de email; no se envía ningún mensaje desde esta página.</p>
          </div>
          <div className="service-detail-grid">
            {departments.map((department) => (
              <div className="info-block" key={department.name}>
                <h3>{department.name}</h3>
                <p>{department.description}</p>
                <p><a className="text-link" href={department.phoneHref}><Icon name="phone" />{department.phone}</a></p>
                <p><a className="text-link" href={`mailto:${department.email}`}>{department.email}<Icon name="arrow" /></a></p>
                {department.whatsapp && <p><a className="text-link" href={department.whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp de dirección<Icon name="external" /></a></p>}
              </div>
            ))}
          </div>
        </section>
        <section className="section" aria-labelledby="visit-heading">
          <div className="section-heading">
            <h2 id="visit-heading">Nos vemos en el centro</h2>
            <p>Estamos en Lomo los Frailes, Las Palmas de Gran Canaria.</p>
          </div>
          <div className="service-detail-grid">
            <div className="info-block">
              <h3><Icon name="pin" />Cómo llegar</h3>
              <address>{site.address}<br />{site.locality}<br />{site.postalCode}</address>
              <p><a className="button button-outline" href={site.maps} target="_blank" rel="noopener noreferrer">Ver ubicación en Google Maps<Icon name="external" /></a></p>
              <p>El mapa está justo debajo. Abre Google Maps si prefieres consultar las indicaciones para llegar.</p>
            </div>
            <div className="info-block">
              <h3>Horario de atención</h3>
              <p>{site.hours} (hora de Canarias).</p>
              <p>Para cursos CAP, confirma con formación el horario de tu convocatoria, incluidas las sesiones de fin de semana.</p>
              <p>Las reservas de clases y prácticas se acuerdan con el equipo. La futura agenda online aún no está disponible.</p>
            </div>
          </div>
          <LocationMap />
        </section>
      </div>
      <ContactBand />
    </>
  );
}
