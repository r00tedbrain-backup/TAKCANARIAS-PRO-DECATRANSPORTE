#!/usr/bin/env bash
#
# Copia de seguridad de la base de datos del area de alumnos de Takcanarias.
#
# Sigue el mismo patron que /opt/midecapro/copia-seguridad.sh, el del DeCA, para
# que quien mantenga este servidor no tenga que aprenderse dos sistemas.
#
# Aqui la base es PostgreSQL, no SQLite, asi que NO se copia el volumen: se usa
# pg_dump. Copiar los ficheros de Postgres con la base en marcha da una copia
# que parece valida y no lo es.
#
# Instalacion del cron (a las 4:45, para no solaparse con el del DeCA):
#   (crontab -l 2>/dev/null; echo '45 4 * * * /opt/takcanarias/copia-seguridad.sh >> /var/log/takcanarias-copias.log 2>&1') | crontab -
#
# Una copia que no se ha restaurado nunca no es una copia. Para probarla:
#   ./copia-seguridad.sh --probar-restauracion

set -euo pipefail

DESTINO="${DESTINO:-/var/backups/takcanarias}"
BASE="takcanarias"
USUARIO="takcanarias"
DIAS_A_CONSERVAR="${DIAS_A_CONSERVAR:-30}"

mkdir -p "$DESTINO"

# Si algo falla, que quede escrito con la palabra ERROR delante. Un fallo que
# solo deja un ".parcial" en una carpeta que nadie mira es un fallo silencioso,
# y esta copia ya fallo asi una vez sin que nadie se enterara.
trap 'echo "ERROR: la copia de $(date -Is) no ha terminado. Revisar $DESTINO y este registro."' ERR

# El contenedor se busca por el servicio de compose, no por su nombre. El
# nombre lleva delante el del proyecto, y el 16 de septiembre de 2026 el
# proyecto cambio de "selfhosted" a "takcanarias": el script siguio apuntando
# al nombre viejo y la copia de esa madrugada fallo. Buscandolo por servicio,
# sobrevive a que el proyecto vuelva a cambiar de nombre.
CONTENEDOR=$(docker ps \
  --filter "label=com.docker.compose.service=takcanarias-db" \
  --filter "status=running" \
  --format '{{.Names}}' | head -1)

if [ -z "$CONTENEDOR" ]; then
  echo "ERROR: no encuentro ningun contenedor en marcha del servicio takcanarias-db."
  exit 1
fi

en_base() { docker exec -i "$CONTENEDOR" "$@"; }

# Restos de intentos anteriores que no terminaron. Se quitan antes de empezar
# para que no se confundan con copias validas ni se acumulen.
find "$DESTINO" -name 'alumnos-*.sql.gz.parcial' -delete 2>/dev/null || true

if [ "${1:-}" = "--probar-restauracion" ]; then
  # El '|| true' es necesario: con 'set -e' y 'pipefail', si todavia no hay
  # ninguna copia el 'ls' devuelve 2 y el script moriria aqui en silencio.
  ultima=$(ls -1t "$DESTINO"/alumnos-*.sql.gz 2>/dev/null | head -1 || true)
  [ -n "$ultima" ] || { echo "No hay ninguna copia en $DESTINO"; exit 1; }
  echo "Probando: $ultima"

  # Se restaura en una base temporal aparte. La de produccion no se toca.
  temporal="prueba_restauracion_$(date +%s)"
  en_base psql -U "$USUARIO" -d postgres -q -c "CREATE DATABASE \"$temporal\";"
  # shellcheck disable=SC2064
  trap "docker exec -i '$CONTENEDOR' psql -U '$USUARIO' -d postgres -q -c 'DROP DATABASE IF EXISTS \"$temporal\";' >/dev/null 2>&1 || true" EXIT

  gunzip -c "$ultima" | en_base psql -U "$USUARIO" -d "$temporal" -q -v ON_ERROR_STOP=1 >/dev/null

  tablas=$(en_base psql -U "$USUARIO" -d "$temporal" -tAc \
    "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';")
  usuarios=$(en_base psql -U "$USUARIO" -d "$temporal" -tAc 'SELECT count(*) FROM "user";')

  echo "  tablas restauradas: $tablas"
  echo "  usuarios en la copia: $usuarios"
  [ "$tablas" -ge 11 ] || { echo "FALLO: se esperaban al menos 11 tablas"; exit 1; }
  echo "OK: la copia se puede restaurar."
  exit 0
fi

marca=$(date +%Y-%m-%d_%H%M)
fichero="$DESTINO/alumnos-$marca.sql.gz"

echo "==> $(date -Is) copiando la base $BASE"
# --clean --if-exists: el volcado se puede restaurar sobre una base existente.
en_base pg_dump -U "$USUARIO" -d "$BASE" --clean --if-exists | gzip -9 > "$fichero.parcial"

# Solo se renombra si el volcado termino bien, para no dejar copias a medias
# que parezcan validas.
mv "$fichero.parcial" "$fichero"
chmod 600 "$fichero"

tam=$(du -h "$fichero" | cut -f1)
echo "==> Copia creada: $fichero ($tam)"

# Comprobacion minima: un volcado valido termina con la linea de PostgreSQL.
if ! gunzip -c "$fichero" | tail -5 | grep -q "PostgreSQL database dump complete"; then
  echo "AVISO: el volcado no parece completo. Revisar antes de fiarse de esta copia."
  exit 1
fi

echo "==> Limpiando copias de mas de $DIAS_A_CONSERVAR dias"
find "$DESTINO" -name 'alumnos-*.sql.gz' -mtime +"$DIAS_A_CONSERVAR" -delete

echo "==> Copias disponibles:"
ls -1t "$DESTINO"/alumnos-*.sql.gz | head -5 | sed 's/^/  /'
