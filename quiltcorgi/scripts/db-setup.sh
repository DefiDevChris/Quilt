#!/usr/bin/env bash
# One-command local database setup: start postgres, push schema, seed data.
set -euo pipefail
cd "$(dirname "$0")/.."

export DATABASE_URL="postgresql://quiltcorgi:localdev@localhost:5432/quiltcorgi"

echo "=== Starting PostgreSQL container ==="
docker compose up -d --wait

echo ""
echo "=== Pushing schema to database ==="
# db:push syncs the Drizzle schema directly — no migration journal needed for local dev.
echo "y" | npx drizzle-kit push 2>&1 || npx drizzle-kit push --force 2>&1 || {
  echo "drizzle-kit push requires interactive mode. Falling back to migrations..."
  npx drizzle-kit migrate 2>&1
  # Apply any un-journaled migrations
  docker compose exec -T postgres psql -U quiltcorgi -c 'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "cognitoSub" varchar(255) UNIQUE;' 2>/dev/null || true
}

echo ""
echo "=== Seeding database ==="
npx tsx scripts/db-seed-all.ts

echo ""
echo "=== Local database ready ==="
echo "Connection: $DATABASE_URL"
echo ""
echo "Useful commands:"
echo "  npm run db:studio   — open Drizzle Studio (web UI)"
echo "  npm run db:seed:all — re-run all seeds"
echo "  npm run db:reset    — drop & recreate everything"
