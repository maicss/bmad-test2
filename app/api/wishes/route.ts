import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import {
  getWishes,
  createWish,
  getFamilyMember,
} from "@/lib/db/queries";
import type { NewWish } from "@/lib/db/schema";
import { generateId } from "@/lib/id";

import { ErrorCodes, createErrorResponse, createSuccessResponse } from "@/lib/constant";
// Validation schema for creating a wish
const createWishSchema = z.object({
  familyId: z.string().min(1, "Family ID is required"),
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  description: z.string().max(500, "Description too long").optional(),
  type: z.enum(["item", "activity"]),
  pointsRequired: z.number().positive("Points must be positive"),
  imageUrl: z.string().url("Invalid image URL").optional(),
});

/**
 * GET /api/wishes
 * List all wishes for a family
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
    const familyId = searchParams.get("familyId");
    const memberId = searchParams.get("memberId");
    const status = searchParams.get("status") as "pending" | "approved" | "rejected" | "completed" | "cancelled" | null;

    if (!familyId) {
      return Response.json(
        createErrorResponse(ErrorCodes.VALIDATION_ERROR, "Family ID is required"),
        { status: 400 }
      );
    }

    // Verify user is a member of this family
    const membership = await getFamilyMember(familyId, session.user.id);
    if (!membership) {
      return Response.json(
        createErrorResponse(ErrorCodes.FORBIDDEN, "Access denied"),
        { status: 403 }
      );
    }

    const wishes = await getWishes(familyId, {
      memberId: memberId || undefined,
      status: status || undefined,
    });

    return Response.json(createSuccessResponse(wishes ));
  } catch (error) {
    console.error("GET /api/wishes error:", error);
    return Response.json(
        createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Internal server error"),
        { status: 500 }
      );
  }
}

/**
 * POST /api/wishes
 * Create a new wish
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request.headers);
    
    if (!session?.user) {
      return Response.json(
        createErrorResponse(ErrorCodes.UNAUTHORIZED, "Unauthorized"),
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = createWishSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return Response.json(
        { success: false, error: firstError?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const { familyId, ...wishData } = validation.data;

    // Verify user is a member of this family
    const membership = await getFamilyMember(familyId, session.user.id);
    if (!membership) {
      return Response.json(
        createErrorResponse(ErrorCodes.FORBIDDEN, "Access denied"),
        { status: 403 }
      );
    }

    const newWishData: NewWish = {
      id: generateId(),
      ...wishData,
      familyId,
      memberId: membership.id,
      status: "pending",
    };

    const wish = await createWish(newWishData);

    return Response.json(createSuccessResponse(wish ), { status: 201 });
  } catch (error) {
    console.error("POST /api/wishes error:", error);
    return Response.json(
        createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Internal server error"),
        { status: 500 }
      );
  }
}
