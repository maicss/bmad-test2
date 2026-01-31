import { NextRequest } from "next/server";
import { getSession, isAdmin } from "@/lib/auth";
import { getRawDb } from "@/database/db";
import type { User } from "@/lib/db/schema";
import { ErrorCodes, createErrorResponse, createSuccessResponse } from "@/lib/constant";

function generateStrongPassword(): string {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const special = "!@#$%^&*";
  const allChars = uppercase + lowercase + numbers + special;
  let password = "";
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  for (let i = 0; i < 8; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  return password.split("").sort(() => Math.random() - 0.5).join("");
}

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
        createErrorResponse(ErrorCodes.FORBIDDEN, "Only admins can reset passwords"),
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const rawDb = getRawDb();

    const primaryMember = rawDb
      .query(`
        SELECT fm.user_id, u.name, u.phone
        FROM family_member fm
        JOIN user u ON fm.user_id = u.id
        WHERE fm.family_id = ? AND fm.role = 'primary'
      `)
      .get(id) as { user_id: string; name: string; phone: string | null } | null;

    if (!primaryMember) {
      return Response.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, "Primary parent not found for this family"),
        { status: 404 }
      );
    }

    const password = generateStrongPassword();
    const passwordHash = await Bun.password.hash(password, {
      algorithm: "bcrypt",
      cost: 10,
    });

    const now = new Date();

    rawDb.run(
      `UPDATE account SET password = ?, updated_at = ? WHERE user_id = ? AND provider_id = 'credential'`,
      [passwordHash, now.toISOString(), primaryMember.user_id]
    );

    return Response.json(
      createSuccessResponse({
        message: "Password reset successfully",
        password,
        userName: primaryMember.name,
        phone: primaryMember.phone,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset password error:", error);
    return Response.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Internal server error"),
      { status: 500 }
    );
  }
}
