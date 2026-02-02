"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { MedalTemplateForm } from "@/components/medal-template-form";
import type { CreateMedalTemplateRequest, MedalTemplateResponse } from "@/types/medal";

export default function EditMedalTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [templateId, setTemplateId] = useState<string>("");
  const [template, setTemplate] = useState<MedalTemplateResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then(p => {
      setTemplateId(p.id);
      fetchTemplate(p.id);
    });
  }, [params]);

  const fetchTemplate = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/medal-templates");
      const data = await response.json();
      if (data.success) {
        const found = data.data.find((t: MedalTemplateResponse) => t.id === id);
        if (found) {
          setTemplate(found);
        } else {
          setError("徽章模板不存在");
        }
      } else {
        setError(data.message || "获取模板失败");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取模板失败");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (data: CreateMedalTemplateRequest) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/medal-templates/${templateId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("徽章模板更新成功！");
        router.push("/admin/medal-templates");
      } else {
        setError(result.message || "更新失败");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新失败，请重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!template && error) {
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/medal-templates">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">编辑徽章模板</h1>
          </div>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-red-600">{error}</p>
            <Link href="/admin/medal-templates">
              <Button variant="outline" className="mt-4">
                返回列表
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 转换模板数据为表单初始数据
  const initialData: Partial<CreateMedalTemplateRequest> | undefined = template ? {
    name: template.name,
    icon: template.icon,
    borderStyle: template.borderStyle,
    levelMode: template.levelMode,
    levelCount: template.levelCount,
    thresholdCounts: template.tiers?.map(t => t.threshold) || [10],
    isContinuous: template.isContinuous,
  } : undefined;

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/admin/medal-templates/${templateId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">编辑徽章模板</h1>
          <p className="text-muted-foreground">修改徽章模板信息</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>徽章模板信息</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}
          {template && (
            <MedalTemplateForm 
              initialData={initialData}
              onSubmit={handleSubmit}
              onCancel={() => router.push(`/admin/medal-templates/${templateId}`)}
              isLoading={isSubmitting}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
