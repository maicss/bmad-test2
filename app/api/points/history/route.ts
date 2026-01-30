import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import {
  getPointTransactions,
  getFamilyMember,
} from "@/lib/db/queries";
import { ErrorCodes, createErrorResponse, createSuccessResponse } from "@/lib/constant";

const querySchema = z.object({
  memberId: z.string().min(1, "Member ID is required"),
  familyId: z.string().min(1, "Family ID is required"),
  type: z.enum(["earn", "spend", "adjust", "expire"]).optional(),
  limit: z.number().int().positive().default(20),
  offset: z.number().int().nonnegative().default(0),
});

/**
 * GET /api/points/history
 * Get points transaction history
 */
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
    
    const validation = querySchema.safeParse({
      memberId: searchParams.get("memberId"),
      familyId: searchParams.get("familyId"),
      type: searchParams.get("type") as "earn" | "spend" | "adjust" | "expire" | null,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 20,
      offset: searchParams.get("offset") ? parseInt(searchParams.get("offset")!, 10) : 0,
    });

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return Response.json(
        { success: false, error: firstError?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const { memberId, familyId, type, limit, offset } = validation.data;

    // Verify user is a member of this family
    const membership = await getFamilyMember(familyId, session.user.id);
    if (!membership) {
      return Response.json(
        createErrorResponse(ErrorCodes.FORBIDDEN, "Access denied"),
        { status: 403 }
      );
    }

    // Get transaction history
    const transactions = await getPointTransactions(memberId, {
      type,
      limit,
      offset,
    });

    return Response.json({
      success: true,
      data: {
        memberId,
        transactions,
        pagination: {
          limit,
          offset,
        },
      },
    });
  } catch (error) {
    console.error("GET /api/points/history error:", error);
    return Response.json(
        createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Internal server error"),
        { status: 500 }
      );
  }
}
