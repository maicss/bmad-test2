import { NextRequest } from "next/server";
import { getSession, isAdmin } from "@/lib/auth";
import { getRawDb } from "@/database/db";
import type { User } from "@/lib/db/schema";
import { ErrorCodes, createErrorResponse, createSuccessResponse } from "@/lib/constant";
import { deleteImage } from "@/lib/image-storage";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(request.headers);
    const { id: imageId } = await params;

    if (!session?.user) {
      return Response.json(
        createErrorResponse(ErrorCodes.UNAUTHORIZED, "Unauthorized"),
        { status: 401 }
      );
    }

    // Only admins can delete images
    if (!isAdmin(session.user as User)) {
      return Response.json(
        createErrorResponse(ErrorCodes.FORBIDDEN, "Only admins can delete images"),
        { status: 403 }
      );
    }

    const rawDb = getRawDb();

    // Get image info
    const image = rawDb.query(`
      SELECT id, filename, storage_path, reference_count
      FROM image
      WHERE id = ?
    `).get(imageId) as { id: string; filename: string; storage_path: string; reference_count: number } | null;

    if (!image) {
      return Response.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, "Image not found"),
        { status: 404 }
      );
    }

    // Check if image is referenced
    if (image.reference_count > 0) {
      return Response.json(
        createErrorResponse(ErrorCodes.VALIDATION_ERROR, "Cannot delete image that is still referenced"),
        { status: 400 }
      );
    }

    // Delete from database
    rawDb.query(`DELETE FROM image WHERE id = ?`).run(imageId);

    // Delete from storage
    await deleteImage(image.filename);

    return Response.json(createSuccessResponse({ deleted: true }));
  } catch (error) {
    console.error("DELETE /api/image-bed/[id] error:", error);
    return Response.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to delete image"),
      { status: 500 }
    );
  }
}
