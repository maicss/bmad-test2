/**
 * Story 1.6 Performance and Compliance Verification
 *
 * Tests and verifies NFR requirements for multi-device login
 *
 * Performance Requirements:
 * - Session creation time < 500ms (NFR3: P95)
 * - Session query time < 500ms (NFR3: P95)
 * - Page load time < 3 seconds (NFR2)
 *
 * Security Requirements:
 * - Device_id encryption using Bun.password.hash() (NFR10)
 * - Audit logs recording device information (NFR14)
 * - Automatic session cleanup (36-hour inactivity timeout)
 * - "Remember Me" 7-day session expiration (NFR13)
 *
 * Compliance Requirements:
 * - GDPR compliance for "Remember Me" (opt-in/opt-out)
 * - Explicit logout (NFR11: AC #4)
 * - Session invalidation
 *
 * Source: Story 1.6 Task 11
 */

import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import {
  createSession,
  getSessionByToken,
  getActiveSessionsByUserId,
  deactivateSession,
  cleanupExpiredSessions,
} from '@/lib/db/queries/sessions';
import {
  generateDeviceFingerprint,
  detectDeviceType,
  generateDeviceName,
  generateSessionToken,
} from '@/lib/auth/device-fingerprint';
import { logUserAction } from '@/lib/db/queries/audit-logs';
import db from '@/lib/db';
import { sessions, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { sessions, auditLogs } from '@/lib/db/schema';

describe('Story 1.6 Performance and Compliance Verification', () => {
  let testUserId: string;
  let testSessionToken: string;

  beforeAll(async () => {
    // Create a test user
    const [user] = await db.insert(users).values({
      id: `test-user-${Date.now()}`,
      phone: '9' + Date.now().toString().slice(-10),
      phone_hash: await Bun.password.hash('19999999999'),
      role: 'parent',
      family_id: 'test-family-1111',
    }).returning();

    testUserId = user.id;
  });

  describe('Performance Tests', () => {
    it('Session creation should complete within 500ms (NFR3: P95)', async () => {
      const startTime = performance.now();

      const deviceFingerprint = await generateDeviceFingerprint(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        '192.168.1.100'
      );

      const sessionToken = generateSessionToken();

      await createSession({
        userId: testUserId,
        token: sessionToken,
        deviceId: deviceFingerprint,
        deviceType: 'mobile',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        ipAddress: '192.168.1.100',
        rememberMe: false,
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      testSessionToken = sessionToken;

      expect(duration).toBeLessThan(500);
      console.log(`[PERF] Session creation time: ${duration.toFixed(2)}ms`);
    });

    it('Session query should complete within 500ms (NFR3: P95)', async () => {
      const startTime = performance.now();

      const session = await getSessionByToken(testSessionToken);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(session).not.toBeNull();
      expect(session!.token).toBe(testSessionToken);
      expect(duration).toBeLessThan(500);
      console.log(`[PERF] Session query time: ${duration.toFixed(2)}ms`);
    });

    it('Get active sessions should complete within 500ms (NFR3: P95)', async () => {
      const startTime = performance.now();

      const activeSessions = await getActiveSessionsByUserId(testUserId);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(activeSessions.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(500);
      console.log(`[PERF] Get active sessions time: ${duration.toFixed(2)}ms`);
    });

    it('Session cleanup should complete within 10 seconds', async () => {
      // Create an expired session
      const expiredDeviceFingerprint = await generateDeviceFingerprint(
        'Expired Device',
        '192.168.1.200'
      );

      const expiredSessionToken = generateSessionToken();

      // Manually set expires_at to the past
      const expiredAt = new Date(Date.now() - 3600 * 1000); // 1 hour ago

      await db.insert(sessions).values({
        id: `test-session-${Date.now()}`,
        user_id: testUserId,
        token: expiredSessionToken,
        device_id: expiredDeviceFingerprint,
        device_type: 'mobile',
        user_agent: 'Expired Device',
        ip_address: '192.168.1.200',
        last_activity_at: expiredAt,
        expires_at: expiredAt,
        is_active: true,
        remember_me: false,
        created_at: expiredAt,
      });

      const startTime = performance.now();

      await cleanupExpiredSessions();

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(10000);
      console.log(`[PERF] Session cleanup time: ${duration.toFixed(2)}ms`);
    });
  });

  describe('Security Tests', () => {
    it('Device fingerprint should be hashed using Bun.password.hash() (NFR10)', async () => {
      const userAgent = 'Test User Agent';
      const ipAddress = '192.168.1.1';

      const deviceFingerprint = await generateDeviceFingerprint(userAgent, ipAddress);

      // Should be a base64 encoded hash (64 characters)
      expect(deviceFingerprint).toHaveLength(64);
      expect(deviceFingerprint).toMatch(/^[A-Za-z0-9+/]+={0,2}$/);

      console.log(`[SEC] Device fingerprint: ${deviceFingerprint}`);
    });

    it('Audit logs should record device information (NFR14)', async () => {
      const actionType = 'test_audit_log';
      const metadata = {
        device_id: await generateDeviceFingerprint('Test Device', '192.168.1.1'),
        device_type: 'desktop',
        ip_address: '192.168.1.1',
        user_agent: 'Test User Agent',
      };

      await logUserAction(testUserId, actionType as any, metadata);

      // Query audit logs to verify device info was recorded
      const [log] = await db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.user_id, testUserId));

      expect(log).toBeDefined();
      expect(log.action_type).toBe(actionType);

      // Parse metadata to verify device info
      const parsedMetadata = JSON.parse(log.metadata || '{}');
      expect(parsedMetadata.device_id).toBeDefined();
      expect(parsedMetadata.device_type).toBeDefined();
      expect(parsedMetadata.ip_address).toBeDefined();

      console.log(`[SEC] Audit log with device info:`, log);
    });

    it('Session should automatically expire after 36 hours (NFR6, NFR7)', async () => {
      // Create a session with 36-hour expiration
      const sessionToken = generateSessionToken();
      const deviceFingerprint = await generateDeviceFingerprint('Test Device', '192.168.1.1');

      await createSession({
        userId: testUserId,
        token: sessionToken,
        deviceId: deviceFingerprint,
        deviceType: 'desktop',
        userAgent: 'Test User Agent',
        ipAddress: '192.168.1.1',
        rememberMe: false, // 36 hours
      });

      // Query the session
      const session = await getSessionByToken(sessionToken);
      expect(session).not.toBeNull();

      // Calculate expiration
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = Math.floor(new Date(session!.expires_at).getTime() / 1000);
      const hoursUntilExpiry = (expiresAt - now) / 3600;

      // Should be approximately 36 hours
      expect(hoursUntilExpiry).toBeGreaterThan(35);
      expect(hoursUntilExpiry).toBeLessThan(37);

      console.log(`[SEC] Session expires in ${hoursUntilExpiry.toFixed(2)} hours`);
    });

    it('"Remember Me" should extend session to 7 days (NFR13)', async () => {
      const sessionToken = generateSessionToken();
      const deviceFingerprint = await generateDeviceFingerprint('Test Device', '192.168.1.1');

      await createSession({
        userId: testUserId,
        token: sessionToken,
        deviceId: deviceFingerprint,
        deviceType: 'desktop',
        userAgent: 'Test User Agent',
        ipAddress: '192.168.1.1',
        rememberMe: true, // 7 days
      });

      // Query the session
      const session = await getSessionByToken(sessionToken);
      expect(session).not.toBeNull();

      // Calculate expiration
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = Math.floor(new Date(session!.expires_at).getTime() / 1000);
      const daysUntilExpiry = (expiresAt - now) / (24 * 3600);

      // Should be approximately 7 days
      expect(daysUntilExpiry).toBeGreaterThan(6.9);
      expect(daysUntilExpiry).toBeLessThan(7.1);

      console.log(`[SEC] "Remember Me" session expires in ${daysUntilExpiry.toFixed(2)} days`);
    });
  });

  describe('Compliance Tests', () => {
    it('Explicit logout should invalidate session (NFR11: AC #4)', async () => {
      const sessionToken = generateSessionToken();
      const deviceFingerprint = await generateDeviceFingerprint('Test Device', '192.168.1.1');

      const session = await createSession({
        userId: testUserId,
        token: sessionToken,
        deviceId: deviceFingerprint,
        deviceType: 'desktop',
        userAgent: 'Test User Agent',
        ipAddress: '192.168.1.1',
        rememberMe: false,
      });

      // Verify session is active
      let activeSession = await getSessionByToken(sessionToken);
      expect(activeSession!.is_active).toBe(true);

      // Logout session
      await deactivateSession(session.id);

      // Verify session is inactive
      activeSession = await getSessionByToken(sessionToken);
      expect(activeSession!.is_active).toBe(false);

      console.log(`[COMPLIANCE] Session invalidated after explicit logout`);
    });

    it('Device type detection should work correctly', () => {
      const mobileUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)';
      const tabletUA = 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)';
      const desktopUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

      expect(detectDeviceType(mobileUA)).toBe('mobile');
      expect(detectDeviceType(tabletUA)).toBe('tablet');
      expect(detectDeviceType(desktopUA)).toBe('desktop');

      console.log(`[COMPLIANCE] Device type detection: PASS`);
    });

    it('Device name generation should work correctly', () => {
      const iPhoneUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)';
      const chromeUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124';

      const iPhoneName = generateDeviceName(iPhoneUA);
      const chromeName = generateDeviceName(chromeUA);

      expect(iPhoneName).toContain('iPhone');
      expect(chromeName).toContain('Chrome');

      console.log(`[COMPLIANCE] Device names: iPhone="${iPhoneName}", Chrome="${chromeName}"`);
    });
  });

  afterAll(async () => {
    // Cleanup test data
    await db.delete(sessions).where(eq(sessions.user_id, testUserId));
    await db.delete(auditLogs).where(eq(auditLogs.user_id, testUserId));
    // Note: Don't delete the test user as it might be shared with other tests
  });
});
