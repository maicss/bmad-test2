/**
 * IconPicker - 图标选择组件
 * 
 * 功能：
 * - 全量 Lucide 图标选择
 * - 支持搜索过滤
 * - 支持颜色选择
 * - 参考: https://www.shadcnblocks.com/component/emoji-picker/emoji-picker-basic
 */

"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { Search, X, Check } from "lucide-react"
import { cn } from "@/lib/utils"

// 导入所有 Lucide 图标
import * as Icons from "lucide-react"

// ============================================================
// 图标列表配置
// ============================================================

/**
 * 常用的 Lucide 图标名称列表
 * 从 lucide-react 库中筛选出适合作为徽章/成就的图标
 */
const MEDAL_ICON_NAMES = [
  // 成就/奖励类
  "Trophy", "Medal", "Award", "Star", "Crown", "Gem", "Diamond", "Target", "Flag",
  "Bookmark", "Heart", "Sparkles", "Zap", "Flame", "Sun", "Moon", "Cloud", "Rainbow",
  // 学习/智慧类
  "BookOpen", "Book", "GraduationCap", "Brain", "Lightbulb", "Telescope", "Microscope",
  "Rocket", "Plane", "Globe", "Map", "Compass", "Navigation", "Anchor",
  // 运动/活动类
  "Bike", "Footprints", "Mountain", "Trees", "Flower", "Flower2", "Leaf", "Sprout",
  // 艺术/创意类
  "Palette", "Paintbrush", "Music", "Mic", "Camera", "Image", "Video", "Clapperboard",
  // 科技/工具类
  "Cpu", "Code", "Terminal", "Wifi", "Bluetooth", "Battery", "Plug", "Settings",
  // 社交/情感类
  "ThumbsUp", "Smile", "Laugh", "Clover", "Gift", "PartyPopper", "Balloon",
  // 动物/自然类
  "Cat", "Dog", "Bird", "Fish", "Bug", "Butterfly", "Apple", "Carrot", "Cherry",
  // 其他
  "Shield", "Key", "Lock", "Unlock", "Eye", "EyeOff", "Bell", "Calendar", "Clock",
  "Hourglass", "Timer", "Wallet", "CreditCard", "Banknote", "Coins", "Receipt",
  "ShoppingCart", "Package", "Truck", "Home", "Building", "Castle", "Church",
  "School", "Hospital", "Factory", "Warehouse", "Store", "Hotel", "Landmark",
  "Monument", "Theater", "Stadium", "Dumbbell", "Tent", "TreePine", "TreeDeciduous",
  "PalmTree", "Cactus", "Rose", "Grape", "Citrus", "Banana",
  "Pizza", "Burger", "IceCream", "Cookie", "Candy", "Chocolate", "Coffee", "Tea",
  "Beer", "Wine", "Cocktail", "CupSoda", "Milk", "Egg", "Beef", "Drumstick",
  "Cupcake", "Donut", "Lollipop", "Popsicle",
] as const

type IconName = typeof MEDAL_ICON_NAMES[number]

