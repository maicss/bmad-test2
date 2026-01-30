import { NextRequest } from "next/server";
import { getRawDb } from "@/database/db";
import { getOTPService, SendOTPResult } from "@/lib/otp-service";
import { z } from "zod";

import { ErrorCodes, createErrorResponse, createSuccessResponse } from "@/lib/constant";
// 请求体验证 Schema
const sendOTPSchema = z.object({
  phone: z.string().trim().regex(/^1[3-9]\d{9}$/, "请输入有效的手机号"),
});

// OTP 过期时间（分钟）
const OTP_EXPIRY_MINUTES = 5;

export async function POST(request: NextRequest) {
  try {
    // 1. 解析请求体
    const body = await request.json();

    // 2. 验证请求数据
    const validation = sendOTPSchema.safeParse(body);
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

    const { phone } = validation.data;

    // 3. 检查用户是否存在（必须是家长或管理员）
    const rawDb = getRawDb();
    const user = rawDb
      .query(
        `
      SELECT id, name, role, phone
      FROM user
      WHERE phone = ? AND (role = 'parent' OR role = 'admin')
    `
      )
      .get(phone) as {
      id: string;
      name: string;
      role: string;
      phone: string;
    } | null;

    if (!user) {
      // 为了安全，不告诉用户手机号是否存在，统一返回成功
      // 实际项目中应该返回相同的响应，避免枚举攻击
      return Response.json({
        success: true,
        message: "验证码已发送",
        debugCode: process.env.NODE_ENV === "development" ? "111111" : undefined,
      });
    }

    // 4. 使用OTP服务发送验证码
    const otpService = getOTPService();
    const result: SendOTPResult = await otpService.sendOTP(phone);

    // 5. 如果发送失败，返回错误
    if (!result.success) {
      return Response.json(
        {
          success: false,
          error: result.message || "发送验证码失败",
        },
        { status: 500 }
      );
    }

    // 6. 存储验证码到 verification 表（使用 better-auth 的验证机制）
    const now = new Date();
    const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);
    const code = result.debugCode || "111111"; // 开发模式使用debugCode

    // 先删除该手机号的旧验证码
    rawDb.run(
      `
      DELETE FROM verification 
      WHERE identifier = ?
    `,
      [`otp:${phone}`]
    );

    // 插入新验证码
    rawDb.run(
      `
      INSERT INTO verification (id, identifier, value, expires_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
      [
        crypto.randomUUID(),
        `otp:${phone}`,
        code,
        expiresAt.toISOString(),
        now.toISOString(),
        now.toISOString(),
      ]
    );

    // 7. 返回成功响应
    const response: {
      success: boolean;
      message: string;
      expiresIn: number;
      debugCode?: string;
    } = {
      success: true,
      message: result.message || "验证码已发送",
      expiresIn: OTP_EXPIRY_MINUTES * 60, // 秒
    };

    // 开发/测试模式下返回验证码
    if (result.debugCode && process.env.NODE_ENV !== "production") {
      response.debugCode = result.debugCode;
    }

    return Response.json(response);
  } catch (error) {
    console.error("Send OTP error:", error);
    return Response.json(
      {
        success: false,
        error: "服务器内部错误",
      },
      { status: 500 }
    );
  }
}
