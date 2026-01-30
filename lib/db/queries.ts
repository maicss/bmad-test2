/**
 * Database Queries Layer
 * 
 * 所有复杂的 SQL 查询抽象在此文件中
 * 使用 Drizzle ORM 的类型安全 API
 * 
 * 安全提示：所有查询都使用参数化查询防止 SQL 注入
 */

import { eq, and, desc, asc, sql, like, or, gt, lt, gte, lte, inArray } from "drizzle-orm";
import { db, schema } from "@/database/db";
import type {
  User,
  Family,
  FamilyMember,
  TaskDefinition,
  BehaviorLog,
  PointTransaction,
  Wish,
  WishRedemption,
  NewUser,
  NewFamily,
  NewFamilyMember,
  NewTaskDefinition,
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
  const result = await db.query.users.findFirst({
    where: eq(schema.users.phone, phone),
  });
  return result;
}

/**
 * 根据 ID 获取用户
 */
export async function getUserById(id: string): Promise<User | undefined> {
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
  const [user] = await db.insert(schema.users).values(data).returning();
  return user;
}

/**
 * 更新用户信息
 */
export async function updateUser(id: string, data: Partial<NewUser>): Promise<User | undefined> {
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
  const [family] = await db.insert(schema.families).values(data).returning();
  return family;
}

/**
 * 根据 ID 获取家庭
 */
export async function getFamilyById(id: string): Promise<Family | undefined> {
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
export async function getFamilyByInviteCode(inviteCode: string): Promise<Family | undefined> {
  const result = await db.query.families.findFirst({
    where: and(
      eq(schema.families.inviteCode, inviteCode),
      or(
        sql`${schema.families.inviteCodeExpiresAt} IS NULL`,
        gt(schema.families.inviteCodeExpiresAt, new Date())
      )
    ),
  });
  return result;
}

/**
 * 更新家庭邀请码
 */
export async function updateFamilyInviteCode(
  familyId: string,
  inviteCode: string,
  expiresAt?: Date
): Promise<Family | undefined> {
  const [family] = await db
    .update(schema.families)
    .set({
      inviteCode,
      inviteCodeExpiresAt: expiresAt,
      updatedAt: new Date(),
    })
    .where(eq(schema.families.id, familyId))
    .returning();
  return family;
}

// ============================================================
// 家庭成员相关查询
// ============================================================

/**
 * 添加家庭成员
 */
export async function addFamilyMember(data: NewFamilyMember): Promise<FamilyMember> {
  const [member] = await db.insert(schema.familyMembers).values(data).returning();
  return member;
}

/**
 * 获取用户在家庭中的成员记录
 */
export async function getFamilyMember(
  familyId: string,
  userId: string
): Promise<FamilyMember | undefined> {
  const result = await db.query.familyMembers.findFirst({
    where: and(
      eq(schema.familyMembers.familyId, familyId),
      eq(schema.familyMembers.userId, userId)
    ),
    with: {
      user: true,
      family: true,
    },
  });
  return result;
}

/**
 * 获取家庭的所有成员
 */
export async function getFamilyMembers(familyId: string): Promise<FamilyMember[]> {
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
 * 更新成员积分余额
 */
export async function updateMemberPoints(
  memberId: string,
  newPoints: number
): Promise<FamilyMember | undefined> {
  const [member] = await db
    .update(schema.familyMembers)
    .set({
      currentPoints: newPoints,
      updatedAt: new Date(),
    })
    .where(eq(schema.familyMembers.id, memberId))
    .returning();
  return member;
}

/**
 * 调整成员积分（原子操作）
 */
export async function adjustMemberPoints(
  memberId: string,
  delta: number
): Promise<FamilyMember | undefined> {
  const [member] = await db
    .update(schema.familyMembers)
    .set({
      currentPoints: sql`${schema.familyMembers.currentPoints} + ${delta}`,
      updatedAt: new Date(),
    })
    .where(eq(schema.familyMembers.id, memberId))
    .returning();
  return member;
}

// ============================================================
// 任务定义相关查询
// ============================================================

/**
 * 创建任务定义
 */
export async function createTaskDefinition(data: NewTaskDefinition): Promise<TaskDefinition> {
  const [task] = await db.insert(schema.taskDefinitions).values(data).returning();
  return task;
}

/**
 * 获取家庭的任务定义列表
 */
export async function getTaskDefinitions(
  familyId: string,
  options?: { activeOnly?: boolean; category?: "study" | "housework" | "behavior" | "health" | "custom" }
): Promise<TaskDefinition[]> {
  const conditions = [eq(schema.taskDefinitions.familyId, familyId)];

  if (options?.activeOnly) {
    conditions.push(eq(schema.taskDefinitions.isActive, true));
  }

  if (options?.category) {
    conditions.push(eq(schema.taskDefinitions.category, options.category));
  }

  const results = await db.query.taskDefinitions.findMany({
    where: and(...conditions),
    orderBy: [desc(schema.taskDefinitions.isActive), asc(schema.taskDefinitions.name)],
  });
  return results;
}

/**
 * 根据 ID 获取任务定义
 */
export async function getTaskDefinitionById(id: string): Promise<TaskDefinition | undefined> {
  const result = await db.query.taskDefinitions.findFirst({
    where: eq(schema.taskDefinitions.id, id),
  });
  return result;
}

/**
 * 更新任务定义
 */
export async function updateTaskDefinition(
  id: string,
  data: Partial<NewTaskDefinition>
): Promise<TaskDefinition | undefined> {
  const [task] = await db
    .update(schema.taskDefinitions)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.taskDefinitions.id, id))
    .returning();
  return task;
}

