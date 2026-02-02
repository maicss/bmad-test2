/**
 * MedalTemplateForm - 徽章模板创建表单
 * 
 * 功能：
 * - 名称输入（2-10字符）
 * - 图标选择（ImagePicker组件）
 * - 边框风格选择（影响图标预览）
 * - 等级设置：单等级 / 多等级
 *   - 单等级：次数数字输入框，最少1次，默认10
 *   - 多等级：
 *     - 等级数：slider，范围2-5，默认3
 *     - 色系：select，预设色系选择（Bronze/Silver/Gold/Platinum/Onyx）
 *     - 次数：连续横向排列的数字输入框，最少1次，默认10
 * - 是否连续：checkbox
 */

"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "./ui/input"
import { Checkbox } from "./ui/checkbox"
import { ImagePicker } from "./image-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"
import type {
  MedalIconValue,
  MedalBorderStyle,
  MedalLevelMode,
  MedalTierColorScheme,
  CreateMedalTemplateRequest,
  MedalTemplateFormErrors,
} from "@/types/medal"
import { MedalTierColorSchemes } from "@/types/medal"
import { ErrorCodes } from "@/lib/constant"
import { AlertCircle, Check } from "lucide-react"

// ============================================================
// 类型定义
// ============================================================

interface MedalTemplateFormProps {
  initialData?: Partial<CreateMedalTemplateRequest>
  onSubmit?: (data: CreateMedalTemplateRequest) => void
  onCancel?: () => void
  isLoading?: boolean
}

// ============================================================
// 验证函数
// ============================================================

/**
 * 验证名称
 */
function validateName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: "请输入徽章名称" }
  }
  if (name.length < 2) {
    return { valid: false, error: "名称至少需要2个字符" }
  }
  if (name.length > 10) {
    return { valid: false, error: "名称最多10个字符" }
  }
  return { valid: true }
}

/**
 * 验证阈值次数数组
 * 要求：每个值至少为1，且后一个必须大于前一个
 */
function validateThresholdCounts(counts: number[]): { valid: boolean; error?: string; fieldErrors?: string[] } {
  const fieldErrors: string[] = []
  
  for (let i = 0; i < counts.length; i++) {
    const count = counts[i]
    if (!count || count < 1) {
      fieldErrors[i] = "至少1次"
    } else if (i > 0 && count <= counts[i - 1]) {
      fieldErrors[i] = `必须大于 ${counts[i - 1]}`
    } else {
      fieldErrors[i] = ""
    }
  }

  const hasErrors = fieldErrors.some(e => e.length > 0)
  if (hasErrors) {
    return { valid: false, fieldErrors }
  }

  return { valid: true }
}

// ============================================================
// Slider 组件（参考 shadcnblocks.com/slider/slider-styled-2）
// ============================================================

interface SliderProps {
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  disabled?: boolean
  labels?: string[]
}

