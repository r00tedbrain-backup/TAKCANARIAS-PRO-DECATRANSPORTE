#!/usr/bin/env bash
#
# Paso B: el proxy a su propio proyecto.
#
# Es el único paso de toda la separación que toca los puertos 80 y 443, así que
# va con puntos de control y se detiene ante cualquier duda. Entre parar el
# proxy viejo y levantar el nuevo hay unos segundos sin servicio en los cuatro
# dominios; es inevitable, dos procesos no pueden tener el 443 a la vez.
#
# NO borra el proxy viejo. Eso se hace aparte, después de comprobar los cuatro
# dominios desde fuera del servidor. Mientras el viejo exista parado, la vuelta
# atrás son dos comandos:
#
#     docker stop proxy-proxy-1 && docker start selfhosted-proxy-1
#
# Uso:  bash separar-proxy.sh

set -euo pipefail

MARCA=$(date +%F-%H%M)

echo "== 1. Copias antes de tocar =="
cp /opt/midecapro/selfhosted/Caddyfile "/root/Caddyfile-antes-proxy-${MARCA}"
cp /opt/midecapro/selfhosted/docker-compose.yml "/root/compose-selfhosted-antes-proxy-${MARCA}.yml"
echo "   hechas"

echo "== 2. Los dos ficheros de dominios están en su sitio =="
for f in midecapro takcanarias; do
  [ -f "/opt/proxy/sites/${f}.caddy" ] || { echo "   ERROR: falta /opt/proxy/sites/${f}.caddy"; exit 1; }
  echo "   ${f}.caddy: presente"
done

echo "== 3. Validar la configuración ANTES de tocar el proxy =="
if docker run --rm \
    -v /opt/proxy/Caddyfile:/etc/caddy/Caddyfile:ro \
    -v /opt/proxy/sites:/etc/caddy/sites:ro \
    caddy:2-alpine caddy validate --config /etc/caddy/Caddyfile 2>&1 | grep -q "Valid configuration"; then
  echo "   Valid configuration"
else
  echo "   ERROR: la configuración no valida. No se toca nada."
  exit 1
fi

echo "== 4. Los cuatro dominios están en los ficheros =="
for d in app.midecapro.com api.midecapro.com deca.midecapro.com nueva.takcanarias.es; do
  grep -q "^${d}" /opt/proxy/sites/*.caddy || { echo "   ERROR: falta ${d}"; exit 1; }
  echo "   ${d}: sí"
done

echo "== 5. Todos los servicios que nombran los ficheros están en infra =="
# Si alguno no estuviera, el proxy nuevo no lo alcanzaría y daría 502.
for svc in midecapro-app-1 midecapro-backend-1 takcanarias-takcanarias-1; do
  if docker inspect "$svc" --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}' | grep -q infra; then
    echo "   ${svc}: en infra"
  else
    echo "   ERROR: ${svc} no está en infra. No se sigue."
    exit 1
  fi
done

echo "== 6. Los volúmenes de certificados existen =="
for v in selfhosted_certificados selfhosted_configuracion_proxy; do
  docker volume inspect "$v" > /dev/null 2>&1 || { echo "   ERROR: falta el volumen ${v}"; exit 1; }
  echo "   ${v}: existe"
done
RESUELTO=$(cd /opt/proxy && docker compose config --format json 2>/dev/null \
  | python3 -c "import json,sys; print(json.load(sys.stdin)['volumes']['certificados']['name'])")
[ "$RESUELTO" = "selfhosted_certificados" ] || { echo "   ERROR: resolvería a '${RESUELTO}'"; exit 1; }
echo "   el compose nuevo apunta a los certificados existentes"

echo "== 7. Parar el proxy viejo (NO se borra) =="
docker stop selfhosted-proxy-1 > /dev/null
echo "   parado. Vuelta atrás: docker start selfhosted-proxy-1"

echo "== 8. Levantar el nuevo =="
cd /opt/proxy
docker compose up -d 2>&1 | tail -2

echo "== 9. Comprobar desde dentro del servidor =="
sleep 6
for d in app.midecapro.com api.midecapro.com deca.midecapro.com nueva.takcanarias.es; do
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "https://${d}/" || echo "000")
  printf "   %-24s %s\n" "$d" "$code"
done

echo "== Hecho. Falta comprobar desde FUERA y, si va bien, limpiar el viejo =="
echo "   Vuelta atrás si algo falla: docker stop proxy-proxy-1 && docker start selfhosted-proxy-1"
