import db from '../index';
import { families } from '../schema';
import { eq, desc } from 'drizzle-orm';
import type { Family, NewFamily } from '../schema';

/**
 * Query functions for families table
 *
 * Source: AGENTS.md - All queries must be in lib/db/queries/ directory, per-table files
 */

/**
 * Create a new family
 *
 * @param primaryParentId - ID of the primary parent who created the family
 * @returns Created family
 */
export async function createFamily(primaryParentId: string): Promise<Family> {
  const [family] = await db
    .insert(families)
    .values({
      id: Bun.randomUUIDv7(),
      primary_parent_id: primaryParentId,
    })
    .returning();

  return family;
}

/**
 * Get family by ID
 *
 * @param id - Family ID
 * @returns Family or null
 */
export async function getFamilyById(id: string): Promise<Family | null> {
  const [family] = await db
    .select()
    .from(families)
    .where(eq(families.id, id))
    .limit(1);

  return family || null;
}

/**
 * Get family by primary parent ID
 *
 * Returns the most recent family for the given primary parent (ORDER BY created_at DESC)
 *
 * @param primaryParentId - Primary parent ID
 * @returns Family or null
 */
export async function getFamilyByPrimaryParent(primaryParentId: string): Promise<Family | null> {
  const [family] = await db
    .select()
    .from(families)
    .where(eq(families.primary_parent_id, primaryParentId))
    .orderBy(desc(families.created_at))
    .limit(1);

  return family || null;
}
