import { NextRequest } from "next/server";
import {
  verifyPINAndCreateSession,
  generateDeviceFingerprint,
  initPINAuth,
} from "@/lib/pin-auth";
import { z } from "zod";

import { ErrorCodes, createErrorResponse, createSuccessResponse } from "@/lib/constant";
// 确保 PIN 认证系统已初始化
let initialized = false;

async function ensureInitialized() {
  if (!initialized) {
    await initPINAuth();
    initialized = true;
  }
}

// 请求体验证 Schema
const loginSchema = z.object({
  userId: z.string().trim().min(1, "用户ID不能为空"),
  pin: z.string().trim().regex(/^[0-9]{4,6}$/, "PIN码必须是4-6位数字"),
  deviceId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. 初始化 PIN 认证系统
    await ensureInitialized();

    // 2. 解析请求体
    const body = await request.json();

    // 3. 验证请求数据
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

    const { userId, pin, deviceId } = validation.data;

    // 4. 生成设备指纹
    const deviceFingerprint = deviceId || generateDeviceFingerprint(request);

    // 5. 验证 PIN 并创建会话
    const result = await verifyPINAndCreateSession(userId, pin, deviceFingerprint);

    // 6. 返回结果
    if (result.success) {
      return Response.json({
        success: true,
        sessionId: result.sessionId,
        userId: result.userId,
        memberId: result.memberId,
      });
    } else {
      return Response.json(
        {
          success: false,
          error: result.error || "登录失败",
        },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Child login error:", error);
    return Response.json(
      {
        success: false,
        error: "服务器内部错误",
      },
      { status: 500 }
    );
  }
}


