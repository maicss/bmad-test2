import { NextRequest } from "next/server";
import { getSession, isAdmin } from "@/lib/auth";
import { getRawDb } from "@/database/db";
import type { User } from "@/lib/db/schema";
import { ErrorCodes, createErrorResponse, createSuccessResponse } from "@/lib/constant";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
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
    const template = rawDb.query(`
      SELECT * FROM wish_template WHERE id = ? AND status != 'deleted'
    `).get(id) as any;

    if (!template) {
      return Response.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, "Wish template not found"),
        { status: 404 }
      );
    }

    // 转换 icon_type: "lucide" -> "icon", "custom" -> "upload"
    const formattedTemplate = {
      ...template,
      icon_type: template.icon_type === "lucide" ? "icon" : "upload",
    };

    return Response.json(createSuccessResponse({ template: formattedTemplate }));
  } catch (error) {
    console.error(`GET /api/admin/wish-templates/${id} error:`, error);
    return Response.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Internal server error"),
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
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
        createErrorResponse(ErrorCodes.FORBIDDEN, "Only admins can update"),
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, type, pointsRequired, iconType, iconValue, iconColor, borderStyle, dueDate, isActive } = body;

    const rawDb = getRawDb();
    const existing = rawDb.query(`
      SELECT id FROM wish_template WHERE id = ? AND status != 'deleted'
    `).get(id) as { id: string } | undefined;

    if (!existing) {
      return Response.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, "Wish template not found"),
        { status: 404 }
      );
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      if (name.length < 2 || name.length > 50) {
        return Response.json(
          createErrorResponse(ErrorCodes.VALIDATION_ERROR, "Name must be 2-50 characters"),
          { status: 400 }
        );
      }
      updates.push(`name = ?`);
      values.push(name);
    }

    if (description !== undefined) {
      updates.push(`description = ?`);
      values.push(description || null);
    }

    if (type !== undefined) {
      if (!["item", "activity"].includes(type)) {
        return Response.json(
          createErrorResponse(ErrorCodes.VALIDATION_ERROR, "Invalid type"),
          { status: 400 }
        );
      }
      updates.push(`type = ?`);
      values.push(type);
    }

    if (pointsRequired !== undefined) {
      if (Number(pointsRequired) <= 0) {
        return Response.json(
          createErrorResponse(ErrorCodes.VALIDATION_ERROR, "Points must be greater than 0"),
          { status: 400 }
        );
      }
      updates.push(`points_required = ?`);
      values.push(Number(pointsRequired));
    }

    if (iconType !== undefined) {
      updates.push(`icon_type = ?`);
      values.push(iconType);
    }

    if (iconValue !== undefined) {
      updates.push(`icon_value = ?`);
      values.push(iconValue || null);
    }

    if (iconColor !== undefined) {
      updates.push(`icon_color = ?`);
      values.push(iconColor || null);
    }

    if (borderStyle !== undefined) {
      updates.push(`border_style = ?`);
      values.push(borderStyle);
    }

    if (dueDate !== undefined) {
      updates.push(`due_date = ?`);
      values.push(dueDate || null);
    }

    if (isActive !== undefined) {
      updates.push(`is_active = ?`);
      values.push(isActive ? 1 : 0);
    }

    if (updates.length === 0) {
      return Response.json(
        createErrorResponse(ErrorCodes.VALIDATION_ERROR, "No fields to update"),
        { status: 400 }
      );
    }

    updates.push(`updated_at = ?`);
    values.push(new Date().toISOString());
    values.push(id);

    rawDb.query(`
      UPDATE wish_template SET ${updates.join(", ")} WHERE id = ?
    `).run(...values);

    return Response.json(createSuccessResponse({ id }));
  } catch (error) {
    console.error(`PUT /api/admin/wish-templates/${id} error:`, error);
    return Response.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to update wish template"),
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
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
        createErrorResponse(ErrorCodes.FORBIDDEN, "Only admins can delete"),
        { status: 403 }
      );
    }

    const rawDb = getRawDb();
    const existing = rawDb.query(`
      SELECT id FROM wish_template WHERE id = ? AND status != 'deleted'
    `).get(id) as { id: string } | undefined;

    if (!existing) {
      return Response.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, "Wish template not found"),
        { status: 404 }
      );
    }

    rawDb.query(`
      UPDATE wish_template SET status = 'deleted', updated_at = ? WHERE id = ?
    `).run(new Date().toISOString(), id);

    return Response.json(createSuccessResponse({ id }));
  } catch (error) {
    console.error(`DELETE /api/admin/wish-templates/${id} error:`, error);
    return Response.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to delete wish template"),
      { status: 500 }
    );
  }
}
