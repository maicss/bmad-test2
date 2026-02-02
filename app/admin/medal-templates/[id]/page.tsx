"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Pencil, Trash2, Award, Target, CheckCircle } from "lucide-react";
import type { MedalTemplateResponse, MedalBorderStyle } from "@/types/medal";
import * as Icons from "lucide-react";

const BORDER_STYLE_MAP: Record<MedalBorderStyle, { label: string; icon: string }> = {
  circle: { label: "圆形", icon: "Circle" },
  square: { label: "正方形", icon: "Square" },
  hexagon: { label: "六边形", icon: "Hexagon" },
};

const LEVEL_MODE_MAP = {
  single: "单等级",
  multiple: "多等级",
};

function getIconComponent(name: string): React.ComponentType<{ className?: string; style?: React.CSSProperties }> | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icon = (Icons as unknown as Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>>)[name];
  return Icon || null;
}

export default function MedalTemplateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [template, setTemplate] = useState<MedalTemplateResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [templateId, setTemplateId] = useState<string>("");

  useEffect(() => {
    params.then(p => {
      setTemplateId(p.id);
      fetchTemplate(p.id);
    });
  }, [params]);

  const fetchTemplate = async (id: string) => {
    setIsLoading(true);
    try {
      // 先尝试从列表 API 获取
      const response = await fetch("/api/admin/medal-templates");
      const data = await response.json();
      if (data.success) {
        const found = data.data.find((t: MedalTemplateResponse) => t.id === id);
        if (found) {
          setTemplate(found);
        } else {
          console.error("Template not found");
        }
      }
    } catch (error) {
      console.error("Failed to fetch medal template:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("确定要删除这个徽章模板吗？此操作不可恢复。")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/medal-templates/${templateId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/admin/medal-templates");
      } else {
        const data = await response.json();
        alert(data.message || "删除失败");
      }
    } catch (error) {
      console.error("Failed to delete medal template:", error);
      alert("删除失败");
    }
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
          <p className="text-muted-foreground">徽章模板不存在</p>
          <Link href="/admin/medal-templates">
            <Button variant="outline" className="mt-4">
              返回列表
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const IconComponent = template.icon.type === "lucide" 
    ? getIconComponent(template.icon.value)
    : null;
  const borderStyle = BORDER_STYLE_MAP[template.borderStyle];

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/medal-templates">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">徽章模板详情</h1>
            <p className="text-muted-foreground">查看和管理徽章模板</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/medal-templates/${templateId}/edit`}>
            <Button variant="outline" className="flex items-center gap-2">
              <Pencil className="h-4 w-4" />
              编辑
            </Button>
          </Link>
          <Button variant="destructive" onClick={handleDelete} className="flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            删除
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* 基本信息卡片 */}
        <Card>
          <CardHeader>
            <div className="flex items-start gap-4">
              {/* 徽章预览 */}
              <div 
                className="h-20 w-20 flex items-center justify-center"
                style={{ 
                  backgroundColor: template.icon.type === "lucide" 
                    ? (template.icon.color || "#64748B") + "20"
                    : "#F1F5F9",
                  border: `3px solid ${template.icon.type === "lucide" 
                    ? (template.icon.color || "#64748B")
                    : "#CBD5E1"}`,
                  borderRadius: template.borderStyle === "square" ? "12px" 
                    : template.borderStyle === "hexagon" ? "8px" 
                    : "50%",
                }}
              >
                {template.icon.type === "custom" ? (
                  <img 
                    src={template.icon.value} 
                    alt={template.name}
                    className="h-10 w-10 object-contain"
                  />
                ) : IconComponent ? (
                  <IconComponent 
                    className="h-10 w-10"
                    style={{ color: template.icon.color || "#64748B" }}
                  />
                ) : (
                  <Award className="h-10 w-10 text-slate-400" />
                )}
              </div>
              <div className="flex-1">
                <CardTitle className="text-xl">{template.name}</CardTitle>
                <CardDescription className="mt-1">
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={template.isActive ? "default" : "secondary"}>
                      {template.isActive ? "启用" : "禁用"}
                    </Badge>
                    <Badge variant="outline">
                      {LEVEL_MODE_MAP[template.levelMode]}
                    </Badge>
                    <Badge variant="outline">
                      {borderStyle.label}
                    </Badge>
                  </div>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">图标类型</label>
                <p className="font-medium">{template.icon.type === "lucide" ? "Lucide 图标" : "自定义图片"}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">边框风格</label>
                <p className="font-medium">{borderStyle.label}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">等级模式</label>
                <p className="font-medium">{LEVEL_MODE_MAP[template.levelMode]}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">是否连续</label>
                <p className="font-medium">{template.isContinuous ? "是" : "否"}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">奖励积分</label>
                <p className="font-medium">{template.rewardPoints || 0} 分</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 等级配置 */}
        {template.tiers && template.tiers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                等级配置
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {template.tiers.map((tier, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg"
                  >
                    <div 
                      className="h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                      style={{ backgroundColor: tier.color }}
                    >
                      L{tier.level}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{tier.name}</p>
                      <p className="text-sm text-muted-foreground">
                        需要达成 {tier.threshold} 次
                      </p>
                    </div>
                    <CheckCircle className="h-5 w-5 text-slate-400" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
