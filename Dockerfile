# Imagen de la web. Multi-etapa para no arrastrar el código fuente ni las
# dependencias de desarrollo a la imagen final.
FROM node:22-alpine AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable

# --- dependencias ---------------------------------------------------------
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# --ignore-scripts: ninguna dependencia ejecuta código durante la instalación.
RUN pnpm install --frozen-lockfile --ignore-scripts

# --- compilación ----------------------------------------------------------
FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# En esta fase no hay credenciales reales y no hace falta que las haya: el
# código usa valores de relleno mientras NEXT_PHASE indica compilación, y
# exige las de verdad al arrancar.
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# --- imagen final ---------------------------------------------------------
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
# Usuario sin privilegios: si alguien encuentra un fallo en la aplicación, no
# se encuentra siendo root dentro del contenedor.
RUN addgroup -g 1001 -S nodejs && adduser -S -u 1001 -G nodejs nextjs

COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public
# Migraciones: se aplican desde fuera, no al arrancar, para no tocar la base
# de datos sin querer en un reinicio.
COPY --from=build --chown=nextjs:nodejs /app/drizzle ./drizzle

USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD node -e "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
