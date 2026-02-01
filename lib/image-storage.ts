/**
 * Image Storage Abstraction Layer
 * Supports local filesystem and OSS storage backends
 */

import { writeFile, mkdir, unlink, readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

export type StorageMode = "local" | "oss";

export interface StorageConfig {
  mode: StorageMode;
  localPath?: string; // Local filesystem path (e.g., "/image-bed")
  ossConfig?: {
    accessKeyId: string;
    accessKeySecret: string;
    bucket: string;
    region: string;
  };
}

export interface StoredImage {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  storagePath: string;
  url: string;
}

// Get storage configuration from environment variables
export function getStorageConfig(): StorageConfig {
  const mode = (process.env.OSS_MODE || "local") as StorageMode;

  const config: StorageConfig = {
    mode,
    localPath: process.env.OSS_PATH || path.join(process.cwd(), 'image-bed'),
  };

  if (mode === "oss") {
    config.ossConfig = {
      accessKeyId: process.env.OSS_ACCESS_KEY_ID || "",
      accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || "",
      bucket: process.env.OSS_BUCKET || "",
      region: process.env.OSS_REGION || "oss-cn-hangzhou",
    };
  }

  return config;
}

// Generate unique filename
export function generateFilename(originalName: string): string {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `img_${timestamp}_${random}${ext}`;
}

// Local storage implementation
async function saveLocal(
  buffer: Buffer,
  storagePath: string,
  filename: string
): Promise<string> {
  // Ensure directory exists
  if (!existsSync(storagePath)) {
    await mkdir(storagePath, { recursive: true });
  }

  const fullPath = path.join(storagePath, filename);
  await writeFile(fullPath, buffer);
  return fullPath;
}

async function deleteLocal(filePath: string): Promise<void> {
  if (existsSync(filePath)) {
    await unlink(filePath);
  }
}

async function getLocal(filePath: string): Promise<Buffer | null> {
  if (!existsSync(filePath)) {
    return null;
  }
  return readFile(filePath);
}

// OSS storage implementation (placeholder for future)
async function saveOSS(
  buffer: Buffer,
  _filename: string
): Promise<string> {
  // TODO: Implement OSS upload using Aliyun SDK
  // For now, fall back to local storage
  throw new Error("OSS not implemented yet. Please use local storage mode.");
}

async function deleteOSS(_filePath: string): Promise<void> {
  // TODO: Implement OSS delete
  throw new Error("OSS not implemented yet. Please use local storage mode.");
}

async function getOSS(_filePath: string): Promise<Buffer | null> {
  // TODO: Implement OSS download
  throw new Error("OSS not implemented yet. Please use local storage mode.");
}

/**
 * Save image to storage
 * @param buffer Image file buffer
 * @param filename Generated filename
 * @param originalName Original filename from upload
 * @param mimeType MIME type of the image
 * @param size File size in bytes
 * @returns StoredImage metadata
 */
export async function saveImage(
  buffer: Buffer,
  filename: string,
  originalName: string,
  mimeType: string,
  size: number
): Promise<StoredImage> {
  const config = getStorageConfig();
  const storagePath = config.mode === "local" ? config.localPath! : "";

  let fullPath: string;
  let url: string;

  if (config.mode === "local") {
    fullPath = await saveLocal(buffer, storagePath, filename);
    // Generate URL based on environment
    const host = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    url = `${host}/api/image-bed/files/${filename}`;
  } else {
    fullPath = await saveOSS(buffer, filename);
    url = fullPath; // OSS URL would be generated here
  }

  return {
    id: filename, // Use filename as ID for simplicity
    filename,
    originalName,
    mimeType,
    size,
    storagePath: fullPath,
    url,
  };
}

/**
 * Delete image from storage
 */
export async function deleteImage(filename: string): Promise<void> {
  const config = getStorageConfig();

  if (config.mode === "local") {
    const fullPath = path.join(config.localPath!, filename);
    await deleteLocal(fullPath);
  } else {
    await deleteOSS(filename);
  }
}

/**
 * Get image file buffer from storage
 */
export async function getImage(filename: string): Promise<Buffer | null> {
  const config = getStorageConfig();

  if (config.mode === "local") {
    const fullPath = path.join(config.localPath!, filename);
    return getLocal(fullPath);
  } else {
    return getOSS(filename);
  }
}

/**
 * Get local file path for serving
 */
export function getLocalFilePath(filename: string): string {
  const config = getStorageConfig();
  return path.join(config.localPath!, filename);
}
