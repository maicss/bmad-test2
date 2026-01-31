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
        createErrorResponse(ErrorCodes.FORBIDDEN, "Only admins can delete families"),
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

    if (family.status === "deleted") {
      return Response.json(
        createErrorResponse(ErrorCodes.BAD_REQUEST, "Family is already deleted"),
        { status: 400 }
      );
    }

    const now = new Date();

    rawDb.run(
      `
      UPDATE family 
      SET status = ?, deleted_at = ?, deleted_by = ?, updated_at = ?
      WHERE id = ?
    `,
      ["deleted", now.toISOString(), session.user.id, now.toISOString(), id]
    );

    return Response.json(
      createSuccessResponse({ message: "Family deleted successfully" }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete family error:", error);
    return Response.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Internal server error"),
      { status: 500 }
    );
  }
}
