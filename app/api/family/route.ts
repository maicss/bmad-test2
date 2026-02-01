import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { getRawDb } from "@/database/db";
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

    const rawDb = getRawDb();
    
    const familyMember = rawDb.query(`
      SELECT fm.*, f.name as family_name, f.id as family_id
      FROM family_member fm
      JOIN family f ON fm.family_id = f.id
      WHERE fm.user_id = ?
      LIMIT 1
    `).get(session.user.id) as {
      family_id: string;
      family_name: string;
    } | null;

    if (!familyMember) {
      return Response.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, "Family not found"),
        { status: 404 }
      );
    }

    const members = rawDb.query(`
      SELECT fm.*, u.name, u.role, u.email
      FROM family_member fm
      JOIN user u ON fm.user_id = u.id
      WHERE fm.family_id = ?
    `).all(familyMember.family_id);

    return Response.json(
      createSuccessResponse({
        family: {
          id: familyMember.family_id,
          name: familyMember.family_name,
        },
        members,
      })
    );
  } catch (error) {
    console.error("GET /api/family error:", error);
    return Response.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Internal server error"),
      { status: 500 }
    );
  }
}
