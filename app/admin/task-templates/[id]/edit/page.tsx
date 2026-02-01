"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function EditTaskTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/task-templates">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">编辑任务模板</h1>
          <p className="text-muted-foreground">编辑功能暂未实现，请删除后重新创建</p>
        </div>
      </div>

      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">编辑功能正在开发中...</p>
          <Link href="/admin/task-templates">
            <Button variant="outline" className="mt-4">
              返回列表
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
