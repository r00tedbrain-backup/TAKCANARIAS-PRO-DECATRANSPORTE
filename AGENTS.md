# Takcanarias — estado y avisos

## PENDIENTE BLOQUEANTE: quitar el `noindex`

`src/app/layout.tsx` fuerza `robots: { index: false, follow: true }` **a propósito**.
Toda la web responde `noindex, follow`, incluido el dominio de producción.

**Google no indexará la web hasta que se retire esa línea.** No se retira hasta que
la titular apruebe expresamente:

1. Textos, teléfonos, dirección, horarios y homologación CAP nº 2725.
2. Los textos legales: `/politica-privacidad` y `/aviso-legal` son **borradores
   internos**, no documentos de cumplimiento.
3. Los derechos de uso de las fotografías y del logotipo (ver `docs/assets.md`).
4. El mapa incrustado de Google en portada y contacto, y su tratamiento de datos.

Al retirarlo, añadir también el sitemap al `robots.ts` de producción.
Un `noindex` no es un control de acceso: la URL sigue siendo pública.

## Estado del despliegue

- Código fuente en `main`. Demo estática en la rama `gh-pages`.
- VPS compartido con el proyecto **DeCA en producción** (`midecapro.com`).
  No ocupar los puertos 80/443: los sirve Caddy. Ver `docs/despliegue.md`.
- El dominio `takcanarias.es` sigue apuntando al hosting antiguo. El correo de la
  titular vive en esa zona DNS: **no tocar los nameservers**. Ver `docs/dns.md`.

## La cuenta no es el alumno

El centro da clases de apoyo **desde los 6 años**, y la LOPDGDD fija en **14
años** la edad mínima para consentir el tratamiento de los propios datos. Un niño
de 6 años, por tanto, no puede tener cuenta.

El modelo lo refleja: la cuenta (`user`) es de un adulto, y de ella cuelgan uno o
varios `alumno` mediante `titular_id`. Un adulto que se forma a sí mismo es un
alumno más, marcado con `es_el_titular`.

**Matrículas, reservas y asistencia cuelgan del alumno, nunca de la cuenta.** Si
colgasen de la cuenta, dos hermanos compartirían historial. Al añadir tablas
nuevas, respetar esto.

`consentimiento_tutor_en` solo deja constancia de que existe una autorización
firmada; la recoge el centro en papel. Mientras esté a null, un alumno menor no
está dado de alta de verdad.

## Alcance pendiente solicitado por la clienta

DeCA, aula online de cursos, y área del alumno con reservas, seguimiento de
prácticas y asistencia. Ver `docs/integraciones.md`. Las páginas actuales son
informativas: no simular accesos, formularios ni reservas que no existan.

Sobre la **reserva de plazas**: las tablas `sesion_clase`, `reserva` y
`asistencia` existen pero no se usan. El alcance acordado con el cliente es la
versión de *solicitud* (el centro publica huecos, el alumno pide uno, el centro
confirma), no reserva automática. La agenda completa —con profesores, vehículos y
cancelaciones— va presupuestada aparte y depende de si Facilauto permite
conectarse. Ver `docs/integraciones.md`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
