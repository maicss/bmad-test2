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
      SELECT * FROM task_definition WHERE id = ? AND is_template = 1
    `).get(id);

    if (!template) {
      return Response.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, "Template not found"),
        { status: 404 }
      );
    }

    return Response.json(createSuccessResponse({ template }));
  } catch (error) {
    console.error("GET /api/admin/task-templates/[id] error:", error);
    return Response.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Internal server error"),
      { status: 500 }
    );
  }
}
