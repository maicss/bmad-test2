/**
 * Test helpers for family-related operations
 */

import db from '@/lib/db';
import { families } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function createFamily(data?: { primary_parent_id?: string }) {
  const id = `test-family-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  const result = await db.insert(families).values({
    id,
    primary_parent_id: data?.primary_parent_id || `test-parent-${id}`,
  }).returning();

  return result[0]!;
}

export async function deleteFamily(familyId: string) {
  await db.delete(families).where(eq(families.id, familyId));
}
