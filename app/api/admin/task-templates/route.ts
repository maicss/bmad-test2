import { NextRequest } from "next/server";
import { getSession, isAdmin } from "@/lib/auth";
import { getRawDb } from "@/database/db";
import type { User } from "@/lib/db/schema";
import { ErrorCodes, createErrorResponse, createSuccessResponse } from "@/lib/constant";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request.headers);

    if (!session?.user) {
      return Response.json(
        createErrorResponse(ErrorCodes.UNAUTHORIZED, "Unauthorized"),
        { status: 401 }
      );
    }

    if (!isAdmin(session.user as User)) {
      return Response.json(
        createErrorResponse(ErrorCodes.FORBIDDEN, "Only admins can create"),
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      templateName,
      taskName,
      basePoints,
      startDate,
      endDate,
      dateStrategyId,
      comboStrategyType,
      comboStrategyConfig,
      badgeId,
      ageRangeMin,
      ageRangeMax,
      taskType,
      category,
    } = body;

    if (!templateName || !taskName || !basePoints || !startDate || !endDate || !dateStrategyId) {
      return Response.json(
        createErrorResponse(ErrorCodes.VALIDATION_ERROR, "Missing required fields"),
        { status: 400 }
      );
    }

    const rawDb = getRawDb();
    const id = `tt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    rawDb.query(`
      INSERT INTO task_definition (
        id, family_id, name, description, category, points, icon, color, 
        is_active, daily_limit, created_by, template_name, start_date, end_date,
        date_strategy_id, combo_strategy_type, combo_strategy_config, badge_id,
        age_range_min, age_range_max, task_type, is_template, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      "system",
      taskName,
      null,
      category || "custom",
      basePoints,
      null,
      null,
      1,
      null,
      session.user.id,
      templateName,
      startDate,
      endDate,
      dateStrategyId,
      comboStrategyType || "linear",
      comboStrategyConfig || null,
      badgeId || null,
      ageRangeMin || null,
      ageRangeMax || null,
      taskType || "daily",
      1,
      now,
      now
    );

    return Response.json(
      createSuccessResponse({ id, templateName, taskName }),
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/admin/task-templates error:", error);
    return Response.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to create template"),
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request.headers);

    if (!session?.user) {
      return Response.json(
        createErrorResponse(ErrorCodes.UNAUTHORIZED, "Unauthorized"),
        { status: 401 }
      );
    }

    if (!isAdmin(session.user as User)) {
      return Response.json(
        createErrorResponse(ErrorCodes.FORBIDDEN, "Only admins can access"),
        { status: 403 }
      );
    }

    const rawDb = getRawDb();
    const templates = rawDb.query(`
      SELECT * FROM task_definition WHERE is_template = 1 ORDER BY created_at DESC
    `).all();

    return Response.json(createSuccessResponse({ templates }));
  } catch (error) {
    console.error("GET /api/admin/task-templates error:", error);
    return Response.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Internal server error"),
      { status: 500 }
    );
  }
}
