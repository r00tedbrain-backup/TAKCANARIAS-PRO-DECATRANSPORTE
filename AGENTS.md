# Takcanarias — estado y avisos

## El dominio ya está migrado (19-09-2026)

`takcanarias.es` y `www.takcanarias.es` apuntan al VPS. La web es pública e
indexable en el dominio real.

Cómo se hizo y por qué así: en vez de borrar el ANAME para crear un registro A,
se **cambió su valor** a `nueva.takcanarias.es`, y lo mismo con el CNAME de
`www`. Borrar y crear deja un hueco en el que el dominio no resuelve, y si el
panel falla justo ahí, la web del centro se cae. Cambiando el valor no hay
hueco y se vuelve atrás en un clic. DonDominio resuelve el ANAME y devuelve
192.142.37.235.

- `www.takcanarias.es` sirve la web. Es el dominio canónico.
- `takcanarias.es` responde 301 a `www`. Con los dos sirviendo lo mismo, un
  buscador lo trataría como contenido duplicado.
- `nueva.takcanarias.es` sigue en pie para pruebas, pero **su `robots.txt` lo
  bloquea entero**: si se indexara, competiría con el dominio real.

El `robots.ts` decide por dominio, leyendo la cabecera `host`. Al añadir un
dominio nuevo hay que mirar ese fichero, o quedará bloqueado sin que se note.

**El correo no se tocó y hay que seguir sin tocarlo.** MX, SPF, el DKIM `dddk`,
`webmail`, `imap`, `pop`, `smtp`, `autoconfig` y `autodiscover` siguen en
DonDominio. Comprobado tras el cambio.

Queda pendiente de la titular: **tomo, folio y hoja del Registro Mercantil**. El
aviso legal ya declara que faltan, así que la web es publicable, pero conviene
completarlo.

## Histórico: el `noindex` que había antes

`src/app/layout.tsx` fuerza `robots: { index: false, follow: true }` **a propósito**.
Toda la web responde `noindex, follow`, incluido el dominio de producción.

Ya retirado el 19 de septiembre de 2026. Lo que se exigía antes de hacerlo, por
si sirve de referencia:

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
| `midecapro` | `/opt/midecapro/selfhosted/` | solo el agente de DeCA |
| `proxy` | `/opt/proxy/` | nadie sin avisar al otro |

Ojo con la carpeta de DeCA: se llama `selfhosted/` por herencia del proyecto
antiguo, pero su compose lleva `name: midecapro` y **es su despliegue vivo**. No
es una carpeta muerta ni hay que moverla. Este agente lo dio por hecho el 16 de
septiembre y el otro lo corrigió con `docker inspect`. Regla 5 en acción.

Los tres comparten la red externa `infra`, la única que existe con contenedores.
`selfhosted_default` quedó vacía tras la separación. Los dominios se cargan con
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
- **Al renombrar los contenedores se rompió la copia de seguridad** y nadie se
  enteró hasta que el otro agente vio un `.parcial` en la carpeta. El script
  apuntaba al nombre viejo. Ahora busca el contenedor por su etiqueta de
  servicio y, si falla, escribe `ERROR` en el registro. Si se toca algo que
  cambie nombres, ejecutar `/opt/takcanarias/copia-seguridad.sh` a mano después.
- Los volúmenes `selfhosted_*` **son los vivos**, aunque el proyecto
  `selfhosted` ya no tenga contenedores. Un `docker volume prune` se lleva la
  base de los alumnos y la de DeCA. No limpiar volúmenes sin mirar `docker
  volume ls` con cada contenedor parado.

Probado con reinicio completo del VPS el mismo día: SSH volvió en 16 segundos y
los seis contenedores, las redes y los volúmenes arrancaron solos. Los cuatro
dominios respondieron sin intervención.

Scripts de referencia en `scripts/`: `separar-proyecto.sh`, `separar-proxy.sh`,
`rotar-clave-postgres.sh`. Ficheros del despliegue en `deploy/`.

## Zona DNS de takcanarias.es ANTES de la migración

Copiada literal el 19 de septiembre de 2026, con el dominio todavía apuntando
al hosting antiguo de DonDominio. **Si hay que volver atrás, esto es lo que
había.** Serial SOA en ese momento: 2026091503.

