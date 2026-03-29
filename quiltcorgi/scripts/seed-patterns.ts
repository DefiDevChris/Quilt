import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { patternTemplates } from '../src/db/schema/patternTemplates';
import { getPatternTemplateSeeds } from '../src/db/seed/patternTemplateSeed';

async function main() {
  const pool = new pg.Pool({
    connectionString:
      process.env.DATABASE_URL ?? 'postgresql://quiltcorgi:localdev@localhost:5432/quiltcorgi',
  });
  const db = drizzle(pool);

  const seeds = getPatternTemplateSeeds();
  console.log(`Found ${seeds.length} patterns to seed`);

  for (const seed of seeds) {
    await db.insert(patternTemplates).values(seed).onConflictDoNothing();
    console.log(`  Seeded: ${seed.slug}`);
  }

  const rows = await db.select().from(patternTemplates);
  console.log(`\nTotal pattern_templates in DB: ${rows.length}`);

  for (const r of rows) {
    console.log(`  - ${r.slug} (${r.skillLevel}, ${r.finishedWidth}x${r.finishedHeight})`);
  }

  await pool.end();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
