import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession, isParent } from "@/lib/auth";
import type { User } from "@/lib/db/schema";
import {
  getWishById,
  getFamilyMember,
} from "@/lib/db/queries";
import { getDb, schema } from "@/database/db";
import { eq } from "drizzle-orm";

import { ErrorCodes, createErrorResponse, createSuccessResponse } from "@/lib/constant";
// Validation schema for updating a wish
const updateWishSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title too long").optional(),
  description: z.string().max(500, "Description too long").optional(),
  pointsRequired: z.number().positive("Points must be positive").optional(),
  imageUrl: z.string().url("Invalid image URL").optional(),
});

/**
 * GET /api/wishes/[id]
 * Get wish details
 */
export async function GET(
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

    return Response.json(createSuccessResponse(wish ));
  } catch (error) {
    console.error("GET /api/wishes/[id] error:", error);
    return Response.json(
        createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Internal server error"),
        { status: 500 }
      );
  }
}

/**
 * PUT /api/wishes/[id]
 * Update wish
 */
export async function PUT(
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

    // Only the wish owner or parents can update
    if (wish.memberId !== membership.id && !isParent(session.user as User)) {
      return Response.json(
        createErrorResponse(ErrorCodes.FORBIDDEN, "Can only update your own wishes"),
        { status: 403 }
      );
    }

    // Can only update pending wishes
    if (wish.status !== "pending") {
      return Response.json(
        createErrorResponse(ErrorCodes.VALIDATION_ERROR, "Can only update pending wishes"),
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = updateWishSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return Response.json(
        { success: false, error: firstError?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const db = getDb();
    const [updatedWish] = await db
      .update(schema.wishes)
      .set({
        ...validation.data,
        updatedAt: new Date(),
      })
      .where(eq(schema.wishes.id, id))
      .returning();

    return Response.json(createSuccessResponse(updatedWish ));
  } catch (error) {
    console.error("PUT /api/wishes/[id] error:", error);
    return Response.json(
        createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Internal server error"),
        { status: 500 }
      );
  }
}

/**
 * DELETE /api/wishes/[id]
 * Cancel/delete wish
 */
export async function DELETE(
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

    // Only the wish owner or parents can cancel
    if (wish.memberId !== membership.id && !isParent(session.user as User)) {
      return Response.json(
        createErrorResponse(ErrorCodes.FORBIDDEN, "Can only cancel your own wishes"),
        { status: 403 }
      );
    }

    // Can only cancel pending or approved wishes
    if (wish.status !== "pending" && wish.status !== "approved") {
      return Response.json(
        createErrorResponse(ErrorCodes.VALIDATION_ERROR, "Can only cancel pending or approved wishes"),
        { status: 400 }
      );
    }

    const db = getDb();
    const [cancelledWish] = await db
      .update(schema.wishes)
      .set({
        status: "cancelled",
        updatedAt: new Date(),
      })
      .where(eq(schema.wishes.id, id))
      .returning();

    return Response.json(createSuccessResponse({
      wish: cancelledWish,
      message: "Wish cancelled successfully"
    }));
  } catch (error) {
    console.error("DELETE /api/wishes/[id] error:", error);
    return Response.json(
        createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Internal server error"),
        { status: 500 }
      );
  }
}
