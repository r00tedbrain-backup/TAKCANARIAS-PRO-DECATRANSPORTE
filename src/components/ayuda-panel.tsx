/**
 * Ayuda desplegable del panel del centro.
 *
 * Usa `details`/`summary` del propio navegador en lugar de montar desplegables
 * a mano: funcionan sin JavaScript, el teclado y los lectores de pantalla ya
 * saben manejarlos, y el buscador del navegador encuentra texto dentro de un
 * apartado cerrado. Un desplegable hecho por nosotros perdería las tres cosas.
 *
 * Va cerrada por defecto. Quien entra aquí viene a trabajar, no a leer; la
 * ayuda tiene que estar a mano sin estorbar todos los días.
 */

import { ayudaCentro } from "@/content/ayuda-centro";

export function AyudaPanel() {
  return (
    <section className="section" aria-labelledby="ayuda-centro-heading">
      <div className="section-heading">
        <h2 id="ayuda-centro-heading">Cómo funciona esto</h2>
        <p>Abre el apartado que necesites. Está siempre aquí, al final de la página.</p>
      </div>

      <div className="ayuda-lista">
        {ayudaCentro.map((a) => (
          <details className="ayuda-apartado" key={a.titulo}>
            <summary>
              <span className="ayuda-titulo">{a.titulo}</span>
              <span className="ayuda-resumen">{a.resumen}</span>
            </summary>

            {a.pasos && (
              <ol className="ayuda-pasos">
                {a.pasos.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ol>
            )}

            {a.avisos && (
              <ul className="ayuda-avisos">
                {a.avisos.map((v) => (
                  <li key={v}>{v}</li>
                ))}
              </ul>
            )}
          </details>
        ))}
      </div>
    </section>
  );
}
