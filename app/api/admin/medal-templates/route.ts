/**
 * POST /api/admin/medal-templates
 * 创建新的徽章模板
 */

import { NextRequest } from "next/server";
import { getSession, isAdmin } from "@/lib/auth";
import { getRawDb } from "@/database/db";
import type { User } from "@/lib/db/schema";
import { ErrorCodes, createErrorResponse, createSuccessResponse } from "@/lib/constant";
import { generateId } from "@/lib/id";
import type { CreateMedalTemplateRequest } from "@/types/medal";
import { MedalTierColorSchemes } from "@/types/medal";

export async function POST(request: NextRequest) {
  let requestBody: CreateMedalTemplateRequest | undefined;
  
  try {
    const session = await getSession(request.headers);

    if (!session?.user) {
      return Response.json(
        createErrorResponse(ErrorCodes.UNAUTHORIZED, "未登录"),
        { status: 401 }
      );
    }

    if (!isAdmin(session.user as User)) {
      return Response.json(
        createErrorResponse(ErrorCodes.FORBIDDEN, "只有管理员可以创建徽章模板"),
        { status: 403 }
      );
    }

    requestBody = await request.json();
    const body = requestBody;

    // 确保 body 存在
    if (!body) {
      return Response.json(
        createErrorResponse(ErrorCodes.VALIDATION_ERROR, "请求体不能为空"),
        { status: 400 }
      );
    }

    // 验证必填字段
    if (!body.name || body.name.trim().length < 2 || body.name.trim().length > 10) {
      return Response.json(
        createErrorResponse(ErrorCodes.MEDAL_NAME_INVALID, "徽章名称需要2-10个字符"),
        { status: 400 }
      );
    }

    if (!body.icon || !body.icon.value) {
      return Response.json(
        createErrorResponse(ErrorCodes.MEDAL_ICON_REQUIRED, "请选择图标"),
        { status: 400 }
      );
    }

    // 验证阈值次数
    const thresholdCounts = body.thresholdCounts || [10];
    for (let i = 0; i < thresholdCounts.length; i++) {
      if (thresholdCounts[i] < 1) {
        return Response.json(
          createErrorResponse(ErrorCodes.MEDAL_THRESHOLD_INVALID, `等级${i + 1}的次数至少需要1次`),
          { status: 400 }
        );
      }
      if (i > 0 && thresholdCounts[i] <= thresholdCounts[i - 1]) {
        return Response.json(
          createErrorResponse(ErrorCodes.MEDAL_THRESHOLD_NOT_ASCENDING, `等级${i + 1}的次数必须大于等级${i}的次数`),
          { status: 400 }
        );
      }
    }

    const rawDb = getRawDb();
    const now = new Date().toISOString();
    const id = generateId();

    // 处理色系数据
    let tierColors: string | null = null;
    if (body.levelMode === "multiple" && body.tierColorScheme) {
      const scheme = MedalTierColorSchemes[body.tierColorScheme];
      tierColors = JSON.stringify(scheme.slice(0, body.levelCount || 3));
    }

    // 转换 icon_type: "icon" -> "lucide", "upload" -> "custom" (用于存储到数据库)
    const dbIconType = body.icon.type === "icon" ? "lucide" : "custom";

    // 插入数据库
    // family_id 为 NULL 表示系统级模板（所有家庭可用）
    rawDb.query(`
      INSERT INTO medal_template (
        id, family_id, name, icon_type, icon_value, icon_color, border_style,
        level_mode, level_count, tier_colors, threshold_counts, reward_points, is_continuous,
        is_active, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      null, // 系统级模板，family_id 为 NULL
      body.name.trim(),
      dbIconType,
      body.icon.value,
      body.icon.color || null,
      body.borderStyle || "circle",
      body.levelMode || "single",
      body.levelMode === "multiple" ? (body.levelCount || 3) : 1,
      tierColors,
      JSON.stringify(thresholdCounts),
      body.rewardPoints || 0,
      body.isContinuous ? 1 : 0,
      1, // is_active
      session.user.id,
      now,
      now
    );

    return Response.json(
      createSuccessResponse({
        id,
        name: body.name.trim(),
        message: "徽章模板创建成功",
      }),
      { status: 201 }
    );

  } catch (error) {
    console.error("POST /api/admin/medal-templates error:", error);
    // 详细记录错误信息以便调试
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error details:", { message: errorMessage, stack: errorStack, body: requestBody });
    return Response.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, `创建徽章模板失败: ${errorMessage}`),
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/medal-templates
 * 获取所有徽章模板列表
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request.headers);

    if (!session?.user) {
      return Response.json(
        createErrorResponse(ErrorCodes.UNAUTHORIZED, "未登录"),
        { status: 401 }
      );
    }

    if (!isAdmin(session.user as User)) {
      return Response.json(
        createErrorResponse(ErrorCodes.FORBIDDEN, "只有管理员可以查看徽章模板"),
        { status: 403 }
      );
    }

    const rawDb = getRawDb();
    
    const templates = rawDb.query(`
      SELECT
        id,
        name,
        icon_type as iconType,
        icon_value as iconValue,
        icon_color as iconColor,
        border_style as borderStyle,
        level_mode as levelMode,
        level_count as levelCount,
        reward_points as rewardPoints,
        is_public as isPublic
      FROM medal_template
      ORDER BY created_at DESC
    `).all() as Array<{
      id: string;
      name: string;
      iconType: "lucide" | "custom";
      iconValue: string;
      iconColor: string | null;
      borderStyle: "circle" | "hexagon" | "square";
      levelMode: "single" | "multiple";
      levelCount: number;
      rewardPoints: number;
      isPublic: number;
    }>;

    // 格式化响应数据
    const formattedTemplates = templates.map(t => ({
      id: t.id,
      name: t.name,
      icon: {
        type: t.iconType === "lucide" ? "icon" : "upload",
        value: t.iconValue,
        color: t.iconColor,
      },
      borderStyle: t.borderStyle,
      levelMode: t.levelMode,
      levelCount: t.levelCount,
      rewardPoints: t.rewardPoints,
      isActive: Boolean(t.isPublic),
    }));

    return Response.json(
      createSuccessResponse(formattedTemplates),
      { status: 200 }
    );

  } catch (error) {
    console.error("GET /api/admin/medal-templates error:", error);
    return Response.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "获取徽章模板列表失败"),
      { status: 500 }
    );
  }
}
