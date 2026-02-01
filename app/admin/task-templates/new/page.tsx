"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { TaskTemplateForm } from "@/components/task-template-form";

export default function NewTaskTemplatePage() {
  const router = useRouter();
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSuccess = () => {
    setIsSuccess(true);
    setTimeout(() => {
      router.push("/admin");
    }, 1500);
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
          <h1 className="text-2xl font-bold">新建计划任务模板</h1>
          <p className="text-muted-foreground">创建新的任务模板</p>
        </div>
      </div>

      {isSuccess ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-green-600 font-medium">创建成功！</div>
            <p className="text-muted-foreground text-sm mt-2">正在返回管理页面...</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>模板信息</CardTitle>
          </CardHeader>
          <CardContent>
            <TaskTemplateForm 
              onSuccess={handleSuccess}
              onCancel={() => router.push("/admin")}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
