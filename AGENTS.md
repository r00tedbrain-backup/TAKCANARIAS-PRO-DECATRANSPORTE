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

## Convivencia con DeCA en el mismo servidor

El 16 de septiembre de 2026 el despliegue de DeCA sobrescribió el
`docker-compose.yml` y el `Caddyfile` compartidos y borró de ellos los servicios
de Takcanarias. Los contenedores siguieron vivos por `restart: always`, pero el
sitio dejó de servirse en cuanto se recreó el proxy. Se resolvió separando todo
en **tres proyectos de compose independientes**, y así debe seguir:

| Proyecto | Carpeta | Quién lo toca |
|---|---|---|
| `takcanarias` | `/opt/takcanarias/` | solo este agente |
| `midecapro` | `/opt/midecapro/` | solo el agente de DeCA |
| `proxy` | `/opt/proxy/` | nadie sin avisar al otro |

Los tres comparten la red externa `infra`. Los dominios se cargan con
`import sites/*.caddy`: cada proyecto deja su fichero en `/opt/proxy/sites/` y
**solo toca el suyo**. `takcanarias.caddy` es nuestro; `midecapro.caddy`, suyo.

Reglas acordadas con el otro agente, y que hay que respetar aunque parezcan
obvias, porque cada una viene de un fallo real:

1. Desplegar solo desde la propia carpeta. Nunca `docker compose` en la del otro.
2. **Nunca `--remove-orphans`**: desde cualquier lado borra los contenedores del
   otro, Postgres incluido.
3. Cambios en el proxy: `caddy validate` antes, `caddy reload` después. Nunca
   `up --force-recreate` para aplicar configuración.
4. Copia con fecha en `/root/` antes de cualquier cambio en el servidor.
5. Nada de memoria: `docker inspect` antes de afirmar cómo está algo.
6. Si algo no responde pero hace ping, es fail2ban, no el servidor. Mirar antes
   de reiniciar: reiniciar borra la evidencia.

Detalles que costaron caro y no hay que repetir:

- **El volumen de la base se llama `selfhosted_takcanarias_datos`**, con el
  prefijo del proyecto antiguo. En el compose va `external: true` con ese nombre.
  Sin eso, Docker crea uno vacío, Postgres lo inicializa como nuevo y los datos
  quedan huérfanos sin que falle nada visible.
- **Ningún `${VARIABLE}` en el compose.** La interpolación no lee el `env_file`:
  resuelve antes, contra el entorno del shell, y sin él da cadena vacía. Todos
  los secretos vienen del `env_file`. Comprobado desplegando desde shell limpio.
- Los certificados viven en el volumen `selfhosted_certificados`, externo al
  proyecto `proxy`. Por eso el proxy se pudo mover sin renovar nada.
- Los contenedores se llaman `takcanarias-takcanarias-1` y
  `takcanarias-takcanarias-db-1`. El nombre de **servicio**, que es lo que usa
  Caddy, sigue siendo `takcanarias`.

Probado con reinicio completo del VPS el mismo día: SSH volvió en 16 segundos y
los seis contenedores, las redes y los volúmenes arrancaron solos. Los cuatro
dominios respondieron sin intervención.

Scripts de referencia en `scripts/`: `separar-proyecto.sh`, `separar-proxy.sh`,
`rotar-clave-postgres.sh`. Ficheros del despliegue en `deploy/`.

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
