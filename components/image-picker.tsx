/**
 * ImagePicker - 图片选择组件
 *
 * 这是一个组合组件，整合以下功能：
 * - IconPicker: Lucide 图标选择（全量、过滤、颜色选择）
 * - ImageUploader: 图片上传到图床
 *
 * 边框预览已集成到各选择组件中
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { IconPicker } from "./icon-picker";
import { ImageUploader } from "./image-uploader";
import { BorderStyleSelector } from "./border-preview";
import type { MedalBorderStyle } from "@/types/medal";
import { ImageIcon, Type } from "lucide-react";

// ============================================================
// 类型定义
// ============================================================

type ImagePickerTab = "icon" | "upload";

interface ImagePickerProps {
  value?: {
    type: "icon" | "upload";
    color?: string;
    value: string; // iconName or image url
    borderStyle: MedalBorderStyle;
  };
  borderStyle?: MedalBorderStyle;
  onChange?: (value: {
    type: "icon" | "upload";
    color?: string;
    value: string;
    borderStyle: MedalBorderStyle;
  }) => void;
  disabled?: boolean;
  showBorderSelector?: boolean;
}

// ============================================================
// 主组件
// ============================================================

export function ImagePicker({
  value,
  borderStyle = "circle",
  onChange,
  disabled = false,
  showBorderSelector = false,
}: ImagePickerProps) {
  const [activeTab, setActiveTab] = React.useState<ImagePickerTab>(
    value?.type === "upload" ? "upload" : "icon",
  );

  // 当值变化时同步 tab
  React.useEffect(() => {
    if (value?.type === "upload") {
      setActiveTab("upload");
    } else if (value?.type === "icon") {
      setActiveTab("icon");
    }
  }, [value]);

  /**
   * 处理图标选择
   */
  const handleIconSelect = (iconData: { name: string; color: string }) => {
    onChange?.({
      type: "icon",
      value: iconData.name,
      color: iconData.color,
      borderStyle,
    });
  };

  /**
   * 处理图片上传
   */
  const handleImageUpload = (url: string | null) => {
    if (url) {
      onChange?.({
        type: "upload",
        value: url,
        borderStyle,
      });
    } else {
      // 清除选择
      onChange?.({
        type: "icon",
        value: "Star",
        color: "#3B82F6",
        borderStyle,
      });
    }
  };

  /**
   * 处理边框风格变化
   */
  const handleBorderStyleChange = (style: MedalBorderStyle) => {
    onChange?.({
      type: value?.type || "icon",
      value: value?.value || "Star",
      color: value?.color || "#3B82F6",
      borderStyle: style,
    });
  };

  return (
    <div className={cn("space-y-4", disabled && "opacity-50")}>
      {/* 边框风格选择 */}
      {showBorderSelector && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">边框风格</label>
          <BorderStyleSelector
            value={borderStyle}
            onChange={handleBorderStyleChange}
            disabled={disabled}
          />
        </div>
      )}

      {/* 选择方式切换 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">选择方式</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("icon")}
            disabled={disabled}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-all",
              activeTab === "icon"
                ? "border-blue-500 bg-blue-50 text-blue-600"
                : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50",
              disabled && "cursor-not-allowed",
            )}
          >
            <Type className="h-4 w-4" />
            图标库
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            disabled={disabled}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-all",
              activeTab === "upload"
                ? "border-blue-500 bg-blue-50 text-blue-600"
                : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50",
              disabled && "cursor-not-allowed",
            )}
          >
            <ImageIcon className="h-4 w-4" />
            上传图片
          </button>
        </div>
      </div>

      {/* 选择内容区域 */}
      <div className="pt-2">
        {activeTab === "icon" && (
          <div className="flex flex-col items-center gap-2">
            <IconPicker
              value={
                value?.type === "icon"
                  ? {
                      name: value.value as any,
                      color: value.color || "#3B82F6",
                    }
                  : undefined
              }
              borderStyle={borderStyle}
              onChange={handleIconSelect}
              disabled={disabled}
            />
            <span className="text-xs text-slate-500">点击选择 Lucide 图标</span>
          </div>
        )}

        {activeTab === "upload" && (
          <div className="flex flex-col items-center gap-2">
            <ImageUploader
              value={value?.type === "upload" ? value.value : null}
              onChange={handleImageUpload}
              disabled={disabled}
              borderStyle={borderStyle}
            />
            <span className="text-xs text-slate-500">
              支持 JPG、PNG、GIF、WebP、SVG
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// 导出子组件
export { IconPicker } from "./icon-picker";
export { ImageUploader } from "./image-uploader";
export { BorderStyleSelector } from "./border-preview";

// 导出类型
export type { ImagePickerProps };
