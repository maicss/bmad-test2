/**
 * Session query functions
 *
 * Story 1.6: Multi-device Login - Task 3
 */

import db from '@/lib/db';
import { sessions, userSessionDevices, deviceLocks, users } from '@/lib/db/schema';
import { eq, and, desc, lt, gte } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

export type NewSession = typeof sessions.$inferInsert;
export type NewUserSessionDevice = typeof userSessionDevices.$inferInsert;
export type NewDeviceLock = typeof deviceLocks.$inferInsert;

/**
 * Create a new session with device tracking
 *
 * @param data - Session data
 * @returns Created session
 */
export async function createSession(data: {
  userId: string;
  token: string;
  deviceId: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  userAgent: string;
  ipAddress: string;
  rememberMe: boolean;
}) {
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + (data.rememberMe ? 168 * 3600 : 36 * 3600); // 7 days or 36 hours

  const [session] = await db.insert(sessions).values({
    id: randomUUID(),
    user_id: data.userId,
    token: data.token,
    device_id: data.deviceId,
    device_type: data.deviceType,
    user_agent: data.userAgent,
    ip_address: data.ipAddress,
    last_activity_at: new Date(now * 1000),
    expires_at: new Date(expiresAt * 1000),
    is_active: true,
    remember_me: data.rememberMe,
    created_at: new Date(now * 1000),
  }).returning();

  return session;
}

/**
 * Get session by token
 *
 * @param token - Session token
 * @returns Session or null
 */
export async function getSessionByToken(token: string) {
  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.token, token));

  return session || null;
}

/**
 * Get all active sessions for a user
 *
 * @param userId - User ID
 * @returns Array of sessions
 */
export async function getActiveSessionsByUserId(userId: string) {
  const activeSessions = await db
    .select()
    .from(sessions)
    .where(
      and(
        eq(sessions.user_id, userId),
        eq(sessions.is_active, true)
      )
    )
    .orderBy(desc(sessions.last_activity_at));

  return activeSessions;
}

/**
 * Update session activity timestamp
 *
 * @param sessionId - Session ID
 * @returns Updated session or null
 */
export async function updateSessionActivity(sessionId: string) {
  const now = Math.floor(Date.now() / 1000);

  const [session] = await db
    .update(sessions)
    .set({
      last_activity_at: new Date(now * 1000),
    })
    .where(eq(sessions.id, sessionId))
    .returning();

  return session || null;
}

/**
 * Deactivate a session (logout)
 *
 * @param sessionId - Session ID
 * @returns Updated session or null
 */
export async function deactivateSession(sessionId: string) {
  const [session] = await db
    .update(sessions)
    .set({
      is_active: false,
    })
    .where(eq(sessions.id, sessionId))
    .returning();

  return session || null;
}

/**
 * Deactivate all sessions for a user
 *
 * @param userId - User ID
 * @returns Number of sessions deactivated
 */
export async function deactivateAllUserSessions(userId: string) {
  const result = await db
    .update(sessions)
    .set({
      is_active: false,
    })
    .where(
      and(
        eq(sessions.user_id, userId),
        eq(sessions.is_active, true)
      )
    );

  return result;
}

/**
 * Cleanup expired sessions
 *
 * Marks sessions as inactive if they've expired
 * Should be run periodically (e.g., every 30 minutes)
 *
 * @returns Number of sessions cleaned up
 */
export async function cleanupExpiredSessions() {
  const now = Math.floor(Date.now() / 1000);

  const result = await db
    .update(sessions)
    .set({
      is_active: false,
    })
    .where(
      and(
        eq(sessions.is_active, true),
        lt(sessions.expires_at, new Date(now * 1000))
      )
    );

  return result;
}

/**
 * Get active child session
 *
 * Used to enforce single-device login for children
 *
 * @param userId - User ID (child)
 * @returns Active session or null
 */
export async function getActiveChildSession(userId: string) {
  const [session] = await db
    .select()
    .from(sessions)
    .where(
      and(
        eq(sessions.user_id, userId),
        eq(sessions.is_active, true)
      )
    );

  return session || null;
}

// ============ User Session Devices ============

/**
 * Create or update user session device
 *
 * @param data - Device data
 * @returns Created/updated device record
 */
export async function upsertUserSessionDevice(data: {
  userId: string;
  deviceId: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  deviceName: string;
  isTrusted?: boolean;
}) {
  const now = Math.floor(Date.now() / 1000);

  // Try to find existing device
  const [existing] = await db
    .select()
    .from(userSessionDevices)
    .where(eq(userSessionDevices.device_id, data.deviceId));

  if (existing) {
    // Update existing device
    const [updated] = await db
      .update(userSessionDevices)
      .set({
        last_login_at: new Date(now * 1000),
        device_name: data.deviceName,
        ...(data.isTrusted !== undefined ? { is_trusted: data.isTrusted } : {}),
      })
      .where(eq(userSessionDevices.id, existing.id))
      .returning();

    return updated;
  } else {
    // Create new device
    const [created] = await db.insert(userSessionDevices).values({
      id: randomUUID(),
      user_id: data.userId,
      device_id: data.deviceId,
      device_type: data.deviceType,
      device_name: data.deviceName,
      first_login_at: new Date(now * 1000),
      last_login_at: new Date(now * 1000),
      is_trusted: data.isTrusted || false,
      created_at: new Date(now * 1000),
    }).returning();

    return created;
  }
}

