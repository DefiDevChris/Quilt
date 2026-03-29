#!/usr/bin/env bash
# Drop the local database and recreate from scratch.
set -euo pipefail
cd "$(dirname "$0")/.."

export DATABASE_URL="postgresql://quiltcorgi:localdev@localhost:5432/quiltcorgi"

echo "=== Dropping local database ==="
docker compose exec -T postgres psql -U quiltcorgi -c "DROP SCHEMA IF EXISTS drizzle CASCADE; DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

echo ""
echo "=== Pushing schema to database ==="
echo "y" | npx drizzle-kit push 2>&1 || npx drizzle-kit push --force 2>&1 || {
  echo "Falling back to migrations..."
  npx drizzle-kit migrate 2>&1
  docker compose exec -T postgres psql -U quiltcorgi -c 'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "cognitoSub" varchar(255) UNIQUE;' 2>/dev/null || true
}

echo ""
echo "=== Seeding database ==="
npx tsx scripts/db-seed-all.ts

echo ""
echo "=== Database reset complete ==="
