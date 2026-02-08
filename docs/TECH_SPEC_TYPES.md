# TECH_SPEC_TYPES.md

> 类型系统规范、目录结构、模块命名规则

---

## 目录结构

```
types/
├── task.ts                     # 任务相关类型
├── user.ts                     # 用户相关类型
├── wishlist.ts                 # 愿望单类型
├── family.ts                   # 家庭类型
├── points.ts                   # 积分类型
├── date-strategy.ts            # 日期策略类型
├── dto/                        # DTO 类型（API 层）
│   ├── request/                # 请求体类型
│   │   ├── task.dto.ts
│   │   ├── user.dto.ts
│   │   ├── wishlist.dto.ts
│   │   └── auth.dto.ts
│   └── response/               # 响应类型
│       ├── task.dto.ts
│       ├── user.dto.ts
│       ├── wishlist.dto.ts
│       └── auth.dto.ts
└── db/                         # 数据库类型（从 schema 导出）
    └── index.ts
```

**命名规则**：
- 所有类型文件按**模块命名**，如 `task.ts`、`user.ts`
- 禁止命名为 `index.ts`、`types.ts` 等通用名称
- DTO 文件使用 `.dto.ts` 后缀

---

## 类型继承模式

### 基础类型定义

```typescript
// types/task.ts
/**
 * 任务基础类型 - 原子类型定义
 * 不包含数据库特有字段（如 created_at）
 */

export type TaskStatus = 'pending' | 'completed' | 'cancelled' | 'expired';

export type TaskCategory = '学习' | '家务' | '行为';

export interface TaskBase {
  id: string;
  title: string;
  description?: string;
  points: number;
  status: TaskStatus;
  category?: TaskCategory;
}

export interface ComboTier {
  minStreak: number;
  maxStreak: number;
  bonusPoints: number;
}

export type ComboType = 'linear' | 'ladder';

export interface ComboConfig {
  type: ComboType;
  tiers: ComboTier[];
}
```

### DTO 类型（请求）

```typescript
// types/dto/request/task.dto.ts
/**
 * 任务相关请求 DTO
 */

import { TaskBase, ComboConfig } from '../../task';

// 创建任务请求
export interface CreateTaskDto extends Omit<TaskBase, 'id' | 'status'> {
  familyId: string;
  assigneeId: string;
  dueDate: string;  // ISO 8601 format
  planId?: string;
  comboConfig?: ComboConfig;
}

// 更新任务请求
export interface UpdateTaskDto {
  title?: string;
  description?: string;
  points?: number;
  status?: TaskBase['status'];
  dueDate?: string;
}

// 完成任务请求
export interface CompleteTaskDto {
  completedBy: string;
  note?: string;
}

// 审批任务请求
export interface ApproveTaskDto {
  approved: boolean;
  reason?: string;
}
```

### DTO 类型（响应）

```typescript
// types/dto/response/task.dto.ts
/**
 * 任务相关响应 DTO
 */

import { TaskBase, ComboConfig, TaskStatus } from '../../task';

// 任务响应（基础）
export interface TaskResponseDto extends TaskBase {
  planId?: string;
  assigneeId: string;
  assigneeName: string;
  dueDate: string;           // ISO 8601 format
  completedAt?: string;
  approvedAt?: string;
  actualPoints?: number;
  comboStreak: number;
  createdAt: string;
  updatedAt: string;
}

// 任务详情响应
export interface TaskDetailResponseDto extends TaskResponseDto {
  plan?: {
    id: string;
    name: string;
    comboConfig?: ComboConfig;
  };
  history?: {
    action: string;
    timestamp: string;
    userId: string;
    userName: string;
  }[];
}

// 任务列表响应
export interface TaskListResponseDto {
  tasks: TaskResponseDto[];
  total: number;
  page: number;
  pageSize: number;
}
```

### 用户类型

```typescript
// types/user.ts
/**
 * 用户相关类型
 */

export type UserRole = 'admin' | 'parent' | 'child';

export interface UserBase {
  id: string;
  name: string;
  avatar?: string;
  role: UserRole;
  familyId?: string;
}

// 家长特有字段
export interface ParentUser extends UserBase {
  role: 'parent';
  phone: string;
  familyId: string;
}

// 儿童特有字段
export interface ChildUser extends UserBase {
  role: 'child';
  pin?: string;  // 仅在创建/更新时存在，查询时隐藏
  familyId: string;
}

// 管理员
export interface AdminUser extends UserBase {
  role: 'admin';
  phone: string;
}

export type User = AdminUser | ParentUser | ChildUser;
```

### 愿望单类型

```typescript
// types/wishlist.ts
/**
 * 愿望单相关类型
 */

export type WishlistType = 
  | '大餐' 
  | '零食' 
  | '快餐' 
  | '虚拟物品' 
  | '玩具' 
  | '书籍' 
  | '电子产品' 
  | '陪伴' 
  | '运动' 
  | '旅行';

export type WishlistStatus = 
  | 'published' 
  | 'unpublished' 
  | 'activated' 
  | 'ready' 
  | 'redeemed' 
  | 'completed';

export interface WishlistBase {
  id: string;
  title: string;
  description?: string;
  type: WishlistType;
  points?: number;
  status: WishlistStatus;
}

export interface WishlistProgress {
  currentPoints: number;
  requiredPoints: number;
  percentage: number;  // 0-100
}
```

### 积分类型

