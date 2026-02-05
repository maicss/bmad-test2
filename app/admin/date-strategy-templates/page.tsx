"use client";

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/searchable-select";
import { redirectToLogin } from "@/lib/api-client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar,
  MapPin,
  Globe,
  Plus,
  Search,
  Loader2,
  ArrowLeft,
  Trash2,
  Pencil,
  Copy,
  AlertTriangle,
} from "lucide-react";

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
  updated_at: string;
}

const PROVINCES = [
  { id: "000000", label: "全国" },
  { id: "110000", label: "北京市" },
  { id: "120000", label: "天津市" },
  { id: "130000", label: "河北省" },
  { id: "140000", label: "山西省" },
  { id: "150000", label: "内蒙古自治区" },
  { id: "210000", label: "辽宁省" },
  { id: "220000", label: "吉林省" },
  { id: "230000", label: "黑龙江省" },
  { id: "310000", label: "上海市" },
  { id: "320000", label: "江苏省" },
  { id: "330000", label: "浙江省" },
  { id: "340000", label: "安徽省" },
  { id: "350000", label: "福建省" },
  { id: "360000", label: "江西省" },
  { id: "370000", label: "山东省" },
  { id: "410000", label: "河南省" },
  { id: "420000", label: "湖北省" },
  { id: "430000", label: "湖南省" },
  { id: "440000", label: "广东省" },
  { id: "450000", label: "广西壮族自治区" },
  { id: "460000", label: "海南省" },
  { id: "500000", label: "重庆市" },
  { id: "510000", label: "四川省" },
  { id: "520000", label: "贵州省" },
  { id: "530000", label: "云南省" },
  { id: "540000", label: "西藏自治区" },
  { id: "610000", label: "陕西省" },
  { id: "620000", label: "甘肃省" },
  { id: "630000", label: "青海省" },
  { id: "640000", label: "宁夏回族自治区" },
  { id: "650000", label: "新疆维吾尔自治区" },
];

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

export default function DateStrategyTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<DateStrategyTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/date-strategy-templates");

      // Handle 401 Unauthorized
      if (response.status === 401) {
        redirectToLogin("/admin/date-strategy-templates");
        return;
      }

      // Handle 403 Forbidden - redirect to parent home
      if (response.status === 403) {
        router.push("/parent");
        return;
      }

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

  const openDeleteDialog = (id: string, copyCount: number) => {
    if (copyCount > 0) {
      alert("无法删除已被复制的模板");
      return;
    }
    setDeleteTemplateId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTemplateId) return;

    try {
      const response = await fetch(
        `/api/admin/date-strategy-templates/${deleteTemplateId}`,
        {
          method: "DELETE",
        },
      );

      // Handle 401 Unauthorized
      if (response.status === 401) {
        redirectToLogin("/admin/date-strategy-templates");
        return;
      }

      // Handle 403 Forbidden - redirect to parent home
      if (response.status === 403) {
        router.push("/parent");
        return;
      }

      const data = await response.json();

      if (data.success) {
        fetchTemplates();
      } else {
        alert(data.error?.message || "删除失败");
      }
    } catch (error) {
      alert("删除失败，请重试");
    } finally {
      setDeleteDialogOpen(false);
      setDeleteTemplateId(null);
    }
  };

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (template.description?.toLowerCase() || "").includes(
        searchQuery.toLowerCase(),
      );

    const matchesRegion =
      regionFilter === "all" || template.region === regionFilter;

    const matchesYear = !yearFilter || template.year.toString() === yearFilter;

    return matchesSearch && matchesRegion && matchesYear;
  });

  const regionOptions = [{ id: "all", label: "全部区域" }, ...PROVINCES];

  const uniqueYears = [...new Set(templates.map((t) => t.year))].sort(
    (a, b) => b - a,
  );
  const yearOptions = [
    { id: "", label: "全部年份" },
    ...uniqueYears.map((y) => ({ id: y.toString(), label: `${y}年` })),
  ];

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
            <h1 className="text-2xl font-bold">日期策略模板</h1>
            <p className="text-muted-foreground">管理所有日期策略模板</p>
          </div>
        </div>
        <Link href="/admin/date-strategy-templates/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            新建模板
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索模板名称或描述..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <SearchableSelect
          options={regionOptions}
          value={regionFilter}
          onChange={setRegionFilter}
          placeholder="筛选区域"
          width="200px"
        />
        <SearchableSelect
          options={yearOptions}
          value={yearFilter}
          onChange={setYearFilter}
          placeholder="筛选年份"
          width="150px"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">暂无日期策略模板</p>
          <Link href="/admin/date-strategy-templates/new">
            <Button variant="outline" className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              创建第一个模板
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => {
            const dateCount = template.dates.split(",").filter((d) => d).length;
            const dateList = template.dates
              .split(",")
              .filter((d) => d)
              .slice(0, 5);

            return (
              <Card key={template.id} className="flex flex-col">
                <Link
                  href={`/admin/date-strategy-templates/${template.id}`}
                  className="flex-1"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">
                          {template.name}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {PROVINCE_MAP[template.region] || template.region}
                          </span>
                          <span>·</span>
                          <span>{template.year}年</span>
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-1">
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
                  </CardHeader>

                  <CardContent className="flex-1">
                    {template.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {template.description}
                      </p>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{dateCount} 个日期</span>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {dateList.map((date) => (
                          <Badge
                            key={date}
                            variant="secondary"
                            className="text-xs"
                          >
                            {date}
                          </Badge>
                        ))}
                        {dateCount > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{dateCount - 5}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t">
                      <Badge
                        variant={
                          template.copy_count > 0 ? "default" : "outline"
                        }
                        className="text-xs"
                      >
                        复制次数: {template.copy_count || 0}
                      </Badge>
                    </div>
                  </CardContent>
                </Link>

                <CardFooter className="pt-3 border-t flex gap-2">
                  <Link
                    href={`/admin/date-strategy-templates/${template.id}`}
                    className="flex-1"
                  >
                    <Button variant="outline" size="sm" className="w-full">
                      <Pencil className="h-4 w-4 mr-1" />
                      编辑
                    </Button>
                  </Link>
                  <Link
                    href={`/admin/date-strategy-templates/new?copy=${template.id}`}
                    className="flex-1"
                  >
                    <Button variant="outline" size="sm" className="w-full">
                      <Copy className="h-4 w-4 mr-1" />
                      复制
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    className="px-2"
                    onClick={() =>
                      openDeleteDialog(template.id, template.copy_count)
                    }
                    disabled={template.copy_count > 0}
                    title={
                      template.copy_count > 0 ? "已被复制，无法删除" : "删除"
                    }
                  >
                    <Trash2
                      className={`h-4 w-4 ${template.copy_count > 0 ? "text-muted-foreground" : "text-red-500"}`}
                    />
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              确认删除
            </DialogTitle>
            <DialogDescription>
              确定要删除此日期策略模板吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              取消
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
