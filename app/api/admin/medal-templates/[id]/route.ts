/**
 * DELETE /api/admin/medal-templates/:id
 * 删除徽章模板
 */

import { NextRequest } from "next/server";
import { getSession, isAdmin } from "@/lib/auth";
import { getRawDb } from "@/database/db";
import type { User } from "@/lib/db/schema";
import { ErrorCodes, createErrorResponse, createSuccessResponse } from "@/lib/constant";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(request.headers);

    if (!session?.user) {
      return Response.json(
        createErrorResponse(ErrorCodes.UNAUTHORIZED, "未登录"),
        { status: 401 }
      );
    }

    if (!isAdmin(session.user as User)) {
      return Response.json(
        createErrorResponse(ErrorCodes.FORBIDDEN, "只有管理员可以删除徽章模板"),
        { status: 403 }
      );
    }

    const { id } = await params;
    const rawDb = getRawDb();

    // 检查模板是否存在
    const existing = rawDb.query(`
      SELECT id FROM medal_template WHERE id = ?
    `).get(id) as { id: string } | null;

    if (!existing) {
      return Response.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, "徽章模板不存在"),
        { status: 404 }
      );
    }

    // 删除模板
    rawDb.query(`DELETE FROM medal_template WHERE id = ?`).run(id);

    return Response.json(
      createSuccessResponse({ message: "徽章模板删除成功" }),
      { status: 200 }
    );

  } catch (error) {
    console.error("DELETE /api/admin/medal-templates error:", error);
    return Response.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "删除徽章模板失败"),
      { status: 500 }
    );
  }
}
