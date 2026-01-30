import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import {
  getTaskDefinitionById,
  getFamilyMember,
  recordBehavior,
  adjustMemberPoints,
  createPointTransaction,
} from "@/lib/db/queries";
import type { NewBehaviorLog, NewPointTransaction } from "@/lib/db/schema";
import { generateId } from "@/lib/id";

import { ErrorCodes, createErrorResponse, createSuccessResponse } from "@/lib/constant";
// Validation schema for completing a task
const completeTaskSchema = z.object({
  memberId: z.string().min(1, "Member ID is required"),
  note: z.string().max(500, "Note too long").optional(),
});

/**
 * POST /api/tasks/[id]/complete
 * Record a task completion
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

    const { id } = await params;
    const task = await getTaskDefinitionById(id);

    if (!task) {
      return Response.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, "Task not found"),
        { status: 404 }
      );
    }

    // Verify user is a member of this family
    const membership = await getFamilyMember(task.familyId, session.user.id);
    if (!membership) {
      return Response.json(
        createErrorResponse(ErrorCodes.FORBIDDEN, "Access denied"),
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = completeTaskSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return Response.json(
        { success: false, error: firstError?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const { memberId, note } = validation.data;

    // Verify the target member belongs to the same family
    const targetMember = await getFamilyMember(task.familyId, memberId);
    if (!targetMember) {
      return Response.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, "Member not found in this family"),
        { status: 404 }
      );
    }

    // Create behavior log
    const behaviorLogData: NewBehaviorLog = {
      id: generateId(),
      familyId: task.familyId,
      taskDefinitionId: task.id,
      memberId,
      action: "completed",
      points: task.points,
      description: `Completed task: ${task.name}`,
      recordedBy: session.user.id,
      note: note || null,
    };

    const behaviorLog = await recordBehavior(behaviorLogData);

    // Update member points
    const updatedMember = await adjustMemberPoints(memberId, task.points);

    if (!updatedMember) {
      return Response.json(
        createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to update member points"),
        { status: 500 }
      );
    }

    // Create point transaction record
    const transactionData: NewPointTransaction = {
      id: generateId(),
      familyId: task.familyId,
      memberId,
      type: "earn",
      amount: task.points,
      balanceAfter: updatedMember.currentPoints,
      source: "task",
      sourceId: task.id,
      description: `Task completed: ${task.name}`,
      createdBy: session.user.id,
    };

    await createPointTransaction(transactionData);

    return Response.json({
      success: true,
      data: {
        behaviorLog,
        pointsEarned: task.points,
        newBalance: updatedMember.currentPoints,
      },
    });
  } catch (error) {
    console.error("POST /api/tasks/[id]/complete error:", error);
    return Response.json(
        createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Internal server error"),
        { status: 500 }
      );
  }
}
