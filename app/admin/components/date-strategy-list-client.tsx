"use client";

import { Calendar, MapPin, Globe, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface DateStrategyTemplate {
  id: string;
  name: string;
  description: string | null;
  region: string;
  year: number;
  is_public: number;
  dates: string;
  copy_count: number;
  created_by: string | null;
  created_at: string;
}

interface DateStrategyListClientProps {
  initialTemplates: DateStrategyTemplate[];
  totalCount: number;
  provinceMap: Record<string, string>;
}

export function DateStrategyListClient({
  initialTemplates,
  totalCount,
  provinceMap,
}: DateStrategyListClientProps) {
  if (initialTemplates.length === 0) {
    return <p className="text-sm text-slate-500 text-center py-4">暂无日期策略模板</p>;
  }

  return (
    <div>
      <div className="grid gap-3">
        {initialTemplates.slice(0, 5).map((template) => {
          const dateCount = template.dates.split(",").length;
          return (
            <Link
              key={template.id}
              href={`/admin/date-strategy-templates/${template.id}`}
              className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">{template.name}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {provinceMap[template.region] || template.region}
                    </span>
                    <span>{template.year}年</span>
                    <span>{dateCount}个日期</span>
                    <Badge variant="outline" className="text-xs">
                      复制: {template.copy_count || 0}
                    </Badge>
                    {template.is_public ? (
                      <Badge variant="secondary" className="text-xs">
                        <Globe className="h-3 w-3 mr-1" />
                        公开
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        私有
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
        {totalCount > 5 && (
          <Link href="/admin/date-strategy-templates">
            <Button variant="ghost" className="w-full text-muted-foreground">
              查看更多 ({totalCount - 5})
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
