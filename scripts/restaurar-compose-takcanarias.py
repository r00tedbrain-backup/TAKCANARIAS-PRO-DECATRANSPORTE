#!/usr/bin/env python3
"""
Devuelve al docker-compose.yml los servicios de Takcanarias.

Su definición desapareció del fichero en algún momento mientras los contenedores
seguían corriendo. Eso es peligroso: para Docker pasan a ser huérfanos, y el
primer `docker compose up` que alguien lance en ese directorio puede llevárselos
por delante, base de datos incluida.

Los valores de aquí no están inventados: salen de `docker inspect` sobre los
contenedores que están funcionando ahora mismo.

El script no toca nada de DeCA y no hace nada si los servicios ya están.
Se ejecuta en el servidor:

    python3 restaurar-compose-takcanarias.py /opt/midecapro/selfhosted/docker-compose.yml
"""

import shutil
import sys
from datetime import datetime, timezone

SERVICIOS = """
  # Web de Takcanarias: Next.js en modo standalone sobre Node.
  # Se construye desde /opt/takcanarias/app, donde vive el código desplegado.
  takcanarias:
    build: /opt/takcanarias/app
    image: takcanarias-web
    restart: always
    env_file:
      - /opt/takcanarias/app/.env
    environment:
      NODE_ENV: production
      PORT: "3000"
      HOSTNAME: 0.0.0.0
      DATABASE_URL: postgres://takcanarias:${POSTGRES_PASSWORD}@takcanarias-db:5432/takcanarias
    depends_on:
      takcanarias-db:
        condition: service_healthy
    healthcheck:
      test:
        - CMD-SHELL
        - node -e "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
      interval: 30s
      timeout: 5s
      retries: 3
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

  # Base de datos del área del alumno.
  # No publica ningún puerto: solo se llega a ella desde la red de Docker.
  takcanarias-db:
    image: postgres:17-alpine
    restart: always
    environment:
      POSTGRES_USER: takcanarias
      POSTGRES_DB: takcanarias
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - takcanarias_datos:/var/lib/postgresql/data
    healthcheck:
      test:
        - CMD-SHELL
        - pg_isready -U takcanarias -d takcanarias
      interval: 10s
      timeout: 5s
      retries: 5
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
"""

# El volumen ya existe en el servidor como selfhosted_takcanarias_datos. Compose
# antepone el nombre del proyecto (selfhosted), así que declararlo así reutiliza
# el que hay en lugar de crear uno vacío.
VOLUMEN = "  takcanarias_datos:\n"


def main() -> int:
    if len(sys.argv) != 2:
        print("Uso: restaurar-compose-takcanarias.py <ruta al docker-compose.yml>")
        return 2

    ruta = sys.argv[1]
    with open(ruta, encoding="utf-8") as fichero:
        original = fichero.read()

    if "takcanarias:" in original:
        print("Los servicios ya están declarados. No se toca nada.")
        return 0

    if "\nvolumes:" not in original:
        print("ERROR: no encuentro la sección volumes:. Reviso a mano antes de seguir.")
        return 1

    marca = datetime.now(timezone.utc).strftime("%Y-%m-%d-%H%M")
    copia = f"/root/docker-compose.yml.antes-restaurar-{marca}"
    shutil.copy2(ruta, copia)

    cabeza, _, cola = original.partition("\nvolumes:")
    nuevo = cabeza + SERVICIOS + "\nvolumes:" + cola

    # Añadir el volumen justo detrás de la cabecera de la sección.
    lineas = nuevo.splitlines(keepends=True)
    salida, insertado = [], False
    for linea in lineas:
        salida.append(linea)
        if not insertado and linea.rstrip("\n") == "volumes:":
            salida.append(VOLUMEN)
            insertado = True

    if not insertado:
        print("ERROR: no he podido colocar el volumen. No se escribe nada.")
        return 1

    with open(ruta, "w", encoding="utf-8") as fichero:
        fichero.write("".join(salida))

    print(f"Servicios restaurados. Copia previa en {copia}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
