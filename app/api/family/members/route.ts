import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import {
  ErrorCodes,
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/constant";
import { getUserByPhone, getFamilyMembersByFamilyId } from "@/lib/db/queries";
import { getRawDb } from "@/database/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request.headers);
    if (!session?.user) {
      return Response.json(
        createErrorResponse(ErrorCodes.UNAUTHORIZED, "Unauthorized"),
        { status: 401 },
      );
    }

    // Get user's family_id
    const user = await getUserByPhone(session.user.phone || "");
    if (!user) {
      return Response.json(
        createErrorResponse(ErrorCodes.FORBIDDEN, "User not found"),
        { status: 403 },
      );
    }

    // Get family_id from family_member table using raw db
    const rawDb = getRawDb();
    const member = rawDb
      .query(
        `
      SELECT family_id FROM family_member WHERE user_id = ?
    `,
      )
      .get(user.id) as { family_id: string } | null;

    if (!member) {
      return Response.json(
        createErrorResponse(ErrorCodes.FORBIDDEN, "Not in a family"),
        { status: 403 },
      );
    }

    // Use Drizzle ORM to get members
    const members = await getFamilyMembersByFamilyId(member.family_id);

    return Response.json(createSuccessResponse({ members }));
  } catch (error) {
    console.error("GET /api/family/members error:", error);
    return Response.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Internal server error"),
      { status: 500 },
    );
  }
}
