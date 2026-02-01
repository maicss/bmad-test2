"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImagePreview } from "./image-preview";

interface ImageWaterfallProps {
  images: Array<{
    id: string;
    url: string;
    originalName: string;
    uploader: {
      name: string | null;
      phone: string | null;
    };
    owner: {
      type: string;
      id: string;
    };
    referenceCount: number;
  }>;
  onDelete?: (id: string) => void;
  isAdmin?: boolean;
}

export function ImageWaterfall({ images, onDelete, isAdmin }: ImageWaterfallProps) {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const handleImageClick = useCallback((index: number) => {
    setPreviewIndex(index);
  }, []);

  const handleClosePreview = useCallback(() => {
    setPreviewIndex(null);
  }, []);

  if (images.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        暂无图片
      </div>
    );
  }

  return (
    <>
      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4 p-4">
        {images.map((image, index) => {
          return (
            <div
              key={image.id}
              className="break-inside-avoid group relative"
            >
              <div
                className="relative cursor-pointer overflow-hidden rounded-lg bg-muted"
                onClick={() => handleImageClick(index)}
              >
                <Image
                  src={image.url}
                  alt={image.originalName}
                  width={300}
                  height={200}
                  className="w-full h-auto object-cover transition-transform group-hover:scale-105"
                  style={{ aspectRatio: "3/2" }}
                />

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />

                {/* Reference count badge */}
                <div className="absolute top-2 right-2 bg-slate-600 text-white text-xs px-2 py-1 rounded-full">
                  {image.referenceCount}
                </div>

                {/* Delete button */}
                {isAdmin && onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(image.id);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Image info */}
              <div className="mt-1 text-xs text-muted-foreground truncate">
                {image.originalName}
              </div>
            </div>
          );
        })}
      </div>

      {/* Image preview modal */}
      {previewIndex !== null && (
        <ImagePreview
          images={images}
          initialIndex={previewIndex}
          onClose={handleClosePreview}
        />
      )}
    </>
  );
}