// 预设颜色选项
const PRESET_COLORS = [
  { name: "红色", value: "#EF4444", class: "bg-red-500" },
  { name: "橙色", value: "#F97316", class: "bg-orange-500" },
  { name: "琥珀色", value: "#F59E0B", class: "bg-amber-500" },
  { name: "黄色", value: "#EAB308", class: "bg-yellow-500" },
  { name: "青柠色", value: "#84CC16", class: "bg-lime-500" },
  { name: "绿色", value: "#22C55E", class: "bg-green-500" },
  { name: "翠绿色", value: "#10B981", class: "bg-emerald-500" },
  { name: "青色", value: "#06B6D4", class: "bg-cyan-500" },
  { name: "天蓝色", value: "#0EA5E9", class: "bg-sky-500" },
  { name: "蓝色", value: "#3B82F6", class: "bg-blue-500" },
  { name: "靛蓝色", value: "#6366F1", class: "bg-indigo-500" },
  { name: "紫罗兰", value: "#8B5CF6", class: "bg-violet-500" },
  { name: "紫色", value: "#A855F7", class: "bg-purple-500" },
  { name: "洋红色", value: "#D946EF", class: "bg-fuchsia-500" },
  { name: "粉色", value: "#EC4899", class: "bg-pink-500" },
  { name: "玫瑰色", value: "#FB7185", class: "bg-rose-500" },
  { name: "石板色", value: "#64748B", class: "bg-slate-500" },
  { name: "灰色", value: "#6B7280", class: "bg-gray-500" },
  { name: "锌色", value: "#71717A", class: "bg-zinc-500" },
  { name: "中性色", value: "#737373", class: "bg-neutral-500" },
  { name: "石头色", value: "#78716C", class: "bg-stone-500" },
  { name: "黑色", value: "#000000", class: "bg-black" },
] as const

// ============================================================
// 类型定义
// ============================================================

interface IconPickerProps {
  value?: { name: IconName; color: string }
  onChange?: (value: { name: IconName; color: string }) => void
  disabled?: boolean
  borderStyle?: "circle" | "square" | "hexagon"
}

interface IconPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (icon: IconName, color: string) => void
  selectedIcon?: IconName
  selectedColor?: string
}

// ============================================================
// 辅助函数
// ============================================================

/**
 * 获取图标组件
 */
function getIconComponent(name: IconName): React.ComponentType<{ className?: string; style?: React.CSSProperties }> | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icon = (Icons as unknown as Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>>)[name]
  return Icon || null
}

/**
 * 根据搜索词过滤图标
 */
function filterIcons(searchTerm: string): IconName[] {
  if (!searchTerm.trim()) return [...MEDAL_ICON_NAMES]
  const term = searchTerm.toLowerCase()
  return MEDAL_ICON_NAMES.filter(name => name.toLowerCase().includes(term))
}

// ============================================================
// 图标选择对话框组件
// ============================================================

