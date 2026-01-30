import { NextRequest } from "next/server";
import { getRawDb } from "@/database/db";
import { auth } from "@/lib/auth";
import { z } from "zod";

import { ErrorCodes, createErrorResponse, createSuccessResponse } from "@/lib/constant";
// 密码登录验证 Schema
const passwordLoginSchema = z.object({
  phone: z.string().trim().regex(/^1[3-9]\d{9}$/, "请输入有效的手机号"),
  password: z.string().min(1, "密码不能为空"),
  loginType: z.literal("password"),
});

// OTP登录验证 Schema（预留）
const otpLoginSchema = z.object({
  phone: z.string().trim().regex(/^1[3-9]\d{9}$/, "请输入有效的手机号"),
  otp: z.string().trim().length(6, "验证码为6位数字"),
  loginType: z.literal("otp"),
});

// 合并验证 Schema
const loginSchema = z.discriminatedUnion("loginType", [
  passwordLoginSchema,
  otpLoginSchema,
]);

export async function POST(request: NextRequest) {
  try {
    // 1. 解析请求体
    const body = await request.json();

    // 2. 验证请求数据
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return Response.json(
        {
          success: false,
          error: firstError?.message || "请求数据验证失败",
        },
        { status: 400 }
      );
    }

    const { phone, loginType } = validation.data;

    // 3. 查询用户
    const rawDb = getRawDb();
    const user = rawDb
      .query(
        `
      SELECT id, name, email, role, phone, image
      FROM user
      WHERE phone = ? AND (role = 'parent' OR role = 'admin')
    `
      )
      .get(phone) as {
      id: string;
      name: string;
      email: string | null;
      role: string;
      phone: string;
      image: string | null;
    } | null;

    if (!user) {
      return Response.json(
        {
          success: false,
          error: "用户不存在或不是家长/管理员",
        },
        { status: 401 }
      );
    }

    // 4. 根据登录类型验证
    if (loginType === "password") {
      const { password } = validation.data;

      // 验证密码
      const account = rawDb
        .query(
          `
        SELECT password
        FROM account
        WHERE user_id = ? AND provider_id = 'credential'
      `
        )
        .get(user.id) as { password: string } | null;

      // 测试密码 "1111" 或数据库中的密码
      const isValidPassword =
        password === "1111" || // 测试密码
        (account &&
          account.password &&
          (await verifyPassword(password, account.password)));

      if (!isValidPassword) {
        return Response.json(
          {
            success: false,
            error: "密码错误",
          },
          { status: 401 }
        );
      }
    } else if (loginType === "otp") {
      const { otp } = validation.data;

      // 验证 OTP
      const verification = rawDb
        .query(
          `
        SELECT value, expires_at
        FROM verification
        WHERE identifier = ?
      `
        )
        .get(`otp:${phone}`) as {
        value: string;
        expires_at: string;
      } | null;

      if (!verification) {
        return Response.json(
          {
            success: false,
            error: "验证码不存在或已过期",
          },
          { status: 401 }
        );
      }

      // 检查是否过期
      const expiresAt = new Date(verification.expires_at);
      if (expiresAt < new Date()) {
        return Response.json(
          {
            success: false,
            error: "验证码已过期",
          },
          { status: 401 }
        );
      }

      // 测试验证码 "111111" 或数据库中的验证码
      if (otp !== "111111" && otp !== verification.value) {
        return Response.json(
          {
            success: false,
            error: "验证码错误",
          },
          { status: 401 }
        );
      }

      // 验证成功后删除验证码（一次性使用）
      rawDb.run(
        `
        DELETE FROM verification
        WHERE identifier = ?
      `,
        [`otp:${phone}`]
      );
    }

    // 5. 使用 Better-Auth 创建 session
    // 由于 Better-Auth 默认使用 email，我们需要手动创建 session
    const sessionToken = crypto.randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24小时

    // 创建 session 记录
    rawDb.run(
      `
      INSERT INTO session (id, token, user_id, expires_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
      [
        crypto.randomUUID(),
        sessionToken,
        user.id,
        expiresAt.toISOString(),
        now.toISOString(),
        now.toISOString(),
      ]
    );

    // 6. 返回用户信息，浏览器端需要手动设置 cookie
    // 或者使用 Set-Cookie header
    return Response.json(
      {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
          phone: user.phone,
          image: user.image,
        },
        sessionToken, // 前端需要存储这个 token
        message: "登录成功",
      },
      {
        headers: {
          "Set-Cookie": `better-auth.session_token=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${24 * 60 * 60}`,
        },
      }
    );
  } catch (error) {
    console.error("Parent login error:", error);
    return Response.json(
      {
        success: false,
        error: "服务器内部错误",
      },
      { status: 500 }
    );
  }
}

/**
 * 验证密码
 */
async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    return await Bun.password.verify(plainPassword, hashedPassword);
  } catch {
    return false;
  }
}
