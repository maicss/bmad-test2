/**
 * Integration Tests for Sessions Query Functions
 *
 * Story 1.6: Multi-device Login - Task 3
 *
 * BDD Testing Requirement: Given-When-Then format with business language
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import db from '@/lib/db';
import { users, sessions, userSessionDevices, deviceLocks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import {
  createSession,
  getSessionByToken,
  getActiveSessionsByUserId,
  updateSessionActivity,
  deactivateSession,
  deactivateAllUserSessions,
  cleanupExpiredSessions,
  getActiveChildSession,
  upsertUserSessionDevice,
  getUserSessionDevices,
  isDeviceTrusted,
  upsertDeviceLock,
  getDeviceLock,
  resetDeviceLock,
  incrementFailedAttempts,
} from '@/lib/db/queries/sessions';

describe('Sessions Query Integration Tests', () => {
  let testUserId: string;
  let testDeviceId: string;
  let sessionToken: string;

  beforeAll(async () => {
    // Create test user
    testUserId = Bun.randomUUIDv7();
    testDeviceId = 'test-device-fingerprint-123';
    sessionToken = 'test-session-token-' + Bun.randomUUIDv7();

    await db.insert(users).values({
      id: testUserId,
      phone: '13999999999',
      phone_hash: 'hash',
      role: 'parent',
    });
  });

  beforeEach(async () => {
    // Clean up sessions before each test
    await db.delete(sessions).where(eq(sessions.user_id, testUserId));
    await db.delete(userSessionDevices).where(eq(userSessionDevices.user_id, testUserId));
    await db.delete(deviceLocks).where(eq(deviceLocks.user_id, testUserId));
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(sessions).where(eq(sessions.user_id, testUserId));
    await db.delete(userSessionDevices).where(eq(userSessionDevices.user_id, testUserId));
    await db.delete(deviceLocks).where(eq(deviceLocks.user_id, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  describe('Session CRUD Operations', () => {
    describe('given 创建会话，when 提供会话数据，then 创建会话成功', () => {
      it('should create session successfully', async () => {
        // Given: 会话数据
        const sessionData = {
          userId: testUserId,
          token: sessionToken,
          deviceId: testDeviceId,
          deviceType: 'desktop' as const,
          userAgent: 'Test User Agent',
          ipAddress: '192.168.1.1',
          rememberMe: false,
        };

        // When: 创建会话
        const session = await createSession(sessionData);

        // Then: 创建成功
        expect(session).toBeDefined();
        expect(session.user_id).toBe(testUserId);
        expect(session.token).toBe(sessionToken);
        expect(session.device_id).toBe(testDeviceId);
        expect(session.device_type).toBe('desktop');
        expect(session.is_active).toBe(true);
        expect(session.remember_me).toBe(false);

        // Verify expiration time (36 hours = 129600 seconds)
        const now = Math.floor(Date.now() / 1000);
        const expiresAt = Math.floor(new Date(session.expires_at).getTime() / 1000);
        expect(expiresAt - now).toBeCloseTo(36 * 3600, 0);
      });
    });

    describe('given 创建记住会话，when 设置rememberMe，then 过期时间为7天', () => {
      it('should create session with 7 day expiration for remember me', async () => {
        // Given: 记住会话的数据
        const sessionData = {
          userId: testUserId,
          token: sessionToken + '-remember',
          deviceId: testDeviceId,
          deviceType: 'mobile' as const,
          userAgent: 'Test User Agent',
          ipAddress: '192.168.1.1',
          rememberMe: true,
        };

        // When: 创建记住会话
        const session = await createSession(sessionData);

        // Then: 过期时间为7天
        expect(session.remember_me).toBe(true);

        const now = Math.floor(Date.now() / 1000);
        const expiresAt = Math.floor(new Date(session.expires_at).getTime() / 1000);
        expect(expiresAt - now).toBeCloseTo(168 * 3600, 0); // 7 days
      });
    });

    describe('given 查询会话，when 使用token查询，then 返回会话数据', () => {
      it('should get session by token', async () => {
        // Given: 创建会话
        const sessionData = {
          userId: testUserId,
          token: sessionToken,
          deviceId: testDeviceId,
          deviceType: 'tablet' as const,
          userAgent: 'Test User Agent',
          ipAddress: '192.168.1.1',
          rememberMe: false,
        };
        await createSession(sessionData);

        // When: 使用token查询
        const session = await getSessionByToken(sessionToken);

        // Then: 返回会话数据
        expect(session).toBeDefined();
        expect(session?.token).toBe(sessionToken);
        expect(session?.user_id).toBe(testUserId);
      });
    });

    describe('given 查询不存在的token，when 查询会话，then 返回null', () => {
      it('should return null for non-existent token', async () => {
        // Given: 不存在的token
        const nonExistentToken = 'non-existent-token';

        // When: 查询会话
        const session = await getSessionByToken(nonExistentToken);

        // Then: 返回null
        expect(session).toBeNull();
      });
    });

    describe('given 获取用户活动会话，when 查询用户会话，then 返回所有活动会话', () => {
      it('should get all active sessions for user', async () => {
        // Given: 用户有多个活动会话
        await createSession({
          userId: testUserId,
          token: sessionToken + '-1',
          deviceId: testDeviceId + '-1',
          deviceType: 'desktop',
          userAgent: 'Desktop Browser',
          ipAddress: '192.168.1.1',
          rememberMe: false,
        });
        await createSession({
          userId: testUserId,
          token: sessionToken + '-2',
          deviceId: testDeviceId + '-2',
          deviceType: 'mobile',
          userAgent: 'Mobile App',
          ipAddress: '192.168.1.2',
          rememberMe: true,
        });

        // When: 获取活动会话
        const activeSessions = await getActiveSessionsByUserId(testUserId);

        // Then: 返回所有活动会话
        expect(activeSessions.length).toBe(2);
        expect(activeSessions.every(s => s.is_active === true)).toBe(true);
      });
    });

    describe('given 更新会话活动时间，when 调用更新函数，then 返回更新的会话', () => {
      it('should update session activity timestamp', async () => {
        // Given: 创建会话
        const session = await createSession({
          userId: testUserId,
          token: sessionToken,
          deviceId: testDeviceId,
          deviceType: 'desktop',
          userAgent: 'Test',
          ipAddress: '192.168.1.1',
          rememberMe: false,
        });

        // Wait to ensure different second
        await new Promise(resolve => setTimeout(resolve, 1100));

        // When: 更新活动时间
        const updatedSession = await updateSessionActivity(session.id);

        // Then: 返回更新的会话
        expect(updatedSession).toBeDefined();
        expect(updatedSession?.id).toBe(session.id);
        expect(updatedSession?.is_active).toBe(true);
      });
    });

    describe('given 停用会话，when 调用停用函数，then is_active变为false', () => {
      it('should deactivate session', async () => {
        // Given: 创建活动会话
        const session = await createSession({
          userId: testUserId,
          token: sessionToken,
          deviceId: testDeviceId,
          deviceType: 'desktop',
          userAgent: 'Test',
          ipAddress: '192.168.1.1',
          rememberMe: false,
        });
        expect(session.is_active).toBe(true);

        // When: 停用会话
        const deactivated = await deactivateSession(session.id);

        // Then: is_active变为false
        expect(deactivated).toBeDefined();
        expect(deactivated?.is_active).toBe(false);
      });
    });

    describe('given 停用用户所有会话，when 调用停用函数，then 所有会话被停用', () => {
      it('should deactivate all user sessions', async () => {
        // Given: 用户有多个活动会话
        await createSession({
          userId: testUserId,
          token: sessionToken + '-1',
          deviceId: testDeviceId + '-1',
          deviceType: 'desktop',
          userAgent: 'Test',
          ipAddress: '192.168.1.1',
          rememberMe: false,
        });
        await createSession({
          userId: testUserId,
          token: sessionToken + '-2',
          deviceId: testDeviceId + '-2',
          deviceType: 'mobile',
          userAgent: 'Test',
          ipAddress: '192.168.1.2',
          rememberMe: false,
        });

        // Verify active sessions exist
        const activeBefore = await getActiveSessionsByUserId(testUserId);
        expect(activeBefore.length).toBe(2);

        // When: 停用所有会话
        await deactivateAllUserSessions(testUserId);

        // Then: 所有不活动的会话不再返回
        const activeSessions = await getActiveSessionsByUserId(testUserId);
        expect(activeSessions.length).toBe(0);
      });
    });

    describe('given 儿童有活动会话，when 查询活动会话，then 返回该会话', () => {
      it('should get active child session', async () => {
        // Given: 儿童用户有活动会话
        const childSession = await createSession({
          userId: testUserId,
          token: sessionToken + '-child',
          deviceId: testDeviceId + '-child',
          deviceType: 'tablet',
          userAgent: 'Child App',
          ipAddress: '192.168.1.3',
          rememberMe: false,
        });

        // When: 查询儿童活动会话
        const activeSession = await getActiveChildSession(testUserId);

        // Then: 返回该会话
        expect(activeSession).toBeDefined();
        expect(activeSession?.id).toBe(childSession.id);
        expect(activeSession?.is_active).toBe(true);
      });
    });

    describe('given 清理过期会话，when 运行清理函数，then 标记过期会话为不活动', () => {
      it('should cleanup expired sessions', async () => {
        // Given: 有过期的会话（手动设置过期时间）
        const session = await createSession({
          userId: testUserId,
          token: sessionToken,
          deviceId: testDeviceId,
          deviceType: 'desktop',
          userAgent: 'Test',
          ipAddress: '192.168.1.1',
          rememberMe: false,
        });

        // 手动更新过期时间为过去
        const pastDate = new Date(Date.now() - 1000000);
        await db.update(sessions)
          .set({ expires_at: pastDate })
          .where(eq(sessions.id, session.id));

        // When: 运行清理
        await cleanupExpiredSessions();

        // Then: 过期会话不再活动
        const updatedSession = await db.query.sessions.findFirst({
          where: eq(sessions.id, session.id),
        });
        expect(updatedSession?.is_active).toBe(false);
      });
    });
  });

  describe('User Session Devices', () => {
    describe('given 创建新设备记录，when 首次登录，then 创建设备记录', () => {
      it('should create new device record', async () => {
        // Given: 首次登录的设备数据
        const deviceData = {
          userId: testUserId,
          deviceId: 'new-device-123',
          deviceType: 'mobile' as const,
          deviceName: 'iPhone 13',
          isTrusted: false,
        };

        // When: 创建设备记录
        const device = await upsertUserSessionDevice(deviceData);

        // Then: 创建成功
        expect(device).toBeDefined();
        expect(device.user_id).toBe(testUserId);
        expect(device.device_id).toBe('new-device-123');
        expect(device.device_type).toBe('mobile');
        expect(device.device_name).toBe('iPhone 13');
        expect(device.is_trusted).toBe(false);
        expect(device.first_login_at).toBeDefined();
        expect(device.last_login_at).toBeDefined();
      });
    });

    describe('given 更新现有设备记录，when 再次登录，then 更新设备信息', () => {
      it('should update existing device record', async () => {
        // Given: 已存在的设备记录
        const deviceId = 'existing-device-123';
        await upsertUserSessionDevice({
          userId: testUserId,
          deviceId,
          deviceType: 'desktop',
          deviceName: 'Windows PC',
        });

        // When: 再次登录（更新设备）
        const updatedDevice = await upsertUserSessionDevice({
          userId: testUserId,
          deviceId,
          deviceType: 'desktop',
          deviceName: 'Windows PC Updated',
          isTrusted: true,
        });

        // Then: 更新成功
        expect(updatedDevice).toBeDefined();
        expect(updatedDevice.device_name).toBe('Windows PC Updated');
        expect(updatedDevice.is_trusted).toBe(true);
        expect(updatedDevice.device_id).toBe(deviceId);
      });
    });

    describe('given 获取用户设备列表，when 查询设备，then 返回所有设备', () => {
      it('should get user session devices', async () => {
        // Given: 用户有多个设备
        await upsertUserSessionDevice({
          userId: testUserId,
          deviceId: 'device-1',
          deviceType: 'mobile',
          deviceName: 'iPhone',
        });
        await upsertUserSessionDevice({
          userId: testUserId,
          deviceId: 'device-2',
          deviceType: 'desktop',
          deviceName: 'Windows PC',
        });

        // When: 获取设备列表
        const devices = await getUserSessionDevices(testUserId);

        // Then: 返回所有设备
        expect(devices.length).toBeGreaterThanOrEqual(2);
        expect(devices.every(d => d.user_id === testUserId)).toBe(true);
      });
    });

    describe('given 检查设备信任状态，when 设备受信任，then 返回true', () => {
      it('should return true for trusted device', async () => {
        // Given: 受信任的设备
        const deviceId = 'trusted-device-123';
        await upsertUserSessionDevice({
          userId: testUserId,
          deviceId,
          deviceType: 'mobile',
          deviceName: 'Trusted Phone',
          isTrusted: true,
        });

        // When: 检查设备信任状态
        const isTrusted = await isDeviceTrusted(testUserId, deviceId);

        // Then: 返回true
        expect(isTrusted).toBe(true);
      });
    });

    describe('given 检查设备信任状态，when 设备不受信任，then 返回false', () => {
      it('should return false for non-trusted device', async () => {
        // Given: 不受信任的设备
        const deviceId = 'untrusted-device-123';
        await upsertUserSessionDevice({
          userId: testUserId,
          deviceId,
          deviceType: 'mobile',
          deviceName: 'New Phone',
          isTrusted: false,
        });

        // When: 检查设备信任状态
        const isTrusted = await isDeviceTrusted(testUserId, deviceId);

        // Then: 返回false
        expect(isTrusted).toBe(false);
      });
    });
  });

  describe('Device Locks', () => {
    describe('given 创建设备锁定，when 触发锁定，then 创建锁定记录', () => {
      it('should create device lock', async () => {
        // Given: 锁定数据
        const lockData = {
          userId: testUserId,
          deviceId: 'locked-device-123',
          lockReason: 'rate_limit' as const,
          failedAttempts: 5,
          lockEndAt: Math.floor(Date.now() / 1000) + 600, // 10 minutes
        };

        // When: 创建锁定
        const lock = await upsertDeviceLock(lockData);

        // Then: 创建成功
        expect(lock).toBeDefined();
        expect(lock.user_id).toBe(testUserId);
        expect(lock.lock_reason).toBe('rate_limit');
        expect(lock.failed_attempts).toBe(5);
        expect(lock.lock_end_at).toBeDefined();
      });
    });

    describe('given 更新现有锁定，when 再次触发，then 更新锁定记录', () => {
      it('should update existing device lock', async () => {
        // Given: 已存在的锁定
        const deviceId = 'update-lock-device-123';
        await upsertDeviceLock({
          userId: testUserId,
          deviceId,
          lockReason: 'rate_limit',
          failedAttempts: 5,
        });

        // When: 更新锁定
        const updatedLock = await upsertDeviceLock({
          userId: testUserId,
          deviceId,
          lockReason: 'rate_limit',
          failedAttempts: 10,
          lockEndAt: Math.floor(Date.now() / 1000) + 1800, // 30 minutes
        });

        // Then: 更新成功
        expect(updatedLock.failed_attempts).toBe(10);
      });
    });

    describe('given 查询设备锁定，when 设备被锁定，then 返回锁定信息', () => {
      it('should get active device lock', async () => {
        // Given: 被锁定的设备
        const deviceId = 'query-lock-device-123';
        const lockEndAt = Math.floor(Date.now() / 1000) + 600;
        await upsertDeviceLock({
          userId: testUserId,
          deviceId,
          lockReason: 'security',
          failedAttempts: 3,
          lockEndAt,
        });

        // When: 查询锁定状态
        const lock = await getDeviceLock(testUserId, deviceId);

        // Then: 返回锁定信息
        expect(lock).toBeDefined();
        expect(lock?.lock_reason).toBe('security');
        expect(lock?.failed_attempts).toBe(3);
      });
    });

    describe('given 查询设备锁定，when 锁定已过期，then 返回null', () => {
      it('should return null for expired lock', async () => {
        // Given: 已过期的锁定
        const deviceId = 'expired-lock-device-123';
        const pastTime = Math.floor(Date.now() / 1000) - 600;
        await upsertDeviceLock({
          userId: testUserId,
          deviceId,
          lockReason: 'rate_limit',
          failedAttempts: 5,
          lockEndAt: pastTime,
        });

        // When: 查询锁定状态
        const lock = await getDeviceLock(testUserId, deviceId);

        // Then: 返回null（锁定已过期）
        expect(lock).toBeNull();
      });
    });

    describe('given 重置设备锁定，when 成功登录，then 删除锁定记录', () => {
      it('should reset device lock', async () => {
        // Given: 被锁定的设备
        const deviceId = 'reset-lock-device-123';
        await upsertDeviceLock({
          userId: testUserId,
          deviceId,
          lockReason: 'rate_limit',
          failedAttempts: 5,
        });

        // When: 重置锁定
        await resetDeviceLock(testUserId, deviceId);

        // Then: 锁定已被删除
        const lock = await getDeviceLock(testUserId, deviceId);
        expect(lock).toBeNull();
      });
    });

    describe('given 递增失败次数，when 达到5次，then 锁定设备10分钟', () => {
      it('should lock device for 10 minutes after 5 failed attempts', async () => {
        // Given: 设备
        const deviceId = 'increment-lock-5-123';

        // When: 递增失败次数到5次
        let lock: any = null;
        for (let i = 0; i < 5; i++) {
          lock = await incrementFailedAttempts(testUserId, deviceId);
        }

        // Then: 返回锁定记录
        expect(lock).toBeDefined();
        expect(lock.failed_attempts).toBe(5);

        // And: 锁定时间为10分钟
        const now = Math.floor(Date.now() / 1000);
        const lockEndTime = Math.floor(new Date(lock.lock_end_at).getTime() / 1000);
        expect(lockEndTime - now).toBeCloseTo(600, 2); // 10 minutes
      });
    });

    describe('given 递增失败次数，when 达到10次，then 锁定设备30分钟', () => {
      it('should lock device for 30 minutes after 10 failed attempts', async () => {
        // Given: 设备
        const deviceId = 'increment-lock-10-123';

        // When: 递增失败次数到10次
        let lock: any = null;
        for (let i = 0; i < 10; i++) {
          lock = await incrementFailedAttempts(testUserId, deviceId);
        }

        // Then: 返回锁定记录
        expect(lock).toBeDefined();
        expect(lock.failed_attempts).toBe(10);

        // And: 锁定时间为30分钟
        const now = Math.floor(Date.now() / 1000);
        const lockEndTime = Math.floor(new Date(lock.lock_end_at).getTime() / 1000);
        expect(lockEndTime - now).toBeCloseTo(1800, 2); // 30 minutes
      });
    });

    describe('given 递增失败次数，when 达到20次，then 锁定设备1小时', () => {
      it('should lock device for 1 hour after 20 failed attempts', async () => {
        // Given: 设备
        const deviceId = 'increment-lock-20-123';

        // When: 递增失败次数到20次
        let lock: any = null;
        for (let i = 0; i < 20; i++) {
          lock = await incrementFailedAttempts(testUserId, deviceId);
        }

        // Then: 返回锁定记录
        expect(lock).toBeDefined();
        expect(lock.failed_attempts).toBe(20);

        // And: 锁定时间约为1小时（误差2秒内）
        const now = Math.floor(Date.now() / 1000);
        const lockEndTime = Math.floor(new Date(lock.lock_end_at).getTime() / 1000);
        const lockDuration = lockEndTime - now;
        expect(lockDuration).toBeGreaterThanOrEqual(3598); // 至少3598秒
        expect(lockDuration).toBeLessThanOrEqual(3602); // 最多3602秒
      });
    });

    describe('given 递增失败次数，when 少于5次，then 不锁定设备', () => {
      it('should not lock device under 5 failed attempts', async () => {
        // Given: 设备
        const deviceId = 'increment-lock-4-123';

        // When: 递增失败次数到4次
        let lock: any = null;
        for (let i = 0; i < 4; i++) {
          lock = await incrementFailedAttempts(testUserId, deviceId);
        }

        // Then: 不返回锁定记录
        expect(lock).toBeNull();

        // And: 失败次数已被记录
        const existingLock = await db.query.deviceLocks.findFirst({
          where: eq(deviceLocks.device_id, deviceId),
        });
        expect(existingLock?.failed_attempts).toBe(4);
      });
    });
  });
});
