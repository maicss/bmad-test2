import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession, isAdmin } from "@/lib/auth";
import { getRawDb } from "@/database/db";
import type { User } from "@/lib/db/schema";
import { ErrorCodes, createErrorResponse, createSuccessResponse } from "@/lib/constant";

const updatePhoneSchema = z.object({
  phone: z.string().regex(/^1[3-9]\d{9}$/, "Invalid phone number format"),
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
        createErrorResponse(ErrorCodes.FORBIDDEN, "Only admins can update family phone"),
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();
    
    const validation = updatePhoneSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return Response.json(
        createErrorResponse(ErrorCodes.VALIDATION_ERROR, firstError?.message || "Invalid phone number"),
        { status: 400 }
      );
    }

    const { phone } = validation.data;
    const rawDb = getRawDb();

    const primaryMember = rawDb
      .query(`
        SELECT fm.user_id, u.phone as current_phone
        FROM family_member fm
        JOIN user u ON fm.user_id = u.id
        WHERE fm.family_id = ? AND fm.role = 'primary'
      `)
      .get(id) as { user_id: string; current_phone: string | null } | null;

    if (!primaryMember) {
      return Response.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, "Primary parent not found for this family"),
        { status: 404 }
      );
    }

    const existingUser = rawDb
      .query("SELECT id FROM user WHERE phone = ? AND id != ?")
      .get(phone, primaryMember.user_id) as { id: string } | null;

    if (existingUser) {
      return Response.json(
        createErrorResponse(ErrorCodes.USER_ALREADY_EXISTS, "该手机号已被其他用户使用"),
        { status: 400 }
      );
    }

    const now = new Date();

    rawDb.run(
      `UPDATE user SET phone = ?, updated_at = ? WHERE id = ?`,
      [phone, now.toISOString(), primaryMember.user_id]
    );

    rawDb.run(
      `UPDATE account SET account_id = ?, updated_at = ? WHERE user_id = ? AND provider_id = 'credential'`,
      [phone, now.toISOString(), primaryMember.user_id]
    );

    return Response.json(
      createSuccessResponse({ 
        message: "Phone number updated successfully",
        phone 
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Update phone error:", error);
    return Response.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Internal server error"),
      { status: 500 }
    );
  }
}
