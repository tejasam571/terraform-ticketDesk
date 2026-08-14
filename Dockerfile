# ============================================================
# Argo Suite — single-image build (frontend + backend + database)
# ============================================================

# ---- Stage 1: build the frontend static assets ----
FROM node:20-alpine AS frontend-build
WORKDIR /src/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---- Stage 2: install backend production dependencies ----
FROM node:20-alpine AS backend-deps
RUN apk add --no-cache python3 make g++
WORKDIR /src/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev

# ---- Stage 3: final runtime image (node + postgres + nginx + supervisord) ----
FROM node:20-alpine AS final

RUN apk add --no-cache \
      postgresql16 postgresql16-contrib \
      nginx \
      supervisor \
      su-exec \
      bash \
    || apk add --no-cache \
      postgresql15 postgresql15-contrib \
      nginx \
      supervisor \
      su-exec \
      bash

# --- Backend ---
WORKDIR /app/backend
COPY --from=backend-deps /src/backend/node_modules ./node_modules
COPY backend/package*.json ./
COPY backend/src ./src
RUN mkdir -p uploads

# --- Frontend (served by nginx) ---
COPY --from=frontend-build /src/frontend/dist /usr/share/nginx/html

# --- Nginx & supervisord config ---
COPY docker/nginx.conf /etc/nginx/http.d/default.conf
COPY docker/supervisord.conf /etc/supervisor/supervisord.conf
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# --- App defaults (override any of these with `docker run -e ...`) ---
ENV PORT=5000 \
    NODE_ENV=production \
    JWT_SECRET=change_this_to_a_long_random_secret_in_production \
    JWT_EXPIRES_IN=7d \
    CLIENT_ORIGIN=http://localhost \
    DB_HOST=localhost \
    DB_PORT=5432 \
    DB_USER=argo_admin \
    DB_PASSWORD=change_this_password \
    DB_NAME=argosuite \
    DB_SSL=false \
    PGDATA=/var/lib/postgresql/data

# Persist database data across container restarts if the volume is mounted
VOLUME ["/var/lib/postgresql/data"]

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]