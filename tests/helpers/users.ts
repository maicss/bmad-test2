/**
 * Test helpers for user-related operations
 */

import db from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

let testUserCounter = 0;

export async function createParent(data?: {
  family_id?: string;
  phone?: string;
}) {
  const id = `test-parent-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  testUserCounter++;

  const result = await db.insert(users).values({
    id,
    phone: data?.phone || `19999999${String(testUserCounter).padStart(4, '0')}`,
    phone_hash: `test-hash-${id}`,
    role: 'parent',
    family_id: data?.family_id,
  }).returning();

  return result[0]!;
}

export async function createChild(data?: {
  family_id?: string;
  phone?: string;
}) {
  const id = `test-child-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  testUserCounter++;

  const result = await db.insert(users).values({
    id,
    phone: data?.phone || `19999999${String(testUserCounter).padStart(4, '0')}`,
    phone_hash: `test-hash-${id}`,
    role: 'child',
    family_id: data?.family_id,
  }).returning();

  return result[0]!;
}

export async function deleteUser(userId: string) {
  await db.delete(users).where(eq(users.id, userId));
}
