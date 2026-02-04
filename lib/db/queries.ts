/**
 * Database Queries Layer
 *
 * 所有复杂的 SQL 查询抽象在此文件中
 * 使用 Drizzle ORM 的类型安全 API
 *
 * 安全提示：所有查询都使用参数化查询防止 SQL 注入
 */

import {
  eq,
  and,
  desc,
  asc,
  sql,
  like,
  or,
  gt,
  lt,
  gte,
  lte,
  inArray,
} from "drizzle-orm";
import { getDb, schema } from "@/database/db";
import type {
  User,
  Family,
  FamilyMember,
  TaskDefinition,
  TaskPlan,
  BehaviorLog,
  PointTransaction,
  Wish,
  WishRedemption,
  NewUser,
  NewFamily,
  NewFamilyMember,
  NewTaskDefinition,
  NewTaskPlan,
  NewBehaviorLog,
  NewPointTransaction,
  NewWish,
  NewWishRedemption,
} from "@/lib/db/schema";

// ============================================================
// 用户相关查询
// ============================================================

/**
 * 根据手机号获取用户
 */
export async function getUserByPhone(phone: string): Promise<User | undefined> {
  const db = getDb();
  const result = await db.query.users.findFirst({
    where: eq(schema.users.phone, phone),
  });
  return result;
}

/**
 * 根据 ID 获取用户
 */
export async function getUserById(id: string): Promise<User | undefined> {
  const db = getDb();
  const result = await db.query.users.findFirst({
    where: eq(schema.users.id, id),
    with: {
      familyMembers: {
        with: {
          family: true,
        },
      },
    },
  });
  return result;
}

/**
 * 创建新用户
 */
export async function createUser(data: NewUser): Promise<User> {
  const db = getDb();
  const [user] = await db.insert(schema.users).values(data).returning();
  return user;
}

/**
 * 更新用户信息
 */
export async function updateUser(
  id: string,
  data: Partial<NewUser>,
): Promise<User | undefined> {
  const db = getDb();
  const [user] = await db
    .update(schema.users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.users.id, id))
    .returning();
  return user;
}

// ============================================================
// 家庭相关查询
// ============================================================

/**
 * 创建新家庭
 */
export async function createFamily(data: NewFamily): Promise<Family> {
  const db = getDb();
  const [family] = await db.insert(schema.families).values(data).returning();
  return family;
}

/**
 * 根据 ID 获取家庭
 */
export async function getFamilyById(id: string): Promise<Family | undefined> {
  const db = getDb();
  const result = await db.query.families.findFirst({
    where: eq(schema.families.id, id),
    with: {
      members: {
        with: {
          user: true,
        },
      },
    },
  });
  return result;
}

/**
 * 根据邀请码获取家庭
 */
export async function getFamilyByInviteCode(
  inviteCode: string,
): Promise<Family | undefined> {
  const db = getDb();
  const result = await db.query.families.findFirst({
    where: and(
      eq(schema.families.inviteCode, inviteCode),
      or(
        sql`${schema.families.inviteCodeExpiresAt} IS NULL`,
        gt(schema.families.inviteCodeExpiresAt, new Date()),
      ),
    ),
  });
  return result;
}

/**
 * 更新家庭信息
 */
export async function updateFamily(
  id: string,
  data: Partial<NewFamily>,
): Promise<Family | undefined> {
  const db = getDb();
  const [family] = await db
    .update(schema.families)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.families.id, id))
    .returning();
  return family;
}

// ============================================================
// 家庭成员相关查询
// ============================================================

/**
 * 添加家庭成员
 */
export async function addFamilyMember(
  data: NewFamilyMember,
): Promise<FamilyMember> {
  const db = getDb();
  const [member] = await db
    .insert(schema.familyMembers)
    .values(data)
    .returning();
  return member;
}

/**
 * 根据家庭ID获取成员
 */
export async function getMembersByFamilyId(
  familyId: string,
): Promise<FamilyMember[]> {
  const db = getDb();
  const results = await db.query.familyMembers.findMany({
    where: eq(schema.familyMembers.familyId, familyId),
    with: {
      user: true,
    },
    orderBy: [asc(schema.familyMembers.role)],
  });
  return results;
}

/**
 * 根据成员ID获取成员
 */
export async function getMemberById(
  memberId: string,
): Promise<FamilyMember | undefined> {
  const db = getDb();
  const result = await db.query.familyMembers.findFirst({
    where: eq(schema.familyMembers.id, memberId),
    with: {
      user: true,
      family: true,
    },
  });
  return result;
}

/**
 * 更新成员积分
 */
export async function updateMemberPoints(
  memberId: string,
  delta: number,
): Promise<FamilyMember | undefined> {
  const db = getDb();
  const member = await getMemberById(memberId);
  if (!member) return undefined;

  const [updated] = await db
    .update(schema.familyMembers)
    .set({
      currentPoints: sql`${schema.familyMembers.currentPoints} + ${delta}`,
      updatedAt: new Date(),
    })
    .where(eq(schema.familyMembers.id, memberId))
    .returning();
  return updated;
}

