import { NextRequest } from "next/server";
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

    // Only admins can access the image bed
    if (!isAdmin(session.user as User)) {
      return Response.json(
        createErrorResponse(ErrorCodes.FORBIDDEN, "Only admins can access image bed"),
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const ownerFilter = searchParams.get("owner"); // "admin" or family name or family ID
    const familyIdFilter = searchParams.get("familyId"); // Family ID for primary parent search
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    const rawDb = getRawDb();

    let whereClause = "";
    const params: string[] = [];

    if (ownerFilter) {
      if (ownerFilter === "admin") {
        whereClause = "WHERE i.owner_type = 'admin'";
      } else if (familyIdFilter) {
        // Search by family ID (primary parent)
        whereClause = "WHERE i.owner_type = 'family' AND i.uploader_family_id = ?";
        params.push(familyIdFilter);
      } else {
        // Filter by family name (ownerId is the family name for family uploads)
        whereClause = "WHERE i.owner_type = 'family' AND i.owner_id = ?";
        params.push(ownerFilter);
      }
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM image i ${whereClause}`;
    const countResult = rawDb.query(countQuery).get(...params) as { total: number };
    const total = countResult.total;

    // Get images with pagination
    const query = `
      SELECT 
        i.id,
        i.filename,
        i.original_name,
        i.mime_type,
        i.size,
        i.url,
        i.uploader_id,
        i.uploader_name,
        i.uploader_phone,
        i.uploader_family_id,
        i.owner_type,
        i.owner_id,
        i.reference_count,
        i.created_at,
        i.updated_at
      FROM image i
      ${whereClause}
      ORDER BY i.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const images = rawDb.query(query).all(...params, limit, offset) as Array<{
      id: string;
      filename: string;
      original_name: string;
      mime_type: string;
      size: number;
      url: string;
      uploader_id: string | null;
      uploader_name: string | null;
      uploader_phone: string | null;
      uploader_family_id: string | null;
      owner_type: string;
      owner_id: string;
      reference_count: number;
      created_at: string;
      updated_at: string;
    }>;

    // Format images for response
    const formattedImages = images.map((img) => ({
      id: img.id,
      filename: img.filename,
      originalName: img.original_name,
      mimeType: img.mime_type,
      size: img.size,
      url: img.url,
      uploader: {
        id: img.uploader_id,
        name: img.uploader_name,
        phone: img.uploader_phone,
        familyId: img.uploader_family_id,
      },
      owner: {
        type: img.owner_type,
        id: img.owner_id,
      },
      referenceCount: img.reference_count,
      createdAt: img.created_at,
      updatedAt: img.updated_at,
    }));

    return Response.json(
      createSuccessResponse({
        images: formattedImages,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      })
    );
  } catch (error) {
    console.error("GET /api/image-bed error:", error);
    return Response.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Internal server error"),
      { status: 500 }
    );
  }
}
