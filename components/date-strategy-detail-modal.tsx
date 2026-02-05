"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Loader2, Pencil, Trash2 } from "lucide-react";
import { SearchableSelect } from "@/components/searchable-select";
import { MultiSelectCalendar } from "@/components/multi-select-calendar";

const PROVINCES = [
  { id: "000000", label: "全国" },
  { id: "110000", label: "北京市" },
  { id: "120000", label: "天津市" },
  { id: "130000", label: "河北省" },
  { id: "140000", label: "山西省" },
  { id: "150000", label: "内蒙古自治区" },
  { id: "210000", label: "辽宁省" },
  { id: "220000", label: "吉林省" },
  { id: "230000", label: "黑龙江省" },
  { id: "310000", label: "上海市" },
  { id: "320000", label: "江苏省" },
  { id: "330000", label: "浙江省" },
  { id: "340000", label: "安徽省" },
  { id: "350000", label: "福建省" },
  { id: "360000", label: "江西省" },
  { id: "370000", label: "山东省" },
  { id: "410000", label: "河南省" },
  { id: "420000", label: "湖北省" },
  { id: "430000", label: "湖南省" },
  { id: "440000", label: "广东省" },
  { id: "450000", label: "广西壮族自治区" },
  { id: "460000", label: "海南省" },
  { id: "500000", label: "重庆市" },
  { id: "510000", label: "四川省" },
  { id: "520000", label: "贵州省" },
  { id: "530000", label: "云南省" },
  { id: "540000", label: "西藏自治区" },
  { id: "610000", label: "陕西省" },
  { id: "620000", label: "甘肃省" },
  { id: "630000", label: "青海省" },
  { id: "640000", label: "宁夏回族自治区" },
  { id: "650000", label: "新疆维吾尔自治区" },
];

interface DateStrategyTemplate {
  id: string;
  name: string;
  description: string | null;
  region: string;
  year: number;
  is_public: number;
  dates: string;
  copy_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface DateStrategyDetailModalProps {
  templateId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: () => void;
  onDelete?: () => void;
}

export function DateStrategyDetailModal({
  templateId,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
}: DateStrategyDetailModalProps) {
  const [template, setTemplate] = useState<DateStrategyTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [region, setRegion] = useState("000000");
  const [year, setYear] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [dateMode, setDateMode] = useState<"picker" | "input">("picker");
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [dateInput, setDateInput] = useState("");

  useEffect(() => {
    if (open && templateId) {
      fetchTemplate();
    }
  }, [open, templateId]);

  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description || "");
      setRegion(template.region);
      setYear(template.year.toString());
      setIsPublic(template.is_public === 1);

      const dates = template.dates.split(",").filter((d) => d.trim());
      setSelectedDates(dates);
      setDateInput(template.dates);
    }
  }, [template]);

  const fetchTemplate = async () => {
    if (!templateId) return;
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/admin/date-strategy-templates/${templateId}`,
      );
      const data = await response.json();
      if (data.success) {
        setTemplate(data.data.template);
      }
    } catch (error) {
      console.error("Failed to fetch template:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!template) return;

    // Check if referenced
    if (template.copy_count > 0 && !showConfirm) {
      setShowConfirm(true);
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      let dates = dateMode === "picker" ? selectedDates.join(",") : dateInput;

      // Deduplicate
      if (dateMode === "input") {
        const uniqueDates = [
          ...new Set(
            dates
              .split(",")
              .map((d) => d.trim())
              .filter((d) => d),
          ),
        ];
        dates = uniqueDates.join(",");
      }

      const response = await fetch(
        `/api/admin/date-strategy-templates/${templateId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            description,
            region,
            year: parseInt(year),
            isPublic,
            dates,
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        setIsEditing(false);
        setShowConfirm(false);
        onUpdate?.();
        fetchTemplate();
      } else {
        setError(data.error?.message || "更新失败");
      }
    } catch (error) {
      setError("更新失败，请重试");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!template) return;

    if (template.copy_count > 0) {
      setError("无法删除已被复制的模板");
      return;
    }

    if (!confirm("确定要删除此模板吗？")) return;

    try {
      const response = await fetch(
        `/api/admin/date-strategy-templates/${templateId}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (data.success) {
        onOpenChange(false);
        onDelete?.();
      } else {
        setError(data.error?.message || "删除失败");
      }
    } catch (error) {
      setError("删除失败，请重试");
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="sr-only">加载中...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>日期策略模板详情</span>
            <div className="flex items-center gap-2">
              <Badge
                variant={template.copy_count > 0 ? "secondary" : "outline"}
              >
                复制次数: {template.copy_count || 0}
              </Badge>
              {!isEditing && (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleDelete}
                    disabled={template.copy_count > 0}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        {showConfirm && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-900">确认更新</p>
                <p className="text-sm text-yellow-700 mt-1">
                  此规则已被复制 {template.copy_count} 次，确认更新吗？
                </p>
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowConfirm(false)}
                  >
                    取消
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={isSaving}>
                    确认更新
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>名称</Label>
            <Input
              value={name}
              onChange={(e) => isEditing && setName(e.target.value)}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label>描述</Label>
            <Textarea
              value={description}
              onChange={(e) => isEditing && setDescription(e.target.value)}
              disabled={!isEditing}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>区域</Label>
              {isEditing ? (
                <SearchableSelect
                  options={PROVINCES}
                  value={region}
                  onChange={setRegion}
                  placeholder="选择区域"
                  width="100%"
                />
              ) : (
                <Input
                  value={
                    PROVINCES.find((p) => p.id === region)?.label || region
                  }
                  disabled
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>年份</Label>
              <Input
                type="number"
                value={year}
                onChange={(e) => isEditing && setYear(e.target.value)}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => isEditing && setIsPublic(e.target.checked)}
              disabled={!isEditing}
              className="h-4 w-4"
            />
            <Label>公开</Label>
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <Label className="whitespace-nowrap">日期</Label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dateMode === "picker"}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setDateMode("picker");
                          if (dateInput) {
                            const dates = dateInput
                              .split(",")
                              .map((d) => d.trim())
                              .filter((d) => d);
                            setSelectedDates([...new Set(dates)]);
                          }
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span className="text-sm">日期选择</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dateMode === "input"}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setDateMode("input");
                          if (selectedDates.length > 0) {
                            setDateInput(selectedDates.join(","));
                          }
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span className="text-sm">日期输入</span>
                  </label>
                </div>
              </div>

              {dateMode === "picker" ? (
                <MultiSelectCalendar
                  selectedDates={selectedDates}
                  onChange={setSelectedDates}
                  year={parseInt(year)}
                />
              ) : (
                <Textarea
                  value={dateInput}
                  onChange={(e) => setDateInput(e.target.value)}
                  placeholder="逗号分隔的日期"
                  rows={3}
                  className="max-h-40 overflow-y-auto"
                />
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label>日期</Label>
              <div className="flex flex-wrap gap-2">
                {template.dates
                  .split(",")
                  .filter((d) => d)
                  .map((date) => (
                    <Badge key={date} variant="secondary">
                      {date}
                    </Badge>
                  ))}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-2 rounded-md text-sm">
              {error}
            </div>
          )}
        </div>

        {isEditing && !showConfirm && (
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
