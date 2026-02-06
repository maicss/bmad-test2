## 注册

- 管理员开通
  - 表单：
    - 手机号 必填 校验手机号规则
    - 姓 必填 2-3个字符
    - 名 选填 2-5个字符
    - 性别 必填，男/女
    - 家庭名称，选填，默认值为 <姓><性别男? '先生': '女士'>的家庭
    - 家长数量 必选 数字 1-10
    - 儿童数量 必选 数字 1-10
    - 家庭称呼 必填 select 爸爸，妈妈，爷爷，奶奶
    - 地区 必选 省/市
    - 期限 必选 select 3个月/6个月/12个月/18个月/24个月/36个月

- 家长自主注册。入口在首页。
  - 表单：
    - 手机号 必填 校验手机号规则
    - OTP验证码，必填
    - 姓 必填 2-3个字符
    - 名 选填 2-5个字符
    - 性别 必填，男/女
    - 家庭名称，选填，默认值为 <姓><性别 男 ? '先生': '女士'>的家庭
    - 家长数量 必选 数字 1-10
    - 儿童数量 必选 数字 1-10
    - 家庭称呼 必填 select 爸爸，妈妈，爷爷，奶奶
    - 地区 必选 省/市

成功后：

- users 表里创建家长信息
- 在 families 表里新建家庭数据，并关联主要家长为 users 的 家长id

家长自主注册需要管理员批准

表名称 families

表字段

```ts
export const families = sqliteTable("families", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  inviteCode: text("invite_code").unique(),
  inviteCodeExpiresAt: integer("invite_code_expires_at", { mode: "timestamp" }),
  maxParents: integer("max_parents").notNull().default(2),
  maxChildren: integer("max_children").notNull().default(1),
  validityMonths: integer("validity_months").notNull().default(12),
  registrationType: text("registration_type", { enum: ["self", "admin"] })
    .notNull()
    .default("self"),
  status: text("status", {
    enum: ["pending", "approved", "suspended", "deleted"],
  })
    .notNull()
    .default("pending"),
  province: text("province"),
  city: text("city"),
  previousStatus: text("previous_status", {
    enum: ["pending", "approved", "suspended"],
  }),
  submittedAt: integer("submitted_at", { mode: "timestamp" }),
  reviewedAt: integer("reviewed_at", { mode: "timestamp" }),
  reviewedBy: text("reviewed_by"),
  rejectionReason: text("rejection_reason"),
  suspendedAt: integer("suspended_at", { mode: "timestamp" }),
  suspendedBy: text("suspended_by"),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
  deletedBy: text("deleted_by"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
```
