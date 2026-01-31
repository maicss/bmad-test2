import { NextRequest } from "next/server";
import { getSession, isAdmin } from "@/lib/auth";
import { getRawDb } from "@/database/db";
import type { User } from "@/lib/db/schema";
import { ErrorCodes, createErrorResponse, createSuccessResponse } from "@/lib/constant";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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
        createErrorResponse(ErrorCodes.FORBIDDEN, "Only admins can suspend families"),
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const rawDb = getRawDb();

    const family = rawDb
      .query("SELECT * FROM family WHERE id = ?")
      .get(id) as {
        id: string;
        status: string;
      } | null;

    if (!family) {
      return Response.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, "Family not found"),
        { status: 404 }
      );
    }

    const now = new Date();

    if (family.status === "suspended") {
      const previousStatus = rawDb
        .query("SELECT previous_status FROM family WHERE id = ?")
        .get(id) as { previous_status: string } | null;

      rawDb.run(
        `
        UPDATE family 
        SET status = ?, previous_status = NULL, suspended_at = NULL, suspended_by = NULL, updated_at = ?
        WHERE id = ?
      `,
        [previousStatus?.previous_status || "approved", now.toISOString(), id]
      );

      return Response.json(
        createSuccessResponse({ message: "Family restored successfully" }),
        { status: 200 }
      );
    } else {
      rawDb.run(
        `
        UPDATE family 
        SET status = ?, previous_status = ?, suspended_at = ?, suspended_by = ?, updated_at = ?
        WHERE id = ?
      `,
        ["suspended", family.status, now.toISOString(), session.user.id, now.toISOString(), id]
      );

      return Response.json(
        createSuccessResponse({ message: "Family suspended successfully" }),
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Suspend family error:", error);
    return Response.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Internal server error"),
      { status: 500 }
    );
  }
}
