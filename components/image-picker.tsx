/**
 * ImagePicker - 图片选择组件
 * 
 * 这是一个组合组件，整合以下功能：
 * - IconPicker: Lucide 图标选择（全量、过滤、颜色选择）
 * - ImageUploader: 图片上传到图床
 * - BorderPreview: 边框预览（圆形、六边形、正方形）
 * 
 * 最终预览效果统一使用 Avatar 的大小和外观
 */

"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { IconPicker } from "./icon-picker"
import { ImageUploader } from "./image-uploader"
import { BorderPreview, BorderStyleSelector } from "./border-preview"
import type { MedalIconValue, MedalBorderStyle } from "@/types/medal"
import { ImageIcon, Type } from "lucide-react"

// ============================================================
// 类型定义
// ============================================================

type ImagePickerTab = "icon" | "upload"

interface ImagePickerProps {
  value?: MedalIconValue
  borderStyle?: MedalBorderStyle
  onChange?: (value: MedalIconValue) => void
  onBorderStyleChange?: (style: MedalBorderStyle) => void
  disabled?: boolean
}

// ============================================================
// 主组件
// ============================================================

export function ImagePicker({
  value,
  borderStyle = "circle",
  onChange,
  onBorderStyleChange,
  disabled = false,
}: ImagePickerProps) {
  const [activeTab, setActiveTab] = React.useState<ImagePickerTab>(
    value?.type === "custom" ? "upload" : "icon"
  )

  // 当值变化时同步 tab
  React.useEffect(() => {
    if (value?.type === "custom") {
      setActiveTab("upload")
    } else if (value?.type === "lucide") {
      setActiveTab("icon")
    }
  }, [value])

  /**
   * 处理图标选择
   */
  const handleIconSelect = (iconData: { name: string; color: string }) => {
    onChange?.({
      type: "lucide",
      value: iconData.name,
      color: iconData.color,
    })
  }

  /**
   * 处理图片上传
   */
  const handleImageUpload = (url: string | null) => {
    if (url) {
      onChange?.({
        type: "custom",
        value: url,
      })
    } else {
      // 清除选择
      onChange?.({
        type: "lucide",
        value: "Star",
        color: "#3B82F6",
      })
    }
  }

  /**
   * 处理边框风格变化
   */
  const handleBorderStyleChange = (style: MedalBorderStyle) => {
    onBorderStyleChange?.(style)
  }

  return (
    <div className={cn("space-y-4", disabled && "opacity-50")}>
      {/* 预览区域 */}
      <div className="flex flex-col items-center gap-3">
        <label className="text-sm font-medium text-slate-700">预览效果</label>
        <BorderPreview
          icon={value}
          borderStyle={borderStyle}
          size="md"
          tierColor="#94A3B8"
        />
      </div>

      {/* 边框风格选择 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">边框风格</label>
        <BorderStyleSelector
          value={borderStyle}
          onChange={handleBorderStyleChange}
          disabled={disabled}
        />
      </div>

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
              disabled && "cursor-not-allowed"
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
              disabled && "cursor-not-allowed"
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
                value?.type === "lucide"
                  ? { name: value.value as any, color: value.color || "#3B82F6" }
                  : undefined
              }
              onChange={handleIconSelect}
              disabled={disabled}
            />
            <span className="text-xs text-slate-500">点击选择 Lucide 图标</span>
          </div>
        )}

        {activeTab === "upload" && (
          <div className="flex flex-col items-center gap-2">
            <ImageUploader
              value={value?.type === "custom" ? value.value : null}
              onChange={handleImageUpload}
              disabled={disabled}
            />
            <span className="text-xs text-slate-500">支持 JPG、PNG、GIF、WebP、SVG</span>
          </div>
        )}
      </div>
    </div>
  )
}

// 导出子组件
export { IconPicker } from "./icon-picker"
export { ImageUploader } from "./image-uploader"
export { BorderPreview, BorderStyleSelector } from "./border-preview"

// 导出类型
export type { ImagePickerProps }