// ============================================================
// 任务定义相关查询
// ============================================================

/**
 * 创建任务定义
 */
export async function createTaskDefinition(
  data: NewTaskDefinition,
): Promise<TaskDefinition> {
  const db = getDb();
  const [task] = await db
    .insert(schema.taskDefinitions)
    .values(data)
    .returning();
  return task;
}

/**
 * 根据家庭ID获取任务定义
 */
export async function getTaskDefinitionsByFamilyId(
  familyId: string,
): Promise<TaskDefinition[]> {
  const db = getDb();
  const results = await db.query.taskDefinitions.findMany({
    where: eq(schema.taskDefinitions.familyId, familyId),
    orderBy: [desc(schema.taskDefinitions.createdAt)],
  });
  return results;
}

/**
 * 根据ID获取任务定义
 */
export async function getTaskDefinitionById(
  id: string,
): Promise<TaskDefinition | undefined> {
  const db = getDb();
  const result = await db.query.taskDefinitions.findFirst({
    where: eq(schema.taskDefinitions.id, id),
    with: {
      family: true,
      createdBy: true,
    },
  });
  return result;
}

// ============================================================
// 行为记录相关查询
// ============================================================

/**
 * 创建行为记录
 */
export async function createBehaviorLog(
  data: NewBehaviorLog,
): Promise<BehaviorLog> {
  const db = getDb();
  const [log] = await db.insert(schema.behaviorLogs).values(data).returning();
  return log;
}

/**
 * 获取家庭行为记录
 */
export async function getFamilyBehaviorLogs(
  familyId: string,
  options: { limit?: number; offset?: number } = {},
): Promise<BehaviorLog[]> {
  const db = getDb();
  const { limit = 50, offset = 0 } = options;

  const results = await db.query.behaviorLogs.findMany({
    where: eq(schema.behaviorLogs.familyId, familyId),
    with: {
      member: {
        with: {
          user: true,
        },
      },
      taskDefinition: true,
      recordedBy: true,
    },
    orderBy: [desc(schema.behaviorLogs.recordedAt)],
    limit,
    offset,
  });
  return results;
}

// ============================================================
// 积分交易相关查询
// ============================================================

/**
 * 创建积分交易
 */
export async function createPointTransaction(
  data: NewPointTransaction,
): Promise<PointTransaction> {
  const db = getDb();
  const [transaction] = await db
    .insert(schema.pointTransactions)
    .values(data)
    .returning();
  return transaction;
}

/**
 * 获取成员积分交易记录
 */
export async function getMemberPointTransactions(
  memberId: string,
): Promise<PointTransaction[]> {
  const db = getDb();
  const results = await db.query.pointTransactions.findMany({
    where: eq(schema.pointTransactions.memberId, memberId),
    with: {
      family: true,
      member: {
        with: {
          user: true,
        },
      },
    },
    orderBy: [desc(schema.pointTransactions.createdAt)],
  });
  return results;
}

// ============================================================
// 愿望相关查询
// ============================================================

/**
 * 创建愿望
 */
export async function createWish(data: NewWish): Promise<Wish> {
  const db = getDb();
  const [wish] = await db.insert(schema.wishes).values(data).returning();
  return wish;
}

/**
 * 获取家庭愿望列表
 */
export async function getWishes(
  familyId: string,
  options: { status?: string; limit?: number } = {},
): Promise<Wish[]> {
  const db = getDb();
  const { status, limit = 50 } = options;

  let whereClause = eq(schema.wishes.familyId, familyId);
  if (status) {
    whereClause = and(whereClause, eq(schema.wishes.status, status)) as any;
  }

  const results = await db.query.wishes.findMany({
    where: whereClause,
    with: {
      member: {
        with: {
          user: true,
        },
      },
    },
    orderBy: [desc(schema.wishes.createdAt)],
    limit,
  });
  return results;
}

/**
 * 根据ID获取愿望
 */
export async function getWishById(id: string): Promise<Wish | undefined> {
  const db = getDb();
  const result = await db.query.wishes.findFirst({
    where: eq(schema.wishes.id, id),
    with: {
      family: true,
      member: {
        with: {
          user: true,
        },
      },
      approvedBy: true,
    },
  });
  return result;
}

// ============================================================
// 愿望兑换相关查询
// ============================================================

/**
 * 创建愿望兑换记录
 */
export async function createWishRedemption(
  data: NewWishRedemption,
): Promise<WishRedemption> {
  const db = getDb();
  const [redemption] = await db
    .insert(schema.wishRedemptions)
    .values(data)
    .returning();
  return redemption;
}

/**
 * 获取愿望兑换记录
 */
export async function getWishRedemptionsByWishId(
  wishId: string,
): Promise<WishRedemption[]> {
  const db = getDb();
  const results = await db.query.wishRedemptions.findMany({
    where: eq(schema.wishRedemptions.wishId, wishId),
    with: {
      member: {
        with: {
          user: true,
        },
      },
      wish: true,
    },
    orderBy: [desc(schema.wishRedemptions.createdAt)],
  });
  return results;
}

