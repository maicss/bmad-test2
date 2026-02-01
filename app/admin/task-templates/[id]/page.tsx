"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Pencil, Trash2, Calendar, Target, Award } from "lucide-react";

interface TaskTemplate {
  id: string;
  name: string;
  template_name: string;
  description: string | null;
  category: string;
  points: number;
  is_active: number;
  start_date: string;
  end_date: string;
  date_strategy_id: string;
  combo_strategy_type: string;
  combo_strategy_config: string;
  badge_id: string | null;
  age_range_min: number | null;
  age_range_max: number | null;
  task_type: string;
  created_at: string;
  updated_at: string;
}

const CATEGORY_MAP: Record<string, string> = {
  study: "学习",
  housework: "家务",
  health: "健康",
  behavior: "行为",
  custom: "其他",
};

export default function TaskTemplateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [template, setTemplate] = useState<TaskTemplate | null>(null);
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
      const response = await fetch(`/api/admin/task-templates/${id}`);
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

  const handleDelete = async () => {
    if (!confirm("确定要删除此模板吗？")) return;

    try {
      const response = await fetch(`/api/admin/task-templates/${templateId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        router.push("/admin/task-templates");
      } else {
        alert(data.error?.message || "删除失败");
      }
    } catch (error) {
      alert("删除失败，请重试");
    }
  };

  const parseComboConfig = () => {
    if (!template?.combo_strategy_config) return null;
    try {
      return JSON.parse(template.combo_strategy_config);
    } catch {
      return null;
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
          <p className="text-muted-foreground">模板不存在</p>
          <Link href="/admin/task-templates">
            <Button variant="outline" className="mt-4">
              返回列表
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const comboConfig = parseComboConfig();

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/task-templates">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{template.template_name || template.name}</h1>
            <p className="text-muted-foreground">任务模板详情</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/admin/task-templates/${templateId}/edit`}>
            <Button variant="outline" className="flex items-center gap-2">
              <Pencil className="h-4 w-4" />
              编辑
            </Button>
          </Link>
          <Button variant="outline" className="flex items-center gap-2 text-red-500" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
            删除
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">模板名称</p>
                <p className="font-medium">{template.template_name || template.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">任务名称</p>
                <p className="font-medium">{template.name}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">分类</p>
                <Badge variant="outline">{CATEGORY_MAP[template.category] || template.category}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">状态</p>
                <Badge variant={template.is_active ? "default" : "secondary"}>
                  {template.is_active ? "启用" : "禁用"}
                </Badge>
              </div>
            </div>
            {template.description && (
              <div>
                <p className="text-sm text-muted-foreground">描述</p>
                <p className="font-medium">{template.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>任务设置</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">基础奖励</p>
                <p className="font-medium flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  {template.points} 积分
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">开始时间</p>
                <p className="font-medium">{template.start_date}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">结束时间</p>
                <p className="font-medium">{template.end_date}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">任务类型</p>
                <p className="font-medium">{template.task_type === 'daily' ? '日常任务' : '随机任务'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">连击策略</p>
                <p className="font-medium">{template.combo_strategy_type === 'linear' ? '线性' : '阶梯'}</p>
              </div>
            </div>
            {template.age_range_min && template.age_range_max && (
              <div>
                <p className="text-sm text-muted-foreground">适合年龄段</p>
                <p className="font-medium">{template.age_range_min} - {template.age_range_max} 岁</p>
              </div>
            )}
          </CardContent>
        </Card>

        {comboConfig && (
          <Card>
            <CardHeader>
              <CardTitle>连击策略详情</CardTitle>
            </CardHeader>
            <CardContent>
              {template.combo_strategy_type === 'linear' ? (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">最少次数</p>
                    <p className="font-medium">{comboConfig.min} 次</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">最多次数</p>
                    <p className="font-medium">{comboConfig.max} 次</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">奖励积分</p>
                    <p className="font-medium">{comboConfig.points} 积分</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {comboConfig.map((step: any, index: number) => (
                    <div key={index} className="flex items-center gap-4 p-2 bg-muted rounded">
                      <Badge>阶梯 {index + 1}</Badge>
                      <span>{step.min} - {step.max} 次</span>
                      <span className="text-muted-foreground">·</span>
                      <span>{step.points} 积分</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
