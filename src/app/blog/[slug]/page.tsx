import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContactBand } from "@/components/contact-band";
import { Icon } from "@/components/icon";
import { ArticuloCuerpo } from "@/components/articulo-cuerpo";
import { articulos, buscarArticulo } from "@/content/blog";
import { empresa, site } from "@/content/site";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return articulos.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const a = buscarArticulo(slug);
  if (!a) return {};

  return {
    title: a.tituloSeo,
    description: a.descripcion,
    alternates: { canonical: `${site.url}/blog/${a.slug}` },
    openGraph: {
      type: "article",
      title: a.tituloSeo,
      description: a.descripcion,
      url: `${site.url}/blog/${a.slug}`,
      publishedTime: a.publicado,
      modifiedTime: a.actualizado ?? a.publicado,
      tags: a.etiquetas,
    },
  };
}

function fechaLarga(iso: string): string {
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "long", timeZone: "Atlantic/Canary" }).format(
    new Date(`${iso}T12:00:00Z`),
  );
}

export default async function ArticuloPage({ params }: Props) {
  const { slug } = await params;
  const a = buscarArticulo(slug);
  if (!a) notFound();

  // Los títulos del artículo sirven de índice: ahorra bajar buscando.
  const apartados = a.bloques.filter((b) => b.tipo === "titulo");

  /**
   * Datos estructurados para los buscadores. Se declara como Article con sus
   * fechas y su autor, que es lo que permite a Google mostrarlo como artículo
   * y no como una página suelta.
   */
  const datosEstructurados = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.tituloSeo,
    description: a.descripcion,
    datePublished: a.publicado,
    dateModified: a.actualizado ?? a.publicado,
    inLanguage: "es-ES",
    author: { "@type": "Organization", name: empresa.razonSocial, url: site.url },
    publisher: {
      "@type": "Organization",
      name: empresa.razonSocial,
      url: site.url,
      logo: { "@type": "ImageObject", url: `${site.url}/brand/takcanarias.svg` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${site.url}/blog/${a.slug}` },
    keywords: a.etiquetas.join(", "),
  };

  return (
    <>
      <script
        type="application/ld+json"
        // El contenido lo generamos nosotros y no viene de fuera.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datosEstructurados) }}
      />

      <div className="container">
        <nav className="breadcrumb" aria-label="Ruta de navegación">
          <Link href="/">Inicio</Link>
          <span aria-hidden="true"> / </span>
          <Link href="/blog">Blog</Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">{a.titulo}</span>
        </nav>

        <article className="articulo">
          <header className="articulo-cabecera">
            <p className="blog-meta">
              <time dateTime={a.publicado}>{fechaLarga(a.publicado)}</time>
              <span aria-hidden="true"> · </span>
              {a.minutosLectura} min de lectura
            </p>
            <h1>{a.titulo}</h1>
            <p className="articulo-entradilla">{a.entradilla}</p>
            <ul className="blog-etiquetas">
              {a.etiquetas.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </header>

          {apartados.length > 2 && (
            <nav className="articulo-indice" aria-labelledby="indice-heading">
              <p className="articulo-indice-titulo" id="indice-heading">
                En este artículo
              </p>
              <ol>
                {apartados.map((b) => (
                  <li key={b.id}>
                    <a href={`#${b.id}`}>{b.texto}</a>
                  </li>
                ))}
              </ol>
            </nav>
          )}

          <ArticuloCuerpo bloques={a.bloques} />

          {/*
            Las fuentes van al final y con enlace. Un artículo sobre plazos y
            obligaciones sin forma de comprobarlo vale poco: cualquiera debe
            poder ir al BOE y leer lo mismo que hemos leído nosotros.
          */}
          <section className="articulo-fuentes" aria-labelledby="fuentes-heading">
            <h2 id="fuentes-heading">De dónde sale esto</h2>
            <p>Todo lo anterior sale de estas fuentes oficiales. Puedes comprobarlo tú mismo.</p>
            <ul>
              {a.fuentes.map((f) => (
                <li key={f.url}>
                  <a href={f.url} target="_blank" rel="noopener noreferrer">
                    {f.titulo}
                    <Icon name="external" />
                  </a>
                  <span>{f.referencia}</span>
                </li>
              ))}
            </ul>
            <p className="articulo-aviso">
              Este artículo es información general, no un informe jurídico. La normativa puede cambiar después de la
              fecha de publicación. Si tu caso tiene particularidades, consúltanos y lo miramos contigo.
            </p>
          </section>
        </article>

        <p className="articulo-volver">
          <Link className="text-link" href="/blog">
            Ver todos los artículos
            <Icon name="arrow" />
          </Link>
        </p>
      </div>
      <ContactBand />
    </>
  );
}
