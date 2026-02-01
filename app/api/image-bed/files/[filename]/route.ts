import { NextRequest } from "next/server";
import { getImage } from "@/lib/image-storage";
import { ErrorCodes, createErrorResponse } from "@/lib/constant";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    
    if (!filename) {
      return new Response("Filename required", { status: 400 });
    }

    // Get image buffer from storage
    const buffer = await getImage(filename);

    if (!buffer) {
      return Response.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, "Image not found"),
        { status: 404 }
      );
    }

    // Determine content type based on filename extension
    const ext = filename.split('.').pop()?.toLowerCase();
    const contentTypeMap: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
    };
    const contentType = contentTypeMap[ext || ''] || 'application/octet-stream';

    // Return image with appropriate headers
    return new Response(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error("GET /api/image-bed/files error:", error);
    return Response.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to serve image"),
      { status: 500 }
    );
  }
}
