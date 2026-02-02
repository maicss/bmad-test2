/**
 * BorderPreview - 边框预览组件
 *
 * 功能：
 * - 支持圆形、正六边形、正方形三种边框风格
 * - 统一的 avatar 尺寸外观
 * - 支持图标或图片内容预览
 *
 * 参考 Ingress 徽章风格设计
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { MedalBorderStyle, MedalIconValue } from "@/types/medal";
import * as Icons from "lucide-react";

// ============================================================
// 类型定义
// ============================================================

interface BorderPreviewProps {
  icon?: MedalIconValue;
  borderStyle: MedalBorderStyle;
  size?: "sm" | "md" | "lg";
  className?: string;
  tierColor?: string; // 等级颜色，用于边框着色
}

// ============================================================
// 辅助函数
// ============================================================

/**
 * 获取图标组件
 */
function getIconComponent(
  name: string,
): React.ComponentType<{
  className?: string;
  style?: React.CSSProperties;
}> | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icon = (
    Icons as unknown as Record<
      string,
      React.ComponentType<{ className?: string; style?: React.CSSProperties }>
    >
  )[name];
  return Icon || null;
}

/**
 * 获取尺寸配置
 */
function getSizeConfig(size: "sm" | "md" | "lg") {
  const configs = {
    sm: {
      container: "h-12 w-12",
      icon: "h-6 w-6",
      borderWidth: "border-2",
    },
    md: {
      container: "h-20 w-20",
      icon: "h-10 w-10",
      borderWidth: "border-[3px]",
    },
    lg: {
      container: "h-32 w-32",
      icon: "h-16 w-16",
      borderWidth: "border-4",
    },
  };
  return configs[size];
}

// ============================================================
// 六边形 SVG 路径组件
// ============================================================

function HexagonSVG({
  className,
  borderColor,
  borderWidth,
  children,
}: {
  className?: string;
  borderColor: string;
  borderWidth: string;
  children: React.ReactNode;
}) {
  const bw = parseInt(borderWidth.replace(/[^0-9]/g, "")) || 3;

  return (
    <div className={cn("relative", className)}>
      {/* 六边形边框 SVG */}
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full"
        style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" }}
      >
        <polygon
          points="50,3 93,25 93,75 50,97 7,75 7,25"
          fill="none"
          stroke={borderColor}
          strokeWidth={bw}
          strokeLinejoin="round"
        />
      </svg>
      {/* 内容区域 */}
      <div className="relative z-10 flex h-full w-full items-center justify-center">
        {children}
      </div>
    </div>
  );
}

// ============================================================
// 圆形预览组件
// ============================================================

function CirclePreview({
  icon,
  size,
  borderColor,
}: {
  icon?: MedalIconValue;
  size: "sm" | "md" | "lg";
  borderColor: string;
}) {
  const sizeConfig = getSizeConfig(size);
  const IconComponent =
    icon?.type === "lucide" ? getIconComponent(icon.value) : null;

  return (
    <div
      className={cn(
        "flex items-center justify-center overflow-hidden rounded-full bg-slate-50",
        sizeConfig.container,
        sizeConfig.borderWidth,
        "border-solid",
      )}
      style={{ borderColor }}
    >
      {icon?.type === "custom" ? (
        <img
          src={icon.value}
          alt="Medal icon"
          className={cn("object-contain", sizeConfig.icon)}
        />
      ) : IconComponent ? (
        <IconComponent
          className={sizeConfig.icon}
          style={{ color: icon?.color || "#64748B" }}
        />
      ) : (
        <div className={cn("rounded-full bg-slate-200", sizeConfig.icon)} />
      )}
    </div>
  );
}

// ============================================================
// 正方形预览组件
// ============================================================