function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
  disabled = false,
  labels,
}: SliderProps) {
  const percentage = ((value - min) / (max - min)) * 100

  return (
    <div className={cn("w-full space-y-2", disabled && "opacity-50")}>
      <div className="relative h-6 flex items-center">
        {/* 轨道背景 */}
        <div className="absolute h-2 w-full rounded-full bg-slate-200" />
        {/* 已填充部分 */}
        <div
          className="absolute h-2 rounded-full bg-blue-500"
          style={{ width: `${percentage}%` }}
        />
        {/* 滑块 */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          className="absolute w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110 disabled:cursor-not-allowed"
          style={{
            // 隐藏默认滑块样式，使用伪元素
          }}
        />
      </div>
      {/* 标签 */}
      {labels && (
        <div className="flex justify-between text-xs text-slate-500">
          {labels.map((label, i) => (
            <span key={i}>{label}</span>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================
// 阈值输入组件
// ============================================================

interface ThresholdInputsProps {
  count: number
  values: number[]
  onChange: (values: number[]) => void
  errors?: string[]
  disabled?: boolean
}

function ThresholdInputs({
  count,
  values,
  onChange,
  errors = [],
  disabled = false,
}: ThresholdInputsProps) {
  // 确保 values 长度与 count 一致
  const displayValues = React.useMemo(() => {
    const result = [...values]
    while (result.length < count) {
      // 添加默认值，确保递增
      const prevValue = result.length > 0 ? result[result.length - 1] : 0
      result.push(prevValue + 10)
    }
    return result.slice(0, count)
  }, [values, count])

  const handleChange = (index: number, value: string) => {
    const numValue = parseInt(value, 10) || 0
    const newValues = [...displayValues]
    newValues[index] = numValue
    onChange(newValues)
  }

  return (
    <div className="flex flex-wrap gap-2">
      {displayValues.map((val, index) => (
        <div key={index} className="flex flex-col gap-1">
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-500 min-w-[20px]">
              L{index + 1}
            </span>
            <Input
              type="number"
              min={1}
              value={val || ""}
              onChange={(e) => handleChange(index, e.target.value)}
              disabled={disabled}
              className={cn(
                "w-20 text-center",
                errors[index] && "border-red-500 focus-visible:ring-red-500/20"
              )}
              placeholder="次数"
            />
          </div>
          {errors[index] && (
            <span className="text-[10px] text-red-500">{errors[index]}</span>
          )}
        </div>
      ))}
    </div>
  )
}

// ============================================================
// 主组件
// ============================================================

export function MedalTemplateForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: MedalTemplateFormProps) {
  // 表单状态
  const [name, setName] = React.useState(initialData?.name || "")
  const [icon, setIcon] = React.useState<MedalIconValue>(
    initialData?.icon || { type: "lucide", value: "Medal", color: "#FFD700" }
  )
  const [borderStyle, setBorderStyle] = React.useState<MedalBorderStyle>(
    initialData?.borderStyle || "circle"
  )
  const [levelMode, setLevelMode] = React.useState<MedalLevelMode>(
    initialData?.levelMode || "single"
  )
  const [levelCount, setLevelCount] = React.useState(initialData?.levelCount || 3)
  const [tierColorScheme, setTierColorScheme] = React.useState<MedalTierColorScheme>(
    initialData?.tierColorScheme || "INGRESS"
  )
  const [thresholdCounts, setThresholdCounts] = React.useState<number[]>(
    initialData?.thresholdCounts || [10]
  )
  const [isContinuous, setIsContinuous] = React.useState(
    initialData?.isContinuous || false
  )

  // 错误状态
  const [errors, setErrors] = React.useState<MedalTemplateFormErrors>({})
  const [touched, setTouched] = React.useState<Record<string, boolean>>({})

  // 验证表单
  const validateForm = (): boolean => {
    const newErrors: MedalTemplateFormErrors = {}

    // 验证名称
    const nameValidation = validateName(name)
    if (!nameValidation.valid) {
      newErrors.name = nameValidation.error
    }

    // 验证图标
    if (!icon || !icon.value) {
      newErrors.icon = "请选择图标"
    }

    // 验证次数
    const countsToValidate = levelMode === "single" ? [thresholdCounts[0] || 10] : thresholdCounts
    const thresholdValidation = validateThresholdCounts(countsToValidate)
    if (!thresholdValidation.valid) {
      newErrors.thresholdCounts = thresholdValidation.fieldErrors
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 提交表单
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // 标记所有字段为已触碰
    setTouched({
      name: true,
      icon: true,
      borderStyle: true,
      levelMode: true,
      thresholdCounts: true,
    })

    if (!validateForm()) {
      return
    }

    const submitData: CreateMedalTemplateRequest = {
      name: name.trim(),
      icon,
      borderStyle,
      levelMode,
      levelCount: levelMode === "multiple" ? levelCount : 1,
      tierColorScheme: levelMode === "multiple" ? tierColorScheme : undefined,
      thresholdCounts: levelMode === "single" 
        ? [thresholdCounts[0] || 10]
        : thresholdCounts.slice(0, levelCount),
      isContinuous,
    }

    onSubmit?.(submitData)
  }

  // 当等级模式变化时，重置阈值次数
  React.useEffect(() => {
    if (levelMode === "single") {
      setThresholdCounts([thresholdCounts[0] || 10])
    } else {
      // 多等级模式，生成默认递增的值
      const defaultCounts: number[] = []
      for (let i = 0; i < levelCount; i++) {
        defaultCounts.push((i + 1) * 10)
      }
      setThresholdCounts(defaultCounts)
    }
  }, [levelMode])

  // 当等级数变化时，调整阈值次数数组
  React.useEffect(() => {
    if (levelMode === "multiple") {
      setThresholdCounts(prev => {
        const newCounts = [...prev]
        // 添加新等级的默认值
        while (newCounts.length < levelCount) {
          const lastValue = newCounts[newCounts.length - 1] || 0
          newCounts.push(lastValue + 10)
        }
        // 截断到当前等级数
        return newCounts.slice(0, levelCount)
      })
    }
  }, [levelCount, levelMode])

  // 获取色系选项
  const colorSchemeOptions = Object.entries(MedalTierColorSchemes).map(([key, colors]) => ({
    value: key as MedalTierColorScheme,
    label: key === "INGRESS" ? "Ingress (Bronze→Onyx)" : 
           key === "WARM" ? "暖色系" : 
           key === "COOL" ? "冷色系" : 
           key === "NATURE" ? "自然色系" : key,
    preview: colors.slice(0, 3).map(c => c.value),
  }))

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 名称输入 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">
          徽章名称 <span className="text-red-500">*</span>
          <span className="ml-2 text-xs font-normal text-slate-400">(2-10个字符)</span>
        </label>
        <Input
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            if (touched.name) {
              validateForm()
            }
          }}
          onBlur={() => {
            setTouched(prev => ({ ...prev, name: true }))
            validateForm()
          }}
          placeholder="例如：阅读之星"
          disabled={isLoading}
          className={cn(errors.name && touched.name && "border-red-500 focus-visible:ring-red-500/20")}
        />
        {errors.name && touched.name && (
          <p className="flex items-center gap-1 text-xs text-red-500">
            <AlertCircle className="h-3 w-3" />
            {errors.name}
          </p>
        )}
      </div>

      {/* 图标选择 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">
          图标 <span className="text-red-500">*</span>
        </label>
        <div className="rounded-lg border border-slate-200 p-4">
          <ImagePicker
            value={icon}
            borderStyle={borderStyle}
            onChange={setIcon}
            onBorderStyleChange={setBorderStyle}
            disabled={isLoading}
          />
        </div>
        {errors.icon && touched.icon && (
          <p className="flex items-center gap-1 text-xs text-red-500">
            <AlertCircle className="h-3 w-3" />
            {errors.icon}
          </p>
        )}
      </div>

      {/* 等级设置 */}
      <div className="space-y-4">
        <label className="text-sm font-medium text-slate-700">等级设置</label>
        
        {/* 等级模式选择 */}
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="levelMode"
              value="single"
              checked={levelMode === "single"}
              onChange={() => setLevelMode("single")}
              disabled={isLoading}
              className="h-4 w-4 text-blue-600"
            />
            <span className="text-sm text-slate-700">单等级</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="levelMode"
              value="multiple"
              checked={levelMode === "multiple"}
              onChange={() => setLevelMode("multiple")}
              disabled={isLoading}
              className="h-4 w-4 text-blue-600"
            />
            <span className="text-sm text-slate-700">多等级</span>
          </label>
        </div>

        {/* 单等级设置 */}
        {levelMode === "single" && (
          <div className="space-y-2 rounded-lg bg-slate-50 p-4">
            <label className="text-sm font-medium text-slate-700">
              达成次数 <span className="text-xs font-normal text-slate-400">(最少1次)</span>
            </label>
            <Input
              type="number"
              min={1}
              value={thresholdCounts[0] || 10}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10) || 0
                setThresholdCounts([val])
              }}
              disabled={isLoading}
              className="w-32"
            />
          </div>
        )}

        {/* 多等级设置 */}
        {levelMode === "multiple" && (
          <div className="space-y-4 rounded-lg bg-slate-50 p-4">
            {/* 等级数 Slider */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                等级数量 <span className="text-sm text-blue-600 font-semibold">{levelCount}</span>
              </label>
              <Slider
                value={levelCount}
                min={2}
                max={5}
                step={1}
                onChange={setLevelCount}
                disabled={isLoading}
                labels={["2级", "", "3级", "", "4级", "", "5级"]}
              />
            </div>

            {/* 色系选择 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">色系</label>
              <Select
                value={tierColorScheme}
                onValueChange={(val) => setTierColorScheme(val as MedalTierColorScheme)}
                disabled={isLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择色系" />
                </SelectTrigger>
                <SelectContent>
                  {colorSchemeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          {option.preview.map((color, i) => (
                            <div
                              key={i}
                              className="h-4 w-4 rounded-full"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* 色系预览 */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-slate-500">预览：</span>
                <div className="flex gap-1">
                  {MedalTierColorSchemes[tierColorScheme].slice(0, levelCount).map((color, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs text-white"
                      style={{ backgroundColor: color.value }}
                    >
                      <span>L{i + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 各等级次数 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                各等级所需次数 <span className="text-xs font-normal text-slate-400">(逐级递增)</span>
              </label>
              <ThresholdInputs
                count={levelCount}
                values={thresholdCounts}
                onChange={setThresholdCounts}
                errors={errors.thresholdCounts}
                disabled={isLoading}
              />
              {errors.thresholdCounts && (
                <p className="text-xs text-red-500">
                  请确保每个等级的次数都大于前一等级
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 是否连续 */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="isContinuous"
          checked={isContinuous}
          onCheckedChange={(checked) => setIsContinuous(checked === true)}
          disabled={isLoading}
        />
        <label
          htmlFor="isContinuous"
          className="cursor-pointer text-sm text-slate-700"
        >
          要求连续达成
          <span className="ml-1 text-xs text-slate-400">(中断则重新计算)</span>
        </label>
      </div>

      {/* 提交按钮 */}
      <div className="flex gap-3 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            取消
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "保存中..." : "保存徽章模板"}
        </button>
      </div>
    </form>
  )
}

// 导出类型和组件
export type { MedalTemplateFormProps }
export { validateName, validateThresholdCounts }
