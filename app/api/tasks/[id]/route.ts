import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession, isParent } from "@/lib/auth";
import type { User } from "@/lib/db/schema";
import {
  getTaskDefinitionById,
  updateTaskDefinition,
  deactivateTaskDefinition,
  getFamilyMember,
} from "@/lib/db/queries";
import { ErrorCodes, createErrorResponse, createSuccessResponse } from "@/lib/constant";

// Validation schema for updating a task
const updateTaskSchema = z.object({
  name: z.string().min(1, "Task name is required").max(100, "Task name too long").optional(),
  description: z.string().max(500, "Description too long").optional(),
  category: z.enum(["study", "housework", "behavior", "health", "custom"]).optional(),
  points: z.number().finite("Invalid points value").optional(),
  icon: z.string().max(50, "Icon name too long").optional(),
  color: z.string().max(20, "Color code too long").optional(),
  isActive: z.boolean().optional(),
  dailyLimit: z.number().int().positive().optional(),
});

/**
 * GET /api/tasks/[id]
 * Get task definition details
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

    return Response.json(createSuccessResponse(task ));
  } catch (error) {
    console.error("GET /api/tasks/[id] error:", error);
    return Response.json(
        createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Internal server error"),
        { status: 500 }
      );
  }
}

/**
 * PUT /api/tasks/[id]
 * Update task definition
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

    // Only parents can update tasks
    if (!isParent(session.user as User)) {
      return Response.json(
        createErrorResponse(ErrorCodes.FORBIDDEN, "Only parents can update tasks"),
        { status: 403 }
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
    const validation = updateTaskSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return Response.json(
        { success: false, error: firstError?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const updatedTask = await updateTaskDefinition(id, validation.data);

    return Response.json(createSuccessResponse(updatedTask ));
  } catch (error) {
    console.error("PUT /api/tasks/[id] error:", error);
    return Response.json(
        createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Internal server error"),
        { status: 500 }
      );
  }
}

/**
 * DELETE /api/tasks/[id]
 * Deactivate task definition (soft delete)
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

    // Only parents can delete tasks
    if (!isParent(session.user as User)) {
      return Response.json(
        createErrorResponse(ErrorCodes.FORBIDDEN, "Only parents can delete tasks"),
        { status: 403 }
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

    const deactivatedTask = await deactivateTaskDefinition(id);

    return Response.json(createSuccessResponse({
      task: deactivatedTask,
      message: "Task deactivated successfully"
    }));
  } catch (error) {
    console.error("DELETE /api/tasks/[id] error:", error);
    return Response.json(
        createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Internal server error"),
        { status: 500 }
      );
  }
}
