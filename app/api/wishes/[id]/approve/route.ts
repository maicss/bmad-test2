import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession, isParent } from "@/lib/auth";
import type { User } from "@/lib/db/schema";
import {
  getWishById,
  getFamilyMember,
  approveWish,
  rejectWish,
} from "@/lib/db/queries";
import { ErrorCodes, createErrorResponse, createSuccessResponse } from "@/lib/constant";

const approveSchema = z.object({
  action: z.enum(["approve", "reject"]),
  note: z.string().max(500, "Note too long").optional(),
});

/**
 * POST /api/wishes/[id]/approve
 * Approve or reject a wish
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(request.headers);
    
    if (!session?.user) {
      return Response.json(
        createErrorResponse(ErrorCodes.UNAUTHORIZED, "Unauthorized"),
        { status: 401 }
      );
    }

    // Only parents can approve/reject wishes
    if (!isParent(session.user as User)) {
      return Response.json(
        createErrorResponse(ErrorCodes.FORBIDDEN, "Only parents can approve or reject wishes"),
        { status: 403 }
      );
    }

    const { id } = await params;
    const wish = await getWishById(id);

    if (!wish) {
      return Response.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, "Wish not found"),
        { status: 404 }
      );
    }

    // Verify user is a member of this family
    const membership = await getFamilyMember(wish.familyId, session.user.id);
    if (!membership) {
      return Response.json(
        createErrorResponse(ErrorCodes.FORBIDDEN, "Access denied"),
        { status: 403 }
      );
    }

    // Can only approve/reject pending wishes
    if (wish.status !== "pending") {
      return Response.json(
        createErrorResponse(ErrorCodes.VALIDATION_ERROR, "Can only approve or reject pending wishes"),
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = approveSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return Response.json(
        { success: false, error: firstError?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const { action, note } = validation.data;

    let updatedWish;
    if (action === "approve") {
      updatedWish = await approveWish(id, session.user.id);
    } else {
      updatedWish = await rejectWish(id, note);
    }

    return Response.json(createSuccessResponse({
      wish: updatedWish,
      message: action === "approve" ? "Wish approved" : "Wish rejected"
    }));
  } catch (error) {
    console.error("POST /api/wishes/[id]/approve error:", error);
    return Response.json(
        createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Internal server error"),
        { status: 500 }
      );
  }
}
