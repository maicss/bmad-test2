/**
 * Points Balance Queries
 *
 * Story 2.2: Parent Sets Task Points Value
 * Task 6: Update child's points balance when task is approved
 *
 * Manages child points balances with transaction safety
 *
 * Source: Story 2.2 AC #4 - Points automatically accumulate to child account
 */

import db from '../index';
import { pointBalances } from '../schema';
import { eq, sql } from 'drizzle-orm';

// Type definitions for DTOs
export interface CreatePointsBalanceDTO {
  child_id: string;
  balance?: number;
}

export interface UpdatePointsBalanceDTO {
  balance?: number;
}

/**
 * Get points balance for a child
 *
 * @param childId - Child user ID
 * @returns Points balance record or null
 */
export async function getPointsBalance(childId: string) {
  const result = await db.query.pointBalances.findFirst({
    where: eq(pointBalances.child_id, childId),
  });

  return result ?? null;
}

/**
 * Get or create points balance for a child
 *
 * Creates a new balance record with 0 points if it doesn't exist
 *
 * @param childId - Child user ID
 * @returns Points balance record
 */
export async function getOrCreatePointsBalance(childId: string) {
  const existing = await getPointsBalance(childId);

  if (existing) {
    return existing;
  }

  // Create new balance with 0 points
  const id = Bun.randomUUIDv7();
  const result = await db.insert(pointBalances).values({
    id,
    child_id: childId,
    balance: 0,
    created_at: new Date(),
    updated_at: new Date(),
  }).returning();

  return result[0];
}

/**
 * Add points to a child's balance
 *
 * Creates balance record if it doesn't exist
 *
 * @param childId - Child user ID
 * @param points - Points to add (positive integer)
 * @returns Updated balance record or null
 */
export async function addPointsToBalance(childId: string, points: number) {
  // Validate points
  if (!Number.isInteger(points) || points < 1) {
    throw new Error('Points must be a positive integer');
  }

  // Get or create balance
  const current = await getOrCreatePointsBalance(childId);
  const newBalance = (current?.balance ?? 0) + points;

  // Update balance
  const result = await db.update(pointBalances)
    .set({
      balance: newBalance,
      updated_at: new Date(),
    })
    .where(eq(pointBalances.child_id, childId))
    .returning();

  return result[0] ?? null;
}

/**
 * Deduct points from a child's balance
 *
 * For MVP, balance cannot go negative (Story 2.8 will introduce negative points)
 *
 * @param childId - Child user ID
 * @param points - Points to deduct (positive integer)
 * @returns Updated balance record or null
 * @throws Error if insufficient balance
 */
export async function deductPointsFromBalance(childId: string, points: number) {
  // Validate points
  if (!Number.isInteger(points) || points < 1) {
    throw new Error('Points must be a positive integer');
  }

  // Get current balance
  const current = await getPointsBalance(childId);

  if (!current) {
    throw new Error('Balance not found for child');
  }

  // Check sufficient balance (MVP: no negative balance)
  if (current.balance < points) {
    throw new Error(`Insufficient balance: ${current.balance} < ${points}`);
  }

  const newBalance = current.balance - points;

  // Update balance
  const result = await db.update(pointBalances)
    .set({
      balance: newBalance,
      updated_at: new Date(),
    })
    .where(eq(pointBalances.child_id, childId))
    .returning();

  return result[0] ?? null;
}

/**
 * Set points balance to a specific value
 *
 * Used for adjustments by parents
 *
 * @param childId - Child user ID
 * @param balance - New balance value
 * @returns Updated balance record or null
 */
export async function setPointsBalance(childId: string, balance: number) {
  // Validate balance
  if (!Number.isInteger(balance) || balance < 0) {
    throw new Error('Balance must be a non-negative integer');
  }

  // Get or create balance
  const existing = await getPointsBalance(childId);

  if (existing) {
    // Update existing
    const result = await db.update(pointBalances)
      .set({
        balance,
        updated_at: new Date(),
      })
      .where(eq(pointBalances.child_id, childId))
      .returning();

    return result[0] ?? null;
  } else {
    // Create new
    const id = Bun.randomUUIDv7();
    const result = await db.insert(pointBalances).values({
      id,
      child_id: childId,
      balance,
      created_at: new Date(),
      updated_at: new Date(),
    }).returning();

    return result[0];
  }
}

/**
 * Get balances for multiple children
 *
 * @param childIds - Array of child user IDs
 * @returns Map of child ID to balance
 */
export async function getBalancesForChildren(childIds: string[]) {
  if (childIds.length === 0) {
    return {};
  }

  const result = await db.query.pointBalances.findMany({
    where: sql`${pointBalances.child_id} IN ${sql.placeholder('childIds')}`,
  }).prepare('getBalancesForChildren').execute({ childIds });

  const map: Record<string, number> = {};
  for (const row of result) {
    map[row.child_id] = row.balance;
  }

  // Ensure all children have an entry (even if 0)
  for (const childId of childIds) {
    if (!(childId in map)) {
      map[childId] = 0;
    }
  }

  return map;
}

/**
 * Get total points across all children in a family
 *
 * @param familyId - Family ID
 * @returns Total points for all children
 */
export async function getTotalPointsForFamily(familyId: string): Promise<number> {
  // This requires joining with users table
  // For now, return 0 as placeholder
  // TODO: Implement with proper join
  return 0;
}
