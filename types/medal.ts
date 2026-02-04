/**
 * Medal (徽章) 类型定义
 *
 * 命名规范：所有徽章相关英文使用 "medal"，不使用 "badge"
 */

// ============================================================
// 基础数据类型 (Base Types)
// ============================================================

/**
 * 图标类型
 */
export type MedalIconType = "icon" | "upload";

/**
 * 边框风格
 */
export type MedalBorderStyle = "circle" | "hexagon" | "square";

/**
 * 等级模式
 */
export type MedalLevelMode = "single" | "multiple";

/**
 * 预设色系 - Ingress Anniversary Medals 风格
 * Bronze(青铜), Silver(白银), Gold(黄金), Platinum(白金), Onyx(黑曜石)
 */
export const MedalTierColorSchemes = {
  // Ingress 标准色系
  INGRESS: [
    { name: "Bronze", value: "#CD7F32", label: "青铜" },
    { name: "Silver", value: "#C0C0C0", label: "白银" },
    { name: "Gold", value: "#FFD700", label: "黄金" },
    { name: "Platinum", value: "#E5E4E2", label: "白金" },
    { name: "Onyx", value: "#353935", label: "黑曜石" },
  ],
  // 暖色系
  WARM: [
    { name: "Copper", value: "#B87333", label: "铜色" },
    { name: "Bronze", value: "#CD7F32", label: "青铜" },
    { name: "Gold", value: "#FFD700", label: "黄金" },
    { name: "Amber", value: "#FFBF00", label: "琥珀" },
    { name: "Rose", value: "#FF007F", label: "玫瑰" },
  ],
  // 冷色系
  COOL: [
    { name: "Slate", value: "#708090", label: "岩灰" },
    { name: "Steel", value: "#4682B4", label: "钢蓝" },
    { name: "Silver", value: "#C0C0C0", label: "白银" },
    { name: "Ice", value: "#B0E0E6", label: "冰蓝" },
    { name: "Crystal", value: "#A0CFEC", label: "水晶" },
  ],
  // 自然色系
  NATURE: [
    { name: "Soil", value: "#8B4513", label: "土壤" },
    { name: "Leaf", value: "#228B22", label: "绿叶" },
    { name: "Emerald", value: "#50C878", label: "翡翠" },
    { name: "Sky", value: "#87CEEB", label: "天空" },
    { name: "Ocean", value: "#006994", label: "海洋" },
  ],
} as const;

export type MedalTierColorScheme = keyof typeof MedalTierColorSchemes;

/**
 * 单个等级配置
 */
export interface MedalTierConfig {
  level: number; // 等级序号 (1-5)
  name: string; // 等级名称
  color: string; // 等级颜色
  threshold: number; // 所需次数阈值
}

/**
 * 图标选择值
 */
export interface MedalIconValue {
  type: MedalIconType;
  value: string; // Lucide图标名称或图片URL
  color?: string; // 可选颜色
}

// ============================================================
// 数据库相关类型
// ============================================================

/**
 * 数据库中的徽章模板原始类型
 * 对应 medal_template 表结构
 */
