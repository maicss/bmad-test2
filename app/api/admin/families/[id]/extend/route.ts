import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession, isAdmin } from "@/lib/auth";
import { getRawDb } from "@/database/db";
import type { User } from "@/lib/db/schema";
import { ErrorCodes, createErrorResponse, createSuccessResponse } from "@/lib/constant";

const extendSchema = z.object({
  validityMonths: z.number().int().min(1).max(36),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(request.headers);

    if (!session?.user) {
      return Response.json(
        createErrorResponse(ErrorCodes.UNAUTHORIZED, "Unauthorized"),
        { status: 401 }
      );
    }

    if (!isAdmin(session.user as User)) {
      return Response.json(
        createErrorResponse(ErrorCodes.FORBIDDEN, "Only admins can extend family validity"),
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();
    const validation = extendSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return Response.json(
        createErrorResponse(ErrorCodes.VALIDATION_ERROR, firstError?.message || "Validation failed"),
        { status: 400 }
      );
    }

    const { validityMonths } = validation.data;
    const rawDb = getRawDb();

    const family = rawDb
      .query("SELECT * FROM family WHERE id = ?")
      .get(id) as {
        id: string;
        invite_code_expires_at: string;
      } | null;

    if (!family) {
      return Response.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, "Family not found"),
        { status: 404 }
      );
    }

    const now = new Date();
    const currentExpiresAt = family.invite_code_expires_at 
      ? new Date(family.invite_code_expires_at)
      : now;
    
    if (currentExpiresAt < now) {
      currentExpiresAt.setTime(now.getTime());
    }
    
    currentExpiresAt.setMonth(currentExpiresAt.getMonth() + validityMonths);

    rawDb.run(
      `
      UPDATE family 
      SET validity_months = validity_months + ?, invite_code_expires_at = ?, updated_at = ?
      WHERE id = ?
    `,
      [validityMonths, currentExpiresAt.toISOString(), now.toISOString(), id]
    );

    return Response.json(
      createSuccessResponse({ 
        message: "Family validity extended successfully",
        newExpiryDate: currentExpiresAt.toISOString()
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Extend family error:", error);
    return Response.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Internal server error"),
      { status: 500 }
    );
  }
}