function SquarePreview({
  icon,
  size,
  borderColor,
}: {
  icon?: MedalIconValue;
  size: "sm" | "md" | "lg";
  borderColor: string;
}) {
  const sizeConfig = getSizeConfig(size);
  const IconComponent =
    icon?.type === "lucide" ? getIconComponent(icon.value) : null;

  return (
    <div
      className={cn(
        "flex items-center justify-center overflow-hidden rounded-lg bg-slate-50",
        sizeConfig.container,
        sizeConfig.borderWidth,
        "border-solid",
      )}
      style={{ borderColor }}
    >
      {icon?.type === "custom" ? (
        <img
          src={icon.value}
          alt="Medal icon"
          className={cn("object-contain", sizeConfig.icon)}
        />
      ) : IconComponent ? (
        <IconComponent
          className={sizeConfig.icon}
          style={{ color: icon?.color || "#64748B" }}
        />
      ) : (
        <div className={cn("rounded bg-slate-200", sizeConfig.icon)} />
      )}
    </div>
  );
}

// ============================================================
// 六边形预览组件
// ============================================================

function HexagonPreview({
  icon,
  size,
  borderColor,
}: {
  icon?: MedalIconValue;
  size: "sm" | "md" | "lg";
  borderColor: string;
}) {
  const sizeConfig = getSizeConfig(size);
  const IconComponent =
    icon?.type === "lucide" ? getIconComponent(icon.value) : null;

  // 六边形尺寸需要稍微调整以匹配视觉大小
  const hexSizeClass = {
    sm: "h-14 w-14",
    md: "h-24 w-24",
    lg: "h-36 w-36",
  }[size];

  return (
    <HexagonSVG
      className={hexSizeClass}
      borderColor={borderColor}
      borderWidth={sizeConfig.borderWidth}
    >
      {icon?.type === "custom" ? (
        <img
          src={icon.value}
          alt="Medal icon"
          className={cn("object-contain", sizeConfig.icon)}
        />
      ) : IconComponent ? (
        <IconComponent
          className={sizeConfig.icon}
          style={{ color: icon?.color || "#64748B" }}
        />
      ) : (
        <div className={cn("rounded bg-slate-200", sizeConfig.icon)} />
      )}
    </HexagonSVG>
  );
}

// ============================================================
// 主组件
// ============================================================

export function BorderPreview({
  icon,
  borderStyle,
  size = "md",
  className,
  tierColor,
}: BorderPreviewProps) {
  // 使用传入的颜色或默认使用 slate-400
  const borderColor = tierColor || "#94A3B8";

  return (
    <div className={cn("flex items-center justify-center", className)}>
      {borderStyle === "circle" && (
        <CirclePreview icon={icon} size={size} borderColor={borderColor} />
      )}
      {borderStyle === "square" && (
        <SquarePreview icon={icon} size={size} borderColor={borderColor} />
      )}
      {borderStyle === "hexagon" && (
        <HexagonPreview icon={icon} size={size} borderColor={borderColor} />
      )}
    </div>
  );
}

// ============================================================
// 边框风格选择器组件
// ============================================================

interface BorderStyleSelectorProps {
  value: MedalBorderStyle;
  onChange: (style: MedalBorderStyle) => void;
  disabled?: boolean;
}

const BORDER_STYLE_OPTIONS: {
  value: MedalBorderStyle;
  label: string;
  icon: string;
}[] = [
  { value: "circle", label: "圆形", icon: "Circle" },
  { value: "hexagon", label: "六边形", icon: "Hexagon" },
  { value: "square", label: "正方形", icon: "Square" },
];

export function BorderStyleSelector({
  value,
  onChange,
  disabled = false,
}: BorderStyleSelectorProps) {
  return (
    <div className="flex gap-2">
      {BORDER_STYLE_OPTIONS.map((option) => {
        const Icon = getIconComponent(option.icon);
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            disabled={disabled}
            className={cn(
              "flex flex-col items-center gap-1 rounded-lg border px-3 py-2 transition-all",
              value === option.value
                ? "border-blue-500 bg-blue-50 text-blue-600"
                : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50",
              disabled && "cursor-not-allowed opacity-50",
            )}
          >
            {Icon && <Icon className="h-5 w-5" />}
            <span className="text-xs">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// 导出类型
export type { BorderPreviewProps, BorderStyleSelectorProps };
