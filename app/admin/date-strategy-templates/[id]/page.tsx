"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect } from "@/components/searchable-select";
import { MultiSelectCalendar } from "@/components/multi-select-calendar";
import { redirectToLogin } from "@/lib/api-client";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Calendar,
  MapPin,
  Globe,
  Loader2,
  AlertTriangle,
} from "lucide-react";

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

interface DateStrategyTemplateDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function DateStrategyTemplateDetailPage({
  params,
}: DateStrategyTemplateDetailPageProps) {
  const router = useRouter();
  const [template, setTemplate] = useState<DateStrategyTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [templateId, setTemplateId] = useState<string>("");

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
    const loadParams = async () => {
      const { id } = await params;
      setTemplateId(id);
    };
    loadParams();
  }, [params]);

  useEffect(() => {
    if (templateId) {
      fetchTemplate();
    }
  }, [templateId]);

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
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/admin/date-strategy-templates/${templateId}`,
      );

      // Handle 401 Unauthorized
      if (response.status === 401) {
        redirectToLogin(`/admin/date-strategy-templates/${templateId}`);
        return;
      }

      // Handle 403 Forbidden - redirect to parent home
      if (response.status === 403) {
        router.push("/parent");
        return;
      }

      const data = await response.json();
      if (data.success) {
        setTemplate(data.data.template);
      } else {
        setError(data.error?.message || "加载失败");
      }
    } catch (error) {
      console.error("Failed to fetch template:", error);
      setError("加载失败，请重试");
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

      // Normalize and deduplicate dates
      if (dateMode === "input") {
        const normalizedDates = dates
          .split(",")
          .map((d) => d.trim())
          .filter((d) => d)
          .map((d) => {
            // Normalize date format from 2026-2-9 to 2026-02-09
            const match = d.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
            if (!match) return null;
            const [, y, m, day] = match;
            const monthInt = parseInt(m, 10);
            const dayInt = parseInt(day, 10);
            if (monthInt < 1 || monthInt > 12 || dayInt < 1 || dayInt > 31)
              return null;
            return `${y}-${monthInt.toString().padStart(2, "0")}-${dayInt.toString().padStart(2, "0")}`;
          })
          .filter((d): d is string => d !== null);
        dates = [...new Set(normalizedDates)].join(",");
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

      // Handle 401 Unauthorized
      if (response.status === 401) {
        redirectToLogin(`/admin/date-strategy-templates/${templateId}`);
        return;
      }

      // Handle 403 Forbidden - redirect to parent home
      if (response.status === 403) {
        router.push("/parent");
        return;
      }

      const data = await response.json();

      if (data.success) {
        setIsEditing(false);
        setShowConfirm(false);
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

      // Handle 401 Unauthorized
      if (response.status === 401) {
        redirectToLogin(`/admin/date-strategy-templates/${templateId}`);
        return;
      }

      // Handle 403 Forbidden - redirect to parent home
      if (response.status === 403) {
        router.push("/parent");
        return;
      }

      const data = await response.json();

      if (data.success) {
        router.push("/admin/date-strategy-templates");
      } else {
        setError(data.error?.message || "删除失败");
      }
    } catch (error) {
      setError("删除失败，请重试");
    }
  };

  const handleCancel = () => {
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
    setIsEditing(false);
    setShowConfirm(false);
    setError("");
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">模板不存在</p>
          <Link href="/admin/date-strategy-templates">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回列表
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/date-strategy-templates">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">日期策略模板详情</h1>
            <p className="text-muted-foreground">查看和管理模板信息</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={template.copy_count > 0 ? "secondary" : "outline"}>
            复制次数: {template.copy_count || 0}
          </Badge>
          {!isEditing && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="h-4 w-4 mr-1" />
                编辑
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDelete}
                disabled={template.copy_count > 0}
                className="text-red-500 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                删除
              </Button>
            </>
          )}
        </div>
      </div>

      {showConfirm && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
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

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            基本信息
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>名称</Label>
            <Input
              value={name}
              onChange={(e) => isEditing && setName(e.target.value)}
              disabled={!isEditing}
              placeholder="请输入策略名称"
            />
          </div>

          <div className="space-y-2">
            <Label>描述</Label>
            <Textarea
              value={description}
              onChange={(e) => isEditing && setDescription(e.target.value)}
              disabled={!isEditing}
              placeholder="请输入策略描述"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                区域
              </Label>
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
                min="2000"
                max="2100"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => isEditing && setIsPublic(e.target.checked)}
              disabled={!isEditing}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label className="flex items-center gap-1">
              <Globe className="h-4 w-4" />
              公开
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            日期设置
            <span className="text-sm font-normal text-muted-foreground ml-2">
              (共 {template.dates.split(",").filter((d) => d).length} 个日期)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                  year={parseInt(year) || new Date().getFullYear()}
                />
              ) : (
                <Textarea
                  value={dateInput}
                  onChange={(e) => setDateInput(e.target.value)}
                  placeholder="请输入日期，多个日期用逗号分隔，格式：2024-01-01,2024-2-9,2026-12-25"
                  rows={5}
                  className="max-h-40 overflow-y-auto"
                />
              )}
            </div>
          ) : (
            <MultiSelectCalendar
              selectedDates={template.dates.split(",").filter((d) => d)}
              onChange={() => {}}
              year={parseInt(year) || new Date().getFullYear()}
              readOnly
            />
          )}
        </CardContent>
      </Card>

      {isEditing && !showConfirm && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleCancel}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "保存中..." : "保存"}
          </Button>
        </div>
      )}
    </div>
  );
}
