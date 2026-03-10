/**
 * Image Upload Service
 *
 * Story 2.9: Child Marks Task Complete
 * Task 3: Implement image upload functionality
 *
 * Handles image upload and compression for task completion proof:
 * - Validates file type and size
 * - Compresses images to optimize storage
 * - Converts to Base64 for database storage
 *
 * Source: Story 2.9 Dev Notes - Image Upload Service
 */

/**
 * Error class for image upload failures
 */
export class ImageUploadError extends Error {
  constructor(
    message: string,
    public readonly code: 'INVALID_TYPE' | 'FILE_TOO_LARGE' | 'COMPRESS_FAILED' | 'INVALID_DATA',
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'ImageUploadError';
  }
}

/**
 * Image upload service for task proof images
 */
export class ImageUploadService {
  private readonly MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
  private readonly MAX_WIDTH = 800; // Max width for compression
  private readonly JPEG_QUALITY = 0.7; // JPEG quality for compression

  /**
   * Validate and compress an image file for task proof upload
   *
   * @param file - File from input element
   * @returns Base64 encoded image string (data URL format)
   * @throws ImageUploadError if validation or compression fails
   */
  async uploadTaskProofImage(file: File): Promise<string> {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new ImageUploadError(
        '只能上传图片文件',
        'INVALID_TYPE'
      );
    }

    // Validate file size
    if (file.size > this.MAX_FILE_SIZE) {
      throw new ImageUploadError(
        `图片大小不能超过 2MB (当前: ${(file.size / 1024 / 1024).toFixed(2)}MB)`,
        'FILE_TOO_LARGE'
      );
    }

    try {
      // Compress image
      const compressedBlob = await this.compressImage(file);

      // Convert to Base64
      const base64 = await this.blobToBase64(compressedBlob);
      return base64;
    } catch (error) {
      throw new ImageUploadError(
        '图片处理失败，请重试',
        'COMPRESS_FAILED',
        error
      );
    }
  }

  /**
   * Validate a Base64 image string
   *
   * @param base64String - Base64 encoded image string
   * @returns true if valid, false otherwise
   */
  isValidBase64Image(base64String: string): boolean {
    if (!base64String || typeof base64String !== 'string') {
      return false;
    }

    // Check if it's a valid data URL
    const dataUrlPattern = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/i;
    return dataUrlPattern.test(base64String);
  }

  /**
   * Get file size from Base64 string (in bytes)
   *
   * @param base64String - Base64 encoded image string
   * @returns File size in bytes
   */
  getBase64Size(base64String: string): number {
    // Remove the data URL prefix to get the raw base64
    const base64Data = base64String.split(',')[1] || base64String;
    // Base64 size is approximately 4/3 of original binary size
    return Math.floor((base64Data.length * 3) / 4);
  }

  /**
   * Compress image using Canvas API
   *
   * @param file - Original image file
   * @returns Compressed image blob
   */
  private async compressImage(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('无法获取 Canvas 上下文'));
            URL.revokeObjectURL(url);
            return;
          }

          // Calculate scaled dimensions
          let width = img.width;
          let height = img.height;

          if (width > this.MAX_WIDTH) {
            height = Math.round((height * this.MAX_WIDTH) / width);
            width = this.MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;

          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              URL.revokeObjectURL(url);
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('图片压缩失败'));
              }
            },
            'image/jpeg',
            this.JPEG_QUALITY
          );
        } catch (error) {
          URL.revokeObjectURL(url);
          reject(error);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('图片加载失败'));
      };

      img.src = url;
    });
  }

  /**
   * Convert blob to Base64 data URL
   *
   * @param blob - Image blob
   * @returns Base64 encoded data URL
   */
  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === 'string') {
          resolve(result);
        } else {
          reject(new Error('无法转换图片为 Base64'));
        }
      };
      reader.onerror = () => reject(new Error('读取图片失败'));
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Create a test image file for testing purposes
   *
   * @param filename - Name for the test file
   * @returns Test image file (1x1 red pixel PNG)
   */
  static createTestImage(filename = 'test-image.png'): File {
    // 1x1 red PNG in Base64
    const redPixelBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
    const byteString = atob(redPixelBase64);
    const byteArray = new Uint8Array(byteString.length);

    for (let i = 0; i < byteString.length; i++) {
      byteArray[i] = byteString.charCodeAt(i);
    }

    const blob = new Blob([byteArray], { type: 'image/png' });
    return new File([blob], filename, { type: 'image/png' });
  }
}

// Singleton instance
export const imageUploadService = new ImageUploadService();
