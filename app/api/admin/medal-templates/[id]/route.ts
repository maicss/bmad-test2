/**
 * PUT /api/admin/medal-templates/:id
 * 更新徽章模板
 */

import { NextRequest } from "next/server";
import { getSession, isAdmin } from "@/lib/auth";
import { getRawDb } from "@/database/db";
import type { User } from "@/lib/db/schema";
import { ErrorCodes, createErrorResponse, createSuccessResponse } from "@/lib/constant";
import type { CreateMedalTemplateRequest } from "@/types/medal";
import { MedalTierColorSchemes } from "@/types/medal";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
        createErrorResponse(ErrorCodes.FORBIDDEN, "只有管理员可以更新徽章模板"),
        { status: 403 }
      );
    }

    const { id } = await params;
    const rawDb = getRawDb();

    // 检查模板是否存在
    const existing = rawDb.query(`
      SELECT id FROM medal_template WHERE id = ?
    `).get(id) as { id: string } | null;

    if (!existing) {
      return Response.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, "徽章模板不存在"),
        { status: 404 }
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

    const now = new Date().toISOString();

    // 处理色系数据
    let tierColors: string | null = null;
    if (body.levelMode === "multiple" && body.tierColorScheme) {
      const scheme = MedalTierColorSchemes[body.tierColorScheme];
      tierColors = JSON.stringify(scheme.slice(0, body.levelCount || 3));
    }

    // 更新数据库
    rawDb.query(`
      UPDATE medal_template SET
        name = ?,
        icon_type = ?,
        icon_value = ?,
        icon_color = ?,
        border_style = ?,
        level_mode = ?,
        level_count = ?,
        tier_colors = ?,
        threshold_counts = ?,
        reward_points = ?,
        is_continuous = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      body.name.trim(),
      body.icon.type,
      body.icon.value,
      body.icon.color || null,
      body.borderStyle || "circle",
      body.levelMode || "single",
      body.levelMode === "multiple" ? (body.levelCount || 3) : 1,
      tierColors,
      JSON.stringify(thresholdCounts),
      body.rewardPoints || 0,
      body.isContinuous ? 1 : 0,
      now,
      id
    );

    return Response.json(
      createSuccessResponse({
        id,
        name: body.name.trim(),
        message: "徽章模板更新成功",
      }),
      { status: 200 }
    );

  } catch (error) {
    console.error("PUT /api/admin/medal-templates error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error details:", { message: errorMessage, body: requestBody });
    return Response.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, `更新徽章模板失败: ${errorMessage}`),
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
        createErrorResponse(ErrorCodes.FORBIDDEN, "只有管理员可以删除徽章模板"),
        { status: 403 }
      );
    }

    const { id } = await params;
    const rawDb = getRawDb();

    // 检查模板是否存在
    const existing = rawDb.query(`
      SELECT id FROM medal_template WHERE id = ?
    `).get(id) as { id: string } | null;

    if (!existing) {
      return Response.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, "徽章模板不存在"),
        { status: 404 }
      );
    }

    // 删除模板
    rawDb.query(`DELETE FROM medal_template WHERE id = ?`).run(id);

    return Response.json(
      createSuccessResponse({ message: "徽章模板删除成功" }),
      { status: 200 }
    );

  } catch (error) {
    console.error("DELETE /api/admin/medal-templates error:", error);
    return Response.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "删除徽章模板失败"),
      { status: 500 }
    );
  }
}
