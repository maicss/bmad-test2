"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateStrategyForm } from "@/components/date-strategy-form";
import { Loader2, ArrowLeft, Calendar, Copy } from "lucide-react";

interface TemplateData {
  name: string;
  description: string | null;
  region: string;
  year: number;
  isPublic: boolean;
  dates: string;
}

export default function NewDateStrategyTemplatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const copyId = searchParams.get("copy");
  const [templateData, setTemplateData] = useState<TemplateData | null>(null);
  const [isLoading, setIsLoading] = useState(!!copyId);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (copyId) {
      fetchTemplateToCopy();
    }
  }, [copyId]);

  const fetchTemplateToCopy = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/date-strategy-templates/${copyId}`);
      const data = await response.json();
      if (data.success) {
        setTemplateData({
          name: data.data.template.name,
          description: data.data.template.description,
          region: data.data.template.region,
          year: data.data.template.year,
          isPublic: data.data.template.is_public === 1,
          dates: data.data.template.dates,
        });
      } else {
        setError("无法加载要复制的模板");
      }
    } catch (err) {
      setError("加载失败，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccess = () => {
    router.push("/admin/date-strategy-templates");
  };

  const handleCancel = () => {
    router.push("/admin/date-strategy-templates");
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/date-strategy-templates">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">
            {copyId ? (
              <span className="flex items-center gap-2">
                <Copy className="h-5 w-5" />
                复制日期策略模板
              </span>
            ) : (
              "创建日期策略模板"
            )}
          </h1>
          <p className="text-muted-foreground">
            {copyId ? "基于现有模板创建新模板" : "创建新的日期策略模板"}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
          <Button onClick={handleCancel} variant="outline" className="mt-4">
            返回列表
          </Button>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              模板信息
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DateStrategyForm
              onSuccess={handleSuccess}
              onCancel={handleCancel}
              initialData={templateData || undefined}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
