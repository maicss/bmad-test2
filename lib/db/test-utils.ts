/**
 * Test Utilities
 *
 * Helper functions for creating test data in tests
 */

import db from './index';
import { families, users, tasks, pointBalances } from './schema';
import { eq } from 'drizzle-orm';
import type { User } from './schema';

/**
 * Create a test family
 */
export async function createFamily() {
  const id = Bun.randomUUIDv7();
  const result = await db.insert(families).values({
    id,
    primary_parent_id: null,
  }).returning() as unknown as typeof families.$inferSelect[];

  return result[0];
}

/**
 * Create a test parent user
 */
export async function createParent(options: { familyId: string }) {
  const id = Bun.randomUUIDv7();
  const phone = `138${id.slice(-8)}`;
  const phoneHash = await Bun.password.hash(phone, 'bcrypt');
  const passwordHash = await Bun.password.hash('password123', 'bcrypt');

  const result = await db.insert(users).values({
    id,
    phone,
    phone_hash: phoneHash,
    password_hash: passwordHash,
    role: 'parent',
    family_id: options.familyId,
    name: `Parent-${id.slice(-8)}`,
  }).returning() as unknown as User[];

  return result[0];
}

/**
 * Create a test child user
 */
export async function createChild(options: { familyId: string }) {
  const id = Bun.randomUUIDv7();
  const pin = '111111';
  const pinHash = await Bun.password.hash(pin, 'bcrypt');

  const result = await db.insert(users).values({
    id,
    phone: `child_${id.slice(-8)}@test.local`,
    phone_hash: await Bun.password.hash(`child_${id.slice(-8)}`, 'bcrypt'),
    password_hash: pinHash,
    role: 'child',
    family_id: options.familyId,
    name: `Child-${id.slice(-8)}`,
  }).returning() as unknown as User[];

  const user = result[0];

  // Create points balance for child
  await db.insert(pointBalances).values({
    id: Bun.randomUUIDv7(),
    child_id: id,
    balance: 0,
  });

  return user;
}

/**
 * Clean up test data
 */
export async function cleanupTestData(familyId: string) {
  await db.delete(tasks).where(eq(tasks.family_id, familyId));
  await db.delete(pointBalances);
  await db.delete(users).where(eq(users.family_id, familyId));
  await db.delete(families).where(eq(families.id, familyId));
}
