"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { IconPicker } from "@/components/icon-picker";
import { ImageUploader } from "@/components/image-uploader";
import type { MedalIconValue } from "@/types/medal";
import { ImageIcon, Type } from "lucide-react";
import { cn } from "@/lib/utils";

interface WishTemplateFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: {
    name: string;
    description: string;
    type: "item" | "activity";
    points_required: number;
    icon_type: string | null;
    icon_value: string | null;
    icon_color: string | null;
    border_style: string | null;
    due_date: string | null;
    is_active: number;
  };
}

type ImagePickerTab = "icon" | "upload";

export function WishTemplateForm({
  onSuccess,
  onCancel,
  initialData,
}: WishTemplateFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(
    initialData?.description || "",
  );
  const [type, setType] = useState<"item" | "activity">(
    initialData?.type || "item",
  );
  const [pointsRequired, setPointsRequired] = useState(
    initialData?.points_required?.toString() || "",
  );
  const [dueDate, setDueDate] = useState(initialData?.due_date || "");
  const [isActive, setIsActive] = useState(
    initialData?.is_active === 1 ? true : true,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [iconValue, setIconValue] = useState<MedalIconValue | undefined>(
    initialData?.icon_type
      ? {
          type: initialData.icon_type === "lucide" ? "icon" : "upload",
          value: initialData.icon_value || "",
          color: initialData.icon_color || undefined,
        }
      : undefined,
  );
  const [activeTab, setActiveTab] = useState<ImagePickerTab>(
    iconValue?.type === "upload" ? "upload" : "icon",
  );

  const validateForm = () => {
    if (!name || name.length < 2 || name.length > 50) {
      setError("名称需2-50个字符");
      return false;
    }
    if (
      !pointsRequired ||
      isNaN(Number(pointsRequired)) ||
      Number(pointsRequired) <= 0
    ) {
      setError("需要分数必填且必须大于0");
      return false;
    }
    return true;
  };

  const handleIconSelect = (iconData: { name: string; color: string }) => {
    setIconValue({
      type: "icon",
      value: iconData.name,
      color: iconData.color,
    });
  };

  const handleImageUpload = (url: string | null) => {
    if (url) {
      setIconValue({
        type: "upload",
        value: url,
      });
    } else {
      setIconValue({
        type: "icon",
        value: "Star",
        color: "#3B82F6",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError("");

    const payload = {
      name,
      description,
      type,
      pointsRequired: Number(pointsRequired),
      iconType: iconValue?.type === "icon" ? "lucide" : "custom",
      iconValue: iconValue?.value || null,
      iconColor: iconValue?.color || null,
      borderStyle: "circle",
      dueDate: dueDate || null,
      isActive,
    };

    try {
      const url = initialData
        ? `/api/admin/wish-templates/${new URLSearchParams(window.location.search).get("id")}`
        : "/api/admin/wish-templates";

      const method = initialData ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess?.();
      } else {
        setError(data.error?.message || initialData ? "更新失败" : "创建失败");
      }
    } catch (error) {
      setError(initialData ? "更新失败，请重试" : "创建失败，请重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 max-h-[80vh] overflow-y-auto pr-2"
    >
      <div className="space-y-2">
        <Label htmlFor="name">名称 * (2-50字符)</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="输入愿望名称"
          minLength={2}
          maxLength={50}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">描述</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="输入愿望描述"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">类型 *</Label>
        <select
          id="type"
          value={type}
          onChange={(e) => setType(e.target.value as "item" | "activity")}
          className="w-full h-10 px-3 py-2 border border-input rounded-md text-sm"
          required
        >
          <option value="item">物品</option>
          <option value="activity">活动</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pointsRequired">需要分数 *</Label>
        <Input
          id="pointsRequired"
          type="number"
          min="0.01"
          step="0.01"
          value={pointsRequired}
          onChange={(e) => setPointsRequired(e.target.value)}
          placeholder="输入所需积分"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dueDate">截止日期 (可选)</Label>
        <Input
          id="dueDate"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="isActive"
          checked={isActive}
          onCheckedChange={(checked) => setIsActive(checked === true)}
        />
        <Label htmlFor="isActive" className="cursor-pointer">
          激活
        </Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="image">图标/图片 (可选)</Label>
        <div className="space-y-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("icon")}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-all",
                activeTab === "icon"
                  ? "border-blue-500 bg-blue-50 text-blue-600"
                  : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50",
              )}
            >
              <Type className="h-4 w-4" />
              图标库
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("upload")}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-all",
                activeTab === "upload"
                  ? "border-blue-500 bg-blue-50 text-blue-600"
                  : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50",
              )}
            >
              <ImageIcon className="h-4 w-4" />
              上传图片
            </button>
          </div>

          <div className="pt-2">
            {activeTab === "icon" && (
              <div className="flex flex-col items-center gap-2">
                <IconPicker
                  value={
                    iconValue?.type === "icon"
                      ? {
                          name: iconValue.value as any,
                          color: iconValue.color || "#3B82F6",
                        }
                      : undefined
                  }
                  borderStyle="circle"
                  onChange={handleIconSelect}
                />
                <span className="text-xs text-slate-500">
                  点击选择 Lucide 图标
                </span>
              </div>
            )}

            {activeTab === "upload" && (
              <div className="flex flex-col items-center gap-2">
                <ImageUploader
                  value={iconValue?.type === "upload" ? iconValue.value : null}
                  onChange={handleImageUpload}
                  borderStyle="circle"
                />
                <span className="text-xs text-slate-500">
                  支持 JPG、PNG、GIF、WebP、SVG
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-2 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? initialData
              ? "保存中..."
              : "创建中..."
            : initialData
              ? "保存"
              : "创建"}
        </Button>
      </div>
    </form>
  );
}
