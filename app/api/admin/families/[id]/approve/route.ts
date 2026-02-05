import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession, isAdmin } from "@/lib/auth";
import { getRawDb } from "@/database/db";
import type { User } from "@/lib/db/schema";
import {
  ErrorCodes,
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/constant";

const approveSchema = z.object({
  action: z.enum(["approve", "reject"]),
  rejectionReason: z.string().max(500).optional(),
});

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
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession(request.headers);

    if (!session?.user) {
      return Response.json(
        createErrorResponse(ErrorCodes.UNAUTHORIZED, "Unauthorized"),
        { status: 401 },
      );
    }

    if (!isAdmin(session.user as User)) {
      return Response.json(
        createErrorResponse(
          ErrorCodes.FORBIDDEN,
          "Only admins can approve families",
        ),
        { status: 403 },
      );
    }

    const { id } = await context.params;
    const body = await request.json();
    const validation = approveSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return Response.json(
        createErrorResponse(
          ErrorCodes.VALIDATION_ERROR,
          firstError?.message || "Validation failed",
        ),
        { status: 400 },
      );
    }

    const { action, rejectionReason } = validation.data;
    const rawDb = getRawDb();

    const family = rawDb.query("SELECT * FROM family WHERE id = ?").get(id) as {
      id: string;
      name: string;
      status: string;
      max_parents: number;
      max_children: number;
    } | null;

    if (!family) {
      return Response.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, "Family not found"),
        { status: 404 },
      );
    }

    if (family.status !== "pending") {
      return Response.json(
        createErrorResponse(
          ErrorCodes.BAD_REQUEST,
          "Family is not in pending status",
        ),
        { status: 400 },
      );
    }

    const now = new Date();

    if (action === "reject") {
      rawDb.run(
        `
        UPDATE family 
        SET status = ?, rejection_reason = ?, reviewed_at = ?, reviewed_by = ?, updated_at = ?
        WHERE id = ?
      `,
        [
          "rejected",
          rejectionReason || null,
          now.toISOString(),
          session.user.id,
          now.toISOString(),
          id,
        ],
      );

      return Response.json(
        createSuccessResponse({ message: "Family registration rejected" }),
        { status: 200 },
      );
    }

    const userId = crypto.randomUUID();
    const password = generateStrongPassword();
    const passwordHash = await Bun.password.hash(password, {
      algorithm: "bcrypt",
      cost: 10,
    });

    rawDb.exec("BEGIN TRANSACTION");

    try {
      rawDb.run(
        `
        UPDATE family 
        SET status = ?, reviewed_at = ?, reviewed_by = ?, updated_at = ?
        WHERE id = ?
      `,
        ["approved", now.toISOString(), session.user.id, now.toISOString(), id],
      );

      rawDb.run(
        `
        INSERT INTO user (id, email, name, email_verified, image, created_at, updated_at, role, phone, gender, pin_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          userId,
          null,
          family.name + "家长",
          0,
          null,
          now.toISOString(),
          now.toISOString(),
          "parent",
          null,
          "male",
          null,
        ],
      );

      rawDb.run(
        `
        INSERT INTO account (id, account_id, provider_id, user_id, access_token, refresh_token, id_token, 
          access_token_expires_at, refresh_token_expires_at, scope, password, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          crypto.randomUUID(),
          userId,
          "credential",
          userId,
          null,
          null,
          null,
          null,
          null,
          null,
          passwordHash,
          now.toISOString(),
          now.toISOString(),
        ],
      );

      rawDb.run(
        `
        INSERT INTO family_member (id, family_id, user_id, role, display_name, current_points, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          crypto.randomUUID(),
          id,
          userId,
          "primary",
          family.name + "家长",
          0,
          now.toISOString(),
          now.toISOString(),
        ],
      );

      rawDb.exec("COMMIT");

      const host = process.env.NEXT_PUBLIC_APP_URL;
      const familyLink = `${host}/parent?familyId=${id}`;

      return Response.json(
        createSuccessResponse({
          message: "Family approved successfully",
          familyId: id,
          password,
          link: familyLink,
        }),
        { status: 200 },
      );
    } catch (error) {
      rawDb.exec("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Approve family error:", error);
    return Response.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Internal server error"),
      { status: 500 },
    );
  }
}
