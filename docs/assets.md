# Assets preparados

## Generacion

Desde la raiz del repositorio:

```sh
python3 scripts/prepare-assets.py
```

El script resuelve las rutas desde su propia ubicacion, por lo que tambien admite
ejecucion desde otro directorio. Requiere Pillow con soporte WebP; no instala
dependencias. Verificado con Pillow 12.2.0 instalado localmente (incluida la API
`get_flattened_data`). Verifica los originales y el directorio `public` antes de generar.
Solo escribe los ocho archivos enumerados abajo, reemplazandolos al repetir la
generacion. No borra otros assets ni modifica los originales en `_scrape/media/`.
No modifica frontend ni el favicon de la aplicacion.

## Fotografias

Todos los origenes son archivos locales de `_scrape/media/`. Se corrige la
orientacion EXIF y se exporta RGB WebP con calidad 85, metodo 6 y lado mayor
maximo de 1600 px. Se conserva la proporcion, sin recorte ni ampliacion.
No se transfieren metadatos EXIF/XMP a las salidas.

| Original | Salida en `public/images/` | Dimensiones |
| --- | --- | --- |
| `snow-light-sunset-road-traffic-night-232-pxhere-com.jpg` | `carretera.webp` | 1600 x 1067 |
| `Vehiculos-autoescuela2.jpg` | `autoescuela.webp` | 1015 x 461 |
| `313b391a-d550-4c4a-91fe-1eec17c3ae69.jpg` | `aula.webp` | 1600 x 1200 |
| `5200277f-bc79-4521-8c44-b226f9bbf6da.jpg` | `centro.webp` | 1600 x 1200 |
| `takcanarias-camion-tacografo-vdo-edited.png` | `tacografo.webp` | 1600 x 1000 |

## Marca

Fuente: `_scrape/media/Logo-Takcanarias-nuevo.jpg`, JPG de 508 x 118 px con
manuscrito azul, fondo blanco y sombra gris. Se conserva la forma manuscrita
aprobada, no se sustituye por una tipografia.

| Salida en `public/brand/` | Contenido |
| --- | --- |
| `takcanarias.svg` | Contornos reales en un path compuesto, color `#171e59`, viewBox `0 0 508 118`, fondo transparente. Sin bitmap embebido, fuentes ni elementos de texto visual. |
| `logo.webp` | Fallback RGBA transparente de 508 x 118 px, WebP sin perdida, generado desde los mismos contornos con antialiasing. |
| `favicon.png` | T geometrica azul sobre transparencia, 64 x 64 px. Dibujada con poligono, sin fuente. No es la T manuscrita del logo. |

El trazado usa una mascara de tinta azul (`r < 150`, `g < 150`, `b-r > 15`,
`b-g > 10`), sigue los bordes expuestos de los pixeles y simplifica con
Ramer-Douglas-Peucker a 0.55 px. Los giros a la derecha separan contactos
diagonales; el relleno SVG `evenodd` conserva los huecos de las letras.
Se elimina deliberadamente el fondo y la sombra gris. La version raster combina
los contornos por paridad a 4x y reduce con LANCZOS.

**Limite de calidad:** es un trazado de un JPG de baja resolucion, no un diseno
maestro. Puede conservar irregularidades, esquinas y pequenas desviaciones del
original por compresion, umbral y simplificacion. Escalar el SVG no recupera
detalle perdido. Para impresion de gran formato conviene obtener el original
vectorial o encargar un trazado manual aprobado por el titular.

## Origen Y Derechos

Los archivos proceden del archivo local de medios del sitio anterior. Sus nombres
establecen la correspondencia tecnica, no prueban autor, titularidad ni licencia.
**No se han comprobado licencias ni autorizaciones de reutilizacion** de fotos o
marca. Confirmarlas con el titular antes de publicar; conservar creditos y
condiciones que resulten exigibles.

El nombre de la fotografia de carretera menciona PxHere, pero no se ha verificado
la ficha original, autor o licencia. **No es atribuible a Canarias con la
informacion disponible**: usarla solo como imagen generica de carretera, nunca
como prueba de una ubicacion, ruta o instalacion canaria.

## Comprobacion Visual

Renderizar el SVG con ImageMagick sobre blanco y compararlo con el JPG original;
comprobar especialmente los huecos de las letras, el punto de la i y el subrayado.
Las imagenes de comprobacion son temporales, no assets publicados.

```sh
magick -background none -density 288 public/brand/takcanarias.svg -resize 508x118 -background white -alpha remove /tmp/takcanarias-check.png
```

Comprobaciones realizadas: render con ImageMagick y comparacion visual con el
JPG original; decodificacion y dimensiones de todas las salidas raster;
transparencia de logo y favicon; inspeccion XML del SVG (solo `svg`, `title` y
`path`); casos de mascara vacia, pixel aislado, hueco, contactos diagonales y
bloque lleno. Dos generaciones produjeron hashes SHA-256 identicos para las
ocho salidas y los originales conservaron sus hashes durante la regeneracion.

El favicon se entrega unicamente como recurso en `public/brand/`; su integracion
en la aplicacion corresponde al responsable del frontend.
