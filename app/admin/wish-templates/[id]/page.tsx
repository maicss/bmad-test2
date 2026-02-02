"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Coins, Loader2 } from "lucide-react";
import Link from "next/link";
import { WishTemplateForm } from "@/components/wish-template-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface WishTemplate {
  id: string;
  name: string;
  description: string;
  type: "item" | "activity";
  points_required: number;
  icon_type: string | null;
  icon_value: string | null;
  icon_color: string | null;
  border_style: string | null;
  due_date: string | null;
  is_active: number;
  created_at: string;
}

const TYPE_MAP: Record<string, string> = {
  item: "物品",
  activity: "活动",
};

export default function WishTemplateDetailPage() {
  const router = useRouter();
  const params = useParams();
  const templateId = params?.id as string;
  const [template, setTemplate] = useState<WishTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [errorDialog, setErrorDialog] = useState<{ open: boolean; title: string; message: string }>({ open: false, title: "", message: "" });

  useEffect(() => {
    if (templateId) {
      fetchTemplate();
    }
  }, [templateId]);

  const fetchTemplate = async () => {
    if (!templateId) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/wish-templates/${templateId}`);
      const data = await response.json();

      if (data.success) {
        setTemplate(data.data.template);
      } else {
        setErrorDialog({ open: true, title: "获取失败", message: data.error?.message || "获取愿望模板失败" });
        router.push("/admin/wish-templates");
      }
    } catch (error) {
      console.error("Failed to fetch template:", error);
      setErrorDialog({ open: true, title: "获取失败", message: "获取愿望模板失败" });
      router.push("/admin/wish-templates");
    } finally {
      setIsLoading(false);
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
    return null;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/wish-templates">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{template.name}</h1>
          <p className="text-muted-foreground">
            愿望模板详情
          </p>
        </div>
      </div>

      {!isEditing ? (
        <Card className="bg-white border-slate-200">
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="flex items-start gap-6">
                {template.icon_type === "custom" && template.icon_value && (
                  <div className="flex-shrink-0">
                    <img
                      src={template.icon_value}
                      alt={template.name}
                      className="w-32 h-32 object-cover rounded-lg border border-slate-200"
                    />
                  </div>
                )}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-sm">
                      {TYPE_MAP[template.type] || template.type}
                    </Badge>
                    <Badge
                      variant={template.is_active ? "default" : "secondary"}
                      className="text-sm"
                    >
                      {template.is_active ? "启用" : "禁用"}
                    </Badge>
                  </div>
                  {template.description && (
                    <p className="text-slate-700">
                      {template.description}
                    </p>
                  )}
                  <div className="flex gap-6">
                    <div className="flex items-center gap-2">
                      <Coins className="h-5 w-5 text-amber-600" />
                      <span className="font-semibold">
                        {template.points_required} 积分
                      </span>
                    </div>
                    {template.due_date && (
                      <div className="flex items-center gap-2 text-slate-500">
                        <Calendar className="h-5 w-5" />
                        <span>截止: {template.due_date}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-slate-500">
                    创建时间: {new Date(template.created_at).toLocaleString("zh-CN")}
                  </div>
                </div>
              </div>
              <div className="pt-6 border-t border-slate-200">
                <Button
                  onClick={() => setIsEditing(true)}
                  className="w-full"
                >
                  编辑
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <WishTemplateForm
            initialData={{
              name: template.name,
              description: template.description,
              type: template.type,
              points_required: template.points_required,
              icon_type: template.icon_type,
              icon_value: template.icon_value,
              icon_color: template.icon_color,
              border_style: template.border_style,
              due_date: template.due_date,
              is_active: template.is_active,
            }}
            onSuccess={() => {
              fetchTemplate();
              setIsEditing(false);
            }}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      )}

      <AlertDialog open={errorDialog.open} onOpenChange={(open) => setErrorDialog({ ...errorDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{errorDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{errorDialog.message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setErrorDialog({ ...errorDialog, open: false })}>
              确定
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
