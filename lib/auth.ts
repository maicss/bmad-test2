/**
 * Better-Auth Configuration
 *
 * 使用 Bun 内置 SQLite 模块
 * 文档：https://www.better-auth.com/docs/adapters/sqlite#bun-built-in-sqlite
 */

import { betterAuth } from "better-auth";
import { Database } from "bun:sqlite";
import * as schema from "@/lib/db/schema";
import { getRawDb } from "@/database/db";

// 直接使用 bun:sqlite 创建数据库连接
const db = new Database("database/db.sqlite");

/**
 * Better-Auth 配置
 *
 * 支持的认证方式：
 * 1. 家长: 手机号 + 密码
 * 2. 家长: 手机号 + OTP 验证码
 * 3. 儿童: PIN 码 (在 lib/pin-auth.ts 中实现)
 */
export const auth = betterAuth({
  // 数据库配置 - 直接使用 Bun SQLite
  database: db,

  // 用户模型扩展字段
  user: {
    modelName: "user",
    // Better-Auth 核心字段映射
    fields: {
      email: "email",
      name: "name",
      emailVerified: "emailVerified",
      image: "image",
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
    // Family Reward 自定义扩展字段
    additionalFields: {
      role: {
        type: "string",
        input: false,
        defaultValue: "parent",
      },
      phone: {
        type: "string",
        input: false,
        unique: true,
      },
      gender: {
        type: "string",
        input: false,
      },
      pinHash: {
        type: "string",
        input: false,
      },
    },
  },

  // 会话配置
  session: {
    modelName: "session",
    fields: {
      expiresAt: "expiresAt",
      token: "token",
      createdAt: "createdAt",
      updatedAt: "updatedAt",
      ipAddress: "ipAddress",
      userAgent: "userAgent",
      userId: "userId",
    },
    // 会话过期时间：24小时 (以秒为单位)
    expiresIn: 60 * 60 * 24,
  },

  // 社交认证提供者
  socialProviders: {},

  // 账户配置
  account: {
    modelName: "account",
    fields: {
      accountId: "accountId",
      providerId: "providerId",
      userId: "userId",
      accessToken: "accessToken",
      refreshToken: "refreshToken",
      idToken: "idToken",
      accessTokenExpiresAt: "accessTokenExpiresAt",
      refreshTokenExpiresAt: "refreshTokenExpiresAt",
      scope: "scope",
      password: "password",
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
  },

  // 验证配置
  verification: {
    modelName: "verification",
    fields: {
      identifier: "identifier",
      value: "value",
      expiresAt: "expiresAt",
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
  },

  // 速率限制
  rateLimit: {
    window: 900,
    max: 100,
  },
});

/**
 * Get user by phone number
 */
export async function getUserByPhone(phone: string) {
  const rawDb = getRawDb();
  const user = rawDb
    .query(`
      SELECT id, name, email, role, phone, image, createdAt, updatedAt
      FROM user
      WHERE phone = ?
    `)
    .get(phone) as {
      id: string;
      name: string;
      email: string | null;
      role: string;
      phone: string;
      image: string | null;
      createdAt: string;
      updatedAt: string;
    } | null;

  return user;
}

/**
 * 获取当前会话
 * 
 * 首先尝试 Better-Auth 的标准方法，如果失败则尝试自定义 session token
 */
export async function getSession(headers: Headers) {
  // 1. 首先尝试 Better-Auth 的标准方法
  try {
    const session = await auth.api.getSession({ headers });
    if (session) {
      return session;
    }
  } catch {
    // Better-Auth failed, continue to fallback
  }

  // 2. 如果 Better-Auth 失败，尝试手动解析自定义 session token
  // 从 headers 中获取 cookie
  const cookieHeader = headers.get("cookie") || headers.get("Cookie");
  if (!cookieHeader) {
    return null;
  }

  // 解析 cookie 字符串
  const cookies = parseCookies(cookieHeader);
  const sessionToken = cookies["better-auth.session_token"];

  if (!sessionToken) {
    return null;
  }

  // 3. 验证 session token 是否有效
  try {
    const rawDb = getRawDb();
    const sessionData = rawDb
      .query(
        `
        SELECT s.id, s.token, s.user_id, s.expires_at, s.created_at, s.updated_at,
               u.id as user_id, u.name, u.email, u.role, u.phone, u.image
        FROM session s
        JOIN user u ON s.user_id = u.id
        WHERE s.token = ? AND s.expires_at > unixepoch('now') * 1000
      `
      )
      .get(sessionToken) as {
      id: string;
      token: string;
      user_id: string;
      expires_at: string;
      created_at: string;
      updated_at: string;
      name: string;
      email: string | null;
      role: string;
      phone: string | null;
      image: string | null;
    } | null;

    if (!sessionData) {
      return null;
    }

    // 4. 返回符合 Better-Auth 格式的 session 对象
    return {
      session: {
        id: sessionData.id,
        token: sessionData.token,
        userId: sessionData.user_id,
        expiresAt: new Date(sessionData.expires_at),
        createdAt: new Date(sessionData.created_at),
        updatedAt: new Date(sessionData.updated_at),
      },
      user: {
        id: sessionData.user_id,
        name: sessionData.name,
        email: sessionData.email,
        emailVerified: false,
        image: sessionData.image,
        role: sessionData.role,
        phone: sessionData.phone,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };
  } catch (error) {
    console.error("Custom session validation error:", error);
    return null;
  }
}

/**
 * 解析 Cookie 字符串
 */
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  cookieHeader.split(";").forEach((cookie) => {
    const [name, value] = cookie.trim().split("=");
    if (name && value) {
      cookies[name] = decodeURIComponent(value);
    }
  });
  return cookies;
}

/**
 * 验证用户是否为家长角色
 */
export function isParent(user: typeof schema.users.$inferSelect): boolean {
  return user.role === "parent" || user.role === "admin";
}

/**
 * 验证用户是否为孩子角色
 */
export function isChild(user: typeof schema.users.$inferSelect): boolean {
  return user.role === "child";
}

/**
 * 验证用户是否为管理员
 */
export function isAdmin(user: typeof schema.users.$inferSelect): boolean {
  return user.role === "admin";
}

// 导出类型
export type Auth = typeof auth;
