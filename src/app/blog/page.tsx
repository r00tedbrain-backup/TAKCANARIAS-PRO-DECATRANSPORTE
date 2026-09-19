import type { Metadata } from "next";
import Link from "next/link";
import { ContactBand } from "@/components/contact-band";
import { Icon } from "@/components/icon";
import { articulosPorFecha } from "@/content/blog";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Normativa de transporte, formación y trámites, explicados en claro por el equipo de Takcanarias. Con las fuentes oficiales enlazadas.",
  alternates: { canonical: `${site.url}/blog` },
};

function fechaLarga(iso: string): string {
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "long", timeZone: "Atlantic/Canary" }).format(
    new Date(`${iso}T12:00:00Z`),
  );
}

export default function BlogPage() {
  return (
    <>
      <div className="container">
        <nav className="breadcrumb" aria-label="Ruta de navegación">
          <Link href="/">Inicio</Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">Blog</span>
        </nav>

        <header className="future-hero">
          <h1>Lo que conviene saber</h1>
          <p>
            Normativa, plazos y trámites explicados en claro. Escribimos sobre lo que nos preguntáis en el mostrador, y
            citamos siempre la fuente oficial para que puedas comprobarlo.
          </p>
        </header>

        <section className="section" aria-labelledby="articulos-heading">
          <h2 className="sr-only" id="articulos-heading">
            Artículos
          </h2>

          {articulosPorFecha.length === 0 ? (
            <div className="info-block">
              <h3>Todavía no hay artículos</h3>
              <p>Estamos preparando los primeros.</p>
            </div>
          ) : (
            <div className="blog-lista">
              {articulosPorFecha.map((a) => (
                <article className="blog-entrada" key={a.slug}>
                  <p className="blog-meta">
                    <time dateTime={a.publicado}>{fechaLarga(a.publicado)}</time>
                    <span aria-hidden="true"> · </span>
                    {a.minutosLectura} min de lectura
                  </p>
                  <h3>
                    <Link href={`/blog/${a.slug}`}>{a.titulo}</Link>
                  </h3>
                  <p className="blog-entradilla">{a.entradilla}</p>
                  <ul className="blog-etiquetas">
                    {a.etiquetas.map((e) => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                  <Link className="text-link" href={`/blog/${a.slug}`}>
                    Leer el artículo
                    <Icon name="arrow" />
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
      <ContactBand />
    </>
  );
}
