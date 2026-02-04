import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import {
  ErrorCodes,
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/constant";
import { getUserByPhone, getFamilyDateStrategies } from "@/lib/db/queries";
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

    // Get user's family_id and all user_ids in the family
    const rawDb = getRawDb();

    const user = await getUserByPhone(session.user.phone || "");
    if (!user) {
      return Response.json(
        createErrorResponse(ErrorCodes.FORBIDDEN, "User not found"),
        { status: 403 },
      );
    }

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

    const familyUsers = rawDb
      .query(
        `
      SELECT user_id FROM family_member WHERE family_id = ?
    `,
      )
      .all(member.family_id) as { user_id: string }[];

    if (familyUsers.length === 0) {
      return Response.json(createSuccessResponse({ strategies: [] }));
    }

    const userIds = familyUsers.map((u) => u.user_id);

    // Use Drizzle ORM to get family date strategies
    const strategies = await getFamilyDateStrategies(userIds);

    return Response.json(createSuccessResponse({ strategies }));
  } catch (error) {
    console.error("GET /api/family/date-strategies error:", error);
    return Response.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Internal server error"),
      { status: 500 },
    );
  }
}
