# Despliegue en el VPS

Estado al 15/09/2026. La web está publicada en
**`https://nueva.takcanarias.es`**, un subdominio de pruebas. El dominio
principal sigue en el hosting antiguo: ver `docs/dns.md`.

## Aviso de seguridad pendiente

La contraseña de `root` del VPS se transmitió por chat durante esta sesión.
**Debe rotarse** y sustituirse por acceso con clave SSH, deshabilitando después
la autenticación por contraseña. No está guardada en este repositorio ni debe
escribirse en él.

## El VPS no es exclusivo de esta web

`192.142.37.235` (puerto SSH **2313**) aloja además el proyecto **DeCA en
producción**, bajo `/opt/midecapro/selfhosted`:

| Dominio | Servicio |
| --- | --- |
| `app.midecapro.com` | Interfaz DeCA |
| `api.midecapro.com` | API de Convex |
| `deca.midecapro.com` | Acciones HTTP, descargas `/d/<token>` |

**Los puertos 80 y 443 los ocupa Caddy**, que actúa de proxy para todo. No
instalar nginx, Apache ni certbot en el host: romperían ese proxy. Antes y
después de cualquier cambio, comprobar que esos tres dominios responden.

## Arquitectura añadida

Un contenedor propio sirve los archivos estáticos; Caddy le da TLS.
No hay Node en ejecución, ni base de datos, ni proceso que vigilar.

```
Internet :443 → Caddy (selfhosted-proxy-1)
                 ├── *.midecapro.com     → DeCA (sin tocar)
                 └── nueva.takcanarias.es → selfhosted-takcanarias-1
                                            nginx:alpine
                                            /opt/takcanarias/site (solo lectura)
```

Piezas añadidas, todas dentro del stack existente:

- Servicio `takcanarias` en `/opt/midecapro/selfhosted/docker-compose.yml`.
- Bloque `nueva.takcanarias.es` en `/opt/midecapro/selfhosted/Caddyfile`,
  con los redirects históricos que la exportación estática no incluye.
- Contenido en `/opt/takcanarias/site`, montado en solo lectura.

El contenedor del proxy **no se recreó**: el cambio se aplicó con
`caddy reload`, sin interrumpir el DeCA.

## Publicar una actualización

Desde la raíz del repositorio:

```sh
pnpm build:static
rsync -az --delete -e "ssh -p 2313" out/ root@192.142.37.235:/opt/takcanarias/site/
```

No hace falta reiniciar nada: nginx sirve los archivos del volumen. Si cambia
el Caddyfile, aplicar sin cortes con:

```sh
ssh -p 2313 root@192.142.37.235 \
  'docker exec selfhosted-proxy-1 caddy reload --config /etc/caddy/Caddyfile'
```

Validar **siempre** antes de aplicar un Caddyfile:

```sh
docker run --rm -v /opt/midecapro/selfhosted/Caddyfile:/etc/caddy/Caddyfile:ro \
  caddy:2-alpine caddy validate --config /etc/caddy/Caddyfile
```

## Certificados: renovación automática

Caddy obtiene y renueva los certificados de Let's Encrypt **por sí mismo**.
No hay certbot, ni cron de renovación, ni nada que caduque por olvido.

Comprobado sobre el certificado real de `nueva.takcanarias.es`:

| Dato | Valor |
| --- | --- |
| Emisor | Let's Encrypt |
| Caduca | 14 dic 2026 |
| Renovación ya programada | 15 nov 2026 |
| Margen | **29 días antes de caducar** |

La fecha no es una estimación: Caddy la negocia con Let's Encrypt mediante ARI
(*ACME Renewal Information*) y la guarda junto al certificado. Si la renovación
fallara, quedarían casi 30 días de reintentos.

Condiciones que lo sostienen, verificadas:

- Certificados en el volumen `selfhosted_certificados`, persistente.
- `restart: always` en el proxy y en el contenedor de la web.
- `docker` habilitado en el arranque del servidor.

## Vigilancia: `revisar-certificados.sh`

Caddy renueva solo, pero un fallo silencioso es la única vía realista a un
certificado caducado. Hay una revisión diaria independiente:

- Script: `/usr/local/bin/revisar-certificados.sh [dias_aviso]` (por defecto 20).
- Temporizador: `revisar-certificados.timer`, diario con retardo aleatorio.
- Estado: `/var/lib/revisar-certificados.estado`.
- Registro: `journalctl -u revisar-certificados.service`.

Lee los dominios del propio Caddyfile, así que **cubre también el DeCA** y no
hay que mantener una lista aparte. De cada dominio comprueba tres cosas:

1. que la cadena de confianza sea válida,
2. **que el certificado sea realmente de ese dominio**,
3. que le queden días de sobra.

El punto 2 surgió de una prueba fallida. La primera versión solo miraba la
fecha y dio por bueno un dominio inexistente: el comodín `*.takcanarias.es` lo
enviaba al hosting antiguo, que respondía con un certificado ajeno. Ahora se
valida con `-verify_hostname` y ese caso se detecta.

Pruebas realizadas: dominios reales correctos (salida 0); umbral alto que
fuerza el aviso (salida 1); dominio inexistente con certificado ajeno
(detectado, salida 1); ejecución mediante systemd.

Para recibir avisos fuera del servidor, descomentar `CERT_WEBHOOK` en
`/etc/systemd/system/revisar-certificados.service` y recargar systemd. Sin
webhook, el fallo queda en el registro y en el estado del temporizador.

## Reversión

- **Quitar la web sin tocar el DeCA:** borrar el bloque `nueva.takcanarias.es`
  del Caddyfile, `caddy reload`, y `docker compose stop takcanarias`.
