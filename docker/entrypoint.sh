#!/bin/sh
set -e

: "${DB_USER:=argo_admin}"
: "${DB_PASSWORD:=change_this_password}"
: "${DB_NAME:=argosuite}"
export DB_USER DB_PASSWORD DB_NAME

PGDATA=/var/lib/postgresql/data

mkdir -p "$PGDATA" /var/log/supervisor /app/backend/uploads /run/postgresql
chown -R postgres:postgres /var/lib/postgresql /run/postgresql

echo "============================================"
echo "  Argo Suite — booting all-in-one container"
echo "============================================"

if [ ! -s "$PGDATA/PG_VERSION" ]; then
  echo "==> First run detected. Initializing PostgreSQL data directory..."
  su-exec postgres initdb -D "$PGDATA" --auth=trust --username=postgres > /var/log/supervisor/initdb.log 2>&1

  echo "==> Starting PostgreSQL temporarily to create app role/database..."
  su-exec postgres pg_ctl -D "$PGDATA" -o "-c listen_addresses=localhost" -w start

  su-exec postgres psql -v ON_ERROR_STOP=1 <<-SQL
    CREATE ROLE "${DB_USER}" LOGIN PASSWORD '${DB_PASSWORD}';
    CREATE DATABASE "${DB_NAME}" OWNER "${DB_USER}";
SQL

  echo "==> Seeding demo data (admin/itdesk/user accounts, sample tickets)..."
  (cd /app/backend && DB_HOST=localhost DB_PORT=5432 node src/db/seed.js) || \
    echo "==> Seeding failed or was skipped — the app will still start."

  su-exec postgres pg_ctl -D "$PGDATA" -w stop
  echo "==> Database role, database, and demo data are ready."
else
  echo "==> Existing PostgreSQL data directory found. Skipping init."
fi

echo "==> Handing off to supervisord (postgres + backend + nginx)..."
exec supervisord -c /etc/supervisor/supervisord.conf
