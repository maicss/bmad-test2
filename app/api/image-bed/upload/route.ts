import { NextRequest } from "next/server";
import { getSession, isAdmin } from "@/lib/auth";
import { getRawDb } from "@/database/db";
import type { User } from "@/lib/db/schema";
import { ErrorCodes, createErrorResponse, createSuccessResponse } from "@/lib/constant";
import { saveImage, generateFilename, getStorageConfig } from "@/lib/image-storage";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request.headers);

    if (!session?.user) {
      return Response.json(
        createErrorResponse(ErrorCodes.UNAUTHORIZED, "Unauthorized"),
        { status: 401 }
      );
    }

    const isUserAdmin = isAdmin(session.user as User);
    const rawDb = getRawDb();

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json(
        createErrorResponse(ErrorCodes.VALIDATION_ERROR, "No file uploaded"),
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        createErrorResponse(ErrorCodes.VALIDATION_ERROR, "File too large. Maximum size is 10MB"),
        { status: 400 }
      );
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return Response.json(
        createErrorResponse(ErrorCodes.VALIDATION_ERROR, "Invalid file type. Allowed: JPEG, PNG, GIF, WebP, SVG"),
        { status: 400 }
      );
    }

    // Get file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate unique filename
    const filename = generateFilename(file.name);
    const mimeType = file.type;
    const size = file.size;

    // Save image to storage
    const storedImage = await saveImage(buffer, filename, file.name, mimeType, size);

    // Get uploader info
    const user = session.user;
    let uploaderId: string | null = null;
    let uploaderName: string | null = null;
    let uploaderPhone: string | null = null;
    let uploaderFamilyId: string | null = null;
    let ownerType: "admin" | "family";
    let ownerId: string;

    if (isUserAdmin) {
      // Admin upload
      ownerType = "admin";
      ownerId = user.id;
      uploaderId = user.id;
      uploaderName = user.name;
      uploaderPhone = user.phone;
    } else {
      // Family member upload
      ownerType = "family";
      
      // Get family member info
      const memberResult = rawDb.query(`
        SELECT fm.id, fm.family_id, u.name, u.phone
        FROM family_member fm
        JOIN user u ON fm.user_id = u.id
        WHERE fm.user_id = ?
        LIMIT 1
      `).get(user.id) as { id: string; family_id: string; name: string; phone: string } | null;

      if (memberResult) {
        uploaderId = user.id;
        uploaderName = memberResult.name;
        uploaderPhone = memberResult.phone;
        uploaderFamilyId = memberResult.family_id;
        ownerId = memberResult.family_id;
      } else {
        // Fallback if no family membership found
        ownerId = user.id;
      }
    }

    // Save to database
    const now = new Date().toISOString();
    rawDb.query(`
      INSERT INTO image (
        id, filename, original_name, mime_type, size, storage_path, url,
        uploader_id, uploader_name, uploader_phone, uploader_family_id,
        owner_type, owner_id, reference_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      storedImage.id,
      storedImage.filename,
      storedImage.originalName,
      storedImage.mimeType,
      storedImage.size,
      storedImage.storagePath,
      storedImage.url,
      uploaderId,
      uploaderName,
      uploaderPhone,
      uploaderFamilyId,
      ownerType,
      ownerId,
      0,
      now,
      now
    );

    return Response.json(
      createSuccessResponse({
        id: storedImage.id,
        filename: storedImage.filename,
        originalName: storedImage.originalName,
        mimeType: storedImage.mimeType,
        size: storedImage.size,
        url: storedImage.url,
        uploader: {
          id: uploaderId,
          name: uploaderName,
          phone: uploaderPhone,
          familyId: uploaderFamilyId,
        },
        owner: {
          type: ownerType,
          id: ownerId,
        },
        createdAt: now,
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/image-bed/upload error:", error);
    return Response.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to upload image"),
      { status: 500 }
    );
  }
}
