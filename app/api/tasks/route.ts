/**
 * Task Management API
 *
 * GET /api/tasks - List all tasks for the family
 * POST /api/tasks - Create a new task definition
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession, isParent } from "@/lib/auth";
import {
  getTaskDefinitions,
  createTaskDefinition,
  getFamilyMember,
} from "@/lib/db/queries";
import type { NewTaskDefinition, User } from "@/lib/db/schema";
import { generateId } from "@/lib/id";

// Validation schema for creating a task
const createTaskSchema = z.object({
  familyId: z.string().min(1, "Family ID is required"),
  name: z.string().min(1, "Task name is required").max(100, "Task name too long"),
  description: z.string().max(500, "Description too long").optional(),
  category: z.enum(["study", "housework", "behavior", "health", "custom"]).default("custom"),
  points: z.number().finite("Invalid points value"),
  icon: z.string().max(50, "Icon name too long").optional(),
  color: z.string().max(20, "Color code too long").optional(),
  dailyLimit: z.number().int().positive().optional(),
});

/**
 * GET /api/tasks
 * List all task definitions for a family
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
    const category = searchParams.get("category") as "study" | "housework" | "behavior" | "health" | "custom" | null;
    const activeOnly = searchParams.get("activeOnly") === "true";

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

    const tasks = await getTaskDefinitions(familyId, {
      activeOnly,
      category: category || undefined,
    });

    return Response.json({ success: true, data: tasks });
  } catch (error) {
    console.error("GET /api/tasks error:", error);
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tasks
 * Create a new task definition
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

    // Only parents can create tasks
    if (!isParent(session.user as User)) {
      return Response.json(
        { success: false, error: "Only parents can create tasks" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = createTaskSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return Response.json(
        { success: false, error: firstError?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const { familyId, ...taskData } = validation.data;

    // Verify user is a member of this family
    const membership = await getFamilyMember(familyId, session.user.id);
    if (!membership) {
      return Response.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    const newTaskData: NewTaskDefinition = {
      id: generateId(),
      ...taskData,
      familyId,
      createdBy: session.user.id,
      isActive: true,
    };

    const task = await createTaskDefinition(newTaskData);

    return Response.json({ success: true, data: task }, { status: 201 });
  } catch (error) {
    console.error("POST /api/tasks error:", error);
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
