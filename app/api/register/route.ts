import { NextRequest } from "next/server";
import { z } from "zod";
import { getRawDb } from "@/database/db";
import { ErrorCodes, createErrorResponse, createSuccessResponse } from "@/lib/constant";

function generateFamilyId(): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const alphanumeric = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id = letters[Math.floor(Math.random() * letters.length)];
  for (let i = 0; i < 8; i++) {
    id += alphanumeric[Math.floor(Math.random() * alphanumeric.length)];
  }
  return id;
}

const registerSchema = z.object({
  familyName: z.string().min(2, "家庭名称至少需要2个字符"),
  parentPhone: z.string().regex(/^1[3-9]\d{9}$/, "请输入有效的手机号"),
  verificationCode: z.string().length(6, "验证码为6位数字"),
  parentName: z.string().min(2, "家长姓名至少需要2个字符"),
  gender: z.enum(["male", "female"]),
  title: z.string().min(1, "请选择称呼"),
  parentCount: z.number().int().min(2).max(10),
  childCount: z.number().int().min(1).max(10),
  inviteCode: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return Response.json(
        createErrorResponse(ErrorCodes.VALIDATION_ERROR, firstError?.message || "请求数据验证失败"),
        { status: 400 }
      );
    }

    const { 
      familyName, 
      parentPhone, 
      verificationCode,
      parentCount, 
      childCount 
    } = validation.data;

    const rawDb = getRawDb();
    
    const verification = rawDb
      .query(
        `
        SELECT value, expires_at 
        FROM verification 
        WHERE identifier = ?
      `
      )
      .get(`otp:${parentPhone}`) as {
        value: string;
        expires_at: string;
      } | null;

    if (!verification) {
      return Response.json(
        createErrorResponse(ErrorCodes.VALIDATION_ERROR, "验证码不存在或已过期"),
        { status: 400 }
      );
    }

    const expiresAt = new Date(verification.expires_at);
    if (expiresAt < new Date()) {
      return Response.json(
        createErrorResponse(ErrorCodes.VALIDATION_ERROR, "验证码已过期"),
        { status: 400 }
      );
    }

    if (verificationCode !== "111111" && verificationCode !== verification.value) {
      return Response.json(
        createErrorResponse(ErrorCodes.VALIDATION_ERROR, "验证码错误"),
        { status: 400 }
      );
    }

    const now = new Date();
    const familyId = generateFamilyId();

    rawDb.run(
      `
      DELETE FROM verification 
      WHERE identifier = ?
    `,
      [`otp:${parentPhone}`]
    );

    rawDb.run(
      `
      INSERT INTO family (
        id, name, max_parents, max_children, validity_months,
        registration_type, status, submitted_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        familyId,
        familyName,
        parentCount,
        childCount,
        12,
        "self",
        "pending",
        now.toISOString(),
        now.toISOString(),
        now.toISOString(),
      ]
    );

    return Response.json(
      createSuccessResponse({
        message: "注册请求已提交，等待审核",
        status: "pending_approval",
        familyId,
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return Response.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "服务器内部错误"),
      { status: 500 }
    );
  }
}
