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
