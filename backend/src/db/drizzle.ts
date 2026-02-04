import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import type { Logger } from '../common/types/logger';
import * as schema from './schema';

let pool: Pool | null = null;

export type Database = NodePgDatabase<typeof schema>;

let db: Database | null = null;

function createPgPool(dbUrl: string): Pool {
  return new Pool({
    connectionString: dbUrl,
    connectionTimeoutMillis: 5_000,
    ssl: process.env.NODE_ENV === 'production',
  });
}

export function connectDB(dbUrl: string, logger: Logger): Database {
  pool = createPgPool(dbUrl);
  db = drizzle(pool, { schema });
  logger.info('database connected successfully');
  return db;
}

export async function disconnectDB(logger: Logger) {
  if (!pool) {
    return;
  }
  await pool.end();
  logger.info('database disconnected successfully');
}
