/**
 * Logout API
 * 
 * POST /api/auth/logout
 * 
 * 清除用户会话并删除cookie
 */

import { NextRequest } from "next/server";
import { getRawDb } from "@/database/db";

export async function POST(request: NextRequest) {
  try {
    // 1. 从cookie中获取session token
    const cookieHeader = request.headers.get("cookie") || "";
    const cookies = parseCookies(cookieHeader);
    const sessionToken = cookies["better-auth.session_token"];

    // 2. 如果存在session token，从数据库中删除
    if (sessionToken) {
      const rawDb = getRawDb();
      rawDb.run(
        `DELETE FROM session WHERE token = ?`,
        [sessionToken]
      );
    }

    // 3. 返回成功响应，并清除cookie
    return Response.json(
      {
        success: true,
        message: "退出登录成功",
      },
      {
        headers: {
          "Set-Cookie": "better-auth.session_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT",
        },
      }
    );
  } catch (error) {
    console.error("Logout error:", error);
    return Response.json(
      {
        success: false,
        error: "退出登录失败",
      },
      { status: 500 }
    );
  }
}

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
