import { drizzle } from 'drizzle-orm/bun-sqlite';
import * as schema from './schema';

/**
 * Database connection using Bun's SQLite runtime
 *
 * Source: AGENTS.md - MUST use bun:sqlite, NO Node.js compatibility layer
 */
const db = drizzle({
  schema,
  connection: {
    source: Bun.env.DATABASE_URL || 'database/db.sqlite',
  },
  logger: false,
});

export default db;
