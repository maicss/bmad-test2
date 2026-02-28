import db from './lib/db';

async function initDatabase() {
  console.log('Initializing database...');

  // Users table with default values
  await db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      phone TEXT NOT NULL UNIQUE,
      phone_hash TEXT NOT NULL,
      password_hash TEXT,
      role TEXT NOT NULL DEFAULT 'parent',
      family_id TEXT,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      phoneNumber TEXT,
      phoneNumberVerified INTEGER DEFAULT 0,
      name TEXT,
      email TEXT,
      emailVerified INTEGER DEFAULT 0,
      image TEXT,
      createdAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      updatedAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    )
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS families (
      id TEXT PRIMARY KEY,
      primary_parent_id TEXT,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    )
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action_type TEXT NOT NULL,
      metadata TEXT,
      ip_address TEXT,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    )
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS pending_invitations (
      id TEXT PRIMARY KEY,
      token TEXT NOT NULL UNIQUE,
      inviter_user_id TEXT NOT NULL,
      family_id TEXT NOT NULL,
      invited_phone TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      expires_at INTEGER NOT NULL
    )
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS verification (
      id TEXT PRIMARY KEY,
      identifier TEXT NOT NULL,
      value TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    )
  `);

  console.log('Database initialized successfully');
}

initDatabase().catch(console.error);