/**
 * 软删除任务定义（标记为不活跃）
 */
export async function deactivateTaskDefinition(id: string): Promise<TaskDefinition | undefined> {
  const [task] = await db
    .update(schema.taskDefinitions)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(schema.taskDefinitions.id, id))
    .returning();
  return task;
}

// ============================================================
// 行为记录相关查询
// ============================================================

/**
 * 记录行为
 */
export async function recordBehavior(data: NewBehaviorLog): Promise<BehaviorLog> {
  const [log] = await db.insert(schema.behaviorLogs).values(data).returning();
  return log;
}

/**
 * 获取成员的行为记录
 */
export async function getBehaviorLogs(
  memberId: string,
  options?: {
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<BehaviorLog[]> {
  const conditions = [eq(schema.behaviorLogs.memberId, memberId)];

  if (options?.startDate) {
    conditions.push(gte(schema.behaviorLogs.recordedAt, options.startDate));
  }

  if (options?.endDate) {
    conditions.push(lte(schema.behaviorLogs.recordedAt, options.endDate));
  }

  const results = await db.query.behaviorLogs.findMany({
    where: and(...conditions),
    with: {
      taskDefinition: true,
      recordedBy: true,
    },
    orderBy: [desc(schema.behaviorLogs.recordedAt)],
    limit: options?.limit,
    offset: options?.offset,
  });
  return results;
}

/**
 * 获取家庭的所有行为记录
 */
export async function getFamilyBehaviorLogs(
  familyId: string,
  options?: {
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<BehaviorLog[]> {
  const conditions = [eq(schema.behaviorLogs.familyId, familyId)];

  if (options?.startDate) {
    conditions.push(gte(schema.behaviorLogs.recordedAt, options.startDate));
  }

  if (options?.endDate) {
    conditions.push(lte(schema.behaviorLogs.recordedAt, options.endDate));
  }

  const results = await db.query.behaviorLogs.findMany({
    where: and(...conditions),
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
    limit: options?.limit,
    offset: options?.offset,
  });
  return results;
}

/**
 * 计算成员在日期范围内的行为统计
 */
export async function getBehaviorStats(
  memberId: string,
  startDate: Date,
  endDate: Date
): Promise<{ totalPoints: number; positiveCount: number; negativeCount: number }> {
  const logs = await db
    .select({
      points: schema.behaviorLogs.points,
    })
    .from(schema.behaviorLogs)
    .where(
      and(
        eq(schema.behaviorLogs.memberId, memberId),
        gte(schema.behaviorLogs.recordedAt, startDate),
        lte(schema.behaviorLogs.recordedAt, endDate)
      )
    );

  return logs.reduce(
    (acc, log) => ({
      totalPoints: acc.totalPoints + log.points,
      positiveCount: acc.positiveCount + (log.points > 0 ? 1 : 0),
      negativeCount: acc.negativeCount + (log.points < 0 ? 1 : 0),
    }),
    { totalPoints: 0, positiveCount: 0, negativeCount: 0 }
  );
}

// ============================================================
// 积分交易相关查询
// ============================================================

/**
 * 创建积分交易记录
 */
export async function createPointTransaction(data: NewPointTransaction): Promise<PointTransaction> {
  const [transaction] = await db.insert(schema.pointTransactions).values(data).returning();
  return transaction;
}

/**
 * 获取成员的积分交易历史
 */
export async function getPointTransactions(
  memberId: string,
  options?: {
    limit?: number;
    offset?: number;
    type?: "earn" | "spend" | "adjust" | "expire";
  }
): Promise<PointTransaction[]> {
  const conditions = [eq(schema.pointTransactions.memberId, memberId)];

  if (options?.type) {
    conditions.push(eq(schema.pointTransactions.type, options.type));
  }

  const results = await db.query.pointTransactions.findMany({
    where: and(...conditions),
    orderBy: [desc(schema.pointTransactions.createdAt)],
    limit: options?.limit,
    offset: options?.offset,
  });
  return results;
}

/**
 * 获取家庭积分交易汇总
 */
export async function getFamilyPointSummary(familyId: string): Promise<
  { memberId: string; totalEarned: number; totalSpent: number; balance: number }[]
> {
  const results = await db
    .select({
      memberId: schema.pointTransactions.memberId,
      totalEarned: sql<number>`SUM(CASE WHEN ${schema.pointTransactions.type} = 'earn' THEN ${schema.pointTransactions.amount} ELSE 0 END)`,
      totalSpent: sql<number>`SUM(CASE WHEN ${schema.pointTransactions.type} = 'spend' THEN ABS(${schema.pointTransactions.amount}) ELSE 0 END)`,
      balance: sql<number>`SUM(${schema.pointTransactions.amount})`,
    })
    .from(schema.pointTransactions)
    .where(eq(schema.pointTransactions.familyId, familyId))
    .groupBy(schema.pointTransactions.memberId);

  return results;
}

// ============================================================
// 愿望相关查询
// ============================================================

/**
 * 创建愿望
 */
export async function createWish(data: NewWish): Promise<Wish> {
  const [wish] = await db.insert(schema.wishes).values(data).returning();
  return wish;
}

/**
 * 获取家庭的愿望列表
 */
export async function getWishes(
  familyId: string,
  options?: {
    memberId?: string;
    status?: "pending" | "approved" | "rejected" | "completed" | "cancelled";
  }
): Promise<Wish[]> {
  const conditions = [eq(schema.wishes.familyId, familyId)];

  if (options?.memberId) {
    conditions.push(eq(schema.wishes.memberId, options.memberId));
  }

  if (options?.status) {
    conditions.push(eq(schema.wishes.status, options.status));
  }

  const results = await db.query.wishes.findMany({
    where: and(...conditions),
    with: {
      member: {
        with: {
          user: true,
        },
      },
      approvedBy: true,
    },
    orderBy: [desc(schema.wishes.createdAt)],
  });
  return results;
}

/**
 * 根据 ID 获取愿望
 */
export async function getWishById(id: string): Promise<Wish | undefined> {
  const result = await db.query.wishes.findFirst({
    where: eq(schema.wishes.id, id),
    with: {
      member: {
        with: {
          user: true,
        },
      },
      approvedBy: true,
      redemptions: true,
    },
  });
  return result;
}

/**
 * 批准愿望
 */
export async function approveWish(
  wishId: string,
  approvedBy: string
): Promise<Wish | undefined> {
  const [wish] = await db
    .update(schema.wishes)
    .set({
      status: "approved",
      approvedBy,
      approvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(schema.wishes.id, wishId))
    .returning();
  return wish;
}

/**
 * 拒绝愿望
 */
export async function rejectWish(
  wishId: string,
  note?: string
): Promise<Wish | undefined> {
  const [wish] = await db
    .update(schema.wishes)
    .set({
      status: "rejected",
      note,
      updatedAt: new Date(),
    })
    .where(eq(schema.wishes.id, wishId))
    .returning();
  return wish;
}

/**
 * 完成愿望
 */
export async function completeWish(wishId: string): Promise<Wish | undefined> {
  const [wish] = await db
    .update(schema.wishes)
    .set({
      status: "completed",
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(schema.wishes.id, wishId))
    .returning();
  return wish;
}

// ============================================================
// 愿望兑换相关查询
// ============================================================

/**
 * 创建愿望兑换记录
 */
export async function createWishRedemption(data: NewWishRedemption): Promise<WishRedemption> {
  const [redemption] = await db.insert(schema.wishRedemptions).values(data).returning();
  return redemption;
}

/**
 * 获取兑换记录
 */
export async function getWishRedemptions(
  options?: {
    memberId?: string;
    familyId?: string;
    status?: "pending" | "fulfilled" | "cancelled";
  }
): Promise<WishRedemption[]> {
  const conditions = [];

  if (options?.memberId) {
    conditions.push(eq(schema.wishRedemptions.memberId, options.memberId));
  }

  if (options?.familyId) {
    conditions.push(eq(schema.wishRedemptions.familyId, options.familyId));
  }

  if (options?.status) {
    conditions.push(eq(schema.wishRedemptions.status, options.status));
  }

  const results = await db.query.wishRedemptions.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    with: {
      wish: true,
      member: {
        with: {
          user: true,
        },
      },
      fulfilledBy: true,
    },
    orderBy: [desc(schema.wishRedemptions.createdAt)],
  });
  return results;
}

/**
 * 履行兑换
 */
export async function fulfillRedemption(
  redemptionId: string,
  fulfilledBy: string
): Promise<WishRedemption | undefined> {
  const [redemption] = await db
    .update(schema.wishRedemptions)
    .set({
      status: "fulfilled",
      fulfilledBy,
      fulfilledAt: new Date(),
    })
    .where(eq(schema.wishRedemptions.id, redemptionId))
    .returning();
  return redemption;
}

// ============================================================
// 复杂业务查询
// ============================================================

/**
 * 获取家庭仪表板数据
 */
export async function getFamilyDashboard(familyId: string): Promise<{
  family: Family;
  members: (FamilyMember & { user: User })[];
  recentLogs: BehaviorLog[];
  pendingWishes: Wish[];
  topTasks: TaskDefinition[];
}> {
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
    where: and(eq(schema.taskDefinitions.familyId, familyId), eq(schema.taskDefinitions.isActive, true)),
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
  const results = await db.query.users.findMany({
    where: or(
      like(schema.users.name, `%${query}%`),
      like(schema.users.phone, `%${query}%`)
    ),
    limit: 10,
  });
  return results;
}
