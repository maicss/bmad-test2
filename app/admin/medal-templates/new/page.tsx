"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { MedalTemplateForm } from "@/components/medal-template-form";
import type { CreateMedalTemplateRequest } from "@/types/medal";

export default function NewMedalTemplatePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: CreateMedalTemplateRequest) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/medal-templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("徽章模板创建成功！");
        router.push("/admin/medal-templates");
      } else {
        setError(result.message || "创建失败");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建失败，请重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">新建徽章模板</h1>
          <p className="text-muted-foreground">创建新的徽章模板，用于奖励儿童成就</p>
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
          <MedalTemplateForm 
            onSubmit={handleSubmit}
            onCancel={() => router.push("/admin")}
            isLoading={isSubmitting}
          />
        </CardContent>
      </Card>
    </div>
  );
}
