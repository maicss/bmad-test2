import db from '../index';
import { auditLogs } from '../schema';
import { eq } from 'drizzle-orm';
import type { AuditLog, NewAuditLog } from '../schema';

/**
 * Query functions for audit_logs table
 *
 * Source: AGENTS.md - All queries must be in lib/db/queries/ directory, per-table files
 * Source: Story 1.1 AC #7 - NFR14: Operation audit logging
 */

/**
 * Log user action
 *
 * Records all critical operations for compliance and security:
 * - Registration, login, task creation, etc.
 * - Stores timestamp, IP address, and optional metadata
 *
 * Source: Story 1.1 AC #7 - NFR14
 *
 * @param userId - User ID who performed the action
 * @param actionType - Type of action (register, login, task_create, etc.)
 * @param metadata - Optional JSON metadata (e.g., auth_method: otp/password)
 * @param ipAddress - IP address of the request
 * @returns Created audit log entry
 */
export async function logUserAction(
  userId: string,
  actionType: string,
  metadata: Record<string, unknown> | null = null,
  ipAddress: string | null = null
): Promise<AuditLog> {
  const [log] = await db
    .insert(auditLogs)
    .values({
      id: Bun.randomUUIDv7(),
      user_id: userId,
      action_type: actionType,
      metadata: metadata ? JSON.stringify(metadata) : null,
      ip_address: ipAddress,
    })
    .returning();

  return log;
}

/**
 * Get audit logs by user ID
 *
 * @param userId - User ID
 * @param limit - Maximum number of logs to return (default: 100)
 * @returns Array of audit logs
 */
export async function getAuditLogsByUserId(
  userId: string,
  limit: number = 100
): Promise<AuditLog[]> {
  return await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.user_id, userId))
    .limit(limit)
    .orderBy(auditLogs.created_at);
}

/**
 * Get audit logs by action type
 *
 * @param actionType - Type of action to filter by
 * @param limit - Maximum number of logs to return (default: 100)
 * @returns Array of audit logs
 */
export async function getAuditLogsByActionType(
  actionType: string,
  limit: number = 100
): Promise<AuditLog[]> {
  return await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.action_type, actionType))
    .limit(limit)
    .orderBy(auditLogs.created_at);
}
