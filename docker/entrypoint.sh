#!/bin/sh
set -e

mkdir -p /var/log/supervisor /app/backend/uploads

echo "============================================"
echo "  Argo Suite — booting (using external RDS)"
echo "============================================"
echo "==> DB_HOST=${DB_HOST} DB_NAME=${DB_NAME}"

echo "==> Running seed/migration against RDS (safe to skip if already seeded)..."
(cd /app/backend && node src/db/seed.js) || \
  echo "==> Seeding failed or was skipped — the app will still start."

echo "==> Handing off to supervisord (backend + nginx)..."
exec supervisord -c /etc/supervisor/supervisord.conf