"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImagePicker } from "@/components/image-picker";
import type { MedalBorderStyle } from "@/types/medal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

// ============================================================
// Type Definitions
// ============================================================

export interface DateStrategy {
  id: string;
  name: string;
  is_public: number;
  group: "public" | "family";
  dates?: string;
}

export interface Badge {
  id: string;
  name: string;
  levelMode: "single" | "multiple";
  levelCount: number;
  isActive: number;
  group: "public" | "family";
}

export interface FamilyMember {
  id: string;
  displayName: string | null;
  role: "primary" | "secondary" | "child";
  user?: {
    name: string;
  };
}

export interface StairRow {
  id: string;
  minCount: string;
  maxCount: string;
  points: string;
}

interface ImageValue {
  type: "icon" | "upload";
  color?: string;
  value: string;
  borderStyle: MedalBorderStyle;
}

interface TaskPlanFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: {
    familyMembers: FamilyMember[];
    dateStrategies: DateStrategy[];
    badges: Badge[];
  };
  userRole?: string;
  familyId?: string | null;
}

// ============================================================
// Main Component
// ============================================================

export function TaskPlanForm({
  onSuccess,
  onCancel,
  initialData,
  userRole,
  familyId,
}: TaskPlanFormProps) {
  const router = useRouter();

  // Form state
  const [isTemplate, setIsTemplate] = useState(false);
  const [name, setName] = useState(""); // 计划名称
  const [description, setDescription] = useState(""); // 描述
  const [taskName, setTaskName] = useState(""); // 任务名称
  const [category, setCategory] = useState<"study" | "housework" | "behavior" | "">("study");
  const [basePoints, setBasePoints] = useState("");
  const [targetMemberIds, setTargetMemberIds] = useState<string[]>([]);
  const [imageValue, setImageValue] = useState<ImageValue>({
    type: "icon",
    value: "Star",
    color: "#3B82F6",
    borderStyle: "circle",
  });
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateStrategyId, setDateStrategyId] = useState("");
  const [enableCombo, setEnableCombo] = useState(false);
  const [comboType, setComboType] = useState<"linear" | "stair">("linear");
  const [linearMin, setLinearMin] = useState("");
  const [linearMax, setLinearMax] = useState("");
  const [linearPoints, setLinearPoints] = useState("");
  const [stairRows, setStairRows] = useState<StairRow[]>([
    { id: "1", minCount: "", maxCount: "", points: "" },
  ]);
  const [medalTemplateId, setMedalTemplateId] = useState("");
  const [taskType, setTaskType] = useState<"daily" | "hidden">("daily");
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showDateOverlapDialog, setShowDateOverlapDialog] = useState(false);

  // Data lists
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>(
    initialData?.familyMembers || [],
  );
  const [dateStrategies, setDateStrategies] = useState<DateStrategy[]>(
    initialData?.dateStrategies || [],
  );
  const [badges, setBadges] = useState<Badge[]>(initialData?.badges || []);

  const isAdmin = userRole === "admin";
  const isParent = userRole === "parent";

  // ============================================================
  // Data fetching functions
  // ============================================================

  const fetchDateStrategies = async () => {
    try {
      const endpoint = isAdmin
        ? "/api/admin/date-strategy-templates"
        : "/api/family/date-strategies";
      const response = await fetch(endpoint);
      const data = await response.json();
      if (data.success) {
        const strategies = (
          data.data.templates ||
          data.data.strategies ||
          []
        ).map((t: any) => ({
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
      const response = await fetch("/api/admin/medal-templates");
      const data = await response.json();
      if (data.success) {
        const badgeList = data.data?.map((b: any) => ({
          ...b,
          group: b.isActive ? "public" : "family",
        })) || [];
        setBadges(badgeList);
      }
    } catch (error) {
      console.error("Failed to fetch badges:", error);
    }
  };

  // ============================================================
  // Combo strategy handlers
  // ============================================================

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
      stairRows.map((row) =>
        row.id === id ? { ...row, [field]: value } : row,
      ),
    );
  };

  // ============================================================
  // Validation
  // ============================================================

  const validateForm = (): { valid: boolean; error?: string } => {
    // 计划名称 (2-20字符)
    if (!name || name.length < 2 || name.length > 20) {
      return { valid: false, error: "计划名称需2-20个字符" };
    }

    // 描述 (2-200字符) - 可选
    if (description && (description.length < 2 || description.length > 200)) {
      return { valid: false, error: "描述需2-200个字符" };
    }

    // 任务名称 (2-20字符)
    if (!taskName || taskName.length < 2 || taskName.length > 20) {
      return { valid: false, error: "任务名称需2-20个字符" };
    }

    // 基础奖励 (必填，可以是负数)
    if (!basePoints || isNaN(Number(basePoints))) {
      return { valid: false, error: "基础奖励必填且需为数字" };
    }

    // 任务对象 (非模板模式必选)
    if (!isTemplate && targetMemberIds.length === 0) {
      return { valid: false, error: "请选择任务对象" };
    }

    // 日期范围 (非模板模式必填)
    if (!isTemplate && (!startDate || !endDate)) {
      return { valid: false, error: "日期范围必填" };
    }

    // 日期策略 (必填)
    if (!dateStrategyId) {
      return { valid: false, error: "请选择日期策略" };
    }

    // 连击策略
    if (enableCombo) {
      if (comboType === "linear") {
        if (!linearMin || !linearMax || !linearPoints) {
          return { valid: false, error: "线性连击策略参数必填" };
        }
        const min = Number(linearMin);
        const max = Number(linearMax);
        const points = Number(linearPoints);
        if (min <= 0 || max <= 0) {
          return { valid: false, error: "次数必须大于0" };
        }
        if (max <= min) {
          return { valid: false, error: "最多次数必须大于最少次数" };
        }
        if (points === 0) {
          return { valid: false, error: "奖励积分不能为0" };
        }
      } else {
        // Stair
        for (let i = 0; i < stairRows.length; i++) {
          const row = stairRows[i];
          if (!row.minCount || !row.maxCount || !row.points) {
            return { valid: false, error: "阶梯连击策略所有行必填" };
          }
          const min = Number(row.minCount);
          const max = Number(row.maxCount);
          const points = Number(row.points);
          if (min <= 0 || max <= 0) {
            return { valid: false, error: "次数必须大于0" };
          }
          if (max <= min) {
            return { valid: false, error: "最多次数必须大于最少次数" };
          }
          if (points === 0) {
            return { valid: false, error: "奖励积分不能为0" };
          }
          // Check consecutive tiers
          if (i > 0) {
            const prevRow = stairRows[i - 1];
            const prevMax = Number(prevRow.maxCount);
            if (min !== prevMax + 1) {
              return {
                valid: false,
                error: "阶梯的最少次数必须为上一阶梯最多次数加1",
              };
            }
          }
        }
      }
    }

    // 年龄建议 (模板模式显示)
    if (isTemplate) {
      if (ageMin && ageMax && Number(ageMin) >= Number(ageMax)) {
        return { valid: false, error: "最大年龄必须大于最小年龄" };
      }
    }

    return { valid: true };
  };

  // ============================================================
  // Submit handlers
  // ============================================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const validation = validateForm();
    if (!validation.valid) {
      setError(validation.error || "表单验证失败");
      return;
    }

    setError("");

    // Check date overlap for non-template mode
    if (!isTemplate && dateStrategyId && startDate && endDate) {
      const strategy = dateStrategies.find((s) => s.id === dateStrategyId);
      if (
        strategy &&
        strategy.dates &&
        !checkDateOverlap(startDate, endDate, strategy.dates)
      ) {
        // No overlap, show confirmation dialog
        setShowDateOverlapDialog(true);
        return;
      }
    }

    // Execute submit
    await submitForm();
  };

  const submitForm = async () => {
    setIsSubmitting(true);
    setError("");

    // Build combo config
    const comboConfig = enableCombo
      ? comboType === "linear"
        ? {
            min: Number(linearMin),
            max: Number(linearMax),
            points: Number(linearPoints),
          }
        : stairRows.map((row) => ({
            min: Number(row.minCount),
            max: Number(row.maxCount),
            points: Number(row.points),
          }))
      : null;

    const payload = {
      name,
      description: description || null,
      taskName,
      category: category || null,
      points: Number(basePoints),
      targetMemberIds: isTemplate ? null : targetMemberIds,
      imageType: imageValue.type,
      color: imageValue.color || null,
      image: imageValue.value,
      borderStyle: imageValue.borderStyle,
      startDate: startDate || null,
      endDate: endDate || null,
      dateStrategyId,
      enableCombo,
      comboStrategyType: enableCombo ? comboType : null,
      comboStrategyConfig: enableCombo ? JSON.stringify(comboConfig) : null,
      medalTemplateId: medalTemplateId || null,
      taskType,
      ageRangeMin: isTemplate && ageMin ? Number(ageMin) : null,
      ageRangeMax: isTemplate && ageMax ? Number(ageMax) : null,
      isTemplate,
      isPublic: isTemplate ? isPublic : false,
      familyId: isTemplate ? null : familyId,
      confirmNoOverlap: true,
    };

    try {
      const response = await fetch("/api/task-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("创建成功！");
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/task-plans");
        }
      } else if (data.requiresConfirmation) {
        // Date overlap warning
        setShowDateOverlapDialog(true);
      } else {
        setError(data.error?.message || "创建失败");
        toast.error(data.error?.message || "创建失败");
      }
    } catch (error) {
      setError("创建失败，请重试");
      toast.error("创建失败，请重试");
    } finally {
      setIsSubmitting(false);
      setShowDateOverlapDialog(false);
    }
  };

  // Check date overlap
  const checkDateOverlap = (
    dateRangeStart: string,
    dateRangeEnd: string,
    dateStrategyDates: string,
  ): boolean => {
    if (!dateRangeStart || !dateRangeEnd || !dateStrategyDates) {
      return false;
    }

    const rangeStart = new Date(dateRangeStart);
    const rangeEnd = new Date(dateRangeEnd);
    const strategyDates = dateStrategyDates.split(",");

    for (const dateStr of strategyDates) {
      const strategyDate = new Date(dateStr.trim());
      if (strategyDate >= rangeStart && strategyDate <= rangeEnd) {
        return true; // Has overlap
      }
    }
    return false; // No overlap
  };

  // Handle template checkbox change
  const handleIsTemplateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setIsTemplate(checked);
    if (checked) {
      setTargetMemberIds([]); // Clear target members when template mode
    }
  };

  // Handle member selection (multi-select)
  const handleMemberToggle = (memberId: string) => {
    if (targetMemberIds.includes(memberId)) {
      setTargetMemberIds(targetMemberIds.filter((id) => id !== memberId));
    } else {
      setTargetMemberIds([...targetMemberIds, memberId]);
    }
  };

  // Sort members: children first, then primary, then secondary
  const sortedMembers = [...familyMembers].sort((a, b) => {
    const order = { child: 0, primary: 1, secondary: 2 };
    return order[a.role] - order[b.role];
  });

  // ============================================================
  // Render
  // ============================================================

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 设为模板 - Admin only */}
        {isAdmin && (
          <div className="flex items-center space-x-2 pb-4 border-b">
            <input
              type="checkbox"
              id="isTemplate"
              checked={isTemplate}
              onChange={handleIsTemplateChange}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="isTemplate" className="font-medium">
              设为模板
            </Label>
          </div>
        )}

        {/* 计划名称 */}
        <div className="space-y-2">
          <Label htmlFor="name">
            计划名称 * (2-20字符)
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="输入计划名称"
            minLength={2}
            maxLength={20}
            required
          />
        </div>

        {/* 描述 */}
        <div className="space-y-2">
          <Label htmlFor="description">
            描述 (2-200字符，可选)
          </Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="输入描述"
            minLength={2}
            maxLength={200}
          />
        </div>

        {/* 任务名称 */}
        <div className="space-y-2">
          <Label htmlFor="taskName">
            任务名称 * (2-20字符)
          </Label>
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

        {/* 分类 + 基础奖励 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">分类</Label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full h-10 px-3 py-2 border border-input rounded-md text-sm"
            >
              <option value="study">学习</option>
              <option value="housework">家务</option>
              <option value="behavior">行为</option>
            </select>
          </div>
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
        </div>

        {/* 任务对象 - 多选，非模板模式 */}
        {!isTemplate && (
          <div className="space-y-2">
            <Label>任务对象 * (可多选)</Label>
            <div className="border rounded-md p-3 space-y-2">
              {sortedMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground">暂无家庭成员</p>
              ) : (
                sortedMembers.map((member) => (
                  <label key={member.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={targetMemberIds.includes(member.id)}
                      onChange={() => handleMemberToggle(member.id)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span className="text-sm">
                      {member.displayName || member.user?.name || "未命名"}
                      {member.role === "child" && " (儿童)"}
                      {member.role === "primary" && " (主要家长)"}
                      {member.role === "secondary" && " (次要家长)"}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>
        )}

        {/* 图标选择 */}
        <div className="space-y-2">
          <Label>图标 *</Label>
          <ImagePicker
            value={imageValue}
            onChange={setImageValue}
            showBorderSelector={true}
          />
        </div>

        {/* 日期范围 */}
        <div className="space-y-2">
          <Label>
            日期范围 {!isTemplate && "*"}
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required={!isTemplate}
              className="flex-1"
            />
            <span className="text-muted-foreground">至</span>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required={!isTemplate}
              className="flex-1"
            />
          </div>
          {isTemplate && (
            <p className="text-xs text-muted-foreground">
              模板模式下日期可选，创建具体任务时再设置
            </p>
          )}
        </div>

        {/* 日期策略 */}
        <div className="space-y-2">
          <Label htmlFor="dateStrategy">日期策略 *</Label>
          <select
            id="dateStrategy"
            value={dateStrategyId}
            onChange={(e) => setDateStrategyId(e.target.value)}
            className="w-full h-10 px-3 py-2 border border-input rounded-md text-sm"
            required
          >
            <option value="">选择日期策略</option>
            {dateStrategies.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} {s.group === "public" ? "(公开)" : "(家庭)"}
              </option>
            ))}
          </select>
        </div>

        {/* 开启连击 */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="enableCombo"
            checked={enableCombo}
            onChange={(e) => setEnableCombo(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor="enableCombo" className="font-medium">
            开启连击
          </Label>
        </div>

        {/* 连击策略 */}
        {enableCombo && (
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
                {stairRows.map((row) => (
                  <div
                    key={row.id}
                    className="grid grid-cols-[1fr,1fr,1fr,auto] gap-2 items-end"
                  >
                    <div className="space-y-1">
                      <Label className="text-xs">最少次数</Label>
                      <Input
                        type="number"
                        value={row.minCount}
                        onChange={(e) =>
                          updateStairRow(row.id, "minCount", e.target.value)
                        }
                        placeholder="次数"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">最多次数</Label>
                      <Input
                        type="number"
                        value={row.maxCount}
                        onChange={(e) =>
                          updateStairRow(row.id, "maxCount", e.target.value)
                        }
                        placeholder="次数"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">奖励积分</Label>
                      <Input
                        type="number"
                        value={row.points}
                        onChange={(e) =>
                          updateStairRow(row.id, "points", e.target.value)
                        }
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addStairRow}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  添加阶梯
                </Button>
              </div>
            )}
          </div>
        )}

        {/* 徽章 */}
        <div className="space-y-2">
          <Label htmlFor="badge">徽章</Label>
          <select
            id="badge"
            value={medalTemplateId}
            onChange={(e) => setMedalTemplateId(e.target.value)}
            className="w-full h-10 px-3 py-2 border border-input rounded-md text-sm"
          >
            <option value="">不选择徽章</option>
            {badges.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} {b.group === "public" ? "(公开)" : "(家庭)"}
              </option>
            ))}
          </select>
        </div>

        {/* 任务类型 */}
        <div className="space-y-2">
          <Label>任务类型 *</Label>
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
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="taskType"
                value="hidden"
                checked={taskType === "hidden"}
                onChange={() => setTaskType("hidden")}
                className="h-4 w-4"
              />
              <span>隐藏</span>
            </label>
          </div>
        </div>

        {/* 年龄建议 - 仅模板模式显示 */}
        {isTemplate && (
          <div className="space-y-2">
            <Label>年龄建议</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={ageMin}
                onChange={(e) => setAgeMin(e.target.value)}
                placeholder="最小年龄"
                className="w-32"
              />
              <span>-</span>
              <Input
                type="number"
                value={ageMax}
                onChange={(e) => setAgeMax(e.target.value)}
                placeholder="最大年龄"
                className="w-32"
              />
              <span className="text-sm text-muted-foreground">岁</span>
            </div>
          </div>
        )}

        {/* 设为公开 - 仅模板模式显示 */}
        {isTemplate && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="isPublic" className="font-medium">
              设为公开
            </Label>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-2 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            取消
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "创建中..." : "创建"}
          </Button>
        </div>
      </form>

      {/* Date Overlap Confirmation Dialog */}
      <AlertDialog
        open={showDateOverlapDialog}
        onOpenChange={setShowDateOverlapDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认保存</AlertDialogTitle>
            <AlertDialogDescription>
              所选日期范围和日期策略没有重叠，将不会产生任务。确定要保存吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDateOverlapDialog(false)}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction onClick={submitForm} disabled={isSubmitting}>
              {isSubmitting ? "保存中..." : "确定保存"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
