import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@/db/schema';

const connectionString = process.env.DATABASE_URL;
if (!connectionString && process.env.NODE_ENV === 'production') {
  throw new Error('DATABASE_URL must be set in production');
}

const pool = new Pool({
  connectionString: connectionString ?? 'postgresql://localhost:5432/quiltcorgi',
  max: 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 2_000,
  statement_timeout: 30_000,
});

pool.on('error', (err) => {
  console.error('Unexpected pg pool error:', err);
});

export const db = drizzle(pool, { schema });
