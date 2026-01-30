import { NextRequest } from "next/server";
import {
  validateSession,
  shouldAutoLock,
  lockSession,
  updateLastActive,
  initPINAuth,
} from "@/lib/pin-auth";
import { getSession } from "@/lib/auth";
import { z } from "zod";
import { ErrorCodes, createErrorResponse, createSuccessResponse } from "@/lib/constant";

let initialized = false;

async function ensureInitialized() {
  if (!initialized) {
    await initPINAuth();
    initialized = true;
  }
}

const checkSchema = z.object({
  sessionId: z.string().min(1, "会话ID不能为空"),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request.headers);

    if (!session?.user) {
      return Response.json(
        createErrorResponse(ErrorCodes.UNAUTHORIZED, "未登录"),
        { status: 401 }
      );
    }

    return Response.json(
      createSuccessResponse({
        user: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          role: session.user.role,
        },
        session: {
          id: session.session.id,
          expiresAt: session.session.expiresAt,
        },
      })
    );
  } catch (error) {
    console.error("Session check GET error:", error);
    return Response.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "服务器内部错误"),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. 初始化
    await ensureInitialized();

    // 2. 解析请求体
    const body = await request.json();

    // 3. 验证请求数据
    const validation = checkSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return Response.json(
        {
          valid: false,
          locked: false,
          error: firstError?.message || "请求数据验证失败",
        },
        { status: 400 }
      );
    }

    const { sessionId } = validation.data;

    // 4. 验证会话是否存在
    const session = await validateSession(sessionId);

    if (!session) {
      return Response.json(
        {
          valid: false,
          locked: false,
          error: "会话已过期或不存在",
        },
        { status: 401 }
      );
    }

    // 5. 检查是否需要自动锁定
    const shouldLock = await shouldAutoLock(sessionId);

    if (shouldLock) {
      await lockSession(sessionId);
      return Response.json({
        valid: true,
        locked: true,
        error: "会话已自动锁定（2分钟无操作）",
      });
    }

    // 6. 更新最后活动时间
    await updateLastActive(sessionId);

    // 7. 返回会话状态
    return Response.json({
      valid: true,
      locked: false,
      expiresAt: session.expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Session check error:", error);
    return Response.json(
      {
        valid: false,
        locked: false,
        error: "服务器内部错误",
      },
      { status: 500 }
    );
  }
}
