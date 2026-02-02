/**
 * ImageUploader - 图片上传组件
 * 
 * 功能：
 * - 上传图片到图床
 * - 上传成功后显示预览
 * - 支持删除已上传图片
 * - 参考: https://www.shadcnblocks.com/component/file-upload/file-upload-special-1
 */

"use client"

import * as React from "react"
import { Upload, X, Loader2, ImageIcon, Check } from "lucide-react"
import { cn } from "@/lib/utils"

// ============================================================
// 类型定义
// ============================================================

interface ImageUploaderProps {
  value?: string | null // 图片URL
  onChange?: (url: string | null) => void
  disabled?: boolean
  maxSize?: number // 最大文件大小（MB），默认10MB
  acceptedTypes?: string[] // 接受的文件类型
}

interface UploadState {
  status: "idle" | "uploading" | "success" | "error"
  progress: number
  error?: string
}

// ============================================================
// 辅助函数
// ============================================================

/**
 * 格式化文件大小
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

/**
 * 验证文件
 */
function validateFile(
  file: File,
  maxSizeMB: number,
  acceptedTypes: string[]
): { valid: boolean; error?: string } {
  // 检查文件大小
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `文件过大，最大支持 ${maxSizeMB}MB`,
    }
  }

  // 检查文件类型
  if (acceptedTypes.length > 0 && !acceptedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `不支持的文件类型，请上传 ${acceptedTypes.map(t => t.replace("image/", "")).join("、")} 格式的图片`,
    }
  }

  return { valid: true }
}

// ============================================================
// 主组件
// ============================================================

export function ImageUploader({
  value,
  onChange,
  disabled = false,
  maxSize = 10,
  acceptedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"],
}: ImageUploaderProps) {
  const [uploadState, setUploadState] = React.useState<UploadState>({
    status: "idle",
    progress: 0,
  })
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(value || null)
  const [dragActive, setDragActive] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // 同步外部value变化
  React.useEffect(() => {
    setPreviewUrl(value || null)
  }, [value])

  /**
   * 执行上传
   */
  const performUpload = async (file: File) => {
    // 验证文件
    const validation = validateFile(file, maxSize, acceptedTypes)
    if (!validation.valid) {
      setUploadState({ status: "error", progress: 0, error: validation.error })
      return
    }

    setUploadState({ status: "uploading", progress: 0 })

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/image-bed/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.message || "上传失败")
      }

      const result = await response.json()

      if (result.success && result.data?.url) {
        setUploadState({ status: "success", progress: 100 })
        setPreviewUrl(result.data.url)
        onChange?.(result.data.url)
      } else {
        throw new Error(result.message || "上传失败")
      }
    } catch (error) {
      setUploadState({
        status: "error",
        progress: 0,
        error: error instanceof Error ? error.message : "上传失败，请重试",
      })
    }
  }

  /**
   * 处理文件选择
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      performUpload(file)
    }
    // 重置input以允许重复选择同一文件
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }

  /**
   * 处理拖拽事件
   */
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  /**
   * 处理文件拖放
   */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (disabled) return

    const file = e.dataTransfer.files?.[0]
    if (file) {
      performUpload(file)
    }
  }

  /**
   * 清除已上传的图片
   */
  const handleClear = () => {
    setPreviewUrl(null)
    setUploadState({ status: "idle", progress: 0 })
    onChange?.(null)
  }

  /**
   * 触发文件选择
   */
  const triggerFileInput = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.click()
    }
  }

  // 显示已上传的图片预览
  if (previewUrl) {
    return (
      <div className="relative h-32 w-32 overflow-hidden rounded-xl border border-slate-200">
        <img
          src={previewUrl}
          alt="Uploaded preview"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors hover:bg-black/40">
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-red-500 opacity-0 shadow-sm transition-opacity hover:bg-white hover:text-red-600 disabled:cursor-not-allowed group-hover:opacity-100"
            style={{ opacity: 1 }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {/* 悬停时显示删除按钮 */}
        <div className="group absolute inset-0 flex items-center justify-center">
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-red-500 opacity-0 shadow-lg transition-all hover:scale-110 hover:bg-white group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    )
  }

  // 上传中状态
  if (uploadState.status === "uploading") {
    return (
      <div className="flex h-32 w-32 flex-col items-center justify-center rounded-xl border-2 border-dashed border-blue-300 bg-blue-50">
        <Loader2 className="mb-2 h-8 w-8 animate-spin text-blue-500" />
        <span className="text-xs text-blue-600">上传中...</span>
        <div className="mt-2 h-1 w-20 overflow-hidden rounded-full bg-blue-200">
          <div
            className="h-full bg-blue-500 transition-all"
            style={{ width: `${uploadState.progress}%` }}
          />
        </div>
      </div>
    )
  }

  // 错误状态
  if (uploadState.status === "error") {
    return (
      <div className="flex h-32 w-32 flex-col items-center justify-center rounded-xl border-2 border-dashed border-red-300 bg-red-50">
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
          <X className="h-5 w-5 text-red-500" />
        </div>
        <span className="px-2 text-center text-xs text-red-600">
          {uploadState.error || "上传失败"}
        </span>
        <button
          type="button"
          onClick={triggerFileInput}
          disabled={disabled}
          className="mt-2 text-xs text-blue-500 hover:text-blue-600"
        >
          重试
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={acceptedTypes.join(",")}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    )
  }

  // 默认上传区域
  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={cn(
        "flex h-32 w-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all",
        dragActive
          ? "border-blue-500 bg-blue-50"
          : "border-slate-300 hover:border-slate-400 hover:bg-slate-50",
        disabled && "cursor-not-allowed opacity-50"
      )}
      onClick={triggerFileInput}
    >
      <input
        ref={inputRef}
        type="file"
        accept={acceptedTypes.join(",")}
        onChange={handleFileChange}
        disabled={disabled}
        className="hidden"
      />
      <div className="flex flex-col items-center gap-2 text-slate-400">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
          {uploadState.status === "success" ? (
            <Check className="h-5 w-5 text-green-500" />
          ) : (
            <Upload className="h-5 w-5" />
          )}
        </div>
        <span className="text-xs">上传图片</span>
        <span className="text-[10px] text-slate-400">
          最大 {maxSize}MB
        </span>
      </div>
    </div>
  )
}

// 导出类型
export type { ImageUploaderProps, UploadState }
