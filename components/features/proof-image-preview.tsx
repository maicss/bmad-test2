/**
 * Proof Image Preview Component
 *
 * Story 2.7: Parent Batch Approves Tasks
 * Task 8: 实现任务完成证明展示
 *
 * Displays task completion proof images
 * - Thumbnail preview in approval list
 * - Full screen preview on click
 * - Default icon when no proof image
 *
 * Source: Story 2.7 AC - 任务完成证明（如有照片）
 */

'use client';

import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ImageIcon, X } from 'lucide-react';

interface ProofImagePreviewProps {
  imageUrl: string;
  taskTitle: string;
}

export function ProofImagePreview({ imageUrl, taskTitle }: ProofImagePreviewProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Thumbnail */}
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 transition-colors"
        data-testid="proof-image-preview"
      >
        <ImageIcon className="h-3.5 w-3.5" />
        <span>查看证明</span>
      </button>

      {/* Full Screen Preview Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          <div className="relative">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 bg-background/80 hover:bg-background"
              onClick={() => setIsOpen(false)}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>

            {/* Image */}
            <div className="flex items-center justify-center bg-black/5 min-h-[300px]">
              <img
                src={imageUrl}
                alt={`完成证明: ${taskTitle}`}
                className="max-w-full max-h-[70vh] object-contain"
              />
            </div>

            {/* Title Bar */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
              <p className="text-white text-sm font-medium">{taskTitle}</p>
              <p className="text-white/80 text-xs">完成证明</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Default placeholder for tasks without proof image
 */
export function NoProofImage() {
  return (
    <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground" data-testid="no-proof-icon">
      <ImageIcon className="h-3.5 w-3.5" />
      <span>无完成证明</span>
    </div>
  );
}
