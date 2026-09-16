#!/usr/bin/env bash
#
# Rota la contraseña de Postgres y deja de depender de la interpolación.
#
# Dos problemas se arreglan a la vez porque tocan lo mismo:
#
# 1. La contraseña anterior se filtró en el registro de otra sesión del
#    servidor. Es la base con los datos de los alumnos.
#
# 2. El compose usaba ${POSTGRES_PASSWORD}, que NO lee el env_file: lo resuelve
#    antes, contra el .env que está junto al compose o el entorno del shell.
#    Como allí no existe, interpolaba a cadena vacía. Funcionaba solo porque
#    quien desplegaba exportaba las variables a mano; el día que se olvidara,
#    la aplicación se habría quedado sin poder abrir su base, y no de una forma
#    ruidosa: simplemente los alumnos no habrían podido entrar.
#
# La contraseña nueva se genera aquí y no se imprime en ningún momento.
#
# Uso:  bash rotar-clave-postgres.sh

set -euo pipefail

ENV_APP=/opt/takcanarias/app/.env
COMPOSE=/opt/midecapro/selfhosted/docker-compose.yml
MARCA=$(date +%F-%H%M)

echo "== 1. Copias antes de tocar =="
docker exec selfhosted-takcanarias-db-1 pg_dump -U takcanarias takcanarias \
  | gzip > "/root/backup-antes-rotar-${MARCA}.sql.gz"
cp "$ENV_APP" "/root/env-antes-rotar-${MARCA}"
cp "$COMPOSE" "/root/compose-antes-rotar-${MARCA}.yml"
echo "   hechas"

echo "== 2. Nueva contraseña =="
# Se genera con Python y no con `tr < /dev/urandom | head`: esa tubería termina
# matando a `tr` con SIGPIPE, y con `set -e` el script se aborta justo aquí.
# Solo letras y números, para no arrastrar caracteres que haya que escapar en
# una URL de conexión ni en un fichero de entorno.
NUEVA=$(python3 -c "import secrets,string;print(''.join(secrets.choice(string.ascii_letters+string.digits) for _ in range(40)))")
if [ "${#NUEVA}" -ne 40 ]; then
  echo "   ERROR: no se ha podido generar la contraseña. No se toca nada."
  exit 1
fi
echo "   generada (${#NUEVA} caracteres, no se imprime)"

echo "== 3. Cambiarla en Postgres =="
# Por variable de entorno, para que no quede en la lista de procesos.
docker exec -e NUEVA="$NUEVA" selfhosted-takcanarias-db-1 \
  psql -U takcanarias -d takcanarias -v ON_ERROR_STOP=1 -q \
  -c "ALTER USER takcanarias WITH PASSWORD '$NUEVA';" > /dev/null
echo "   cambiada"

echo "== 4. Actualizar el .env de la aplicación =="
python3 - "$ENV_APP" "$NUEVA" <<'PY'
import sys, re
ruta, nueva = sys.argv[1], sys.argv[2]
with open(ruta, encoding="utf-8") as f:
    lineas = f.read().splitlines()

salida = []
for linea in lineas:
    if linea.startswith("POSTGRES_PASSWORD="):
        salida.append(f"POSTGRES_PASSWORD={nueva}")
    elif linea.startswith("DATABASE_URL="):
        # Se sustituye solo la contraseña; el resto de la cadena se respeta.
        salida.append(re.sub(r"(postgres://[^:]+:)[^@]*(@)", rf"\g<1>{nueva}\g<2>", linea))
    else:
        salida.append(linea)

with open(ruta, "w", encoding="utf-8") as f:
    f.write("\n".join(salida) + "\n")
print("   .env actualizado")
PY
chmod 600 "$ENV_APP"

echo "== 5. Quitar la interpolación del compose =="
python3 - "$COMPOSE" <<'PY'
import sys
ruta = sys.argv[1]
with open(ruta, encoding="utf-8") as f:
    texto = f.read()

# El servicio de aplicación ya recibe DATABASE_URL por env_file: la línea del
# compose solo servía para pisarlo con una versión interpolada, y además
# "environment" tiene prioridad sobre "env_file".
texto = texto.replace(
    "      DATABASE_URL: postgres://takcanarias:${POSTGRES_PASSWORD}@takcanarias-db:5432/takcanarias\n",
    "",
)

# La base de datos pasa a leer la contraseña del mismo fichero. Usuario y
# nombre de la base se quedan escritos: no son secretos y así se ven de un
# vistazo.
texto = texto.replace(
    """    environment:
      POSTGRES_USER: takcanarias
      POSTGRES_DB: takcanarias
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
""",
    """    env_file:
      - /opt/takcanarias/app/.env
    environment:
      POSTGRES_USER: takcanarias
      POSTGRES_DB: takcanarias
""",
)

with open(ruta, "w", encoding="utf-8") as f:
    f.write(texto)

quedan = texto.count("${POSTGRES_PASSWORD}")
print(f"   interpolaciones restantes: {quedan}")
PY

echo "== 6. Comprobar que ya no hace falta exportar nada =="
cd /opt/midecapro/selfhosted
if docker compose config 2>&1 >/dev/null | grep -q "POSTGRES_PASSWORD.*not set"; then
  echo "   AVISO: sigue avisando de variable sin definir"
else
  echo "   sin avisos: el compose ya no depende del shell"
fi

echo "== 7. Recrear los contenedores =="
docker compose up -d --no-deps --force-recreate takcanarias-db takcanarias 2>&1 | tail -3

echo "== 8. Comprobar que la aplicación abre su base =="
sleep 18
for intento in 1 2 3 4 5 6; do
  if docker exec selfhosted-takcanarias-db-1 pg_isready -U takcanarias -d takcanarias > /dev/null 2>&1; then
    echo "   la base acepta conexiones"
    break
  fi
  sleep 5
done

docker exec selfhosted-takcanarias-db-1 psql -U takcanarias -d takcanarias -tAc \
  "SELECT 'filas de usuarios: ' || count(*) FROM \"user\";"

echo "== Terminado =="
echo "La contraseña anterior ya no sirve. Copias en /root/*-antes-rotar-${MARCA}*"
