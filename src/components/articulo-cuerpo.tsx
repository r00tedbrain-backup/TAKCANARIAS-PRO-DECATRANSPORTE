import Link from "next/link";
import { Icon } from "./icon";
import type { Bloque } from "@/content/blog";

/**
 * Pinta el cuerpo de un artículo a partir de sus bloques.
 *
 * Se recibe contenido tipado y no HTML: así el texto de un artículo no puede
 * romper la maquetación ni colar etiquetas, y el día que se cambie el diseño
 * se cambia aquí y no en cada artículo.
 *
 * Los títulos llevan identificador para poder enlazarlos desde el índice y
 * desde fuera. Un enlace a un apartado concreto es lo que la gente comparte
 * cuando quiere señalar una cosa en particular.
 */
export function ArticuloCuerpo({ bloques }: { bloques: Bloque[] }) {
  return (
    <div className="articulo-cuerpo">
      {bloques.map((b, i) => {
        switch (b.tipo) {
          case "titulo":
            return (
              <h2 className="articulo-titulo" id={b.id} key={i}>
                {b.texto}
              </h2>
            );

          case "subtitulo":
            return (
              <h3 className="articulo-subtitulo" key={i}>
                {b.texto}
              </h3>
            );

          case "parrafo":
            return <p key={i}>{b.texto}</p>;

          case "lista":
            return (
              <ul className="articulo-lista" key={i}>
                {b.puntos.map((p) => (
                  <li key={p}>
                    <Icon name="check" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            );

          case "lista-numerada":
            return (
              <ol className="articulo-pasos" key={i}>
                {b.puntos.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ol>
            );

          case "destacado":
            return (
              <p className="articulo-destacado" key={i}>
                {b.texto}
              </p>
            );

          case "tabla":
            return (
              <div className="articulo-tabla-marco" key={i}>
                <table className="articulo-tabla">
                  <thead>
                    <tr>
                      {b.cabeceras.map((c) => (
                        <th key={c} scope="col">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.filas.map((fila) => (
                      <tr key={fila.join()}>
                        {fila.map((celda, j) => (
                          <td key={j}>{celda}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );

          /* Cita literal de una norma: se marca como tal para que se distinga
             de nuestra explicación. Confundir una cosa con otra en un texto
             legal es justo lo que no puede pasar. */
          case "cita":
            return (
              <figure className="articulo-cita" key={i}>
                <blockquote>{b.texto}</blockquote>
                <figcaption>{b.fuente}</figcaption>
              </figure>
            );

          case "llamada":
            return (
              <aside className="articulo-llamada" key={i}>
                <p>{b.texto}</p>
                <Link className="button button-blue" href={b.enlace.url}>
                  {b.enlace.texto}
                  <Icon name="arrow" />
                </Link>
              </aside>
            );
        }
      })}
    </div>
  );
}
