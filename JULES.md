# Jules Environment Setup Script

Paste the following into **Jules → Configuration → Initial Setup → Run and Snapshot**.

```bash
npm install

sudo apt-get update && sudo apt-get install -y postgresql postgresql-contrib
sudo pg_ctlcluster 16 main start
sudo -u postgres psql -c "CREATE USER quiltcorgi WITH PASSWORD 'localdev';" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE quiltcorgi OWNER quiltcorgi;" 2>/dev/null || true

export DATABASE_URL=postgresql://quiltcorgi:localdev@localhost:5432/quiltcorgi

echo "DATABASE_URL=${DATABASE_URL}" > .env.local
echo "AWS_SECRET_NAME=skip" >> .env.local
echo "COGNITO_USER_POOL_ID=us-east-1_dummy" >> .env.local
echo "COGNITO_CLIENT_ID=dummy" >> .env.local
echo "COGNITO_REGION=us-east-1" >> .env.local
echo "NEXT_PUBLIC_APP_URL=http://localhost:3000" >> .env.local

npx drizzle-kit push

npx tsx src/db/seed/seedFabrics.ts
npx tsx src/db/seed/seedBlocksFromFiles.ts
npx tsx src/db/seed/seed-layouts.ts 2>/dev/null || true

npx playwright install --with-deps chromium

npm run dev &
DEV_PID=$!
echo "Waiting for dev server on port 3000..."
for i in $(seq 1 30); do
  curl -s http://localhost:3000 > /dev/null 2>&1 && break
  sleep 2
done

npx playwright test --project=chromium

# Kill dev server so the script exits cleanly for snapshot
kill $DEV_PID 2>/dev/null || true
```

## What this does

1. **`npm install`** — installs all dependencies
2. **PostgreSQL** — installs via apt (avoids Docker Hub rate limit in Jules)
3. **`.env.local`** — writes dummy env vars so Next.js doesn't crash
4. **`drizzle-kit push`** — pushes schema to the empty DB
5. **Seed data** — 2,764 fabrics, 50 system blocks, layout templates
6. **Playwright Chromium** — installs browser + system deps
7. **Dev server** — starts in background, waits for port 3000
8. **E2E tests** — runs all 30 specs on Chromium (245+ pass, ~289 skipped)
9. **Cleanup** — kills dev server so snapshot completes cleanly

## Known skipped tests

~289 tests are skipped because they require authenticated Cognito sessions, which aren't available in the Jules sandbox. The 245 passing tests cover studio, toolbar, blocks, fabrics, layouts, worktables, undo/redo, export, dashboard, and more.

## Re-running tests in a Jules task

Once the snapshot is saved, run tests with:

```bash
npx playwright test --project=chromium
```
