import { NextRequest } from "next/server";
import { getSession, isAdmin } from "@/lib/auth";
import { getDb } from "@/database/db";
import { taskDefinitions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { User } from "@/lib/db/schema";
import {
  ErrorCodes,
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/constant";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request.headers);

    if (!session?.user) {
      return Response.json(
        createErrorResponse(ErrorCodes.UNAUTHORIZED, "Unauthorized"),
        { status: 401 },
      );
    }

    if (!isAdmin(session.user as User)) {
      return Response.json(
        createErrorResponse(ErrorCodes.FORBIDDEN, "Only admins can create"),
        { status: 403 },
      );
    }

    const body = await request.json();
    const {
      templateName,
      taskName,
      basePoints,
      dateStrategyId,
      category,
    } = body;

    const isTemplateFromBody = body.isTemplate === 1 || body.isTemplate === true;

    if (!templateName || !taskName || !basePoints || !dateStrategyId) {
      return Response.json(
        createErrorResponse(ErrorCodes.VALIDATION_ERROR, "Missing required fields"),
        { status: 400 },
      );
    }

    const db = getDb();
    const id = `tt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    await db.insert(taskDefinitions).values({
      id,
      familyId: "system",
      name: taskName,
      description: null,
      category: category || "custom",
      points: basePoints,
      icon: null,
      color: null,
      isActive: true,
      dailyLimit: null,
      createdBy: session.user.id,
      createdAt: now,
      updatedAt: now,
      isTemplate: 1,
      templateName,
    });

    console.log("Insert successful, ID:", id);
    return Response.json(
      createSuccessResponse({ id, templateName, taskName }),
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/admin/task-templates error:", error);
    return Response.json(
      createErrorResponse(
        ErrorCodes.INTERNAL_ERROR,
        "Failed to create template",
      ),
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

    if (!isAdmin(session.user as User)) {
      return Response.json(
        createErrorResponse(ErrorCodes.FORBIDDEN, "Only admins can access"),
        { status: 403 },
      );
    }

    const db = getDb();
    const templates = await db.select()
      .from(taskDefinitions)
      .where(eq(taskDefinitions.isTemplate, 1))
      .orderBy(taskDefinitions.createdAt)
      .all();

    return Response.json(createSuccessResponse({ templates }));
  } catch (error) {
    console.error("GET /api/admin/task-templates error:", error);
    return Response.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Internal server error"),
      { status: 500 },
    );
  }
}
