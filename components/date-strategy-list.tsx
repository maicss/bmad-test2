"use client";

import { useState, useEffect } from "react";
import { Loader2, Calendar, MapPin, Globe, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DateStrategyDetailModal } from "./date-strategy-detail-modal";

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

const PROVINCE_MAP: Record<string, string> = {
  "000000": "全国",
  "110000": "北京市",
  "120000": "天津市",
  "130000": "河北省",
  "140000": "山西省",
  "150000": "内蒙古自治区",
  "210000": "辽宁省",
  "220000": "吉林省",
  "230000": "黑龙江省",
  "310000": "上海市",
  "320000": "江苏省",
  "330000": "浙江省",
  "340000": "安徽省",
  "350000": "福建省",
  "360000": "江西省",
  "370000": "山东省",
  "410000": "河南省",
  "420000": "湖北省",
  "430000": "湖南省",
  "440000": "广东省",
  "450000": "广西壮族自治区",
  "460000": "海南省",
  "500000": "重庆市",
  "510000": "四川省",
  "520000": "贵州省",
  "530000": "云南省",
  "540000": "西藏自治区",
  "610000": "陕西省",
  "620000": "甘肃省",
  "630000": "青海省",
  "640000": "宁夏回族自治区",
  "650000": "新疆维吾尔自治区",
};

export function DateStrategyList() {
  const [templates, setTemplates] = useState<DateStrategyTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/admin/date-strategy-templates");
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

  const handleTemplateClick = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      {templates.length === 0 ? (
        <p className="text-sm text-slate-500">暂无日期策略模板</p>
      ) : (
        <div className="grid gap-3">
          {templates.slice(0, 5).map((template) => {
            const dateCount = template.dates.split(",").length;
            return (
              <div
                key={template.id}
                onClick={() => handleTemplateClick(template.id)}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      {template.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {PROVINCE_MAP[template.region] || template.region}
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
              </div>
            );
          })}
          {templates.length > 5 && (
            <Link href="/admin/date-strategy-templates">
              <Button variant="ghost" className="w-full text-muted-foreground">
                查看更多 ({templates.length - 5})
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          )}
        </div>
      )}

      <DateStrategyDetailModal
        templateId={selectedTemplateId}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onUpdate={fetchTemplates}
        onDelete={fetchTemplates}
      />
    </div>
  );
}
