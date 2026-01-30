/**
 * Wish Redeem API
 *
 * POST /api/wishes/[id]/redeem - Redeem an approved wish
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import {
  getWishById,
  getFamilyMember,
  completeWish,
  createWishRedemption,
  adjustMemberPoints,
  createPointTransaction,
} from "@/lib/db/queries";
import type { NewWishRedemption, NewPointTransaction } from "@/lib/db/schema";
import { generateId } from "@/lib/id";

const redeemSchema = z.object({
  note: z.string().max(500, "Note too long").optional(),
});

/**
 * POST /api/wishes/[id]/redeem
 * Redeem an approved wish
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(request.headers);
    
    if (!session?.user) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const wish = await getWishById(id);

    if (!wish) {
      return Response.json(
        { success: false, error: "Wish not found" },
        { status: 404 }
      );
    }

    // Verify user is a member of this family
    const membership = await getFamilyMember(wish.familyId, session.user.id);
    if (!membership) {
      return Response.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    // Can only redeem approved wishes
    if (wish.status !== "approved") {
      return Response.json(
        { success: false, error: "Wish must be approved before redemption" },
        { status: 400 }
      );
    }

    // Only the wish owner can redeem their own wish
    if (wish.memberId !== membership.id) {
      return Response.json(
        { success: false, error: "Can only redeem your own wishes" },
        { status: 403 }
      );
    }

    // Check if member has enough points
    if (membership.currentPoints < wish.pointsRequired) {
      return Response.json(
        { 
          success: false, 
          error: "Insufficient points", 
          details: {
            required: wish.pointsRequired,
            available: membership.currentPoints,
          }
        },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const validation = redeemSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return Response.json(
        { success: false, error: firstError?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const { note } = validation.data;

    // Deduct points from member
    const pointsToDeduct = -wish.pointsRequired;
    const updatedMember = await adjustMemberPoints(membership.id, pointsToDeduct);

    if (!updatedMember) {
      return Response.json(
        { success: false, error: "Failed to deduct points" },
        { status: 500 }
      );
    }

    // Create point transaction record
    const transactionData: NewPointTransaction = {
      id: generateId(),
      familyId: wish.familyId,
      memberId: membership.id,
      type: "spend",
      amount: pointsToDeduct,
      balanceAfter: updatedMember.currentPoints,
      source: "wish",
      sourceId: wish.id,
      description: `Redeemed wish: ${wish.title}`,
      createdBy: session.user.id,
    };

    await createPointTransaction(transactionData);

    // Create redemption record
    const redemptionData: NewWishRedemption = {
      id: generateId(),
      familyId: wish.familyId,
      wishId: wish.id,
      memberId: membership.id,
      pointsSpent: wish.pointsRequired,
      status: "pending",
      note: note || null,
    };

    const redemption = await createWishRedemption(redemptionData);

    // Mark wish as completed
    const completedWish = await completeWish(id);

    return Response.json({
      success: true,
      data: {
        wish: completedWish,
        redemption,
        pointsSpent: wish.pointsRequired,
        remainingPoints: updatedMember.currentPoints,
      },
      message: "Wish redeemed successfully",
    });
  } catch (error) {
    console.error("POST /api/wishes/[id]/redeem error:", error);
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
