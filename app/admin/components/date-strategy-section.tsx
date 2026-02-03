import { getRawDb } from "@/database/db";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, ChevronRight } from "lucide-react";
import Link from "next/link";
import { DateStrategyListClient } from "./date-strategy-list-client";

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
  national: "全国",
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

async function getDateStrategyTemplates(): Promise<DateStrategyTemplate[]> {
  const rawDb = getRawDb();
  const templates = rawDb
    .query(
      `
      SELECT id, name, description, region, year, is_public, dates, copy_count, created_by, created_at
      FROM date_strategy
      ORDER BY year DESC, created_at DESC
      LIMIT 6
    `,
    )
    .all() as DateStrategyTemplate[];
  return templates;
}

async function getDateStrategyTemplateCount(): Promise<number> {
  const rawDb = getRawDb();
  const result = rawDb
    .query(
      `
      SELECT COUNT(*) as count FROM date_strategy
    `,
    )
    .get() as { count: number };
  return result.count;
}

export async function DateStrategySection() {
  const templates = await getDateStrategyTemplates();
  const totalCount = await getDateStrategyTemplateCount();

  return (
    <Card className="bg-white border-slate-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <Calendar className="h-5 w-5" />
            日期策略模板
          </CardTitle>
          <p className="text-sm text-slate-500 mt-1">管理日期策略模板</p>
        </div>
        <Link href="/admin/date-strategy-templates/new">
          <Button size="sm" className="flex items-center gap-1">
            <Plus className="h-4 w-4" />
            创建
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <DateStrategyListClient
          initialTemplates={templates}
          totalCount={totalCount}
          provinceMap={PROVINCE_MAP}
        />
      </CardContent>
    </Card>
  );
}
