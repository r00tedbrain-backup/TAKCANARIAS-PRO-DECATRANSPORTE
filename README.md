# Takcanarias — web pública

Reconstrucción de la web de asesoría de transportes, formación CAP, autoescuela
y apoyo escolar. **Versión local para revisión, no publicada.**

DeCA, aula online y área de cliente tienen páginas de presentación, no acceso
privado operativo. Se conserva el alcance solicitado de reservas, seguimiento
de prácticas y asistencia a cursos. No se ha modificado el proyecto DeCA existente.

## Stack real

- Next.js **16.3.5**, App Router y páginas pregeneradas.
- React / React DOM **19.2.8**.
- TypeScript **5.9.3** y Tailwind **4.3.3**, según el lockfile.
- pnpm **10.33.0**, fijado por el scaffold existente, sin cambios al gestor global.
- Manrope y Barlow Condensed mediante `next/font`.
- Sin CMS, base de datos, autenticación ni librerías añadidas de animación.

Verificado con Node 22.11.0. Consultar la documentación real de Next en
`node_modules/next/dist/docs/` antes de cambiar sus APIs.

## Desarrollo y comprobación

En una copia nueva: `pnpm install --frozen-lockfile --ignore-scripts`.
Los medios preparados están incluidos en `public/`; no hay que regenerarlos
para compilar. La preparación opcional de medios requiere Pillow instalado.

```sh
pnpm dev
pnpm lint
pnpm build

# Tras build, en otra terminal:
pnpm exec next start --hostname 127.0.0.1 --port 3107

# Con el servidor encendido:
pnpm test:smoke
# O indicando otro puerto local:
pnpm test:smoke http://127.0.0.1:3000
```

El build de `next/font/google` necesita descargar fuentes. El visitante las
recibe localmente, no desde Google. No hay peticiones al WordPress en build/render.

## Estructura

```text
src/app/               Portada, contacto, páginas, metadata y estilos
src/components/        Navegación, iconos SVG, pie y contacto compartidos
src/content/site.ts    Datos de negocio, servicios, accesos y módulos futuros
public/brand/          Logo vectorizado, fallback raster y favicon
public/images/         Fotografías recuperadas y optimizadas a WebP
scripts/               Archivo WordPress, preparación de medios y smoke test
docs/                  Integraciones, medios y verificación
_scrape/               Archivo público original LOCAL, excluido de Git
```

La navegación es el único componente cliente con estado. Los servicios y el
resto del contenido se generan en servidor. FAQ utiliza `details/summary`.
No se importan scripts ni formularios del WordPress. Se recupera el mapa de
Google Maps con un iframe propio en portada y contacto; conecta con Google al
cargar. Revisar consentimiento y tratamiento de datos antes de publicar.

## Rutas

| Públicas | Preparadas, no operativas | Auxiliares |
| --- | --- | --- |
| `/` | `/deca` | `/politica-privacidad` |
| `/asesoria-transportes` | `/cursos` | `/aviso-legal` |
| `/formacion-cap` | `/area-cliente` | `/blog` |
| `/autoescuela-takcanarias` | | |
| `/clases-de-apoyo` | | |
| `/contacto` | | |
| `/descarga-tarjeta` | | |
| `/plataforma-gps` | | |

`next.config.ts` redirige las portadas duplicadas y las entradas históricas de
tarjetas. Las rutas desconocidas devuelven 404. `/blog` conserva el acceso útil
de las entradas originales, sin inventar artículos.

## Archivo de la web anterior

Inventario corregido: `_scrape/INVENTARIO.md`. Los manifests incluyen paginación,
URLs, tamaño, SHA256 y errores. Preservados: 10 páginas, 3 entradas, 69 medios
originales y sus variantes. **Es contenido público, no un backup del servidor,
base de datos, plugins ni archivos privados.**

```sh
node scripts/archive-wordpress.mjs
python3 scripts/prepare-assets.py
```

Ver [docs/assets.md](docs/assets.md). El logo se trazó desde un JPG pequeño;
es vectorial pero no sustituye al original de imprenta.

## Antes de publicar

1. Aprobar con la clienta textos, teléfonos, dirección, horarios, homologación CAP,
   cursos de puntos y derechos de las imágenes.
2. Completar y validar identificación fiscal y legales: las páginas actuales son
   borradores explícitos, no una declaración de cumplimiento.
3. Confirmar alojamiento comercial, dominio y certificado HTTPS. No se ha tocado
   el WordPress ni el DNS. El certificado del sitio histórico presenta un desajuste
   de nombre, documentado en el inventario.
4. Retirar `noindex` del layout **solo al aprobar el lanzamiento**; mantenerlo en
   previews, módulos pendientes y borradores. Añadir el sitemap al robots de producción.
   `noindex` no es control de acceso ni protege información confidencial.
5. El contacto usa teléfono, correo y WhatsApp reales. No hay formulario que simule
   enviar consultas. Acordar proveedor y tratamiento de datos antes de añadir uno,
   junto con cualquier analítica o píxel publicitario.
6. Revisar el proyecto DeCA antes de elegir la integración. Ver
   [docs/integraciones.md](docs/integraciones.md): incluye agenda, prácticas y asistencia.

Chat, transcripción, archivo bruto, `.env`, dependencias y builds están excluidos
de Git. Nunca incluir correspondencia privada en `public/`.
Publicar este repositorio en GitHub no despliega la web ni modifica el dominio.

Resultados: [docs/verificacion.md](docs/verificacion.md).