- **Volver al estado previo completo:** en `/root/backup-antes-takcanarias-*`
  están el `Caddyfile` y el `docker-compose.yml` originales, más la lista de
  contenedores anterior.
- El registro DNS `nueva` puede borrarse en cualquier momento: no afecta ni a
  la web actual ni al correo.

## Pendiente

1. Rotar la contraseña de `root` y pasar a clave SSH.
2. Aprobación de la titular sobre contenidos y textos legales.
3. Retirar el `noindex` solo tras esa aprobación (ver `AGENTS.md`).
4. Mover los dos registros DNS del dominio principal (ver `docs/dns.md`).
5. Decidir si el hosting antiguo se mantiene: **el correo sigue dependiendo de
   ese servicio**.

## Área de alumnos

Desplegada el 15/09/2026 en `nueva.takcanarias.es`. **El registro está cerrado**
hasta que la titular facilite razón social y NIF y apruebe los textos legales.

Piezas nuevas, todas en Docker dentro del mismo stack:

| Servicio | Imagen | Cometido |
| --- | --- | --- |
| `takcanarias` | build propio, Node 22 | Web y área de alumnos |
| `takcanarias-db` | postgres:17-alpine | Base de datos, volumen `takcanarias_datos` |

El contenedor que servía los estáticos con nginx se sustituyó por la aplicación
Node. Caddy le hace de proxy al puerto 3000. **El proxy no se recreó**: solo se
recargó la configuración, sin cortar el DeCA.

La base de datos es independiente de la del DeCA a propósito: aquí hay datos de
alumnos, parte de ellos menores.

### Cómo se cierra el registro

`AREA_ALUMNO_REGISTRO_ABIERTO` en `/opt/takcanarias/app/.env`. Con valor `0`:

1. La página de registro no muestra el formulario.
2. Un `hook` en el servidor **rechaza cualquier alta con 403**, venga de donde venga.

El segundo punto no es redundante. En pruebas, con el formulario ya oculto, se
consiguió crear una cuenta llamando directamente a la API: **ocultar el
formulario no cierra nada**. La cuenta de prueba se eliminó y se añadió el
bloqueo en servidor. Comprobado después: `403 REGISTRO_CERRADO` y cero usuarios.

Para abrirlo cuando haya cobertura legal: poner `1`, `docker compose up -d
takcanarias`, y comprobar que la API deja de devolver 403.

### Migraciones

El SQL se genera en local con `pnpm db:generate`, se revisa y se aplica a mano:

```sh
docker compose exec -T takcanarias-db psql -U takcanarias -d takcanarias \
  -v ON_ERROR_STOP=1 < /opt/takcanarias/app/drizzle/NNNN_nombre.sql
```

No se aplican solas al arrancar: en esta base hay datos de alumnos y un
reinicio no debe modificar el esquema sin que alguien lo mire.

### Pruebas realizadas

Con el registro abierto de forma temporal, sobre el servidor real:

- Alta, acceso y sesión: correctos.
- Contraseña incorrecta: rechazada (401).
- Correo sin verificar: acceso rechazado (403).
- Panel sin sesión: redirige al acceso.
- **Aislamiento entre alumnos**: con dos cuentas, ninguna ve el nombre ni el
  correo de la otra.
- Límite de intentos: bloquea al cuarto intento fallido (429).
- Alta por API con el registro cerrado: rechazada (403).

Las cuentas de prueba se borraron. La base quedó con **cero usuarios**.

### Dos fallos que destapó el despliegue

Ninguno se habría visto sin probar contra la base real:

1. **Identificadores nulos.** Better Auth inserta las filas mandando `default`
   en la columna `id`, y las tablas no tenían valor por defecto. Postgres las
   rechazaba: fallaban el alta y toda la API de autenticación. Resuelto dando
   `gen_random_uuid()::text` por defecto a las once tablas.
2. **Registro cerrado solo de cara.** Descrito arriba.

### Envío de correo

Resuelto el 15/09/2026 con Resend, desde el subdominio `avisos.takcanarias.es`.
Cubre la verificación de la cuenta y el restablecimiento de contraseña.

Se verificó el subdominio, **no el dominio principal**: hacerlo en la raíz
obligaba a modificar el SPF que usan los buzones del centro. Los registros
añadidos y la comprobación de que el correo quedó intacto están en `docs/dns.md`.

La clave de Resend es **de solo envío**: no puede gestionar dominios ni borrar
nada. Vive únicamente en `/opt/takcanarias/app/.env`, con permisos 600.

Probado contra el servidor real: envío directo aceptado por Resend, alta con
correo de verificación, reenvío de verificación y solicitud de restablecimiento,
las tres sin errores en el registro de la aplicación. La cuenta de prueba se
borró y la base quedó con cero usuarios.

`EMAIL_REMITENTE` **no debe ponerse en el `.env`**: los caracteres `<` y `>` del
formato `Nombre <correo>` rompen el fichero y la variable llega vacía. El valor
por defecto está en `src/lib/email.ts`.

### Pendiente antes de abrir a alumnos reales

1. **Rediseño para menores.** La titular confirma alumnado desde 6 años. La ley
   española no permite que un menor de 14 consienta por sí mismo, así que la
   cuenta debe ser del padre, madre o tutor, con los hijos asociados. El modelo
   actual asume que se registra el propio alumno: **falta esa relación**.
2. **Consentimiento de tutores**, que hoy se recoge en papel.
3. **Copias de seguridad de la base.** El volumen persiste, pero no hay copia
   automática fuera del servidor.
4. **Rotar credenciales**: la contraseña de `root` y la clave de Resend se
   transmitieron por chat durante el desarrollo.
