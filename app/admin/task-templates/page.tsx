"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/searchable-select";
import { ArrowLeft, Plus, Activity, Loader2, Calendar, Target } from "lucide-react";

interface TaskTemplate {
  id: string;
  name: string;
  template_name: string;
  category: string;
  is_active: number;
  combo_strategy_type: string;
  points: number;
  start_date: string;
  end_date: string;
  created_at: string;
}

const CATEGORIES = [
  { id: "all", label: "全部分类" },
  { id: "study", label: "学习" },
  { id: "housework", label: "家务" },
  { id: "health", label: "健康" },
  { id: "behavior", label: "行为" },
  { id: "custom", label: "其他" },
];

const CATEGORY_MAP: Record<string, string> = {
  study: "学习",
  housework: "家务",
  health: "健康",
  behavior: "行为",
  custom: "其他",
};

export default function TaskTemplatesListPage() {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/task-templates");
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
      (template.template_name || template.name).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || template.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

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
            <h1 className="text-2xl font-bold">计划任务模板</h1>
            <p className="text-muted-foreground">管理所有计划任务模板</p>
          </div>
        </div>
        <Link href="/admin/task-templates/new">
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
          options={CATEGORIES}
          value={categoryFilter}
          onChange={setCategoryFilter}
          placeholder="筛选分类"
          width="200px"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">暂无任务模板</p>
          <Link href="/admin/task-templates/new">
            <Button variant="outline" className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              创建第一个模板
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <Link key={template.id} href={`/admin/task-templates/${template.id}`}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">
                        {template.template_name || template.name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {CATEGORY_MAP[template.category] || template.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {template.combo_strategy_type === 'linear' ? '线性连击' : '阶梯连击'}
                        </span>
                      </CardDescription>
                    </div>
                    <Badge variant={template.is_active ? "default" : "secondary"}>
                      {template.is_active ? "启用" : "禁用"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span>基础奖励: {template.points} 积分</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {template.start_date} ~ {template.end_date}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
