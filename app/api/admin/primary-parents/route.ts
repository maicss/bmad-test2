import { NextRequest } from "next/server";
import { getRawDb } from "@/database/db";
import { ErrorCodes, createErrorResponse, createSuccessResponse } from "@/lib/constant";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const rawDb = getRawDb();

    // Get all primary parents with search
    let query = `
      SELECT DISTINCT
        u.id as id,
        u.name,
        u.phone,
        pp.family_name
      FROM user u
      JOIN family_member fm ON u.id = fm.user_id
      JOIN family pp ON fm.family_id = pp.id
      WHERE fm.role = 'primary'
        AND u.role = 'parent'
        AND pp.status = 'approved'
    `;

    const params: string[] = [];

    if (search) {
      query += " AND (u.name LIKE ? OR u.phone LIKE ? OR pp.family_name LIKE ?)";
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    query += `
      ORDER BY u.name
      LIMIT 50
    `;

    const primaryParents = rawDb.query(query).all(...params) as Array<{
      id: string;
      name: string;
      phone: string;
      family_name: string;
    }>;

    return Response.json(
      createSuccessResponse({
        primaryParents,
      })
    );
  } catch (error) {
    console.error("GET /api/admin/primary-parents error:", error);
    return Response.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to fetch primary parents"),
      { status: 500 }
    );
  }
}
