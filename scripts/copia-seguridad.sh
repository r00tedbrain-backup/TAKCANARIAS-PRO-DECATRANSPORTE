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
COMPOSE_DIR="/opt/midecapro/selfhosted"
FICHERO_ENV="/opt/takcanarias/app/.env"
CONTENEDOR="selfhosted-takcanarias-db-1"
BASE="takcanarias"
USUARIO="takcanarias"
DIAS_A_CONSERVAR="${DIAS_A_CONSERVAR:-30}"

mkdir -p "$DESTINO"

en_base() { docker exec -i "$CONTENEDOR" "$@"; }

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
