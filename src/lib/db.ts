import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@/db/schema';

const connectionString = process.env.DATABASE_URL;
if (!connectionString && process.env.NODE_ENV === 'production') {
  throw new Error('DATABASE_URL must be set in production');
}

const pool = new Pool({
  connectionString: connectionString ?? 'postgresql://localhost:5432/quiltcorgi',
  max:
    parseInt(process.env.DATABASE_POOL_SIZE ?? '', 10) ||
    (process.env.NODE_ENV === 'production' ? 10 : 5),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 2_000,
  ssl:
    process.env.NODE_ENV === 'production' &&
    connectionString &&
    !/localhost|127\.0\.0\.1/.test(connectionString)
      ? { rejectUnauthorized: true }
      : false,
  options: '-c statement_timeout=30000',
});

pool.on('error', () => {
  // Pool errors are handled by query execution
});

export const db = drizzle(pool, { schema });
