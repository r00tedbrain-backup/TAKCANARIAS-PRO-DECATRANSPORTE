# DNS y correo de takcanarias.es

Inventario tomado el 15/09/2026 mediante consultas DNS públicas contra `1.1.1.1`.
Solo lectura: no se ha modificado ningún registro ni se ha accedido al panel.

## Estado actual

Registrador y DNS: **DonDominio**. Nameservers `ns8.dondominio.com` y `ns2.dondominio.com`.

| Registro | Valor actual | Para qué sirve |
| --- | --- | --- |
| `NS` | ns8 / ns2.dondominio.com | Zona DNS completa |
| `A` (raíz) | 31.214.178.44 (`hostingsrv27`) | Web WordPress actual |
| `www` | CNAME → hostingsrv27 → 31.214.178.44 | Web WordPress actual |
| `MX` | 10 mx01.dondominio.com | **Recepción de correo** |
| `TXT` (SPF) | `v=spf1 include:spf.dondominio.com` | **Envío de correo / antispam** |
| `mail` / `imap` / `pop` / `smtp` | mailsrv9.dondominio.com (31.214.176.10) | **Clientes de correo** |
| `webmail` | webmail-09.dondominio.net (31.214.176.12) | **Webmail** |
| `autodiscover` / `autoconfig` | panel247.com (37.152.88.149) | **Autoconfiguración Outlook/móvil** |
| `ftp` | ftp-server-00.dondominio.net | FTP del hosting |
| `cpanel` | hostingsrv27.dondominio.com | Panel del hosting |
| `*` (comodín) | → hostingsrv27 → 31.214.178.44 | Cualquier subdominio no definido |

**TTL observado: 60 segundos en todos los registros consultados.**

Hallazgos adicionales:

- **No hay DMARC.** La consulta a `_dmarc` devuelve un CNAME al hosting porque
  existe un comodín `*`, no porque haya una política publicada.
- Existe un **comodín** `*.takcanarias.es`. Cualquier subdominio inventado
  resuelve al hosting antiguo.
- El HTTPS del dominio falla por un certificado que no corresponde al nombre
  (documentado en `_scrape/INVENTARIO.md`). Ya está roto hoy, antes de migrar.

## Zona completa leída en el panel (15/09/2026)

Corrige el punto anterior: **sí existe DKIM**, con el selector `dddk`. La
consulta previa solo probó selectores habituales (`default`, `google`,
`selector1`) y ninguno era el de DonDominio; la ausencia era del método de
búsqueda, no del registro.

| Nombre | Tipo | Valor | Función |
| --- | --- | --- | --- |
| `takcanarias.es` | ANAME | hostingsrv27.dondominio.com (31.214.178.44) | **Web** |
| `www` | CNAME | hostingsrv27.dondominio.com. | **Web** |
| `takcanarias.es` | MX 10 | mx01.dondominio.com. | Correo |
| `takcanarias.es` | TXT | `v=spf1 include:spf.dondominio.com` | Correo |
| `dddk._domainkey` | TXT | `v=DKIM1; k=rsa; p=…` | Correo (firma) |
| `mail` · `imap` · `pop` · `pop3` · `smtp` | CNAME | mailsrv9.dondominio.com. | Correo |
| `webmail` | CNAME | webmail-09.dondominio.net. | Correo |
| `autodiscover` · `autoconfig` | CNAME | *.panel247.com. | Correo |
| `_autodiscover._tcp` | SRV | 0 0 443 autodiscover.panel247.com | Correo |
| `bbdd` | CNAME | bbddsrv8.dondominio.com. | Base de datos del hosting |
| `ftp` | CNAME | ftp-server-00.dondominio.net. | FTP del hosting |
| `*` | CNAME | hostingsrv27.dondominio.com. | Comodín |

**De los 17 registros de la zona, 11 son de correo y solo 2 son de la web.**
Ese es el argumento concreto para no mover los nameservers: para cambiar dos
registros se arrastrarían los otros quince.

El registro raíz es **ANAME**, no `A`. Es un alias propio de DonDominio que
resuelve a la IP del hosting. Para apuntar a una IP fija del VPS hay que
sustituirlo por un registro `A`.

## El riesgo del botón "Servidores personalizados"

Cambiar los **nameservers** no mueve solo la web: mueve **toda la zona DNS**.
Eso incluye `MX`, `SPF`, `mail`, `imap`, `pop`, `smtp`, `webmail` y
`autodiscover`. Si los nuevos nameservers no replican esos registros **antes**
del cambio, el correo `@takcanarias.es` deja de entrar y de salir.

Cuentas visibles en la web que dependen de esa zona: `administracion@`,
`formacion@`, `clases@` y `direccion@`. La cuenta `takcanarias@hotmail.es` no
depende del dominio y no se vería afectada.

El aviso de "hasta 24 horas" del panel corresponde a este cambio de
nameservers, no al cambio de un registro suelto.

## Alternativa recomendada: no tocar los nameservers

Para publicar la web nueva en el VPS basta con editar **dos registros** dentro
del panel DNS de DonDominio, dejando los nameservers como están:

| Registro | Antes | Después |
| --- | --- | --- |
| `takcanarias.es` (raíz) | ANAME → hostingsrv27.dondominio.com | `A` → `<IP_DEL_VPS>` |
| `www` | CNAME → hostingsrv27.dondominio.com. | `A` → `<IP_DEL_VPS>` |

Todo lo demás (`MX`, `SPF`, `mail`, `webmail`, `autodiscover`, `ftp`) se queda
intacto. **El correo no se toca en ningún momento.**

Con TTL de 60 segundos, el cambio se propaga en aproximadamente un minuto y
**revertirlo es igual de rápido**: se vuelve a poner 31.214.178.44. El
WordPress antiguo sigue existiendo en el hosting; deja de verse por el dominio,
pero no se borra.

## Antes de tocar nada

1. Confirmar con la titular que los correos `@takcanarias.es` están en uso y
   dónde se consultan (webmail, Outlook, móvil).
2. Tener la web ya funcionando en el VPS por IP, y el certificado HTTPS
   (Let's Encrypt) listo para emitirse en cuanto el dominio apunte.
3. Anotar los valores actuales de esta tabla para poder revertir.
4. Elegir un momento de baja actividad y avisar antes.

## Si en el futuro se cambian los nameservers

Solo tiene sentido si se quiere gestionar la zona completa fuera de DonDominio.
En ese caso hay que **replicar la zona entera antes del cambio**, incluidos
`MX`, `SPF`, los CNAME de correo, `autodiscover` y el comodín, y verificar la
recepción y el envío con un correo de prueba real antes de dar por buena la
migración. No es necesario para publicar la web.
