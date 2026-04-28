import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

const connectionString =
  process.env.DATABASE_URL || 'postgresql://quiltcorgi:localdev@localhost:5432/quiltcorgi';

const pool = new Pool({ connectionString });
const db = drizzle(pool);

async function main() {
  console.log('Resetting public schema...');
  await pool.query('DROP SCHEMA public CASCADE;');
  await pool.query('CREATE SCHEMA public;');
  await pool.query('GRANT ALL ON SCHEMA public TO public;');

  console.log('Running migrations from src/db/migrations...');
  await migrate(db, { migrationsFolder: './src/db/migrations' });
  console.log('Migrations complete!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
