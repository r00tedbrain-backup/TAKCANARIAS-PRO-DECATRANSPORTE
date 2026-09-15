import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContactBand } from "@/components/contact-band";
import { Icon } from "@/components/icon";
import { empresa, futureModules, services, site } from "@/content/site";
import { avisoLegal, privacidad } from "@/content/legal";
import { TachographAccess } from "@/components/tachograph-access";
import { SupportProgram } from "@/components/support-program";

const pages = [
  { slug: "descarga-tarjeta", title: "Descarga de tarjeta", description: "Accede directamente a Tachomat de VDO para descargar los datos de tu tarjeta de conductor e imprimir el recibo. Takcanarias te ayuda con tus tacógrafos." },
  { slug: "plataforma-gps", title: "Plataforma GPS", description: "Acceso directo a la plataforma GPS de Takcanarias para clientes que ya disponen de acceso al servicio." },
  { slug: "politica-privacidad", title: "Política de privacidad", description: "Cómo trata Takcanarias S.L. los datos personales de quienes contactan con el centro y de su alumnado, incluido el alumnado menor de edad." },
  { slug: "aviso-legal", title: "Aviso legal", description: "Datos identificativos de Takcanarias S.L., titular de esta web: CIF, domicilio, homologación CAP 2725 y registro de autoescuela GC0308." },
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
                <h2 className="sr-only" id="legal-heading">
                  {slug === "politica-privacidad" ? "Política de privacidad" : "Aviso legal"}
                </h2>
                {(slug === "politica-privacidad" ? privacidad : avisoLegal).map((bloque) => (
                  <div className="info-block" key={bloque.titulo}>
                    <h3>{bloque.titulo}</h3>
                    {bloque.parrafos.map((texto) => <p key={texto}>{texto}</p>)}
                  </div>
                ))}
                <p>
                  <a href={`mailto:${empresa.correoTitular}`} className="text-link">Escribir a {empresa.correoTitular}<Icon name="arrow" /></a>
                </p>
                <p>
                  <Link href={slug === "politica-privacidad" ? "/aviso-legal" : "/politica-privacidad"} className="text-link">
                    {slug === "politica-privacidad" ? "Ver el aviso legal" : "Ver la política de privacidad"}<Icon name="arrow" />
                  </Link>
                </p>
              </section>
            )}
          </>
        )}
      </div>
      <ContactBand />
    </>
  );
}
