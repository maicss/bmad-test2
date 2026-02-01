import { NextRequest } from "next/server";
import { getSession, isAdmin } from "@/lib/auth";
import { getRawDb } from "@/database/db";
import type { User } from "@/lib/db/schema";
import { ErrorCodes, createErrorResponse, createSuccessResponse } from "@/lib/constant";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request.headers);

    if (!session?.user) {
      return Response.json(
        createErrorResponse(ErrorCodes.UNAUTHORIZED, "Unauthorized"),
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const isPublic = searchParams.get("is_public");
    const category = searchParams.get("category");

    const rawDb = getRawDb();

    let query = `SELECT * FROM date_strategy_template WHERE 1=1`;
    const params: (string | number)[] = [];

    if (isPublic !== null) {
      query += ` AND is_public = ?`;
      params.push(isPublic === "true" ? 1 : 0);
    }

    query += ` ORDER BY created_at DESC`;

    const templates = rawDb.query(query).all(...params);

    return Response.json(createSuccessResponse({ templates }));
  } catch (error) {
    console.error("GET /api/date-strategy-templates error:", error);
    return Response.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Internal server error"),
      { status: 500 }
    );
  }
}
