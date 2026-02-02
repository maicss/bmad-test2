"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Medal } from "lucide-react";
import { MedalTemplateForm } from "@/components/medal-template-form";
import type { CreateMedalTemplateRequest } from "@/types/medal";
import { ErrorCodes, createErrorResponse, createSuccessResponse } from "@/lib/constant";

export default function NewMedalTemplatePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
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
        setIsSuccess(true);
        setTimeout(() => {
          router.push("/admin/badge-templates");
        }, 1500);
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

      {isSuccess ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <Medal className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="text-green-600 font-medium text-lg">徽章模板创建成功！</div>
            <p className="text-muted-foreground text-sm mt-2">正在返回管理页面...</p>
          </CardContent>
        </Card>
      ) : (
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
      )}
    </div>
  );
}
