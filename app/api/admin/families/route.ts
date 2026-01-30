import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession, isAdmin } from "@/lib/auth";
import { getRawDb } from "@/database/db";
import type { User } from "@/lib/db/schema";
import { ErrorCodes, createErrorResponse, createSuccessResponse } from "@/lib/constant";

export async function GET(request: NextRequest) {
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
        createErrorResponse(ErrorCodes.FORBIDDEN, "Only admins can access this endpoint"),
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const registrationType = searchParams.get("type");

    const rawDb = getRawDb();

    let query = `
      SELECT 
        f.id, 
        f.name, 
        f.max_parents,
        f.max_children,
        f.validity_months,
        f.registration_type,
        f.status,
        f.submitted_at,
        f.reviewed_at,
        f.rejection_reason,
        f.created_at,
        f.updated_at,
        COUNT(fm.id) as member_count
      FROM family f
      LEFT JOIN family_member fm ON f.id = fm.family_id
    `;

    const conditions: string[] = [];
    const params: any[] = [];

    if (status) {
      conditions.push("f.status = ?");
      params.push(status);
    }

    if (registrationType) {
      conditions.push("f.registration_type = ?");
      params.push(registrationType);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += `
      GROUP BY f.id
      ORDER BY 
        CASE f.status 
          WHEN 'pending' THEN 1 
          WHEN 'approved' THEN 2 
          WHEN 'rejected' THEN 3 
        END,
        f.submitted_at DESC NULLS LAST,
        f.created_at DESC
    `;

    const families = rawDb.query(query).all(...params) as Array<{
      id: string;
      name: string;
      max_parents: number;
      max_children: number;
      validity_months: number;
      registration_type: string;
      status: string;
      submitted_at: string;
      reviewed_at: string;
      rejection_reason: string;
      created_at: string;
      updated_at: string;
      member_count: number;
    }>;

    return Response.json(createSuccessResponse(families));
  } catch (error) {
    console.error("GET /api/admin/families error:", error);
    return Response.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Internal server error"),
      { status: 500 }
    );
  }
}

const createFamilySchema = z.object({
  parentPhone: z.string().regex(/^1[3-9]\d{9}$/, "Invalid phone number"),
  familyName: z.string().min(2, "Family name must be at least 2 characters"),
  parentName: z.string().min(2, "Parent name must be at least 2 characters"),
  parentGender: z.enum(["male", "female"]),
  parentCount: z.number().int().min(2).max(10),
  childCount: z.number().int().min(1).max(10),
  validityMonths: z.number().int().min(1).max(36),
});

function generateFamilyId(): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const alphanumeric = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id = letters[Math.floor(Math.random() * letters.length)];
  for (let i = 0; i < 8; i++) {
    id += alphanumeric[Math.floor(Math.random() * alphanumeric.length)];
  }
  return id;
}

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

export async function POST(request: NextRequest) {
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
        createErrorResponse(ErrorCodes.FORBIDDEN, "Only admins can create families"),
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = createFamilySchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return Response.json(
        createErrorResponse(ErrorCodes.VALIDATION_ERROR, firstError?.message || "Validation failed"),
        { status: 400 }
      );
    }

    const {
      parentPhone,
      familyName,
      parentName,
      parentGender,
      parentCount,
      childCount,
      validityMonths,
    } = validation.data;

    const rawDb = getRawDb();

    const existingUser = rawDb
      .query("SELECT id FROM user WHERE phone = ?")
      .get(parentPhone) as { id: string } | null;

    if (existingUser) {
      return Response.json(
        createErrorResponse(ErrorCodes.USER_ALREADY_EXISTS, "该手机号已被注册"),
        { status: 400 }
      );
    }

    const familyId = generateFamilyId();
    const userId = crypto.randomUUID();
    const password = generateStrongPassword();
    const passwordHash = await Bun.password.hash(password, {
      algorithm: "bcrypt",
      cost: 10,
    });

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + validityMonths);

    rawDb.exec("BEGIN TRANSACTION");

    try {
      rawDb
        .query(
          `
          INSERT INTO family (
            id, name, invite_code, invite_code_expires_at, max_parents, max_children, validity_months,
            registration_type, status, reviewed_at, reviewed_by, created_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
        )
        .run(
          familyId,
          familyName,
          null,
          expiresAt.toISOString(),
          parentCount,
          childCount,
          validityMonths,
          "admin",
          "approved",
          now.toISOString(),
          session.user.id,
          now.toISOString(),
          now.toISOString()
        );

      rawDb
        .query(
          `
          INSERT INTO user (id, email, name, email_verified, image, created_at, updated_at, role, phone, gender, pin_hash)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
        )
        .run(
          userId,
          null,
          parentName,
          0,
          null,
          now.toISOString(),
          now.toISOString(),
          "parent",
          parentPhone,
          parentGender,
          null
        );

      rawDb
        .query(
          `
          INSERT INTO account (id, account_id, provider_id, user_id, access_token, refresh_token, id_token, 
            access_token_expires_at, refresh_token_expires_at, scope, password, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
        )
        .run(
          crypto.randomUUID(),
          parentPhone,
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
          now.toISOString()
        );

      rawDb
        .query(
          `
          INSERT INTO family_member (id, family_id, user_id, role, display_name, current_points, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `
        )
        .run(
          crypto.randomUUID(),
          familyId,
          userId,
          "primary",
          parentName,
          0,
          now.toISOString(),
          now.toISOString()
        );

      rawDb.exec("COMMIT");

      const host = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const familyLink = `${host}/parent?familyId=${familyId}`;

      return Response.json(
        createSuccessResponse({
          familyId,
          password,
          link: familyLink,
        }),
        { status: 201 }
      );
    } catch (error) {
      rawDb.exec("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("POST /api/admin/families error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return Response.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Internal server error", errorMessage),
      { status: 500 }
    );
  }
}
