import type { Metadata } from "next";
import Image from "@/components/site-image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContactBand } from "@/components/contact-band";
import { Icon } from "@/components/icon";
import { futureModules, services, site } from "@/content/site";
import { TachographAccess } from "@/components/tachograph-access";
import { SupportProgram } from "@/components/support-program";

const pages = [
  { slug: "descarga-tarjeta", title: "Descarga de tarjeta", description: "Accede directamente a Tachomat de VDO para descargar los datos de tu tarjeta de conductor e imprimir el recibo. Takcanarias te ayuda con tus tacógrafos." },
  { slug: "plataforma-gps", title: "Plataforma GPS", description: "Acceso directo a la plataforma GPS de Takcanarias para clientes que ya disponen de acceso al servicio." },
  { slug: "politica-privacidad", title: "Política de privacidad", description: "Borrador interno de la información de privacidad de Takcanarias. Identidad del responsable y tratamientos pendientes de confirmar." },
  { slug: "aviso-legal", title: "Aviso legal", description: "Borrador interno del aviso legal de Takcanarias. Datos del titular y condiciones pendientes de validación antes de publicar." },
  { slug: "blog", title: "Blog", description: "Espacio de publicaciones de Takcanarias. Conservamos el acceso a la descarga de tarjeta mientras se prepara nuevo contenido." },
] as const;

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return [...services, ...futureModules, ...pages].map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = services.find((entry) => entry.slug === slug);
  const page = futureModules.find((entry) => entry.slug === slug)
    ?? pages.find((entry) => entry.slug === slug);

  if (!service && !page) notFound();

  return {
    title: service?.title ?? page?.title,
    description: service?.summary ?? page?.description,
    alternates: { canonical: `${site.url}/${slug}` },
  };
}

function ExternalAccess({ kind }: { kind: "gps" | "card" }) {
  if (kind === "card") return <TachographAccess />;

  return (
    <div className="access-panel">
      <Icon name="pin" />
      <h3>Plataforma GPS</h3>
      <p>Utiliza el acceso que ya te ha facilitado el equipo. La plataforma GPS es un servicio externo, independiente de la futura área privada.</p>
      <a href={site.gps} className="button button-blue" target="_blank" rel="noopener noreferrer">
        Abrir plataforma GPS<Icon name="external" />
      </a>
      <p>Se abre en otra pestaña. Esta web no solicita ni comprueba tus credenciales.</p>
    </div>
  );
}

