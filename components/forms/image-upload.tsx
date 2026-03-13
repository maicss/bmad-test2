/**
 * Image Upload Component
 *
 * Story 2.9: Child Marks Task Complete
 * Task 2 & 3: Task completion dialog and image upload functionality
 *
 * Handles image upload for task completion proof:
 * - Drag & drop or click to upload
 * - Camera capture support
 * - Image preview before upload
 * - Image compression
 * - Delete/re-upload functionality
 *
 * Source: Story 2.9 Dev Notes - Image Upload Service
 */

'use client';

import { useState, useRef } from 'react';
import { Camera, Upload, X, Image as ImageIcon } from 'lucide-react';
import { imageUploadService, ImageUploadError } from '@/lib/services/image-upload';

interface ImageUploadProps {
  /** Current image URL (Base64) */
  value?: string;
  /** Callback when image changes */
  onChange: (image: string | undefined) => void;
  /** Error message to display */
  error?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Test ID prefix for E2E testing */
  testIdPrefix?: string;
}

export function ImageUpload({ value, onChange, error, disabled, testIdPrefix = 'image-upload' }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(value);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File | null | undefined) => {
    if (!file) return;

    setIsUploading(true);
    try {
      const base64 = await imageUploadService.uploadTaskProofImage(file);
      setPreviewUrl(base64);
      onChange(base64);
    } catch (err) {
      if (err instanceof ImageUploadError) {
        console.error('Image upload error:', err.message);
      } else {
        console.error('Unknown error:', err);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;

    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    handleFileSelect(file);
  };

  const handleCameraClick = async () => {
    if (disabled) return;

    try {
      // Check if camera API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        // Fallback to file input
        fileInputRef.current?.click();
        return;
      }

      // Create a file input for camera capture
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';

      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        handleFileSelect(file ?? null);
      };

      input.click();
    } catch (err) {
      console.error('Camera access error:', err);
      // Fallback to file input
      fileInputRef.current?.click();
    }
  };

  const handleDelete = () => {
    setPreviewUrl(undefined);
    onChange(undefined);
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      {previewUrl ? (
        // Image preview with delete button
        <div className="relative group">
          <img
            src={previewUrl}
            alt="Task proof"
            className="w-full h-48 object-cover rounded-lg border-2 border-gray-200"
            data-testid={`${testIdPrefix}-preview`}
          />
          <button
            type="button"
            onClick={handleDelete}
            disabled={disabled}
            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
            data-testid={`${testIdPrefix}-delete`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        // Upload area
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={`
            border-2 border-dashed rounded-lg p-6
            flex flex-col items-center justify-center
            min-h-[120px] transition-colors
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:bg-gray-50 cursor-pointer'}
            ${error ? 'border-red-400' : 'border-gray-300'}
          `}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-600">处理中...</p>
            </div>
          ) : (
            <>
              <ImageIcon className="w-12 h-12 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 text-center">
                拖拽图片到此处，或点击上传
              </p>
            </>
          )}
        </div>
      )}

      {/* Action buttons */}
      {!previewUrl && !isUploading && (
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={handleCameraClick}
            disabled={disabled}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
            data-testid={`${testIdPrefix}-camera`}
          >
            <Camera className="w-4 h-4" />
            <span>拍照</span>
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
            data-testid={`${testIdPrefix}-gallery`}
          >
            <Upload className="w-4 h-4" />
            <span>相册</span>
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
