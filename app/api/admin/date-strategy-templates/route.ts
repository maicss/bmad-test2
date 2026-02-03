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

    if (!isAdmin(session.user as User)) {
      return Response.json(
        createErrorResponse(ErrorCodes.FORBIDDEN, "Only admins can access"),
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const region = searchParams.get("region");
    const year = searchParams.get("year");

    const rawDb = getRawDb();

    let query = `SELECT * FROM date_strategy WHERE 1=1`;
    const params: (string | number)[] = [];

    if (region) {
      query += ` AND region = ?`;
      params.push(region);
    }

    if (year) {
      query += ` AND year = ?`;
      params.push(parseInt(year));
    }

    query += ` ORDER BY year DESC, created_at DESC`;

    const templates = rawDb.query(query).all(...params);

    return Response.json(createSuccessResponse({ templates }));
  } catch (error) {
    console.error("GET /api/admin/date-strategy-templates error:", error);
    return Response.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Internal server error"),
      { status: 500 }
    );
  }
}

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
    const { name, description, region, year, isPublic, dates } = body;

    if (!name || !region || !year || !dates) {
      return Response.json(
        createErrorResponse(ErrorCodes.VALIDATION_ERROR, "Missing required fields"),
        { status: 400 }
      );
    }

    const rawDb = getRawDb();
    const id = `dst_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    rawDb.query(`
      INSERT INTO date_strategy (id, name, description, region, year, is_public, dates, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      name,
      description || null,
      region,
      year,
      isPublic ? 1 : 0,
      dates,
      session.user.id,
      now,
      now
    );

    return Response.json(
      createSuccessResponse({ id, name, description, region, year, isPublic, dates }),
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/admin/date-strategy-templates error:", error);
    return Response.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to create template"),
      { status: 500 }
    );
  }
}