export default async function DetailPage({ params }: Props) {
  const { slug } = await params;
  const service = services.find((entry) => entry.slug === slug);
  const future = futureModules.find((entry) => entry.slug === slug);
  const page = pages.find((entry) => entry.slug === slug);

  if (!service && !future && !page) notFound();

  const title = service?.title ?? future?.title ?? page?.title;
  const isLegal = slug === "politica-privacidad" || slug === "aviso-legal";

  return (
    <>
      <div className="container">
        <nav className="breadcrumb" aria-label="Ruta de navegación">
          <Link href="/">Inicio</Link><span aria-hidden="true"> / </span><span aria-current="page">{title}</span>
        </nav>

        {service ? (
          <>
            <header className="detail-hero">
              <div className="detail-copy">
                <h1>{service.title}</h1>
                <p>{service.summary}</p>
                <a
                  href={service.contactHref}
                  className="button button-blue"
                  target={service.contactHref.startsWith("https://") ? "_blank" : undefined}
                  rel={service.contactHref.startsWith("https://") ? "noopener noreferrer" : undefined}
                >
                  {service.contactLabel}<Icon name="arrow" />
                </a>
              </div>
              <div className="detail-media">
                <Image src={service.image} alt={service.imageAlt} fill sizes="(max-width: 800px) 100vw, 50vw" loading="eager" style={{ objectFit: "cover" }} />
              </div>
            </header>
            {slug === "asesoria-transportes" && <TachographAccess />}
            {slug === "clases-de-apoyo" ? <SupportProgram /> : <section className="section" aria-labelledby="service-heading">
              <div className="section-heading">
                <h2 id="service-heading">{service.headline}</h2>
                <p>{service.introduction}</p>
              </div>
              <div className="service-detail-grid">
                {service.items.map((item) => (
                  <div className="info-block" key={item.title}>
                    <h3>{item.title}</h3><p>{item.description}</p>
                  </div>
                ))}
              </div>
            </section>}
            <section className="section" aria-labelledby="faq-heading">
              <div className="section-heading">
                <h2 id="faq-heading">Antes de dar el siguiente paso</h2>
                <p>Resolvemos algunas dudas. Para tu caso concreto, habla con nuestro equipo.</p>
              </div>
              <div className="faq-list">
                {service.questions.map(({ question, answer }) => (
                  <details key={question}><summary>{question}</summary><p>{answer}</p></details>
                ))}
              </div>
              {slug === "asesoria-transportes" ? (
                <p><Link className="text-link" href="/descarga-tarjeta">Descarga de tarjeta<Icon name="arrow" /></Link>{" "}<Link className="text-link" href="/plataforma-gps">Plataforma GPS<Icon name="arrow" /></Link></p>
              ) : (
                <p><Link className="text-link" href="/contacto">Consultar con el centro<Icon name="arrow" /></Link></p>
              )}
            </section>
          </>
        ) : future ? (
          <>
            <header className="future-hero">
              <h1>{future.title}</h1>
              <p className="future-status">En preparación · No disponible todavía</p>
              <p>{future.description}</p>
              <p>{future.note}</p>
              <Link href="/contacto" className="button button-blue">Consultar con el equipo<Icon name="arrow" /></Link>
            </header>
            <section className="section" aria-labelledby="future-heading">
              <div className="section-heading">
                <h2 id="future-heading">Lo que estamos preparando</h2>
                <p>{slug === "deca"
                  ? "DeCA se desarrolla en un proyecto separado. Su integración con esta web está pendiente: aquí todavía no se pueden generar, consultar ni descargar documentos DeCA."
                  : slug === "cursos"
                    ? "El aula y la consulta de asistencia están pendientes. Se está definiendo si los cursos online serán grabados, en directo o una combinación; no hay matrícula online abierta."
                    : "La futura área contempla las reservas de clases y prácticas, el seguimiento de las prácticas y la consulta de asistencia a cursos. Por ahora, estas gestiones se realizan directamente con el centro."}</p>
              </div>
              <ul className="feature-list">
                {future.features.map((feature) => <li key={feature}><Icon name="check" /><span>{feature} <small>(previsto)</small></span></li>)}
              </ul>
              <p>La apertura y las condiciones se comunicarán cuando el servicio esté listo. No es necesario crear una cuenta en esta web.</p>
            </section>
            {slug === "area-cliente" && (
              <section className="section" aria-labelledby="access-heading">
                <div className="section-heading">
                  <h2 id="access-heading">Tus accesos habituales</h2>
                  <p>Estos servicios externos siguen separados de la nueva área privada y conservan sus enlaces de acceso.</p>
                </div>
                <div className="service-detail-grid"><ExternalAccess kind="gps" /><ExternalAccess kind="card" /></div>
              </section>
            )}
          </>
        ) : (
          <>
            <header className="future-hero">
               <h1>{page?.title}</h1>
               {isLegal && <p className="future-status">Borrador interno · Pendiente de validación</p>}
               <p>{page?.description}</p>
               {slug === "descarga-tarjeta" && <a href={site.cardDownload} className="button button-blue" target="_blank" rel="noopener noreferrer">Descargar tarjeta en VDO<Icon name="external" /></a>}
            </header>

            {(slug === "descarga-tarjeta" || slug === "plataforma-gps") && (
              <section className="section" aria-labelledby="external-heading">
                <div className="section-heading">
                  <h2 id="external-heading">Accede a tu servicio habitual</h2>
                  <p>No necesitas esperar a la nueva área de cliente para utilizar este acceso externo.</p>
                </div>
                <ExternalAccess kind={slug === "plataforma-gps" ? "gps" : "card"} />
                <p><Link href="/contacto" className="text-link">¿Necesitas ayuda con el acceso?<Icon name="arrow" /></Link></p>
              </section>
            )}

            {slug === "blog" && (
              <section className="section" aria-labelledby="blog-heading">
                <div className="section-heading">
                  <h2 id="blog-heading">Sin nuevas publicaciones por ahora</h2>
                  <p>Este espacio aún no tiene artículos nuevos. Si buscabas las entradas históricas sobre descarga de tarjetas, conservamos el acceso al servicio en su página de descarga.</p>
                </div>
                <Link href="/descarga-tarjeta" className="button button-blue">Ir a descarga de tarjeta<Icon name="arrow" /></Link>
              </section>
            )}

            {isLegal && (
              <section className="section" aria-labelledby="legal-heading">
                <div className="section-heading">
                  <h2 id="legal-heading">Documento de trabajo, no texto legal definitivo</h2>
                  <p>Esta página forma parte de una versión de revisión interna. No acredita cumplimiento legal ni sustituye la información que debe validarse antes de la publicación definitiva.</p>
                </div>
                <div className="service-detail-grid">
                  <div className="info-block">
                    <h3>{slug === "politica-privacidad" ? "Responsable pendiente de identificar" : "Identificación del titular"}</h3>
                    <p>Takcanarias es la marca utilizada en esta web. La razón social o identidad jurídica del titular, el NIF y los datos registrales aplicables no están confirmados. No se han completado con datos supuestos.</p>
                  </div>
                  {slug === "politica-privacidad" ? (
                    <>
                      <div className="info-block">
                        <h3>Tratamientos por confirmar</h3>
                        <p>Antes de publicar deben documentarse las finalidades, bases jurídicas, datos utilizados, plazos de conservación, destinatarios, encargados y posibles transferencias de las consultas, matrículas y servicios de empresa. La descripción real de estos tratamientos sigue pendiente.</p>
                      </div>
                      <div className="info-block">
                        <h3>Canales y servicios externos</h3>
                        <p>Contacto y portada muestran un mapa incrustado de Google Maps. Al cargarlo, el navegador conecta con Google, que recibe datos técnicos de la conexión. También hay enlaces a teléfono, correo y WhatsApp, no un formulario de envío. GPS y descarga de tarjeta se abren fuera de esta web. Antes de publicar deben revisarse las condiciones de los proveedores, la carga del mapa y los mecanismos de consentimiento que correspondan, junto con el alojamiento y cualquier analítica.</p>
                      </div>
                      <div className="info-block">
                        <h3>Derechos y atención de solicitudes</h3>
                        <p>Debe confirmarse el canal para ejercer derechos de protección de datos y el procedimiento de atención. Mientras se revisa, administración puede orientar tu consulta; no se presenta su correo como un contacto de privacidad validado.</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="info-block">
                        <h3>Alcance de esta versión</h3>
                        <p>La web presenta servicios y canales de contacto. DeCA, el aula online y la gestión privada de reservas, prácticas y asistencia están pendientes de integración. No hay contratación, matrícula ni acceso privado operativo en estas páginas.</p>
                      </div>
                      <div className="info-block">
                        <h3>Condiciones pendientes de aprobación</h3>
                        <p>El titular debe validar las condiciones de uso, los derechos sobre textos e imágenes y la información profesional o autorizaciones que corresponda publicar. Fechas, plazas, tarifas y condiciones de los servicios se consultan con el centro.</p>
                      </div>
                      <div className="info-block">
                        <h3>Enlaces a otras plataformas</h3>
                        <p>Los accesos a GPS y descarga de tarjeta remiten a servicios externos. Sus condiciones deben revisarse con el titular y sus proveedores; este borrador no formula garantías sobre su disponibilidad ni sobre la validez de credenciales.</p>
                      </div>
                    </>
                  )}
                </div>
                <p><a href={`mailto:${site.email}`} className="text-link">Consultar con administración<Icon name="arrow" /></a></p>
                <p><Link href={slug === "politica-privacidad" ? "/aviso-legal" : "/politica-privacidad"} className="text-link">{slug === "politica-privacidad" ? "Ver borrador del aviso legal" : "Ver borrador de privacidad"}<Icon name="arrow" /></Link></p>
              </section>
            )}
          </>
        )}
      </div>
      <ContactBand />
    </>
  );
}
