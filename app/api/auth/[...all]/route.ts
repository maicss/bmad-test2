/**
 * Better-Auth API 路由处理器
 *
 * 处理所有 Better-Auth 相关的 API 请求
 * 路径：/api/auth/*
 */

import { auth } from "@/lib/auth";

/**
 * 处理所有 HTTP 方法
 */
export const GET = (req: Request) => auth.handler(req);
export const POST = (req: Request) => auth.handler(req);
export const PUT = (req: Request) => auth.handler(req);
export const DELETE = (req: Request) => auth.handler(req);
export const PATCH = (req: Request) => auth.handler(req);

/**
 * Better-Auth 提供的标准端点：
 *
 * POST /api/auth/sign-up/email - 邮箱注册
 * POST /api/auth/sign-in/email - 邮箱登录
 * POST /api/auth/sign-out - 登出
 * GET /api/auth/session - 获取当前会话
 * POST /api/auth/forget-password - 忘记密码
 * POST /api/auth/reset-password - 重置密码
 * POST /api/auth/verify-email - 验证邮箱
 *
 * 注意：Family Reward 主要使用手机号认证，这些端点可能需要配合插件使用
 */
