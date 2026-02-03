import { NextRequest } from "next/server";
import { ErrorCodes, createErrorResponse, createSuccessResponse } from "@/lib/constant";
import { verifyPhoneCredential } from "@/lib/phone-credential-provider";

/**
 * Phone Sign-In API
 *
 * POST /api/auth/phone-login
 *
 * Authentication using phone number + password
 */

const loginSchema = {
  phone: (value: string) => typeof value === "string" && /^1[3-9]\d{9}$/.test(value),
  password: (value: string) => typeof value === "string" && value.length > 0,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, password } = body;

    // Validate input
    if (!phone || !loginSchema.phone(phone)) {
      return Response.json(
        createErrorResponse(ErrorCodes.VALIDATION_ERROR, "请输入有效的手机号"),
        { status: 400 }
      );
    }

    if (!password || !loginSchema.password(password)) {
      return Response.json(
        createErrorResponse(ErrorCodes.VALIDATION_ERROR, "密码不能为空"),
        { status: 400 }
      );
    }

    const trimmedPhone = phone.trim();
    const trimmedPassword = password.trim();

    // Verify phone + password
    const user = await verifyPhoneCredential(trimmedPhone, trimmedPassword);

    if (!user) {
      // Don't reveal whether user exists or password is wrong
      return Response.json(
        createErrorResponse(ErrorCodes.UNAUTHORIZED, "手机号或密码错误"),
        { status: 401 }
      );
    }

    // Check if user is allowed to login via phone/password
    if (user.role !== "admin" && user.role !== "parent") {
      return Response.json(
        createErrorResponse(ErrorCodes.FORBIDDEN, "该角色不支持手机号密码登录"),
        { status: 403 }
      );
    }

    // Create session
    const rawDb = await import("@/database/db").then(m => m.getRawDb());
    const sessionToken = crypto.randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    // Use milliseconds timestamp for Better-Auth compatibility
    rawDb.run(`
      INSERT INTO session (id, token, user_id, expires_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      crypto.randomUUID(),
      sessionToken,
      user.id,
      expiresAt.getTime(),
      now.getTime(),
      now.getTime(),
    ]);

    // Set cookie and return
    return Response.json(
      createSuccessResponse({
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
          phone: user.phone,
          image: user.image,
        },
        message: "登录成功",
      }),
      {
        headers: {
          "Set-Cookie": `better-auth.session_token=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${24 * 60 * 60}`,
        },
      }
    );
  } catch (error) {
    console.error("Phone login error:", error);
    return Response.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "服务器内部错误"),
      { status: 500 }
    );
  }
}