// ============================================================
// 家庭仪表板相关查询
// ============================================================

/**
 * 获取家庭仪表板数据
 */
export async function getFamilyDashboardData(familyId: string): Promise<{
  family: Family;
  members: FamilyMember[];
  recentLogs: BehaviorLog[];
  pendingWishes: Wish[];
  topTasks: TaskDefinition[];
}> {
  const db = getDb();
  const family = await getFamilyById(familyId);
  if (!family) {
    throw new Error("Family not found");
  }

  const members = await db.query.familyMembers.findMany({
    where: eq(schema.familyMembers.familyId, familyId),
    with: {
      user: true,
    },
  });

  const recentLogs = await getFamilyBehaviorLogs(familyId, { limit: 10 });

  const pendingWishes = await getWishes(familyId, { status: "pending" });

  const topTasks = await db.query.taskDefinitions.findMany({
    where: and(
      eq(schema.taskDefinitions.familyId, familyId),
      eq(schema.taskDefinitions.isActive, true),
    ),
    orderBy: [desc(schema.taskDefinitions.createdAt)],
    limit: 5,
  });

  return {
    family,
    members,
    recentLogs,
    pendingWishes,
    topTasks,
  };
}

/**
 * 搜索用户（用于添加家庭成员）
 */
export async function searchUsers(query: string): Promise<User[]> {
  const db = getDb();
  const results = await db.query.users.findMany({
    where: or(
      like(schema.users.name, `%${query}%`),
      like(schema.users.phone, `%${query}%`),
    ),
    limit: 10,
  });
  return results;
}

// ============================================================
// 计划任务相关查询
// ============================================================

/**
 * 获取家庭成员（带用户信息，按角色排序）
 * role 排序: child -> primary -> secondary
 */
export async function getFamilyMembersByFamilyId(familyId: string) {
  const db = getDb();
  const members = await db.query.familyMembers.findMany({
    where: eq(schema.familyMembers.familyId, familyId),
    with: {
      user: true,
    },
    orderBy: [asc(schema.familyMembers.role)],
  });
  return members;
}

/**
 * 获取家庭成员的用户ID列表
 */
export async function getFamilyUserIds(familyId: string): Promise<string[]> {
  const db = getDb();
  const members = await db.query.familyMembers.findMany({
    where: eq(schema.familyMembers.familyId, familyId),
    columns: {
      userId: true,
    },
  });
  return members.map((m) => m.userId);
}

/**
 * 获取家庭创建的日期策略（非公开）
 */
export async function getFamilyDateStrategies(userIds: string[]) {
  const db = getDb();
  const strategies = await db.query.dateStrategies.findMany({
    where: and(
      inArray(schema.dateStrategies.createdBy, userIds),
      eq(schema.dateStrategies.isPublic, false),
    ),
    orderBy: [desc(schema.dateStrategies.createdAt)],
  });
  return strategies;
}

// ============================================================
// 任务计划相关查询 (Task Plan Queries)
// ============================================================

/**
 * 创建任务计划
 */
export async function createTaskPlan(data: NewTaskPlan): Promise<TaskPlan> {
  const db = getDb();
  const [plan] = await db.insert(schema.taskPlans).values(data).returning();
  return plan;
}

/**
 * 根据家庭ID获取任务计划
 */
export async function getTaskPlansByFamilyId(familyId: string): Promise<TaskPlan[]> {
  const db = getDb();
  return db.query.taskPlans.findMany({
    where: eq(schema.taskPlans.familyId, familyId),
    orderBy: [desc(schema.taskPlans.createdAt)],
  });
}

/**
 * 获取公开任务计划模板
 */
export async function getPublicTaskPlanTemplates(): Promise<TaskPlan[]> {
  const db = getDb();
  return db.query.taskPlans.findMany({
    where: and(
      eq(schema.taskPlans.isTemplate, true),
      eq(schema.taskPlans.isPublic, true),
      eq(schema.taskPlans.status, "published"),
    ),
    with: {
      createdBy: true,
      medalTemplate: true,
      dateStrategy: true,
    },
  });
}

/**
 * 根据ID获取任务计划
 */
export async function getTaskPlanById(id: string): Promise<TaskPlan | undefined> {
  const db = getDb();
  return db.query.taskPlans.findFirst({
    where: eq(schema.taskPlans.id, id),
    with: {
      family: true,
      createdBy: true,
      dateStrategy: true,
      medalTemplate: true,
    },
  });
}

/**
 * 验证日期范围与日期策略的重叠
 */
export async function validateDateRangeOverlap(
  startDate: string,
  endDate: string,
  dateStrategyId: string
): Promise<boolean> {
  const db = getDb();
  const strategy = await db.query.dateStrategies.findFirst({
    where: eq(schema.dateStrategies.id, dateStrategyId),
  });

  if (!strategy || !strategy.dates) return false;

  const start = new Date(startDate);
  const end = new Date(endDate);
  const strategyDates = strategy.dates.split(",");

  return strategyDates.some(dateStr => {
    const date = new Date(dateStr.trim());
    return date >= start && date <= end;
  });
}
