/**
 * Next.js Middleware - Route Protection
 *
 * Protects authenticated routes:
 * - /parent/* - Requires parent/admin role
 * - /child/* - Requires child role with valid session
 * - /admin/* - Requires admin role (except /admin/login)
 *
 * Redirects unauthenticated users to /family/login
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 公开路由（不需要认证）
const PUBLIC_ROUTES = [
  "/",
  "/family/login",
  "/admin/login",
  "/auth/login",
  "/api/auth/parent-login",
  "/api/auth/admin-login",
  "/api/auth/child-login",
  "/api/auth/session",
  "/api/auth/session-check",
  "/api/auth/otp/send",
  "/api/auth/logout",
  "/api/auth/[...all]",
];

// 静态资源路由
const STATIC_ROUTES = [
  "/_next",
  "/static",
  "/favicon.ico",
  "/manifest.json",
  "/icons",
  "/images",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. 检查是否是静态资源或公开路由
  if (
    STATIC_ROUTES.some((route) => pathname.startsWith(route)) ||
    PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/"))
  ) {
    return NextResponse.next();
  }

  // 2. 获取会话 token（从 cookie 中）
  const sessionCookie = request.cookies.get("better-auth.session_token");
  const sessionToken = sessionCookie?.value;

  // 3. 如果没有会话 token，重定向到家庭登录页
  if (!sessionToken) {
    const loginUrl = new URL("/family/login", request.url);
    // 添加返回 URL 参数
    loginUrl.searchParams.set("returnUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 4. 对于受保护路由，验证会话有效性
  // 这里我们让页面自己去验证，middleware 只负责检查 cookie 存在
  // 这样可以避免每个请求都查询数据库

  // 5. 角色检查（由页面组件完成）
  // 我们通过添加请求头来传递 session token，方便页面获取
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-session-token", sessionToken);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// 配置匹配规则
export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了：
     * - /_next (Next.js 内部文件)
     * - /static (静态文件)
     * - /api/auth/* (认证 API，需要公开访问)
     * - /favicon.ico, /manifest.json 等根目录静态文件
     */
    "/((?!_next|static|api/auth|favicon.ico|manifest.json|sw.js|workbox-).*)",
  ],
};
