/**
 * Points API
 *
 * GET /api/points - Get points summary for the family
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import {
  getFamilyPointSummary,
  getFamilyMember,
  getFamilyMembers,
} from "@/lib/db/queries";

/**
 * GET /api/points
 * Get points summary for the family
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request.headers);
    
    if (!session?.user) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const familyId = searchParams.get("familyId");

    if (!familyId) {
      return Response.json(
        { success: false, error: "Family ID is required" },
        { status: 400 }
      );
    }

    // Verify user is a member of this family
    const membership = await getFamilyMember(familyId, session.user.id);
    if (!membership) {
      return Response.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    // Get all family members with their details
    const members = await getFamilyMembers(familyId);
    
    // Get point summary
    const pointSummary = await getFamilyPointSummary(familyId);

    // Fetch user details for each member
    const { getDb, schema } = await import("@/database/db");
    const { eq } = await import("drizzle-orm");
    const db = getDb();
    
    const membersWithUsers = await Promise.all(
      members.map(async (member) => {
        const user = await db.query.users.findFirst({
          where: eq(schema.users.id, member.userId),
        });
        return { ...member, user };
      })
    );

    // Combine member details with point summary
    const summaryWithDetails = membersWithUsers.map((member) => {
      const summary = pointSummary.find((s) => s.memberId === member.id);
      return {
        memberId: member.id,
        userId: member.userId,
        displayName: member.displayName || member.user?.name || "Unknown",
        role: member.role,
        currentPoints: member.currentPoints,
        totalEarned: summary?.totalEarned || 0,
        totalSpent: summary?.totalSpent || 0,
      };
    });

    return Response.json({
      success: true,
      data: {
        familyId,
        members: summaryWithDetails,
      },
    });
  } catch (error) {
    console.error("GET /api/points error:", error);
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
