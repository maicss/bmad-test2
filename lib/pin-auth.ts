/**
 * PIN Code Authentication Service
 *
 * 专为儿童设计的 PIN 码认证系统
 * - 支持 4-6 位数字 PIN
 * - 使用 Bun.password 进行哈希存储
 * - 2 分钟无操作自动锁定
 * - 共享设备安全隔离
 */

import { eq } from "drizzle-orm";
import { getDb, getRawDb } from "@/database/db";
import { users, familyMembers } from "@/lib/db/schema";

// 会话配置常量
const SESSION_EXPIRY_HOURS = 24;
const AUTO_LOCK_MINUTES = 2;

/**
 * PIN 码验证结果
 */
export interface PINVerificationResult {
  success: boolean;
  userId?: string;
  memberId?: string;
  sessionId?: string;
  error?: string;
}

/**
 * 会话信息
 */
export interface ChildSession {
  id: string;
  userId: string;
  memberId: string;
  familyId: string;
  deviceFingerprint: string;
  createdAt: Date;
  expiresAt: Date;
  lastActiveAt: Date;
  isLocked: boolean;
}

/**
 * 设置 PIN 码
 *
 * @param userId 用户 ID
 * @param pin 4-6 位数字 PIN 码
 * @throws Error 如果 PIN 格式无效
 */
