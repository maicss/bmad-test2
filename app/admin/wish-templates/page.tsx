"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/searchable-select";
import { ArrowLeft, Plus, Star, Loader2, Calendar, Coins, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WishTemplateForm } from "@/components/wish-template-form";

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

const TYPES = [
  { id: "all", label: "全部类型" },
  { id: "item", label: "物品" },
  { id: "activity", label: "活动" },
];

const TYPE_MAP: Record<string, string> = {
  item: "物品",
  activity: "活动",
};

export default function WishTemplatesListPage() {
  const [templates, setTemplates] = useState<WishTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorDialog, setErrorDialog] = useState<{ open: boolean; title: string; message: string }>({ open: false, title: "", message: "" });
  const [editingTemplate, setEditingTemplate] = useState<WishTemplate | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/wish-templates");
      const data = await response.json();
      if (data.success) {
        setTemplates(data.data.templates || []);
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || template.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/wish-templates/${deleteId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        setTemplates(templates.filter((t) => t.id !== deleteId));
        setDeleteId(null);
      } else {
        setErrorDialog({ open: true, title: "删除失败", message: data.error?.message || "删除失败" });
      }
    } catch (error) {
      setErrorDialog({ open: true, title: "删除失败", message: "删除失败，请重试" });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopy = async (template: WishTemplate) => {
    try {
      const response = await fetch("/api/admin/wish-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${template.name} 复制`,
          description: template.description,
          type: template.type,
          pointsRequired: template.points_required,
          iconType: template.icon_type,
          iconValue: template.icon_value,
          iconColor: template.icon_color,
          borderStyle: template.border_style,
          dueDate: template.due_date,
          isActive: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        fetchTemplates();
      } else {
        setErrorDialog({ open: true, title: "复制失败", message: data.error?.message || "复制失败" });
      }
    } catch (error) {
      setErrorDialog({ open: true, title: "复制失败", message: "复制失败，请重试" });
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">愿望模板</h1>
            <p className="text-muted-foreground">管理所有愿望模板</p>
          </div>
        </div>
        <Link href="/admin/wish-templates/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            新建模板
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Input
            placeholder="搜索模板名称..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <SearchableSelect
          options={TYPES}
          value={typeFilter}
          onChange={setTypeFilter}
          placeholder="筛选类型"
          width="200px"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">暂无意愿模板</p>
          <Link href="/admin/wish-templates/new">
            <Button variant="outline" className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              创建第一个模板
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="bg-white border-slate-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">
                      {template.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {TYPE_MAP[template.type] || template.type}
                      </Badge>
                      <Badge
                        variant={template.is_active ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {template.is_active ? "启用" : "禁用"}
                      </Badge>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {template.description && (
                    <p className="text-sm text-slate-600 line-clamp-2">
                      {template.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Coins className="h-4 w-4 text-amber-600" />
                    <span>{template.points_required} 积分</span>
                  </div>
                  {template.due_date && (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Calendar className="h-4 w-4" />
                      <span>截止: {template.due_date}</span>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setEditingTemplate(template)}
                    >
                      编辑
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(template)}
                    >
                      复制
                    </Button>
                    <AlertDialog open={deleteId === template.id} onOpenChange={(open) => setDeleteId(open ? template.id : null)}>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          删除
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>确认删除</AlertDialogTitle>
                          <AlertDialogDescription>
                            确定要删除愿望模板 "{template.name}" 吗？此操作可以撤销。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {isDeleting ? "删除中..." : "确认删除"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
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

      <Dialog open={!!editingTemplate} onOpenChange={(open) => !open && setEditingTemplate(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑愿望模板</DialogTitle>
          </DialogHeader>
          {editingTemplate && (
            <WishTemplateForm
              initialData={{
                name: editingTemplate.name,
                description: editingTemplate.description,
                type: editingTemplate.type,
                points_required: editingTemplate.points_required,
                icon_type: editingTemplate.icon_type,
                icon_value: editingTemplate.icon_value,
                icon_color: editingTemplate.icon_color,
                border_style: editingTemplate.border_style,
                due_date: editingTemplate.due_date,
                is_active: editingTemplate.is_active,
              }}
              onSuccess={() => {
                setEditingTemplate(null);
                fetchTemplates();
              }}
              onCancel={() => setEditingTemplate(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
