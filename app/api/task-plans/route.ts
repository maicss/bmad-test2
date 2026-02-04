import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { getSession, isAdmin, isParent } from "@/lib/auth";
import { getDb } from "@/database/db";
import { taskPlans } from "@/lib/db/schema";
import { validateDateRangeOverlap } from "@/lib/db/queries";
import type { User } from "@/lib/db/schema";
import {
  ErrorCodes,
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/constant";

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const session = await getSession(request.headers);
    if (!session?.user) {
      return Response.json(
        createErrorResponse(ErrorCodes.UNAUTHORIZED, "Unauthorized"),
        { status: 401 },
      );
    }

    // 2. Authorization
    if (!isAdmin(session.user as User) && !isParent(session.user as User)) {
      return Response.json(
        createErrorResponse(ErrorCodes.FORBIDDEN, "Only admin and parent can create"),
        { status: 403 },
      );
    }

    const user = session.user as User;
    const body = await request.json();

    // 3. Validation
    const {
      name,
      taskName,
      points,
      dateStrategyId,
      isTemplate,
      familyId,
    } = body;

    // Required fields validation
    if (!name || !taskName || points === undefined || !dateStrategyId) {
      return Response.json(
        createErrorResponse(ErrorCodes.VALIDATION_ERROR, "Missing required fields"),
        { status: 400 },
      );
    }

    // Name length validation
    if (name.length < 2 || name.length > 20) {
      return Response.json(
        createErrorResponse(ErrorCodes.VALIDATION_ERROR, "计划名称需2-20个字符"),
        { status: 400 },
      );
    }

    if (taskName.length < 2 || taskName.length > 20) {
      return Response.json(
        createErrorResponse(ErrorCodes.VALIDATION_ERROR, "任务名称需2-20个字符"),
        { status: 400 },
      );
    }

    // Description length validation (optional)
    if (body.description && (body.description.length < 2 || body.description.length > 200)) {
      return Response.json(
        createErrorResponse(ErrorCodes.VALIDATION_ERROR, "描述需2-200个字符"),
        { status: 400 },
      );
    }

    // 4. Date overlap validation (if not template)
    if (!isTemplate && body.startDate && body.endDate && dateStrategyId) {
      const hasOverlap = await validateDateRangeOverlap(
        body.startDate,
        body.endDate,
        dateStrategyId
      );
      if (!hasOverlap && !body.confirmNoOverlap) {
        return Response.json({
          success: false,
          error: {
            code: "DATE_OVERLAP_WARNING",
            message: "所选日期范围和日期策略没有重合，不会产生任务，确定保存吗"
          },
          requiresConfirmation: true,
        }, { status: 400 });
      }
    }

    // 5. Insert into database
    const db = getDb();
    const id = `tp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    await db.insert(taskPlans).values({
      id,
      isTemplate: isTemplate || false,
      familyId: isTemplate ? null : (familyId || null),
      name,
      description: body.description || null,
      taskName,
      category: body.category || null,
      points,
      targetMemberIds: body.targetMemberIds && body.targetMemberIds.length > 0
        ? JSON.stringify(body.targetMemberIds)
        : null,
      imageType: body.imageType || "icon",
      color: body.color || null,
      image: body.image || "Star",
      borderStyle: body.borderStyle || "circle",
      startDate: body.startDate || null,
      endDate: body.endDate || null,
      dateStrategyId: dateStrategyId || null,
      enableCombo: body.enableCombo || false,
      comboStrategyType: body.comboStrategyType || null,
      comboStrategyConfig: body.comboStrategyConfig || null,
      medalTemplateId: body.medalTemplateId || null,
      taskType: body.taskType || "daily",
      ageRangeMin: body.ageRangeMin || null,
      ageRangeMax: body.ageRangeMax || null,
      isPublic: body.isPublic || false,
      status: isTemplate ? (body.isPublic ? "published" : "unpublished") : "active",
      templateId: body.templateId || null,
      createdBy: user.id,
      createdAt: now,
      updatedAt: now,
    });

    return Response.json(
      createSuccessResponse({ id, name }),
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/task-plans error:", error);
    return Response.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to create task plan"),
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request.headers);
    if (!session?.user) {
      return Response.json(
        createErrorResponse(ErrorCodes.UNAUTHORIZED, "Unauthorized"),
        { status: 401 },
      );
    }

    const user = session.user as User;
    const db = getDb();

    // Admin gets all templates
    if (isAdmin(user)) {
      const plans = await db.query.taskPlans.findMany({
        where: eq(taskPlans.isTemplate, true),
        orderBy: [taskPlans.createdAt],
      });
      return Response.json(createSuccessResponse({ plans }));
    }

    // Parent gets family plans
    if (isParent(user)) {
      // Get family_id from family_member
      const rawDb = getDb();
      const member = rawDb
        .query(`SELECT family_id FROM family_member WHERE user_id = ?`)
        .get(user.id) as { family_id: string } | null;

      if (!member?.family_id) {
        return Response.json(createSuccessResponse({ plans: [] }));
      }

      const plans = await db.query.taskPlans.findMany({
        where: eq(taskPlans.familyId, member.family_id),
        orderBy: [taskPlans.createdAt],
      });

      return Response.json(createSuccessResponse({ plans }));
    }

    return Response.json(
      createErrorResponse(ErrorCodes.FORBIDDEN, "Forbidden"),
      { status: 403 },
    );
  } catch (error) {
    console.error("GET /api/task-plans error:", error);
    return Response.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Internal server error"),
      { status: 500 },
    );
  }
}