export async function setPIN(userId: string, pin: string): Promise<void> {
  const db = getDb();
  
  // 验证 PIN 格式
  if (!/^[0-9]{4,6}$/.test(pin)) {
    throw new Error("PIN 码必须是 4-6 位数字");
  }

  // 使用 Bun.password 哈希 PIN
  const pinHash = await Bun.password.hash(pin, {
    algorithm: "bcrypt",
    cost: 10,
  });

  // 更新用户表中的 pinHash
  const result = await db
    .update(users)
    .set({
      pinHash,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();

  if (result.length === 0) {
    throw new Error("用户不存在");
  }
}

/**
 * 验证 PIN 码并创建会话
 *
 * @param userId 用户 ID
 * @param pin PIN 码
 * @param deviceFingerprint 设备指纹
 * @returns PINVerificationResult
 */
export async function verifyPINAndCreateSession(
  userId: string,
  pin: string,
  deviceFingerprint: string
): Promise<PINVerificationResult> {
  try {
    const db = getDb();
    const rawDb = getRawDb();
    
    // 1. 获取用户信息和 PIN 哈希
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        id: true,
        pinHash: true,
        role: true,
      },
    });

    if (!user) {
      return { success: false, error: "用户不存在" };
    }

    if (!user.pinHash) {
      return { success: false, error: "未设置 PIN 码" };
    }

    // 2. 验证 PIN
    const isValid = await Bun.password.verify(pin, user.pinHash);

    if (!isValid) {
      return { success: false, error: "PIN 码错误" };
    }

    // 3. 获取家庭成员信息
    const member = await db.query.familyMembers.findFirst({
      where: eq(familyMembers.userId, userId),
      columns: {
        id: true,
        familyId: true,
      },
    });

    if (!member) {
      return { success: false, error: "用户不属于任何家庭" };
    }

    // 4. 创建会话
    const sessionId = generateSessionId();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000);

    // 将会话存储到数据库
    rawDb.run(
      `INSERT INTO child_sessions (id, user_id, member_id, family_id, device_fingerprint, 
                                   created_at, expires_at, last_active_at, is_locked)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sessionId,
        userId,
        member.id,
        member.familyId,
        deviceFingerprint,
        now.toISOString(),
        expiresAt.toISOString(),
        now.toISOString(),
        0,
      ]
    );

    return {
      success: true,
      userId: user.id,
      memberId: member.id,
      sessionId,
    };
  } catch (error) {
    console.error("PIN verification error:", error);
    return { success: false, error: "验证失败，请重试" };
  }
}

/**
 * 验证会话
 *
 * @param sessionId 会话 ID
 * @returns ChildSession | null
 */
export async function validateSession(sessionId: string): Promise<ChildSession | null> {
  try {
    const rawDb = getRawDb();
    const result = rawDb.query(
      `SELECT * FROM child_sessions 
       WHERE id = ? AND expires_at > datetime('now') AND is_locked = 0`
    ).get(sessionId);

    if (!result) {
      return null;
    }

    const row = result as Record<string, unknown>;

    return {
      id: row.id as string,
      userId: row.user_id as string,
      memberId: row.member_id as string,
      familyId: row.family_id as string,
      deviceFingerprint: row.device_fingerprint as string,
      createdAt: new Date(row.created_at as string),
      expiresAt: new Date(row.expires_at as string),
      lastActiveAt: new Date(row.last_active_at as string),
      isLocked: Boolean(row.is_locked),
    };
  } catch (error) {
    console.error("Session validation error:", error);
    return null;
  }
}

/**
 * 更新会话最后活动时间
 *
 * @param sessionId 会话 ID
 */
export async function updateLastActive(sessionId: string): Promise<void> {
  const rawDb = getRawDb();
  rawDb.run(
    `UPDATE child_sessions SET last_active_at = datetime('now') WHERE id = ?`,
    [sessionId]
  );
}

/**
 * 检查是否需要自动锁定
 *
 * @param sessionId 会话 ID
 * @returns boolean 是否需要锁定
 */
export async function shouldAutoLock(sessionId: string): Promise<boolean> {
  try {
    const rawDb = getRawDb();
    const result = rawDb.query(
      `SELECT last_active_at FROM child_sessions WHERE id = ?`
    ).get(sessionId);

    if (!result) {
      return true; // 会话不存在，视为已锁定
    }

    const row = result as Record<string, string>;
    const lastActive = new Date(row.last_active_at);
    const diffMinutes = (Date.now() - lastActive.getTime()) / (1000 * 60);

    return diffMinutes > AUTO_LOCK_MINUTES;
  } catch (error) {
    console.error("Auto lock check error:", error);
    return true; // 出错时保守处理，视为需要锁定
  }
}

/**
 * 锁定会话
 *
 * @param sessionId 会话 ID
 */
export async function lockSession(sessionId: string): Promise<void> {
  const rawDb = getRawDb();
  rawDb.run(`UPDATE child_sessions SET is_locked = 1 WHERE id = ?`, [sessionId]);
}

/**
 * 结束会话（登出）
 *
 * @param sessionId 会话 ID
 */
export async function endSession(sessionId: string): Promise<void> {
  const rawDb = getRawDb();
  rawDb.run(`DELETE FROM child_sessions WHERE id = ?`, [sessionId]);
}

/**
 * 获取用户的所有活跃会话
 *
 * @param userId 用户 ID
 * @returns ChildSession[]
 */
export async function getUserSessions(userId: string): Promise<ChildSession[]> {
  try {
    const rawDb = getRawDb();
    const result = rawDb.query(
      `SELECT * FROM child_sessions 
       WHERE user_id = ? AND expires_at > datetime('now')
       ORDER BY last_active_at DESC`
    ).all(userId);

    if (!result || result.length === 0) {
      return [];
    }

    return result.map((row: unknown) => {
      const r = row as Record<string, unknown>;
      return {
        id: r.id as string,
        userId: r.user_id as string,
        memberId: r.member_id as string,
        familyId: r.family_id as string,
        deviceFingerprint: r.device_fingerprint as string,
        createdAt: new Date(r.created_at as string),
        expiresAt: new Date(r.expires_at as string),
        lastActiveAt: new Date(r.last_active_at as string),
        isLocked: Boolean(r.is_locked),
      };
    });
  } catch (error) {
    console.error("Get user sessions error:", error);
    return [];
  }
}

/**
 * 清理过期会话
 */
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const rawDb = getRawDb();
    const result = rawDb.run(
      `DELETE FROM child_sessions WHERE expires_at < datetime('now')`
    );
    return result.changes || 0;
  } catch (error) {
    console.error("Cleanup sessions error:", error);
    return 0;
  }
}

/**
 * 生成会话 ID
 */
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * 生成设备指纹
 *
 * 注意：这只是一个简单的实现，实际应用中应该使用更复杂的设备指纹算法
 *
 * @param request Request 对象
 * @returns 设备指纹字符串
 */
export function generateDeviceFingerprint(request: Request): string {
  const userAgent = request.headers.get("user-agent") || "unknown";
  const ip = request.headers.get("x-forwarded-for") || "unknown";

  // 简单的哈希组合
  const fingerprint = `${ip}-${userAgent}`;

  // 返回 Base64 编码的指纹
  return btoa(fingerprint).substring(0, 32);
}

// ============================================================
// 初始化：创建 child_sessions 表
// ============================================================

/**
 * 初始化 PIN 认证系统
 * 创建必要的表结构
 */
export async function initPINAuth(): Promise<void> {
  try {
    const rawDb = getRawDb();
    rawDb.run(`
      CREATE TABLE IF NOT EXISTS child_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        member_id TEXT NOT NULL,
        family_id TEXT NOT NULL,
        device_fingerprint TEXT,
        created_at DATETIME NOT NULL,
        expires_at DATETIME NOT NULL,
        last_active_at DATETIME NOT NULL,
        is_locked INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
        FOREIGN KEY (member_id) REFERENCES family_member(id) ON DELETE CASCADE,
        FOREIGN KEY (family_id) REFERENCES family(id) ON DELETE CASCADE
      )
    `);

    // 创建索引
    rawDb.run(`
      CREATE INDEX IF NOT EXISTS idx_child_sessions_user 
      ON child_sessions(user_id)
    `);

    rawDb.run(`
      CREATE INDEX IF NOT EXISTS idx_child_sessions_expires 
      ON child_sessions(expires_at)
    `);

    console.log("✅ PIN 认证系统初始化完成");
  } catch (error) {
    console.error("❌ PIN 认证系统初始化失败:", error);
    throw error;
  }
}
