#!/usr/bin/env bash
#
# Saca los servicios de Takcanarias del proyecto de midecapro y los deja en el
# suyo propio, sin migrar datos.
#
# Lo único irreversible aquí es el volumen. Va declarado como externo y con su
# nombre completo en compose.yml; el paso 2 comprueba que Docker lo resuelve al
# que ya existe ANTES de parar nada. Si no cuadrara, el script se detiene y no
# toca los contenedores.
#
# DeCA no se toca en ningún momento: solo se paran y se recrean los dos
# contenedores de Takcanarias.
#
# Uso:  bash separar-proyecto.sh

set -euo pipefail

VOLUMEN=selfhosted_takcanarias_datos
MARCA=$(date +%F-%H%M)

echo "== 1. Copias antes de tocar =="
docker exec selfhosted-takcanarias-db-1 pg_dump -U takcanarias takcanarias \
  | gzip > "/root/backup-antes-separar-${MARCA}.sql.gz"
cp /opt/midecapro/selfhosted/docker-compose.yml "/root/compose-midecapro-antes-separar-${MARCA}.yml"
FILAS_ANTES=$(docker exec selfhosted-takcanarias-db-1 psql -U takcanarias -d takcanarias -tAc \
  'SELECT count(*) FROM "user";' | tr -d ' ')
echo "   copia hecha. Usuarios en la base ahora: ${FILAS_ANTES}"

echo "== 2. Comprobar el volumen ANTES de parar nada =="
RESUELTO=$(cd /opt/takcanarias && docker compose config --format json 2>/dev/null \
  | python3 -c "import json,sys; print(json.load(sys.stdin)['volumes']['datos']['name'])")
if [ "$RESUELTO" != "$VOLUMEN" ]; then
  echo "   ERROR: el compose resolvería el volumen a '${RESUELTO}' y no a '${VOLUMEN}'."
  echo "   No se toca nada. Revisa 'external' y 'name' en compose.yml."
  exit 1
fi
echo "   correcto: apunta a ${VOLUMEN}"

echo "== 3. Comprobar que las redes existen =="
for red in infra selfhosted_default; do
  docker network inspect "$red" > /dev/null 2>&1 || { echo "   ERROR: falta la red ${red}"; exit 1; }
  echo "   ${red}: existe"
done

echo "== 4. Parar y quitar los contenedores viejos =="
# `docker rm` a secas: no toca volúmenes. Se evita `docker compose down` a
# propósito, porque en ese proyecto se llevaría también a DeCA por delante.
docker stop selfhosted-takcanarias-1 selfhosted-takcanarias-db-1 > /dev/null
docker rm   selfhosted-takcanarias-1 selfhosted-takcanarias-db-1 > /dev/null
echo "   quitados (el volumen sigue intacto)"
docker volume inspect "$VOLUMEN" > /dev/null && echo "   volumen comprobado: sigue ahí"

echo "== 5. Levantar desde el proyecto nuevo =="
cd /opt/takcanarias
docker compose up -d 2>&1 | tail -4

echo "== 6. Esperar a que la base acepte conexiones =="
for _ in $(seq 1 12); do
  if docker exec takcanarias-takcanarias-db-1 pg_isready -U takcanarias -d takcanarias > /dev/null 2>&1; then
    echo "   lista"
    break
  fi
  sleep 5
done

echo "== 7. Comprobar que los datos siguen ahí =="
FILAS_DESPUES=$(docker exec takcanarias-takcanarias-db-1 psql -U takcanarias -d takcanarias -tAc \
  'SELECT count(*) FROM "user";' | tr -d ' ')
echo "   usuarios antes: ${FILAS_ANTES} · después: ${FILAS_DESPUES}"
if [ "$FILAS_ANTES" != "$FILAS_DESPUES" ]; then
  echo "   ERROR: no cuadra. Hay copia en /root/backup-antes-separar-${MARCA}.sql.gz"
  exit 1
fi

echo "== 8. Comprobar que el proxy sigue alcanzando la web =="
sleep 8
if docker exec selfhosted-proxy-1 wget -qO- --timeout=6 http://takcanarias:3000/ > /dev/null 2>&1; then
  echo "   el proxy llega"
else
  echo "   AVISO: el proxy NO llega. Revisar la red antes de seguir."
fi

echo "== 9. Quitar los servicios del compose de midecapro =="
python3 - <<'PY'
import re
ruta = "/opt/midecapro/selfhosted/docker-compose.yml"
with open(ruta, encoding="utf-8") as f:
    texto = f.read()

# Se recorta desde el comentario que precede al primer servicio propio hasta
# justo antes de la sección de volúmenes, que es donde terminan.
inicio = texto.find("  # Web de Takcanarias")
fin = texto.find("\nvolumes:")
if inicio == -1 or fin == -1 or inicio > fin:
    print("   AVISO: no encuentro el bloque. Hay que quitarlo a mano.")
else:
    texto = texto[:inicio] + texto[fin + 1 :]
    # Y el volumen, que ya pertenece al otro proyecto.
    texto = re.sub(r"^  takcanarias_datos:\n", "", texto, flags=re.M)
    with open(ruta, "w", encoding="utf-8") as f:
        f.write(texto)
    print("   bloque retirado del compose de midecapro")
PY

echo "== 10. Que DeCA no se haya visto afectado =="
cd /opt/midecapro/selfhosted
docker compose config --services 2>/dev/null | sed 's/^/   servicio: /'

echo "== Terminado =="
echo "Copias en /root/*-antes-separar-${MARCA}*"