export interface MedalTemplateDB {
  id: string;
  familyId: string;
  name: string;
  iconType: MedalIconType;
  iconValue: string;
  iconColor: string | null;
  borderStyle: MedalBorderStyle;
  levelMode: MedalLevelMode;
  levelCount: number;
  tierColors: string | null; // JSON字符串
  thresholdCounts: string; // JSON字符串
  rewardPoints: number; // 奖励积分
  isContinuous: boolean;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 创建徽章模板的数据库输入类型
 */
export interface NewMedalTemplateDB {
  id: string;
  familyId: string;
  name: string;
  iconType: MedalIconType;
  iconValue: string;
  iconColor?: string;
  borderStyle: MedalBorderStyle;
  levelMode: MedalLevelMode;
  levelCount: number;
  tierColors?: string;
  thresholdCounts: string;
  rewardPoints?: number;
  isContinuous: boolean;
  isActive?: boolean;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// ============================================================
// API DTO 类型
// ============================================================

/**
 * 创建徽章模板请求 DTO
 */
export interface CreateMedalTemplateRequest {
  name: string;
  icon: MedalIconValue;
  borderStyle: MedalBorderStyle;
  levelMode: MedalLevelMode;
  levelCount?: number; // 多等级时有效，默认3
  tierColorScheme?: MedalTierColorScheme; // 多等级时有效
  thresholdCounts: number[]; // 各等级所需次数
  rewardPoints: number; // 奖励积分
  isContinuous: boolean;
}

/**
 * 更新徽章模板请求 DTO
 */
export interface UpdateMedalTemplateRequest {
  name?: string;
  icon?: MedalIconValue;
  borderStyle?: MedalBorderStyle;
  levelMode?: MedalLevelMode;
  levelCount?: number;
  tierColorScheme?: MedalTierColorScheme;
  thresholdCounts?: number[];
  rewardPoints?: number;
  isContinuous?: boolean;
  isActive?: boolean;
}

/**
 * 徽章模板响应 DTO
 */
export interface MedalTemplateResponse {
  id: string;
  familyId: string;
  name: string;
  icon: MedalIconValue;
  borderStyle: MedalBorderStyle;
  levelMode: MedalLevelMode;
  levelCount: number;
  tiers: MedalTierConfig[];
  rewardPoints: number;
  isContinuous: boolean;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 徽章模板列表项 DTO
 */
export interface MedalTemplateListItem {
  id: string;
  name: string;
  icon: MedalIconValue;
  borderStyle: MedalBorderStyle;
  levelMode: MedalLevelMode;
  levelCount: number;
  isActive: boolean;
}

// ============================================================
// 前端组件 Props 类型
// ============================================================

/**
 * 图片选择组件 Props
 */
export interface ImagePickerProps {
  value?: {
    type: "icon" | "upload";
    color?: string;
    value: string; // iconName or image url
    borderStyle: MedalBorderStyle;
  };
  borderStyle?: MedalBorderStyle;
  onChange?: (value: {
    type: "icon" | "upload";
    color?: string;
    value: string;
    borderStyle: MedalBorderStyle;
  }) => void;
  disabled?: boolean;
}

/**
 * 徽章模板表单 Props
 */
export interface MedalTemplateFormProps {
  initialData?: Partial<CreateMedalTemplateRequest>;
  onSubmit?: (data: CreateMedalTemplateRequest) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

/**
 * 徽章预览 Props
 */
export interface MedalPreviewProps {
  name: string;
  icon: MedalIconValue;
  borderStyle: MedalBorderStyle;
  tier?: MedalTierConfig;
  size?: "sm" | "md" | "lg";
}

// ============================================================
// 表单验证相关类型
// ============================================================

/**
 * 徽章模板表单字段错误
 */
export interface MedalTemplateFormErrors {
  name?: string;
  icon?: string;
  borderStyle?: string;
  levelMode?: string;
  levelCount?: string;
  tierColorScheme?: string;
  thresholdCounts?: string[];
  isContinuous?: string;
}

/**
 * 表单验证结果
 */
export interface MedalTemplateValidationResult {
  isValid: boolean;
  errors: MedalTemplateFormErrors;
}

// ============================================================
// 业务逻辑类型
// ============================================================

/**
 * 用户获得的徽章实例
 */
export interface UserMedal {
  id: string;
  templateId: string;
  memberId: string;
  currentTier: number; // 当前等级
  currentCount: number; // 当前累计次数
  unlockedAt: Date | null; // 解锁时间
  tierHistory: MedalTierHistory[];
}

/**
 * 等级变更历史
 */
export interface MedalTierHistory {
  tier: number;
  achievedAt: Date;
  countAtAchievement: number;
}

/**
 * 徽章进度信息
 */
export interface MedalProgress {
  templateId: string;
  memberId: string;
  currentTier: number;
  currentCount: number;
  nextTier: MedalTierConfig | null;
  countToNextTier: number; // 距离下一等级还需次数
  isMaxTier: boolean;
  progressPercentage: number; // 当前等级进度百分比
}
