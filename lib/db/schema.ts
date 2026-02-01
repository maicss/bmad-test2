/**
 * Family Reward - Database Schema
 * 
 * 使用 Drizzle ORM + bun:sqlite
 * 遵循 Better-Auth 的 Bun SQLite Adapter 规范
 */

import { sqliteTable, text, integer, real, blob, primaryKey } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// ============================================================
// Better-Auth 核心表
// ============================================================

export const users = sqliteTable("user", {
  id: text("id").primaryKey(),
  email: text("email").unique(),
  name: text("name").notNull(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  // Family Reward 扩展字段
  role: text("role", { enum: ["admin", "parent", "child"] }).notNull().default("parent"),
  phone: text("phone").unique(),
  gender: text("gender", { enum: ["male", "female", "other"] }),
  pinHash: text("pin_hash"), // 儿童 PIN 码哈希 (使用 Bun.password)
});

export const sessions = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const accounts = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verifications = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

// ============================================================
// Family Reward 业务表
// ============================================================

/**
 * 家庭表
 * 每个家庭有唯一的家庭ID
 */
export const families = sqliteTable("family", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  inviteCode: text("invite_code").unique(),
  inviteCodeExpiresAt: integer("invite_code_expires_at", { mode: "timestamp" }),
  maxParents: integer("max_parents").notNull().default(2),
  maxChildren: integer("max_children").notNull().default(1),
  validityMonths: integer("validity_months").notNull().default(12),
  registrationType: text("registration_type", { enum: ["self", "admin"] }).notNull().default("self"),
  status: text("status", { enum: ["pending", "approved", "suspended", "deleted"] }).notNull().default("pending"),
  province: text("province"),
  city: text("city"),
  previousStatus: text("previous_status", { enum: ["pending", "approved", "suspended"] }),
  submittedAt: integer("submitted_at", { mode: "timestamp" }),
  reviewedAt: integer("reviewed_at", { mode: "timestamp" }),
  reviewedBy: text("reviewed_by"),
  rejectionReason: text("rejection_reason"),
  suspendedAt: integer("suspended_at", { mode: "timestamp" }),
  suspendedBy: text("suspended_by"),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
  deletedBy: text("deleted_by"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

/**
 * 家庭成员表
 * 关联用户和家庭，定义成员在家庭中的角色
 */
export const familyMembers = sqliteTable("family_member", {
  id: text("id").primaryKey(),
  familyId: text("family_id")
    .notNull()
    .references(() => families.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["primary", "secondary", "child"] }).notNull(),
    // primary: 主要家长
    // secondary: 次要家长（另一位家长）
    // child: 孩子
  displayName: text("display_name"), // 在家庭中的显示名称
  currentPoints: real("current_points").notNull().default(0), // 当前积分余额
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (t) => ({
  pk: primaryKey({ columns: [t.familyId, t.userId] }),
}));

/**
 * 行为任务定义表
 * 家长定义的行为规范和对应的积分值
 */
export const taskDefinitions = sqliteTable("task_definition", {
  id: text("id").primaryKey(),
  familyId: text("family_id")
    .notNull()
    .references(() => families.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // 任务名称，如 "按时完成作业"
  description: text("description"), // 任务描述
  category: text("category", { enum: ["study", "housework", "behavior", "health", "custom"] })
    .notNull()
    .default("custom"),
  points: real("points").notNull(), // 积分值（正数奖励，负数扣分）
  icon: text("icon"), // 图标名称（Lucide 图标）
  color: text("color"), // 颜色代码
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  dailyLimit: integer("daily_limit"), // 每日限制次数
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

/**
 * 行为记录表
 * 记录实际的行为发生和积分变动
 */
export const behaviorLogs = sqliteTable("behavior_log", {
  id: text("id").primaryKey(),
  familyId: text("family_id")
    .notNull()
    .references(() => families.id, { onDelete: "cascade" }),
  taskDefinitionId: text("task_definition_id")
    .references(() => taskDefinitions.id, { onDelete: "set null" }),
  memberId: text("member_id") // family_members.id 的引用
    .notNull()
    .references(() => familyMembers.id, { onDelete: "cascade" }),
  action: text("action", { enum: ["completed", "violated", "manual_add", "manual_deduct"] })
    .notNull(),
  points: real("points").notNull(), // 实际变动的积分
  description: text("description"), // 具体描述
  recordedBy: text("recorded_by") // 记录者ID
    .notNull()
    .references(() => users.id),
  recordedAt: integer("recorded_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  note: text("note"), // 备注
});

/**
 * 积分交易记录表
 * 记录积分的变动历史（更详细的审计追踪）
 */
export const pointTransactions = sqliteTable("point_transaction", {
  id: text("id").primaryKey(),
  familyId: text("family_id")
    .notNull()
    .references(() => families.id, { onDelete: "cascade" }),
  memberId: text("member_id")
    .notNull()
    .references(() => familyMembers.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["earn", "spend", "adjust", "expire"] }).notNull(),
  amount: real("amount").notNull(), // 变动数量
  balanceAfter: real("balance_after").notNull(), // 变动后余额
  source: text("source", { enum: ["task", "wish", "manual", "system"] }).notNull(),
  sourceId: text("source_id"), // 关联的任务ID或愿望ID
  description: text("description").notNull(),
  createdBy: text("created_by")
    .references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

/**
 * 愿望表
 * 孩子可以兑换的物品或体验
 */
export const wishes = sqliteTable("wish", {
  id: text("id").primaryKey(),
  familyId: text("family_id")
    .notNull()
    .references(() => families.id, { onDelete: "cascade" }),
  memberId: text("member_id") // 提出愿望的成员
    .notNull()
    .references(() => familyMembers.id, { onDelete: "cascade" }),
  title: text("title").notNull(), // 愿望标题
  description: text("description"), // 愿望描述
  type: text("type", { enum: ["item", "activity"] }).notNull(),
    // item: 物品
    // activity: 互动体验（如 "去游乐园"）
  pointsRequired: real("points_required").notNull(), // 所需积分
  imageUrl: text("image_url"), // 愿望图片
  status: text("status", { enum: ["pending", "approved", "rejected", "completed", "cancelled"] })
    .notNull()
    .default("pending"),
  approvedBy: text("approved_by")
    .references(() => users.id),
  approvedAt: integer("approved_at", { mode: "timestamp" }),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  note: text("note"), // 备注
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

/**
 * 愿望兑换记录表
 */
export const wishRedemptions = sqliteTable("wish_redemption", {
  id: text("id").primaryKey(),
  familyId: text("family_id")
    .notNull()
    .references(() => families.id, { onDelete: "cascade" }),
  wishId: text("wish_id")
    .notNull()
    .references(() => wishes.id, { onDelete: "cascade" }),
  memberId: text("member_id")
    .notNull()
    .references(() => familyMembers.id, { onDelete: "cascade" }),
  pointsSpent: real("points_spent").notNull(),
  status: text("status", { enum: ["pending", "fulfilled", "cancelled"] })
    .notNull()
    .default("pending"),
  fulfilledBy: text("fulfilled_by")
    .references(() => users.id),
  fulfilledAt: integer("fulfilled_at", { mode: "timestamp" }),
  note: text("note"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// ============================================================
// 关系定义
// ============================================================

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  familyMembers: many(familyMembers),
  createdTasks: many(taskDefinitions),
  recordedBehaviors: many(behaviorLogs),
}));

export const familiesRelations = relations(families, ({ many }) => ({
  members: many(familyMembers),
  taskDefinitions: many(taskDefinitions),
  behaviorLogs: many(behaviorLogs),
  wishes: many(wishes),
}));

export const familyMembersRelations = relations(familyMembers, ({ one, many }) => ({
  family: one(families, {
    fields: [familyMembers.familyId],
    references: [families.id],
  }),
  user: one(users, {
    fields: [familyMembers.userId],
    references: [users.id],
  }),
  behaviorLogs: many(behaviorLogs),
  pointTransactions: many(pointTransactions),
  wishes: many(wishes),
  wishRedemptions: many(wishRedemptions),
}));

export const taskDefinitionsRelations = relations(taskDefinitions, ({ one, many }) => ({
  family: one(families, {
    fields: [taskDefinitions.familyId],
    references: [families.id],
  }),
  createdBy: one(users, {
    fields: [taskDefinitions.createdBy],
    references: [users.id],
  }),
  behaviorLogs: many(behaviorLogs),
}));

export const behaviorLogsRelations = relations(behaviorLogs, ({ one }) => ({
  family: one(families, {
    fields: [behaviorLogs.familyId],
    references: [families.id],
  }),
  taskDefinition: one(taskDefinitions, {
    fields: [behaviorLogs.taskDefinitionId],
    references: [taskDefinitions.id],
  }),
  member: one(familyMembers, {
    fields: [behaviorLogs.memberId],
    references: [familyMembers.id],
  }),
  recordedBy: one(users, {
    fields: [behaviorLogs.recordedBy],
    references: [users.id],
  }),
}));

export const wishesRelations = relations(wishes, ({ one, many }) => ({
  family: one(families, {
    fields: [wishes.familyId],
    references: [families.id],
  }),
  member: one(familyMembers, {
    fields: [wishes.memberId],
    references: [familyMembers.id],
  }),
  approvedBy: one(users, {
    fields: [wishes.approvedBy],
    references: [users.id],
  }),
  redemptions: many(wishRedemptions),
}));

export const wishRedemptionsRelations = relations(wishRedemptions, ({ one }) => ({
  wish: one(wishes, {
    fields: [wishRedemptions.wishId],
    references: [wishes.id],
  }),
  member: one(familyMembers, {
    fields: [wishRedemptions.memberId],
    references: [familyMembers.id],
  }),
  fulfilledBy: one(users, {
    fields: [wishRedemptions.fulfilledBy],
    references: [users.id],
  }),
}));

export const pointTransactionsRelations = relations(pointTransactions, ({ one }) => ({
  family: one(families, {
    fields: [pointTransactions.familyId],
    references: [families.id],
  }),
  member: one(familyMembers, {
    fields: [pointTransactions.memberId],
    references: [familyMembers.id],
  }),
  createdBy: one(users, {
    fields: [pointTransactions.createdBy],
    references: [users.id],
  }),
}));

// ============================================================
// 类型导出
// ============================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type Family = typeof families.$inferSelect;
export type NewFamily = typeof families.$inferInsert;

export type FamilyMember = typeof familyMembers.$inferSelect;
export type NewFamilyMember = typeof familyMembers.$inferInsert;

export type TaskDefinition = typeof taskDefinitions.$inferSelect;
export type NewTaskDefinition = typeof taskDefinitions.$inferInsert;

export type BehaviorLog = typeof behaviorLogs.$inferSelect;
export type NewBehaviorLog = typeof behaviorLogs.$inferInsert;

export type PointTransaction = typeof pointTransactions.$inferSelect;
export type NewPointTransaction = typeof pointTransactions.$inferInsert;

export type Wish = typeof wishes.$inferSelect;
export type NewWish = typeof wishes.$inferInsert;

export type WishRedemption = typeof wishRedemptions.$inferSelect;
export type NewWishRedemption = typeof wishRedemptions.$inferInsert;

/**
 * 图片表
 * 存储用户上传的图片信息
 */
export const images = sqliteTable("image", {
  id: text("id").primaryKey(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  storagePath: text("storage_path").notNull(),
  url: text("url").notNull(),
  uploaderId: text("uploader_id"),
  uploaderName: text("uploader_name"),
  uploaderPhone: text("uploader_phone"),
  uploaderFamilyId: text("uploader_family_id"),
  ownerType: text("owner_type", { enum: ["admin", "family"] }).notNull(),
  ownerId: text("owner_id").notNull(),
  referenceCount: integer("reference_count").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export type Image = typeof images.$inferSelect;
export type NewImage = typeof images.$inferInsert;

export const dateStrategyTemplates = sqliteTable("date_strategy_template", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  region: text("region").notNull(),
  year: integer("year").notNull(),
  isPublic: integer("is_public", { mode: "boolean" }).notNull().default(true),
  dates: text("dates").notNull(),
  copyCount: integer("copy_count").notNull().default(0),
  createdBy: text("created_by"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export type DateStrategyTemplate = typeof dateStrategyTemplates.$inferSelect;
export type NewDateStrategyTemplate = typeof dateStrategyTemplates.$inferInsert;
