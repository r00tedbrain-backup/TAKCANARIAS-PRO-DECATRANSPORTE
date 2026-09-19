"use client";

/**
 * Cuenta atrás hasta que el DeCA sea obligatorio.
 *
 * Se apoya en `useSyncExternalStore` y no en un `useEffect` con `setState`.
 * El reloj es exactamente lo que esa API espera: un dato que vive fuera de
 * React y cambia por su cuenta. Con ella, además, se resuelven de una vez las
 * dos cosas delicadas de un contador:
 *
 * - La hidratación. El servidor devuelve `null` en su instantánea, así que el
 *   HTML no trae ninguna hora que pueda no coincidir con la del navegador.
 * - Los renders en cascada, que es lo que pasa al llamar a `setState` dentro
 *   de un efecto para arrancar.
 *
 * La instantánea es un número de segundos, no un objeto: React compara por
 * identidad y un objeto nuevo en cada consulta provocaría un bucle de renders.
 *
 * Mientras no hay valor —sin JavaScript, antes de montar, o pasada la fecha—
 * se enseña el texto que viene calculado del servidor. Así nadie se queda sin
 * saber cuánto falta.
 */

import { useSyncExternalStore } from "react";

type Restante = { dias: number; horas: number; minutos: number; segundos: number };

/** Avisa a React una vez por segundo. */
function suscribir(alCambiar: () => void): () => void {
  const id = setInterval(alCambiar, 1000);
  return () => clearInterval(id);
}

const ahoraEnSegundos = () => Math.floor(Date.now() / 1000);
const enElServidorNoHayReloj = () => null;

function desglosar(faltanSegundos: number): Restante {
  return {
    dias: Math.floor(faltanSegundos / 86_400),
    horas: Math.floor((faltanSegundos % 86_400) / 3_600),
    minutos: Math.floor((faltanSegundos % 3_600) / 60),
    segundos: faltanSegundos % 60,
  };
}

const dosCifras = (n: number) => String(n).padStart(2, "0");

export function CuentaAtras({ limiteISO, respaldo }: { limiteISO: string; respaldo: string }) {
  const ahora = useSyncExternalStore(suscribir, ahoraEnSegundos, enElServidorNoHayReloj);

  const limite = Math.floor(new Date(limiteISO).getTime() / 1000);
  const faltan = ahora === null ? null : limite - ahora;

  if (faltan === null || faltan <= 0) return <p className="deca-plazo">{respaldo}</p>;

  const restante = desglosar(faltan);
  const bloques: [number, string][] = [
    [restante.dias, restante.dias === 1 ? "día" : "días"],
    [restante.horas, "horas"],
    [restante.minutos, "min"],
    [restante.segundos, "seg"],
  ];

  return (
    <div className="cuenta-atras">
      <p className="cuenta-atras-titulo">Obligatorio el 5 de octubre de 2026</p>

      {/* Los números cambian cada segundo: oírlos repetidos sin parar sería
          insufrible, así que se ocultan y debajo va el equivalente en texto. */}
      <div className="cuenta-atras-bloques" aria-hidden="true">
        {bloques.map(([valor, etiqueta], i) => (
          <div className="cuenta-bloque" key={etiqueta}>
            <span className="cuenta-numero">{i === 0 ? valor : dosCifras(valor)}</span>
            <span className="cuenta-etiqueta">{etiqueta}</span>
          </div>
        ))}
      </div>

      <p className="sr-only">
        Quedan {restante.dias} {restante.dias === 1 ? "día" : "días"} y {restante.horas} horas para que el DeCA sea
        obligatorio.
      </p>
    </div>
  );
}