| Nombre | Tipo | Valor |
|---|---|---|
| `takcanarias.es` | ANAME | `hostingsrv27.dondominio.com` (31.214.178.44) |
| `www` | CNAME | `hostingsrv27.dondominio.com.` |
| `*` | CNAME | `hostingsrv27.dondominio.com.` |
| `nueva` | A | `192.142.37.235` |
| `takcanarias.es` | MX 10 | `mx01.dondominio.com.` |
| `takcanarias.es` | TXT | `v=spf1 include:spf.dondominio.com` |
| `dddk._domainkey` | TXT | DKIM del correo (`v=DKIM1; k=rsa; p=MIGfMA0…QIDAQAB`) |
| `mail`, `imap`, `pop`, `pop3`, `smtp` | CNAME | `mailsrv9.dondominio.com.` |
| `webmail` | CNAME | `webmail-09.dondominio.net.` |
| `autoconfig` | CNAME | `autoconfig.panel247.com.` |
| `autodiscover` | CNAME | `autodiscover.panel247.com.` |
| `_autodiscover._tcp` | SRV | `0 0 443 autodiscover.panel247.com` |
| `ftp` | CNAME | `ftp-server-00.dondominio.net.` |
| `bbdd` | CNAME | `bbddsrv8.dondominio.com.` |
| `resend._domainkey.avisos` | TXT | DKIM de Resend |
| `rsend.avisos` | CNAME | `rsend-euw1.forge.rmta.net.` |
| `send.avisos` | CNAME | `send.forge.rmta.net.` |

**Solo cambian dos registros al migrar**: el ANAME de la raíz y el CNAME de
`www`, que pasan a `A → 192.142.37.235`.

**Todo lo demás se queda como está, y esto es lo importante:** MX, SPF, el DKIM
`dddk`, y los `mail`/`imap`/`pop`/`pop3`/`smtp`/`webmail`/`autoconfig`/
`autodiscover` son el correo de la titular. Tocarlos deja al centro sin correo,
y el daño no se ve hasta que alguien echa de menos un mensaje que nunca llegó.
Los `avisos.*` son de Resend y tampoco se tocan.

Ojo con el **comodín `*`**: manda al hosting antiguo cualquier subdominio que no
esté escrito arriba. Mientras siga ahí, un subdominio nuevo no llega al VPS
hasta que se le cree su propio registro; el específico gana al comodín.

Para volver atrás: devolver la raíz a ANAME `hostingsrv27.dondominio.com` y
`www` a CNAME del mismo valor. La propagación tarda lo que marque el TTL.

## Pendiente de respuesta de la titular (19-09-2026)

Ya está pedido y esperando contestación. **No rehacer la pregunta ni suponer la
respuesta**; si algo se implementó con un valor provisional, está dicho aquí.

### Clases y horario

- **El horario cargado es de lunes a viernes, 8:00–20:00**, con 2 plazas desde
  las 16:00 (sus dos profesores de tarde) y 1 por las mañanas. Son 60 franjas.
- **Faltan los sábados y domingos de los permisos C y D.** Dijeron "algunos", no
  todos, así que no se metieron en el horario fijo: un horario que promete horas
  que no existen es peor que no tenerlo. Mientras no respondan con el patrón, el
  centro los abre a mano desde el panel cuando toque.
- **El "80% de las veces hay dos profesores por la tarde" no se puede
  programar.** Se dejó 2 plazas fijas; el día que solo haya un profesor, el
  centro anula una hora desde el panel.

### Anulaciones

- Dijeron "24h/48h", que son cosas distintas. **Se aplicó 24 horas**, por ser lo
  menos restrictivo, y vive en `HORAS_MINIMAS_ANTELACION` (`src/lib/politica.ts`).
  Cambiarlo a 48 es tocar ese número.
- La otra condición, que la anulación se haga en horario laboral, sí es
  literal: su ejemplo fue "no vale un sábado para un lunes".

### Datos y accesos

- **Tomo, folio y hoja del Registro Mercantil.** Es el único dato de empresa que
  falta. El aviso legal declara que faltan, así que la web es publicable.
- **Derechos de las fotografías.** En `docs/assets.md` consta que no se han
  comprobado licencias: las fotos vienen de su web anterior, y eso no prueba que
  ella tenga los derechos. Ahora están publicadas e indexadas.
- **Correo al que enviar los avisos** de reserva y anulación.
  `AVISOS_EMAIL_CENTRO` está vacío, así que **no se envía nada** todavía.
- **Correos reales del personal** que vaya a usar el panel. Solo existen las
  cuentas de demostración (`@demo.takcanarias.es`), que hay que borrar cuando
  terminen de enseñarlo.
- **Telegram**: sin decidir. Las variables ni siquiera están creadas en el
  `.env`. El aviso por correo funciona sin esto.

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
