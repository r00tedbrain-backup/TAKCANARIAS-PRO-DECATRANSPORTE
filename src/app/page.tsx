import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { services, site } from "@/content/site";
import { Icon } from "@/components/icon";
import { ContactBand } from "@/components/contact-band";
import { TachographAccess } from "@/components/tachograph-access";
import { LocationMap } from "@/components/location-map";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Home() {
  return (
    <>
      <section className="home-hero container">
        <div className="hero-copy">
          <h1>Tu camino.<br />Nuestra <span>experiencia.</span></h1>
          <p className="hero-description">Asesoría de transportes, autoescuela y formación.<br className="desktop-break" /> A tu lado en cada paso, en Gran Canaria.</p>
          <div className="hero-actions"><Link href="/contacto" className="button button-blue">Cuéntanos qué necesitas<Icon name="arrow" /></Link><a className="text-link" href="#servicios">Conoce nuestros servicios<Icon name="arrow" /></a></div>
          <div className="hero-location"><Icon name="pin" /><span>Lomo los Frailes<br /><strong>Las Palmas de Gran Canaria</strong></span></div>
        </div>
        <figure className="hero-photo">
          <Image src="/images/carretera.webp" alt="Estelas de luz de vehículos recorriendo una carretera al anochecer" fill sizes="(max-width: 800px) 100vw, 50vw" preload />
          <div className="photo-word" aria-hidden="true">AVANZA.</div>
          <figcaption><span>En el aula. En la carretera.</span><strong>Siempre contigo.</strong></figcaption>
        </figure>
      </section>

      <section className="credentials" aria-label="Centro y accesos de servicio"><div className="container credentials-inner">
        <Link href="/formacion-cap" className="cap-credential"><Icon name="shield" /><span>Centro homologado CAP<strong>Nº 2725</strong></span></Link>
        <p>Formación para mercancías y viajeros.<br /><strong>Horario continuo y fin de semana.</strong></p>
        <div className="credential-access"><a href={site.cardDownload} target="_blank" rel="noopener noreferrer"><Icon name="download" />Descarga de tarjeta · VDO<Icon name="external" /></a><Link href="/plataforma-gps"><Icon name="pin" />Plataforma GPS<Icon name="external" /></Link></div>
      </div></section>

      <section className="section container services-section" id="servicios">
        <div className="services-intro"><h2>Para lo que <br />mueve tu vida.</h2><p>Tu trabajo. Tu permiso de conducir. Tu formación. Distintas metas, un mismo equipo para ayudarte a alcanzarlas.</p><Link href="/contacto" className="text-link">Encuentra tu próximo paso<Icon name="arrow" /></Link></div>
        <div className="service-index">{services.map((service, index) => <Link className="service-row" href={`/${service.slug}`} key={service.slug}>
          <span className="service-icon"><Icon name={(["truck", "book", "car", "graduate"] as const)[index]} /></span><div><h3>{service.shortTitle}</h3><p>{service.summary}</p></div><Icon name="arrow" className="row-arrow" />
        </Link>)}</div>
      </section>

      <section className="container tachograph-section">
        <div className="section-heading"><h2>Gestión de tacógrafos.<br />Tus datos, bajo control.</h2><div><p>Análisis, control, descarga, informes y custodia. El servicio de asesoría que acompaña a tu empresa de transporte.</p><Link href="/asesoria-transportes" className="text-link">Ver gestión de tacógrafos<Icon name="arrow" /></Link></div></div>
        <TachographAccess />
      </section>

      <section className="auto-section"><div className="container auto-grid">
        <figure className="auto-photo"><Image src="/images/autoescuela.webp" alt="Vehículos Toyota Yaris de Autoescuela Takcanarias" fill sizes="(max-width: 800px) 100vw, 55vw" /><figcaption>Nuestros vehículos · Autoescuela Takcanarias</figcaption></figure>
        <div className="auto-copy"><h2>Al volante, <br /><span>con confianza.</span></h2><p>El primer día tiene sus nervios. Los siguientes, tu progreso. En Takcanarias te acompañamos desde la teoría hasta tus prácticas, con atención personal y profesores a tu lado.</p><ul className="simple-checks"><li><Icon name="check" />Preparación teórica</li><li><Icon name="check" />Clases prácticas</li><li><Icon name="check" />Información sobre cursos de puntos</li></ul><Link href="/autoescuela-takcanarias" className="button button-blue">Conoce la autoescuela<Icon name="arrow" /></Link></div>
      </div></section>

      <section className="section container learning-section">
        <div className="section-heading"><h2>Aprender te lleva más lejos.</h2><p>Formación profesional y apoyo escolar.<br />Un espacio para avanzar a tu ritmo.</p></div>
        <div className="learning-grid">
          <Link href="/formacion-cap" className="learning-card"><div className="learning-image"><Image src="/images/aula.webp" alt="Aula del centro Takcanarias" fill sizes="(max-width: 800px) 100vw, 50vw" /></div><div className="learning-body"><h3>Tu formación profesional</h3><Icon name="arrow" /><p>CAP para mercancías y viajeros. Consulta fechas, horarios y próximas convocatorias.</p><span>Ver formación CAP</span></div></Link>
          <Link href="/clases-de-apoyo" className="learning-card"><div className="learning-image"><Image src="/images/centro.webp" alt="Pizarra y espacio de enseñanza en Takcanarias" fill sizes="(max-width: 800px) 100vw, 50vw" /></div><div className="learning-body"><h3>Cada alumno cuenta</h3><Icon name="arrow" /><p>De Primaria a Bachillerato. Grupos reducidos, hábitos de estudio y contacto con las familias.</p><span>Ver clases de apoyo</span></div></Link>
        </div>
      </section>

      <section className="digital-section"><div className="container digital-grid">
        <div><h2>El mismo equipo.<br />Nuevas formas de estar cerca.</h2><p>Estamos preparando nuevos servicios dentro de Takcanarias. Para que tengas tu documentación, tu formación y tus gestiones más a mano.</p><span className="future-status">En preparación</span></div>
        <div className="digital-links">
          <Link href="/deca"><Icon name="document" /><div><h3>DeCA</h3><p>Documentación electrónica de transporte para tu empresa.</p></div><Icon name="arrow" /></Link>
          <Link href="/cursos"><Icon name="book" /><div><h3>Aula online</h3><p>Tu formación, materiales y seguimiento de cursos.</p></div><Icon name="arrow" /></Link>
          <Link href="/area-cliente"><Icon name="user" /><div><h3>Área del alumno</h3><p>Reservas, prácticas y asistencia a tus cursos.</p></div><Icon name="arrow" /></Link>
        </div>
      </div></section>

      <section className="section container visit-section"><div><h2>Cerca de ti.<br />Aquí, en Gran Canaria.</h2><p>Ven a conocernos en Lomo los Frailes.<br />O llámanos: a veces, una conversación es el mejor comienzo.</p><a className="text-link" href={site.maps} target="_blank" rel="noopener noreferrer">Cómo llegar al centro<Icon name="external" /></a></div><div className="visit-details"><div><Icon name="pin" /><p><strong>{site.address}</strong><span>{site.locality}</span><span>{site.postalCode}</span></p></div><div><Icon name="phone" /><p><a href={site.phoneHref}>{site.phone}</a><span>{site.hours}</span><span>Cursos CAP: consultar horarios de lunes a domingo</span></p></div></div><LocationMap /></section>
      <ContactBand />
    </>
  );
}