function IconPickerDialog({
  open,
  onOpenChange,
  onSelect,
  selectedIcon,
  selectedColor = "#3B82F6",
}: IconPickerDialogProps) {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [currentColor, setCurrentColor] = React.useState(selectedColor)
  const [tempSelectedIcon, setTempSelectedIcon] = React.useState<IconName | undefined>(selectedIcon)

  // 重置状态当对话框打开时
  React.useEffect(() => {
    if (open) {
      setSearchTerm("")
      setCurrentColor(selectedColor || "#3B82F6")
      setTempSelectedIcon(selectedIcon)
    }
  }, [open, selectedIcon, selectedColor])

  const filteredIcons = React.useMemo(() => filterIcons(searchTerm), [searchTerm])

  const handleConfirm = () => {
    if (tempSelectedIcon) {
      onSelect(tempSelectedIcon, currentColor)
    }
    onOpenChange(false)
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-xl border bg-white p-0 shadow-xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          {/* 头部 */}
          <div className="flex items-center justify-between border-b p-4">
            <DialogPrimitive.Title className="text-lg font-semibold">
              选择图标
            </DialogPrimitive.Title>
            <DialogPrimitive.Close className="rounded-full p-1 hover:bg-slate-100">
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>

          {/* 搜索框 */}
          <div className="border-b p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="搜索图标..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* 颜色选择 */}
          <div className="border-b p-4">
            <label className="mb-2 block text-xs font-medium text-slate-500">
              选择颜色
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setCurrentColor(color.value)}
                  className={cn(
                    "relative h-8 w-8 rounded-full transition-all",
                    color.class,
                    currentColor === color.value
                      ? "ring-2 ring-offset-2 ring-blue-500 scale-110"
                      : "hover:scale-105"
                  )}
                  title={color.name}
                >
                  {currentColor === color.value && (
                    <Check className="absolute inset-0 m-auto h-4 w-4 text-white" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 图标网格 */}
          <div className="max-h-[320px] overflow-y-auto p-4">
            <div className="grid grid-cols-6 gap-2">
              {filteredIcons.map((iconName) => {
                const Icon = getIconComponent(iconName)
                if (!Icon) return null
                return (
                  <button
                    key={iconName}
                    onClick={() => setTempSelectedIcon(iconName)}
                    className={cn(
                      "flex aspect-square items-center justify-center rounded-lg border transition-all",
                      tempSelectedIcon === iconName
                        ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500/20"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    )}
                    title={iconName}
                  >
                    <Icon
                      className="h-6 w-6"
                      style={{ color: currentColor }}
                    />
                  </button>
                )
              })}
            </div>
            {filteredIcons.length === 0 && (
              <div className="py-8 text-center text-sm text-slate-500">
                未找到匹配的图标
              </div>
            )}
          </div>

          {/* 底部操作 */}
          <div className="flex items-center justify-end gap-2 border-t p-4">
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              取消
            </button>
            <button
              onClick={handleConfirm}
              disabled={!tempSelectedIcon}
              className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              确认
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

// ============================================================
// 主组件
// ============================================================

export function IconPicker({
  value,
  onChange,
  disabled = false,
  borderStyle = "circle",
}: IconPickerProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (iconName: IconName, color: string) => {
    onChange?.({ name: iconName, color })
    setOpen(false)
  }

  const SelectedIcon = value?.name ? getIconComponent(value.name) : null

  // 根据边框风格获取样式
  const getBorderStyleClass = () => {
    switch (borderStyle) {
      case "circle":
        return "rounded-full"
      case "square":
        return "rounded-lg"
      case "hexagon":
        return "rounded-md"
      default:
        return "rounded-full"
    }
  }

  // 六边形SVG边框组件
  const HexagonBorder = ({ children }: { children: React.ReactNode }) => (
    <div className="relative h-32 w-32">
      {/* SVG边框层 */}
      <svg 
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <polygon
          points="50,2 96,25 96,75 50,98 4,75 4,25"
          fill={value ? "#EFF6FF" : "#F1F5F9"}
          stroke={value ? "#3B82F6" : "#CBD5E1"}
          strokeWidth="3"
        />
      </svg>
      {/* 内容层 */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  )

  // 非六边形时的按钮样式
  const buttonClassName = cn(
    "flex h-32 w-32 items-center justify-center border-2 border-slate-300 bg-slate-100 transition-all",
    getBorderStyleClass(),
    value && "border-blue-500 bg-blue-50",
    disabled && "cursor-not-allowed opacity-50"
  )

  const buttonContent = SelectedIcon ? (
    <SelectedIcon
      className="h-16 w-16"
      style={{ color: value?.color || "#3B82F6" }}
    />
  ) : (
    <div className="flex flex-col items-center gap-1 text-slate-400">
      <Search className="h-8 w-8" />
      <span className="text-xs">选择图标</span>
    </div>
  )

  return (
    <>
      {borderStyle === "hexagon" ? (
        <button
          type="button"
          onClick={() => !disabled && setOpen(true)}
          disabled={disabled}
          className={cn("p-0 border-0 bg-transparent", disabled && "cursor-not-allowed opacity-50")}
        >
          <HexagonBorder>
            {buttonContent}
          </HexagonBorder>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => !disabled && setOpen(true)}
          disabled={disabled}
          className={buttonClassName}
        >
          {buttonContent}
        </button>
      )}

      <IconPickerDialog
        open={open}
        onOpenChange={setOpen}
        onSelect={handleSelect}
        selectedIcon={value?.name}
        selectedColor={value?.color}
      />
    </>
  )
}

// 导出类型和常量
export { MEDAL_ICON_NAMES, PRESET_COLORS }
export type { IconName }
