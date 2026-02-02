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
    const { name, description, type, pointsRequired, iconType, iconValue, iconColor, borderStyle, dueDate, isActive } = body;

    if (!name || name.length < 2 || name.length > 50) {
      return Response.json(
        createErrorResponse(ErrorCodes.VALIDATION_ERROR, "Name must be 2-50 characters"),
        { status: 400 }
      );
    }

    if (!type || !["item", "activity"].includes(type)) {
      return Response.json(
        createErrorResponse(ErrorCodes.VALIDATION_ERROR, "Invalid type"),
        { status: 400 }
      );
    }

    if (!pointsRequired || Number(pointsRequired) <= 0) {
      return Response.json(
        createErrorResponse(ErrorCodes.VALIDATION_ERROR, "Points must be greater than 0"),
        { status: 400 }
      );
    }

    const rawDb = getRawDb();
    const id = `wt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    rawDb.query(`
      INSERT INTO wish_template (
        id, name, description, type, points_required, icon_type, icon_value, icon_color, border_style, due_date,
        is_active, status, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      name,
      description || null,
      type,
      Number(pointsRequired),
      iconType || "lucide",
      iconValue || null,
      iconColor || null,
      borderStyle || "circle",
      dueDate || null,
      isActive !== undefined ? (isActive ? 1 : 0) : 1,
      "active",
      session.user.id,
      now,
      now
    );

    return Response.json(
      createSuccessResponse({ id, name }),
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/admin/wish-templates error:", error);
    return Response.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to create wish template"),
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
      SELECT * FROM wish_template WHERE status = 'active' ORDER BY created_at DESC
    `).all();

    return Response.json(createSuccessResponse({ templates }));
  } catch (error) {
    console.error("GET /api/admin/wish-templates error:", error);
    return Response.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Internal server error"),
      { status: 500 }
    );
  }
}
