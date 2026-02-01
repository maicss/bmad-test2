"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, ExternalLink } from "lucide-react";
import Link from "next/link";

interface TaskTemplateFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface DateStrategy {
  id: string;
  name: string;
  is_public: number;
  group: "public" | "family";
}

interface Badge {
  id: string;
  name: string;
  level: string;
  is_public: number;
  group: "public" | "family";
}

interface StairRow {
  id: string;
  minCount: string;
  maxCount: string;
  points: string;
}

export function TaskTemplateForm({ onSuccess, onCancel }: TaskTemplateFormProps) {
  const [templateName, setTemplateName] = useState("");
  const [taskName, setTaskName] = useState("");
  const [basePoints, setBasePoints] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateStrategyId, setDateStrategyId] = useState("");
  const [dateStrategies, setDateStrategies] = useState<DateStrategy[]>([]);
  const [comboType, setComboType] = useState<"linear" | "stair">("linear");
  const [linearMin, setLinearMin] = useState("");
  const [linearMax, setLinearMax] = useState("");
  const [linearPoints, setLinearPoints] = useState("");
  const [stairRows, setStairRows] = useState<StairRow[]>([
    { id: "1", minCount: "", maxCount: "", points: "" },
  ]);
  const [badgeId, setBadgeId] = useState("");
  const [badges, setBadges] = useState<Badge[]>([]);
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [taskType, setTaskType] = useState<"daily" | "random">("daily");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDateStrategies();
    fetchBadges();
  }, []);

  const fetchDateStrategies = async () => {
    try {
      const response = await fetch("/api/date-strategy-templates?is_public=true");
      const data = await response.json();
      if (data.success) {
        const strategies = data.data.templates.map((t: any) => ({
          ...t,
          group: t.is_public === 1 ? "public" : "family",
        }));
        setDateStrategies(strategies);
      }
    } catch (error) {
      console.error("Failed to fetch date strategies:", error);
    }
  };

  const fetchBadges = async () => {
    try {
      const response = await fetch("/api/admin/badge-templates");
      const data = await response.json();
      if (data.success) {
        const badgeList = data.data.templates?.map((b: any) => ({
          ...b,
          group: b.is_public === 1 ? "public" : "family",
        })) || [];
        setBadges(badgeList);
      }
    } catch (error) {
      console.error("Failed to fetch badges:", error);
    }
  };

  const addStairRow = () => {
    setStairRows([
      ...stairRows,
      { id: Date.now().toString(), minCount: "", maxCount: "", points: "" },
    ]);
  };

  const removeStairRow = (id: string) => {
    if (stairRows.length > 1) {
      setStairRows(stairRows.filter((row) => row.id !== id));
    }
  };

  const updateStairRow = (id: string, field: keyof StairRow, value: string) => {
    setStairRows(
      stairRows.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const validateForm = () => {
    if (!templateName || templateName.length < 2 || templateName.length > 20) {
      setError("模板名称需2-20个字符");
      return false;
    }
    if (!taskName || taskName.length < 2 || taskName.length > 20) {
      setError("任务名称需2-20个字符");
      return false;
    }
    if (!basePoints || isNaN(Number(basePoints))) {
      setError("基础奖励必填且需为数字");
      return false;
    }
    if (!startDate || !endDate) {
      setError("开始和结束时间必填");
      return false;
    }
    if (!dateStrategyId) {
      setError("日期策略必填");
      return false;
    }
    if (comboType === "linear") {
      if (!linearMin || !linearMax || !linearPoints) {
        setError("线性连击策略参数必填");
        return false;
      }
    } else {
      const hasEmpty = stairRows.some(
        (row) => !row.minCount || !row.maxCount || !row.points
      );
      if (hasEmpty) {
        setError("阶梯连击策略所有行必填");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError("");

    const comboConfig =
      comboType === "linear"
        ? { min: Number(linearMin), max: Number(linearMax), points: Number(linearPoints) }
        : stairRows.map((row) => ({
            min: Number(row.minCount),
            max: Number(row.maxCount),
            points: Number(row.points),
          }));

    const payload = {
      templateName,
      taskName,
      basePoints: Number(basePoints),
      startDate,
      endDate,
      dateStrategyId,
      comboStrategyType: comboType,
      comboStrategyConfig: JSON.stringify(comboConfig),
      badgeId: badgeId || null,
      ageRangeMin: ageMin ? Number(ageMin) : null,
      ageRangeMax: ageMax ? Number(ageMax) : null,
      taskType,
      isTemplate: 1,
      category: "custom",
      points: Number(basePoints),
      name: taskName,
    };

    try {
      const response = await fetch("/api/admin/task-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess?.();
      } else {
        setError(data.error?.message || "创建失败");
      }
    } catch (error) {
      setError("创建失败，请重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  const publicStrategies = dateStrategies.filter((s) => s.group === "public");
  const familyStrategies = dateStrategies.filter((s) => s.group === "family");
  const publicBadges = badges.filter((b) => b.group === "public");
  const familyBadges = badges.filter((b) => b.group === "family");

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="templateName">模板名称 * (2-20字符)</Label>
          <Input
            id="templateName"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="输入模板名称"
            minLength={2}
            maxLength={20}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="taskName">任务名称 * (2-20字符)</Label>
          <Input
            id="taskName"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            placeholder="输入任务名称"
            minLength={2}
            maxLength={20}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="basePoints">基础奖励 *</Label>
          <Input
            id="basePoints"
            type="number"
            value={basePoints}
            onChange={(e) => setBasePoints(e.target.value)}
            placeholder="积分"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="startDate">开始时间 *</Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">结束时间 *</Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="dateStrategy">日期策略 *</Label>
          <Link href="/admin/date-strategy-templates" target="_blank">
            <Button type="button" variant="ghost" size="sm" className="h-6 px-2">
              <Plus className="h-3 w-3 mr-1" />
              新建日期策略
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
        <select
          id="dateStrategy"
          value={dateStrategyId}
          onChange={(e) => setDateStrategyId(e.target.value)}
          className="w-full h-10 px-3 py-2 border border-input rounded-md text-sm"
          required
        >
          <option value="">选择日期策略</option>
          {publicStrategies.length > 0 && (
            <optgroup label="公共">
              {publicStrategies.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </optgroup>
          )}
          {familyStrategies.length > 0 && (
            <optgroup label="家庭">
              {familyStrategies.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </div>

      <div className="space-y-3 border rounded-md p-4">
        <div className="flex items-center gap-4">
          <Label>连击策略</Label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="comboType"
                value="linear"
                checked={comboType === "linear"}
                onChange={() => setComboType("linear")}
                className="h-4 w-4"
              />
              <span>线性</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="comboType"
                value="stair"
                checked={comboType === "stair"}
                onChange={() => setComboType("stair")}
                className="h-4 w-4"
              />
              <span>阶梯</span>
            </label>
          </div>
        </div>

        {comboType === "linear" ? (
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">最少次数</Label>
              <Input
                type="number"
                value={linearMin}
                onChange={(e) => setLinearMin(e.target.value)}
                placeholder="次数"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">最多次数</Label>
              <Input
                type="number"
                value={linearMax}
                onChange={(e) => setLinearMax(e.target.value)}
                placeholder="次数"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">奖励积分</Label>
              <Input
                type="number"
                value={linearPoints}
                onChange={(e) => setLinearPoints(e.target.value)}
                placeholder="积分"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {stairRows.map((row, index) => (
              <div key={row.id} className="grid grid-cols-[1fr,1fr,1fr,auto] gap-2 items-end">
                <div className="space-y-1">
                  <Label className="text-xs">最少次数</Label>
                  <Input
                    type="number"
                    value={row.minCount}
                    onChange={(e) => updateStairRow(row.id, "minCount", e.target.value)}
                    placeholder="次数"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">最多次数</Label>
                  <Input
                    type="number"
                    value={row.maxCount}
                    onChange={(e) => updateStairRow(row.id, "maxCount", e.target.value)}
                    placeholder="次数"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">奖励积分</Label>
                  <Input
                    type="number"
                    value={row.points}
                    onChange={(e) => updateStairRow(row.id, "points", e.target.value)}
                    placeholder="积分"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeStairRow(row.id)}
                  disabled={stairRows.length === 1}
                  className="h-10 px-2"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addStairRow} className="w-full">
              <Plus className="h-4 w-4 mr-1" />
              添加阶梯
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="badge">徽章 (可选)</Label>
        <select
          id="badge"
          value={badgeId}
          onChange={(e) => setBadgeId(e.target.value)}
          className="w-full h-10 px-3 py-2 border border-input rounded-md text-sm"
        >
          <option value="">不选择徽章</option>
          {publicBadges.length > 0 && (
            <optgroup label="公共">
              {publicBadges.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.level})
                </option>
              ))}
            </optgroup>
          )}
          {familyBadges.length > 0 && (
            <optgroup label="家庭">
              {familyBadges.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.level})
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>适合年龄段 (可选)</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={ageMin}
              onChange={(e) => setAgeMin(e.target.value)}
              placeholder="最小年龄"
            />
            <span>-</span>
            <Input
              type="number"
              value={ageMax}
              onChange={(e) => setAgeMax(e.target.value)}
              placeholder="最大年龄"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>任务类型</Label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="taskType"
                value="daily"
                checked={taskType === "daily"}
                onChange={() => setTaskType("daily")}
                className="h-4 w-4"
              />
              <span>日常</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer opacity-50">
              <input
                type="radio"
                name="taskType"
                value="random"
                checked={taskType === "random"}
                onChange={() => setTaskType("random")}
                className="h-4 w-4"
                disabled
              />
              <span>随机 (暂未实现)</span>
            </label>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-2 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "创建中..." : "创建"}
        </Button>
      </div>
    </form>
  );
}
