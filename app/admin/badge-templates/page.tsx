"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Medal, Loader2, Circle, Square, Hexagon } from "lucide-react";
import type { MedalTemplateListItem, MedalBorderStyle } from "@/types/medal";
import * as Icons from "lucide-react";

const BORDER_STYLE_MAP: Record<MedalBorderStyle, { label: string; icon: string }> = {
  circle: { label: "圆形", icon: "Circle" },
  square: { label: "正方形", icon: "Square" },
  hexagon: { label: "六边形", icon: "Hexagon" },
};

const LEVEL_MODE_MAP = {
  single: "单等级",
  multiple: "多等级",
};

function getIconComponent(name: string): React.ComponentType<{ className?: string; style?: React.CSSProperties }> | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icon = (Icons as unknown as Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>>)[name];
  return Icon || null;
}

export default function MedalTemplatesListPage() {
  const [templates, setTemplates] = useState<MedalTemplateListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/medal-templates");
      const data = await response.json();
      if (data.success) {
        setTemplates(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch medal templates:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTemplates = templates.filter((template) => {
    return template.name.toLowerCase().includes(searchQuery.toLowerCase());
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
            <h1 className="text-2xl font-bold">徽章模板</h1>
            <p className="text-muted-foreground">管理所有徽章模板</p>
          </div>
        </div>
        <Link href="/admin/badge-templates/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            新建徽章模板
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Input
            placeholder="搜索徽章名称..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <Medal className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">暂存徽章模板</p>
          <Link href="/admin/badge-templates/new">
            <Button variant="outline" className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              创建第一个徽章模板
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => {
            const IconComponent = template.icon.type === "lucide" 
              ? getIconComponent(template.icon.value)
              : null;
            const borderStyle = BORDER_STYLE_MAP[template.borderStyle];
            const BorderIcon = getIconComponent(borderStyle.icon);

            return (
              <Link key={template.id} href={`/admin/badge-templates/${template.id}`}>
                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {/* 徽章预览 */}
                        <div 
                          className="h-12 w-12 rounded-full flex items-center justify-center"
                          style={{ 
                            backgroundColor: template.icon.type === "lucide" 
                              ? (template.icon.color || "#64748B") + "20"
                              : "#F1F5F9",
                            border: `2px solid ${template.icon.type === "lucide" 
                              ? (template.icon.color || "#64748B")
                              : "#CBD5E1"}`,
                            borderRadius: template.borderStyle === "square" ? "8px" 
                              : template.borderStyle === "hexagon" ? "4px" 
                              : "50%",
                          }}
                        >
                          {template.icon.type === "custom" ? (
                            <img 
                              src={template.icon.value} 
                              alt={template.name}
                              className="h-6 w-6 object-contain"
                            />
                          ) : IconComponent ? (
                            <IconComponent 
                              className="h-6 w-6"
                              style={{ color: template.icon.color || "#64748B" }}
                            />
                          ) : (
                            <Medal className="h-6 w-6 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">
                            {template.name}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {LEVEL_MODE_MAP[template.levelMode]}
                            </Badge>
                            {template.levelMode === "multiple" && (
                              <span className="text-xs text-muted-foreground">
                                {template.levelCount} 级
                              </span>
                            )}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant={template.isActive ? "default" : "secondary"}>
                        {template.isActive ? "启用" : "禁用"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {BorderIcon && <BorderIcon className="h-4 w-4" />}
                        <span>{borderStyle.label}边框</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
