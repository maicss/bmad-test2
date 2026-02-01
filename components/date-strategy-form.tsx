"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect } from "@/components/searchable-select";
import { MultiSelectCalendar } from "@/components/multi-select-calendar";

const PROVINCES = [
  { id: "national", label: "全国" },
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

interface DateStrategyFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function DateStrategyForm({ onSuccess, onCancel }: DateStrategyFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [region, setRegion] = useState("national");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [isPublic, setIsPublic] = useState(true);
  const [dateMode, setDateMode] = useState<"picker" | "input">("picker");
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [dateInput, setDateInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState<string>("");

  const deduplicateDates = (datesStr: string): string => {
    const dates = datesStr.split(",").map(d => d.trim()).filter(d => d);
    const uniqueDates = [...new Set(dates)];
    return uniqueDates.join(",");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      let dates = dateMode === "picker" ? selectedDates.join(",") : dateInput;
      
      if (dateMode === "input") {
        dates = deduplicateDates(dates);
      }

      if (!dates) {
        setError("请至少选择一个日期");
        setIsSubmitting(false);
        return;
      }

      const response = await fetch("/api/admin/date-strategy-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          region,
          year: parseInt(year),
          isPublic,
          dates,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess?.();
      } else {
        setError(data.error?.message || "创建失败");
      }
    } catch (error) {
      setError("创建失败，请重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">名称 *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="请输入策略名称"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">描述</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="请输入策略描述"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>区域 *</Label>
          <SearchableSelect
            options={PROVINCES}
            value={region}
            onChange={setRegion}
            placeholder="选择区域"
            width="100%"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="year">年份 *</Label>
          <Input
            id="year"
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            min="2000"
            max="2100"
            required
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isPublic"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300"
        />
        <Label htmlFor="isPublic">公开</Label>
      </div>

       <div className="space-y-3">
        <div className="flex items-center gap-4">
          <Label className="whitespace-nowrap">日期 *</Label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={dateMode === "picker"}
                onChange={(e) => {
                  if (e.target.checked) {
                    setDateMode("picker");
                    if (dateInput) {
                      const dates = dateInput.split(",").map(d => d.trim()).filter(d => d);
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
            placeholder="请输入日期，多个日期用逗号分隔，格式：2024-01-01,2024-02-15"
            rows={3}
            className="max-h-40 overflow-y-auto"
          />
        )}
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
          {isSubmitting ? "创建中..." : "创建"}
        </Button>
      </div>
    </form>
  );
}