```typescript
// types/points.ts
/**
 * 积分相关类型
 */

export interface PointsHistory {
  id: string;
  userId: string;
  amount: number;      // 正数增加，负数扣除
  balance: number;     // 变动后余额
  reason: string;
  taskId?: string;
  wishlistId?: string;
  createdAt: string;
}

export interface PointsSummary {
  userId: string;
  currentBalance: number;
  totalEarned: number;
  totalSpent: number;
  thisMonthEarned: number;
  thisMonthSpent: number;
}
```

### 日期策略类型

```typescript
// types/date-strategy.ts
/**
 * 日期策略相关类型
 */

export interface DateStrategy {
  id: string;
  name: string;
  description?: string;
  region: string;
  year: number;
  isPublic: boolean;
  dates: string[];  // YYYY-MM-DD 格式数组
  copyCount: number;
}

// 预设策略
export type PresetStrategy = 
  | 'daily'           // 每天
  | 'weekends'        // 周末（不含国假）
  | 'weekdays'        // 工作日（不含国假）
  | 'weekdays-holiday' // 工作日（含国假调休）
  | 'holidays';       // 休息日（含国假）
```

---

## 类型守卫

### 类型守卫函数

```typescript
// types/guards/task.guard.ts
/**
 * 任务类型守卫
 */

import { TaskStatus, TaskBase, ComboType } from '../task';

export function isValidTaskStatus(status: unknown): status is TaskStatus {
  return typeof status === 'string' && 
    ['pending', 'completed', 'cancelled', 'expired'].includes(status);
}

export function isValidComboType(type: unknown): type is ComboType {
  return typeof type === 'string' && ['linear', 'ladder'].includes(type);
}

export function validateTaskBase(data: unknown): TaskBase {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid task data: expected object');
  }
  
  const task = data as Record<string, unknown>;
  
  if (typeof task.id !== 'string') {
    throw new Error('Invalid task: id must be string');
  }
  
  if (typeof task.title !== 'string') {
    throw new Error('Invalid task: title must be string');
  }
  
  if (typeof task.points !== 'number') {
    throw new Error('Invalid task: points must be number');
  }
  
  if (!isValidTaskStatus(task.status)) {
    throw new Error('Invalid task: status must be valid TaskStatus');
  }
  
  return {
    id: task.id,
    title: task.title,
    points: task.points,
    status: task.status,
    description: typeof task.description === 'string' ? task.description : undefined,
  };
}
```

```typescript
// types/guards/user.guard.ts
/**
 * 用户类型守卫
 */

import { UserRole, User } from '../user';

export function isValidUserRole(role: unknown): role is UserRole {
  return typeof role === 'string' && 
    ['admin', 'parent', 'child'].includes(role);
}

export function isChildUser(user: User): user is Extract<User, { role: 'child' }> {
  return user.role === 'child';
}

export function isParentUser(user: User): user is Extract<User, { role: 'parent' }> {
  return user.role === 'parent';
}
```

---

## 数据库类型导出

```typescript
// types/db/index.ts
/**
 * 从 Drizzle Schema 导出类型
 */

import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { 
  users, 
  families, 
  tasks, 
  taskPlans, 
  wishlists, 
  pointsHistory,
  dateStrategies 
} from '../../lib/db/schema';

// 用户类型
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

// 家庭类型
export type Family = InferSelectModel<typeof families>;
export type NewFamily = InferInsertModel<typeof families>;

// 任务类型
export type Task = InferSelectModel<typeof tasks>;
export type NewTask = InferInsertModel<typeof tasks>;

// 计划任务类型
export type TaskPlan = InferSelectModel<typeof taskPlans>;
export type NewTaskPlan = InferInsertModel<typeof taskPlans>;

// 愿望单类型
export type Wishlist = InferSelectModel<typeof wishlists>;
export type NewWishlist = InferInsertModel<typeof wishlists>;

// 积分历史类型
export type PointsHistory = InferSelectModel<typeof pointsHistory>;
export type NewPointsHistory = InferInsertModel<typeof pointsHistory>;

// 日期策略类型
export type DateStrategy = InferSelectModel<typeof dateStrategies>;
export type NewDateStrategy = InferInsertModel<typeof dateStrategies>;
```

---

## 使用示例

### 服务端使用

```typescript
// app/api/tasks/route.ts
import { CreateTaskDto, TaskResponseDto } from '@/types/dto/task';
import { validateTaskBase } from '@/types/guards/task';

export async function POST(request: Request) {
  const body: CreateTaskDto = await request.json();
  
  // 使用类型守卫验证
  try {
    validateTaskBase(body);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
  
  // ...
}
```

### 客户端使用

```typescript
// components/task-list.tsx
import { TaskResponseDto } from '@/types/dto/response/task';

interface TaskListProps {
  tasks: TaskResponseDto[];
}

export function TaskList({ tasks }: TaskListProps) {
  return (
    <div>
      {tasks.map(task => (
        <TaskItem key={task.id} task={task} />
      ))}
    </div>
  );
}
```

---

## 最佳实践

1. **模块命名**：按功能模块命名文件，如 `task.ts`、`user.ts`
2. **基础类型优先**：定义基础类型，DTO 继承基础类型
3. **类型守卫**：复杂类型提供类型守卫函数
4. **DTO 分离**：请求和响应 DTO 分开定义
5. **不要重复定义**：使用 `InferSelectModel` 从 Schema 导出

---

## 扩展阅读

- [TECH_SPEC_DATABASE.md](./TECH_SPEC_DATABASE.md) - 数据库 Schema
- [TECH_SPEC_ARCHITECTURE.md](./TECH_SPEC_ARCHITECTURE.md) - 架构设计
- [AGENTS.md](../AGENTS.md) - AI 代理快速参考
