import { NextRequest } from "next/server";
import { getSession, isAdmin } from "@/lib/auth";
import { getRawDb } from "@/database/db";
import type { User } from "@/lib/db/schema";
import { ErrorCodes, createErrorResponse, createSuccessResponse } from "@/lib/constant";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(request.headers);
    const { id } = await params;

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
      SELECT * FROM date_strategy_template WHERE id = ?
    `).get(id);

    if (!template) {
      return Response.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, "Template not found"),
        { status: 404 }
      );
    }

    return Response.json(createSuccessResponse({ template }));
  } catch (error) {
    console.error("GET /api/admin/date-strategy-templates/[id] error:", error);
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
  try {
    const session = await getSession(request.headers);
    const { id } = await params;

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
    const { name, description, region, year, isPublic, dates } = body;

    const rawDb = getRawDb();

    const existing = rawDb.query(`
      SELECT copy_count FROM date_strategy_template WHERE id = ?
    `).get(id) as { copy_count: number } | null;

    if (!existing) {
      return Response.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, "Template not found"),
        { status: 404 }
      );
    }

    const now = new Date().toISOString();

    rawDb.query(`
      UPDATE date_strategy_template 
      SET name = ?, description = ?, region = ?, year = ?, is_public = ?, dates = ?, updated_at = ?
      WHERE id = ?
    `).run(
      name,
      description || null,
      region,
      year,
      isPublic ? 1 : 0,
      dates,
      now,
      id
    );

    return Response.json(createSuccessResponse({ 
      id, 
      name, 
      description, 
      region, 
      year, 
      isPublic, 
      dates,
      copyCount: existing.copy_count 
    }));
  } catch (error) {
    console.error("PUT /api/admin/date-strategy-templates/[id] error:", error);
    return Response.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to update template"),
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
    const { id } = await params;

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
      SELECT copy_count FROM date_strategy_template WHERE id = ?
    `).get(id) as { copy_count: number } | null;

    if (!existing) {
      return Response.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, "Template not found"),
        { status: 404 }
      );
    }

    if (existing.copy_count > 0) {
      return Response.json(
        createErrorResponse(ErrorCodes.VALIDATION_ERROR, "Cannot delete template that is being copied"),
        { status: 400 }
      );
    }

    rawDb.query(`DELETE FROM date_strategy_template WHERE id = ?`).run(id);

    return Response.json(createSuccessResponse({ deleted: true }));
  } catch (error) {
    console.error("DELETE /api/admin/date-strategy-templates/[id] error:", error);
    return Response.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to delete template"),
      { status: 500 }
    );
  }
}