/**
 * Get user's session devices
 *
 * @param userId - User ID
 * @returns Array of devices
 */
export async function getUserSessionDevices(userId: string) {
  const devices = await db
    .select()
    .from(userSessionDevices)
    .where(eq(userSessionDevices.user_id, userId))
    .orderBy(desc(userSessionDevices.last_login_at));

  return devices;
}

/**
 * Check if device is trusted for user
 *
 * @param userId - User ID
 * @param deviceId - Device ID
 * @returns True if trusted
 */
export async function isDeviceTrusted(userId: string, deviceId: string): Promise<boolean> {
  const [device] = await db
    .select()
    .from(userSessionDevices)
    .where(
      and(
        eq(userSessionDevices.user_id, userId),
        eq(userSessionDevices.device_id, deviceId),
        eq(userSessionDevices.is_trusted, true)
      )
    );

  return !!device;
}

// ============ Device Locks ============

/**
 * Create or update device lock
 *
 * @param data - Lock data
 * @returns Created/updated lock record
 */
export async function upsertDeviceLock(data: {
  userId: string;
  deviceId: string;
  lockReason: 'rate_limit' | 'security' | 'suspicious';
  failedAttempts?: number;
  lockEndAt?: number;
}) {
  const now = Math.floor(Date.now() / 1000);

  // Try to find existing lock
  const [existing] = await db
    .select()
    .from(deviceLocks)
    .where(
      and(
        eq(deviceLocks.user_id, data.userId),
        eq(deviceLocks.device_id, data.deviceId)
      )
    );

  if (existing) {
    // Update existing lock
    const [updated] = await db
      .update(deviceLocks)
      .set({
        failed_attempts: data.failedAttempts || 0,
        lock_end_at: data.lockEndAt ? new Date(data.lockEndAt * 1000) : undefined,
      })
      .where(eq(deviceLocks.id, existing.id))
      .returning();

    return updated;
  } else {
    // Create new lock
    const [created] = await db.insert(deviceLocks).values({
      id: randomUUID(),
      user_id: data.userId,
      device_id: data.deviceId,
      lock_reason: data.lockReason,
      lock_start_at: new Date(now * 1000),
      lock_end_at: data.lockEndAt ? new Date(data.lockEndAt * 1000) : null,
      failed_attempts: data.failedAttempts || 0,
      created_at: new Date(now * 1000),
    }).returning();

    return created;
  }
}

/**
 * Check if device is locked
 *
 * @param userId - User ID
 * @param deviceId - Device ID
 * @returns Lock record if locked, null otherwise
 */
export async function getDeviceLock(userId: string, deviceId: string) {
  const now = Math.floor(Date.now() / 1000);

  const [lock] = await db
    .select()
    .from(deviceLocks)
    .where(
      and(
        eq(deviceLocks.user_id, userId),
        eq(deviceLocks.device_id, deviceId),
        gte(deviceLocks.lock_end_at, new Date(now * 1000))
      )
    );

  return lock || null;
}

/**
 * Reset device lock
 *
 * Called on successful login to unlock device
 *
 * @param userId - User ID
 * @param deviceId - Device ID
 * @returns Number of locks reset
 */
export async function resetDeviceLock(userId: string, deviceId: string) {
  const result = await db
    .delete(deviceLocks)
    .where(
      and(
        eq(deviceLocks.user_id, userId),
        eq(deviceLocks.device_id, deviceId)
      )
    );

  return result;
}

/**
 * Increment failed login attempts for device
 *
 * Returns lock status if device should be locked
 *
 * @param userId - User ID
 * @param deviceId - Device ID
 * @returns Lock record if device locked, null otherwise
 */
export async function incrementFailedAttempts(
  userId: string,
  deviceId: string
): Promise<NewDeviceLock | null> {
  // Get current lock status
  const [existing] = await db
    .select()
    .from(deviceLocks)
    .where(
      and(
        eq(deviceLocks.user_id, userId),
        eq(deviceLocks.device_id, deviceId)
      )
    );

  const now = Math.floor(Date.now() / 1000);
  const attempts = existing ? existing.failed_attempts + 1 : 1;

  // Progressive locking:
  // 5 attempts → 10 min lock
  // 10 attempts → 30 min lock
  // 20 attempts → 1 hour lock
  let lockEndAt: number | undefined;
  if (attempts >= 20) {
    lockEndAt = now + 3600; // 1 hour
  } else if (attempts >= 10) {
    lockEndAt = now + 1800; // 30 minutes
  } else if (attempts >= 5) {
    lockEndAt = now + 600; // 10 minutes
  }

  if (lockEndAt) {
    // Create or update lock
    const lock = await upsertDeviceLock({
      userId,
      deviceId,
      lockReason: 'rate_limit',
      failedAttempts: attempts,
      lockEndAt,
    });

    return lock;
  } else {
    // Just update attempts without locking
    await upsertDeviceLock({
      userId,
      deviceId,
      lockReason: 'rate_limit',
      failedAttempts: attempts,
    });

    return null;
  }
}
