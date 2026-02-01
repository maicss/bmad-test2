"use client";

import { useEffect, useCallback, useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImagePreviewProps {
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
  initialIndex: number;
  onClose: () => void;
}

export function ImagePreview({ images, initialIndex, onClose }: ImagePreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [copied, setCopied] = useState(false);

  const currentImage = images[currentIndex];

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  const copyLink = useCallback(async () => {
    if (currentImage) {
      await navigator.clipboard.writeText(currentImage.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [currentImage]);

  const openInNewTab = useCallback(() => {
    if (currentImage) {
      window.open(currentImage.url, "_blank");
    }
  }, [currentImage]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        goToPrevious();
      } else if (e.key === "ArrowRight") {
        goToNext();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose, goToPrevious, goToNext]);

  if (!currentImage) return null;

  const hasReferences = currentImage.referenceCount > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Navigation buttons */}
      {images.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 p-2 text-white/70 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 p-2 text-white/70 hover:text-white transition-colors"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </>
      )}

      {/* Image container */}
      <div className="relative max-w-[90vw] max-h-[80vh]">
        <div className={`relative ${hasReferences ? "ring-4 ring-red-500" : ""}`}>
          <Image
            src={currentImage.url}
            alt={currentImage.originalName}
            width={1200}
            height={800}
            className="max-w-full max-h-[75vh] object-contain"
            priority
          />
        </div>
      </div>

      {/* Info panel */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-white">
            <p className="text-lg font-medium mb-2">{currentImage.originalName}</p>
            <div className="flex flex-wrap gap-4 text-sm text-white/70">
              <span>
                上传者: {currentImage.uploader.name || "未知"}
                {currentImage.uploader.phone && ` (${currentImage.uploader.phone})`}
              </span>
              <span>
                归属:{" "}
                {currentImage.owner.type === "admin"
                  ? "管理员"
                  : currentImage.owner.id}
              </span>
              {hasReferences && (
                <span className="text-red-400">
                  引用次数: {currentImage.referenceCount}
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={copyLink}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Copy className="w-4 h-4 mr-2" />
              {copied ? "已复制" : "复制链接"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={openInNewTab}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              打开链接
            </Button>
          </div>
        </div>
      </div>

      {/* Image counter */}
      <div className="absolute top-4 left-4 text-white/70 text-sm">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  );
}
