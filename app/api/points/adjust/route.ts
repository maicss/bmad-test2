/**
 * Points Adjustment API
 *
 * POST /api/points/adjust - Manually adjust member points (parents only)
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession, isParent } from "@/lib/auth";
import {
  getFamilyMember,
  adjustMemberPoints,
  createPointTransaction,
} from "@/lib/db/queries";
import type { NewPointTransaction, User } from "@/lib/db/schema";
import { generateId } from "@/lib/id";

const adjustSchema = z.object({
  familyId: z.string().min(1, "Family ID is required"),
  memberId: z.string().min(1, "Member ID is required"),
  amount: z.number().finite("Invalid amount"),
  reason: z.string().min(1, "Reason is required").max(500, "Reason too long"),
});

/**
 * POST /api/points/adjust
 * Manually adjust member points
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request.headers);
    
    if (!session?.user) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only parents can adjust points
    if (!isParent(session.user as User)) {
      return Response.json(
        { success: false, error: "Only parents can adjust points" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = adjustSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return Response.json(
        { success: false, error: firstError?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const { familyId, memberId, amount, reason } = validation.data;

    // Verify user is a member of this family
    const membership = await getFamilyMember(familyId, session.user.id);
    if (!membership) {
      return Response.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    // Verify the target member belongs to the same family
    const targetMember = await getFamilyMember(familyId, memberId);
    if (!targetMember) {
      return Response.json(
        { success: false, error: "Member not found in this family" },
        { status: 404 }
      );
    }

    // Check if there's enough points for deduction
    if (amount < 0 && targetMember.currentPoints + amount < 0) {
      return Response.json(
        { success: false, error: "Insufficient points for this deduction" },
        { status: 400 }
      );
    }

    // Update member points
    const updatedMember = await adjustMemberPoints(memberId, amount);

    if (!updatedMember) {
      return Response.json(
        { success: false, error: "Failed to update points" },
        { status: 500 }
      );
    }

    // Create point transaction record
    const transactionData: NewPointTransaction = {
      id: generateId(),
      familyId,
      memberId,
      type: "adjust",
      amount,
      balanceAfter: updatedMember.currentPoints,
      source: "manual",
      description: reason,
      createdBy: session.user.id,
    };

    const transaction = await createPointTransaction(transactionData);

    return Response.json({
      success: true,
      data: {
        transaction,
        pointsAdjusted: amount,
        newBalance: updatedMember.currentPoints,
      },
    });
  } catch (error) {
    console.error("POST /api/points/adjust error:", error);
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
