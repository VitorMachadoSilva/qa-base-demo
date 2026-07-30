# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS frontend-build
WORKDIR /build/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:22-bookworm-slim AS backend-dependencies
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /build/backend
COPY backend/package.json backend/package-lock.json ./
COPY backend/prisma ./prisma
RUN npm ci \
  && npx prisma generate \
  && npm prune --omit=dev

FROM node:22-bookworm-slim AS runtime
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3001 \
    DATABASE_URL=file:/data/qabase.db \
    QABASE_FRONTEND_DIST=/app/frontend/dist

WORKDIR /app
COPY --from=backend-dependencies /build/backend/node_modules ./backend/node_modules
COPY backend/package.json backend/package-lock.json ./backend/
COPY backend/prisma ./backend/prisma
COPY backend/scripts ./backend/scripts
COPY backend/src ./backend/src
COPY --from=frontend-build /build/frontend/dist ./frontend/dist
COPY deploy/entrypoint.sh /usr/local/bin/qabase-entrypoint

RUN mkdir -p /data /backups \
  && chown -R node:node /app /data /backups \
  && chmod 0755 /usr/local/bin/qabase-entrypoint

USER node
WORKDIR /app/backend
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3001/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

ENTRYPOINT ["qabase-entrypoint"]
