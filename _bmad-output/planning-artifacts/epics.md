---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories']
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
---

# bmad-test2 - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for bmad-test2, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

**FR1:** 家长可以使用手机号注册账户
**FR2:** 家长可以使用手机号登录账户
**FR3:** 儿童可以使用PIN码登录账户
**FR4:** 家长可以邀请其他家长加入家庭
**FR5:** 家长可以添加儿童到家庭
**FR6:** 系统支持多设备同时登录
**FR7:** 主要家长可以管理家庭其他成员账户（创建、挂起、转移主要家长角色）
**FR8:** 家长可以创建计划任务模板
**FR9:** 家长可以设置任务的积分值
**FR10:** 家长可以设置任务的日期规则（循环、排除、特定日期）
**FR11:** 系统根据日期策略自动生成任务实例
**FR12:** 家长可以暂停/恢复/删除任务计划
**FR13:** 家长可以使用任务模板快速创建任务
**FR14:** 家长可以批量审批任务
**FR15:** 儿童可以查看今日任务列表
**FR16:** 儿童可以标记任务完成
**FR17:** 家长可以审批任务完成
**FR18:** 家长可以驳回任务完成标记
**FR19:** 家长可以临时创建一次性任务
**FR20:** 系统根据任务完成情况计算积分
**FR21:** 系统支持正向积分（好行为奖励）
**FR22:** 系统支持负向积分（坏行为扣除）
**FR23:** 家长审批后积分才正式结算
**FR24:** 家长可以临时加减分
**FR25:** 家长可以查看积分历史记录
**FR26:** 家长可以根据儿童查看积分变化趋势图表
**FR27:** 儿童可以查看当前积分余额
**FR28:** 积分变动线性叠加，不回退，可为负数
**FR29:** 儿童可以创建愿望（物品或体验）
**FR30:** 家长可以审核愿望
**FR31:** 家长可以设置愿望的积分门槛
**FR32:** 系统显示愿望进度条（当前积分/所需积分）
**FR33:** 儿童可以查看所有愿望及其进度
**FR34:** 儿童可以在积分足够时发起兑换请求
**FR35:** 家长可以确认或拒绝兑换请求
**FR36:** 兑换成功后系统自动扣除积分
**FR37:** 已兑换愿望移动到历史记录
**FR38:** 系统追踪任务连续完成次数
**FR39:** 系统支持线性Combo（连续N次固定奖励）
**FR40:** 系统支持阶梯Combo（连续次数越多奖励越高）
**FR41:** Combo中断时系统发送提醒
**FR42:** 儿童可以查看当前Combo状态
**FR43:** 家长可以配置Combo规则
**FR44:** 儿童可以每日签到获得积分
**FR45:** 系统展示徽章成就墙
**FR46:** 系统支持徽章获得通知
**FR47:** 家长可以查看儿童成长曲线
**FR48:** 系统计算并展示儿童等级
**FR49:** 管理员可以创建任务模板
**FR50:** 管理员可以创建愿望模板
**FR51:** 管理员可以创建Combo规则模板
**FR52:** 管理员可以管理图床（上传、查看、删除）
**FR53:** 管理员可以查看全局统计数据
**FR54:** 管理员可以向家长发送系统通知
**FR55:** 系统向家长推送任务提醒
**FR56:** 系统向家长推送审批通知
**FR57:** 系统向家长推送愿望相关通知
**FR58:** 系统发送Combo即将中断提醒
**FR59:** 家长可以集中查看所有通知
**FR60:** 家长可以配置家庭全局规则

### NonFunctional Requirements

**Performance:**
- NFR1: 孩子端页面加载时间 < 2秒
- NFR2: 家长端数据统计页面加载 < 3秒
- NFR3: API 响应时间 < 500ms（P95）
- NFR4: 实时数据同步延迟 < 3秒
- NFR5: 支持 5000 DAU（日活跃用户）
- NFR6: 高峰时段（17:00-20:00）并发用户支持
- NFR7: 批量操作（审批）性能优化

**Security:**
- NFR8: 所有数据传输使用 HTTPS/TLS 1.3
- NFR9: 敏感数据（手机号、PIN码）加密存储
- NFR10: 密码哈希使用 bcrypt 算法
- NFR11: 会话令牌使用 HttpOnly Cookie
- NFR12: 基于角色的权限控制（RBAC）
- NFR13: 会话管理（36小时过期，滚动刷新）
- NFR14: 操作日志审计（记录所有关键操作）

**Compliance:**
- NFR15: 符合 COPPA（美国，13岁以下儿童在线隐私保护）
- NFR16: 符合 GDPR（欧盟，16岁以下数据保护）
- NFR17: 符合中国《儿童个人信息网络保护规定》（14岁以下）
- NFR18: 数据留存：3年合规保留
- NFR19: 软删除：7天可恢复窗口
- NFR20: 用户数据导出权（GDPR要求）

**Scalability:**
- NFR21: 初期：支持 5000 DAU
- NFR22: 二期演进：PostgreSQL + Redis 支持更大规模
- NFR23: 数据库连接池优化
- NFR24: 预留水平扩展能力
- NFR25: 图片资源CDN加速（生产环境）
- NFR26: 历史数据可按年/月分区归档
- NFR27: 冷热数据分离策略

**Accessibility:**
- NFR28: 大按钮、简洁界面（适合7岁以上儿童独立使用）
- NFR29: 视觉反馈（动画、进度条、音效）
- NFR30: 图标+文字组合，降低阅读门槛
- NFR31: 色彩对比度符合 WCAG AA 标准
- NFR32: 批量操作支持（一键审批多个任务）
- NFR33: 数据可视化（图表、趋势曲线）
- NFR34: 快速导航和搜索功能
- NFR35: 响应式设计适配手机、平板、PC

**Reliability:**
- NFR36: 系统可用性目标 > 99%（排除计划维护时间）
- NFR37: 离线能力：核心功能离线可用（查看任务、积分）
- NFR38: 数据备份：定期自动备份
- NFR39: 网络断线自动重连
- NFR40: 离线操作队列，上线后自动同步
- NFR41: 冲突检测与解决机制

### Additional Requirements

**From Architecture Document:**
- **Starter Template:** Architecture specifies Brownfield project (existing codebase with tech stack) - NOT a greenfield template. Epic 1 Story 1 must account for working within existing codebase.
- **Technical Stack Requirements:**
  - Bun 1.3.x+ runtime (NO Node.js compatibility layer)
  - Next.js 16.x + React 19.x
  - bun:sqlite + Drizzle ORM 0.45.x+ (NO native SQL)
  - Better-Auth 1.4.x with phone plugin + PIN login
  - Tailwind CSS 4 + Shadcn UI 3.7.0+
  - TypeScript 5 strict mode (NO `any` type, NO @ts-ignore)
  - Zustand for state management
  - Bun Test + Playwright for testing (BDD style)
- **Architecture Patterns:**
  - Database queries: lib/db/queries/ directory with per-table files (users.ts, tasks.ts, families.ts, etc.)
  - Function-based queries (NOT Repository pattern)
  - BDD Development: Given-When-Then format, tests BEFORE implementation
  - File length limit: All files ≤ 800 lines
- **PWA Requirements:**
  - Service Worker with Background Sync API
  - IndexedDB for offline queue
  - Real-time sync: 2-3 second polling (with SSE upgrade path)
- **Cross-Cutting Concerns:**
  - Real-time data consistency
  - Multi-device sync and offline queue
  - Children's privacy compliance (COPPA/GDPR/China)
  - Dual-end experience differentiation (Parent vs Child)
  - Points settlement and Combo calculation atomicity

**From UX Design Document:**
- **Responsive Design Requirements:**
  - Child-end: Tablet-optimized (landscape, ≥768px), large buttons (≥80x80pt), gamified UI
  - Parent-end: Mini-program optimized (portrait, <450px), efficient batch operations
  - Admin-end: PC desktop layout (≥1024px)
- **Accessibility Requirements:**
  - Color contrast ≥ 4.5:1
  - Touch targets minimum 44x44pt (child-end 80x80pt recommended)
  - Keyboard navigation support
  - Screen reader support with aria-labels
- **Animation Requirements:**
  - CSS animations for simple transitions
  - Framer Motion for complex gamification (badge celebrations)
  - Page transitions: slide in/out
  - Progress bar updates: number rolling animation
- **Error Handling UX:**
  - Network status indicator (top bar: green/orange/red)
  - Conflict resolution UI: user choice for offline vs server version
  - Optimistic UI with instant feedback
  - Celebration animations for achievements
- **Browser/Device Compatibility:**
  - Minimum: Safari 26.2
  - Chrome latest
  - Edge latest
  - Firefox latest
  - iOS Safari, Android Chrome, WeChat Mini Program

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1 | Epic 1 | 家长手机号注册 |
| FR2 | Epic 1 | 家长手机号登录 |
| FR3 | Epic 1 | 儿童PIN码登录 |
| FR4 | Epic 1 | 邀请其他家长 |
| FR5 | Epic 1 | 添加儿童到家庭 |
| FR6 | Epic 1 | 多设备同时登录 |
| FR7 | Epic 1 | 主要家长管理家庭成员 |
| FR8 | Epic 2 | 创建计划任务模板 |
| FR9 | Epic 2 | 设置任务积分值 |
| FR10 | Epic 2 | 设置日期规则 |
| FR11 | Epic 2 | 系统自动生成任务 |
| FR12 | Epic 2 | 暂停/恢复/删除任务计划 |
| FR13 | Epic 2 | 使用模板快速创建 |
| FR14 | Epic 2 | 批量审批任务 |
| FR15 | Epic 2 | 儿童查看今日任务 |
| FR16 | Epic 2 | 儿童标记任务完成 |
| FR17 | Epic 2 | 家长审批任务 |
| FR18 | Epic 2 | 家长驳回任务 |
| FR19 | Epic 2 | 临时创建一次性任务 |
| FR55 | Epic 2 | 任务提醒推送（已从Epic 6迁移） |
| FR56 | Epic 2 | 审批通知推送（已从Epic 6迁移） |
| FR20 | Epic 3 | 系统计算积分 |
| FR21 | Epic 3 | 正向积分奖励 |
| FR22 | Epic 3 | 负向积分扣除 |
| FR23 | Epic 3 | 审批后积分结算 |
| FR24 | Epic 3 | 临时加减分 |
| FR25 | Epic 3 | 积分历史记录 |
| FR26 | Epic 3 | 积分趋势图表 |
| FR27 | Epic 3 | 儿童查看积分余额 |
| FR28 | Epic 3 | 积分线性叠加不回退 |
| FR29 | Epic 4 | 儿童创建愿望 |
| FR30 | Epic 4 | 家长审核愿望 |
| FR31 | Epic 4 | 设置愿望积分门槛 |
| FR32 | Epic 4 | 愿望进度条显示 |
| FR33 | Epic 4 | 查看所有愿望 |
| FR34 | Epic 4 | 发起兑换请求 |
| FR35 | Epic 4 | 确认/拒绝兑换 |
| FR36 | Epic 4 | 兑换扣除积分 |
| FR37 | Epic 4 | 已兑换愿望历史 |
| FR57 | Epic 4 | 愿望相关通知（已从Epic 6迁移） |
| FR38 | Epic 5 | 追踪连续完成次数 |
| FR39 | Epic 5 | 线性Combo奖励 |
| FR40 | Epic 5 | 阶梯Combo奖励 |
| FR41 | Epic 5 | Combo中断提醒 |
| FR42 | Epic 5 | 查看Combo状态 |
| FR43 | Epic 5 | 配置Combo规则 |
| FR44 | Epic 5 | 每日签到 |
| FR45 | Epic 5 | 徽章成就墙 |
| FR46 | Epic 5 | 徽章获得通知 |
| FR47 | Epic 5 | 儿童成长曲线 |
| FR48 | Epic 5 | 儿童等级系统 |
| FR58 | Epic 5 | Combo中断提醒（已从Epic 6迁移） |
| FR49 | Epic 6 | 管理员创建任务模板 |
| FR50 | Epic 6 | 管理员创建愿望模板 |
| FR51 | Epic 6 | 管理员创建Combo模板 |
| FR52 | Epic 6 | 图床管理 |
| FR53 | Epic 6 | 全局统计数据 |
| FR54 | Epic 6 | 系统通知 |
| FR59 | Epic 6 | 集中通知中心 |
| FR60 | Epic 6 | 家庭全局规则配置 |

**Total Coverage:** 60/60 FRs (100%)

## Epic List

### Epic 1: User Authentication & Family Management
**User Outcome:** Users can register, login, and manage their family structure

**FRs covered:** FR1-FR7 (7 requirements)
- FR1: 家长手机号注册
- FR2: 家长手机号登录  
- FR3: 儿童PIN码登录
- FR4: 邀请其他家长
- FR5: 添加儿童到家庭
- FR6: 多设备同时登录
- FR7: 主要家长管理家庭成员

**Value:** Establishes the foundation - without this, no one can use the system

---

### Epic 2: Task Planning & Management (With Notifications)
**User Outcome:** Parents can create and manage tasks; children can complete them

**FRs covered:** FR8-FR19 + FR55-FR56 (14 requirements)
- FR8-13: 任务计划创建、设置、自动生成、暂停/恢复
- FR14: 批量审批任务
- FR15-16: 儿童查看和标记任务完成
- FR17-18: 家长审批/驳回任务
- FR19: 临时创建一次性任务
- **Migrated from Epic 6:**
  - FR55: 任务提醒推送（定时，如每天8:00）
  - FR56: 实时审批通知（孩子标记完成后3秒内推送给家长）

**Value:** Core behavioral management functionality - The primary product value

**Stories included:**
- Task creation and management workflow
- Task approval workflow with real-time notifications
- Task reminder system (scheduled push notifications)
- Batch approval for parents
- Child task completion and status tracking
- Temporary task creation

**Integration Notes:**
- Epic 2 triggers Epic 3's points calculation on approval
- Receives real-time notifications via notification system stories

---

### Epic 3: Points System & Balance Management (With Notifications)
**User Outcome:** Points are calculated, tracked, and visible to all users

**FRs covered:** FR20-FR28 (9 requirements)
- FR20-23: 积分计算、正向/负向积分、审批后结算
- FR24: 临时加减分
- FR25-26: 积分历史记录和趋势图表
- FR27: 儿童查看积分余额
- FR28: 积分线性叠加不回退

**Value:** The quantified reward mechanism that drives motivation

**Stories included:**
- Points calculation and settlement workflow
- Points history with filtering (7 days / 30 days / all)
- Points trend charts for parents
- **GDPR Compliance:** Points history export functionality (data export right)
- Real-time balance display on child dashboard
- **Migrated from Epic 6:**
  - Points change notifications (approval, deduction, adjustment)
  - Points milestone achievement notifications

**Integration Notes:**
- Triggered by Epic 2's task approval
- Triggers Epic 4's wish redemption
- Notifications via dedicated notification stories

---

### Epic 4: Wishlist Management & Redemption (With Notifications)
**User Outcome:** Children can manage wishes and redeem them when ready

**FRs covered:** FR29-FR37 + FR57 (10 requirements)
- FR29: 儿童创建愿望
- FR30-31: 家长审核愿望、设置积分门槛
- FR32-33: 愿望进度条显示、查看所有愿望
- FR34-36: 兑换请求、确认/拒绝、扣除积分
- FR37: 已兑换愿望历史记录
- **Migrated from Epic 6:**
  - FR57: 愿望相关通知（新愿望、兑换请求、审核结果）

**Value:** The "why" - gives children a concrete goal to work toward

**Stories included:**
- Wish creation and parent approval workflow
- **Enhanced Wish Progress Visualization:**
  - Progress bar showing "当前积分/所需积分" (FR32)
  - Smart estimation: "按照你的速度，5天后就能兑换乐高了！"
  - Task countdown: "还差20分，再完成4个刷牙任务就够啦！"
- Wish redemption request and approval
- Redeemed wish history
- **Migrated notification stories:**
  - Wish created notification (to parent)
  - Wish redemption request notification (to parent)
  - Wish approved/rejected notification (to child)

**Integration Notes:**
- Depends on Epic 3's points for redemption eligibility
- Sends notifications via notification system

---

### Epic 5: Combo Incentives & Gamification (With Notifications)
**User Outcome:** Engagement mechanisms that motivate continued participation

**FRs covered:** FR38-FR48 + FR46 + FR58 (13 requirements)
- FR38-43: Combo追踪、线性/阶梯奖励、中断提醒、配置规则
- FR44: 每日签到
- FR45-46: 徽章展示和通知
- FR47-48: 成长曲线和等级系统
- **Migrated from Epic 6:**
  - FR46 (duplicate - already covered): 徽章获得通知
  - FR58: Combo中断提醒

**Value:** Long-term engagement and habit formation through game mechanics

**Stories included:**
- Combo tracking with linear and tiered rewards
- Combo interruption alerts with positive reframing: "没关系，今天就是新的开始"
- Daily check-in with streak counting
- **Enhanced Badge System:**
  - Badge showcase wall (FR45)
  - **Celebration Animation:** When earning a badge, play celebration animation (confetti/rainbow)
  - **Social Sharing:** "分享到家长微信" feature - child can share earned badges with parent
  - Badge detail view with "为什么获得" explanation
  - Badge earned notifications (FR46)
- Growth curves for parents to view
- Level system calculation and display
- **Migrated notification stories:**
  - Combo interruption warning (before streak breaks)
  - Badge earned notifications

**Integration Notes:**
- Combo triggered by Epic 2's task completions
- Badges can be based on multiple dimensions (Epic 2/3/4)
- Notifications via notification system

---

### Epic 6: Admin & System Management (Simplified)
**User Outcome:** System administrators can manage templates and monitor the platform

**FRs covered:** FR49-FR54 + FR59-FR60 (7 requirements)
- FR49-51: 管理员创建任务/愿望/Combo模板
- FR52: 图床管理
- FR53: 全局统计数据
- FR54: 系统通知（系统公告、管理员消息）
- **保留的Story:**
  - FR59: 全局通知中心（所有通知的统一收件箱，按类型筛选）
  - FR60: 家庭规则配置

**Value:** Platform governance and operational capabilities

**Stories included:**
- Template management (tasks, wishes, Combo rules)
- Image hosting management (upload, view, delete)
- Global statistics dashboard
- System announcements and admin messaging
- Global notification center (aggregates all notification types)
- Family rule configuration interface

**Notes:**
- Notification push stories (FR55, FR56, FR57, FR58) migrated to respective Epics (2, 3, 4, 5)
- Epic 6 retains centralized notification center and rule configuration

---

### Epic 7: Offline Support & Data Synchronization (Simplified)
**User Outcome:** Core features work seamlessly even with poor connectivity; data syncs automatically when online

**Technical Requirements from Architecture & UX:**
- IndexedDB for offline operation queue (ADR-4)
- Background Sync API for automatic synchronization
- Optimistic UI with instant feedback
- Timestamp-based conflict resolution
- Network status indicator (top bar: green/orange/red)

**Stories included:**

1. **Offline Task Completion Marking**
   - **Given:** 儿童处于离线状态
   - **When:** 标记任务为完成
   - **Then:**
     - 如果该任务的完成需要审批（没有权限）→ 状态变为"等待家长审批"，加入离线队列
     - 如果该任务直接完成（有权限，如签到）→ 状态变为"已完成"，加入离线队列
   - **And:** 显示乐观UI更新（立即反馈）

2. **Offline Wish Creation**
   - **Given:** 儿童处于离线状态
   - **When:** 创建愿望
   - **Then:** 愿望状态为"等待审批"，加入离线队列
   - **And:** 网络恢复后自动同步并请求家长审核

3. **Queue Limit & Blocking Prompt**
   - **Given:** 离线队列中已有5个待同步操作
   - **When:** 用户尝试进行新的离线操作
   - **Then:** 阻止操作，显示提示："已达到离线操作上限（5个），请连接互联网后继续"
   - **And:** 顶部栏显示网络状态指示器（橙色/红色）

4. **Automatic Synchronization on Network Restore**
   - **Given:** 设备从离线恢复到在线状态
   - **When:** Background Sync API触发
   - **Then:** 批量上传离线队列中的操作到服务器
   - **And:** 如检测到冲突，显示用户选择对话框：
     - "保留离线版本"
     - "使用服务器版本"

5. **Network Status Indicator**
   - **Given:** 用户打开应用
   - **When:** 检测网络状态
   - **Then:** 顶部栏显示：
     - 绿色 ✓：已连接且已同步
     - 橙色 ⟳：同步进行中
     - 红色 ⚠：离线模式

**Value:** 无论网络条件如何都能无缝使用

**Simplification Notes:**
- Focuses on 3 core offline capabilities
- Queue limit prevents excessive offline debt
- Conflict resolution gives user control

---

### Epic 6: Admin & System Management (Simplified)
**User Outcome:** System administrators can manage templates and monitor the platform

**FRs covered:** FR49-FR54 + FR59-FR60 (7 requirements)
- FR49-51: 管理员创建任务/愿望/Combo模板
- FR52: 图床管理
- FR53: 全局统计数据
- FR54: 系统通知（系统公告、管理员消息）
- **保留的Story:**
  - FR59: 全局通知中心（所有通知的统一收件箱，按类型筛选）
  - FR60: 家庭规则配置

**Value:** Platform governance and operational capabilities

**Stories included:**
- Template management (tasks, wishes, Combo rules)
- Image hosting management (upload, view, delete)
- Global statistics dashboard
- System announcements and admin messaging
- Global notification center (aggregates all notification types)
- Family rule configuration interface

**Notes:**
- Notification push stories (FR55, FR56, FR57, FR58) migrated to respective Epics (2, 3, 4, 5)
- Epic 6 retains centralized notification center and rule configuration

---

### Story 6.1: Admin Creates Task Template

As a 管理员,
I want 为系统创建任务模板,
So that 家长可以快速复制使用，减少从零开始的设计负担。

**Acceptance Criteria:**

**Given** 我已登录Family Reward系统并有管理员权限
**When** 我进入管理员"任务模板"管理页面并点击"创建新模板"按钮
**Then** 系统显示任务模板创建表单，包含：
  - 模板名称（必填，最多50字）
  - 适用年龄段选择器（6-8岁 / 9-12岁）
  - 任务列表编辑器（支持添加、编辑、删除、拖拽排序）
  - 每个任务配置：
    - 任务名称（必填）
    - 任务类型选择器（刷牙/学习/运动/家务）
    - 积分值（数字输入，1-100）
    - 循环规则选择（每日/每周/工作日/周末）
    - 可选：排除日期（日历选择器）
  - 循环规则配置：
    - 每日任务列表预览（未来7天）
    - "保存为草稿"和"发布"按钮（两步流程）
**And** 模板保存为草稿后，仅管理员可见
**And** 点击"发布"按钮时，显示确认对话框："发布后，所有家长都能看到此模板"
**And** 发布成功后，模板状态变为"已发布"，对所有家长可见
**And** 模板数据存储在`admin_templates`表中，包含`is_published`、`reference_count`字段
**And** 发布后，家长在任务计划页面的"使用模板"tab中可以看到新模板
**And** 创建成功后，显示成功提示："任务模板创建成功"
**And** 操作记录到审计日志（NFR14）
**And** API响应时间<500ms（NFR3: P95）
**And** 参考Architecture: 管理员模板存储在`admin_templates`表中，家长任务计划通过`template_id`外键引用

---

### Story 6.2: Admin Creates Wish Template

As a 管理员,
I want 为系统创建愿望模板,
So that 家长可以快速为孩子设置合理的愿望门槛。

**Acceptance Criteria:**

**Given** 我已登录Family Reward系统并有管理员权限
**When** 我进入管理员"愿望模板"管理页面并点击"创建新模板"按钮
**Then** 系统显示愿望模板创建表单，包含：
  - 模板名称（必填，最多50字）
  - 适用年龄段选择器（6-8岁 / 9-12岁）
  - 愿望列表编辑器（支持添加、编辑、删除）
  - 每个愿望配置：
    - 愿望名称（必填）
    - 积分要求范围（默认500分，可配置）
    - 建议物品类别（玩具/活动/书籍）
    - 可选：预设图标选择器
  - "保存为草稿"和"发布"按钮（两步流程）
**And** 模板保存为草稿后，仅管理员可见
**And** 点击"发布"按钮时，显示确认对话框："发布后，所有家长都能看到此模板"
**And** 发布成功后，模板状态变为"已发布"，对所有家长可见
**And** 家长在创建愿望时可以浏览管理员模板并一键复制
**And** 创建成功后，显示成功提示："愿望模板创建成功"
**And** 操作记录到审计日志（NFR14）
**And** API响应时间<500ms（NFR3: P95）
**And** 参考Architecture: 愿望模板存储在`admin_templates`表中

---

### Story 6.3: Admin Creates Combo Rules Template

As a 管理员,
I want 为系统创建Combo激励规则模板,
So that 家长可以配置不同的Combo奖励机制，激励孩子持续参与。

**Acceptance Criteria:**

**Given** 我已登录Family Reward系统并有管理员权限
**When** 我进入管理员"Combo规则"管理页面并点击"创建新模板"按钮
**Then** 系统显示Combo规则创建表单，包含：
  - 模板名称（必填，最多50字）
  - 适用年龄段选择器（6-8岁 / 9-12岁）
  - Combo类型选择器：
    - 线性Combo：连续N次固定奖励（如连续7天=+30分）
    - 阶梯Combo：连续次数越多奖励越高（如7天=30分，14天=70分，30天=150分）
  - 每个任务类型的Combo规则配置：
    - 连续完成次数阈值（触发Combo奖励）
    - 奖励积分值
  - 中断预警设置：
    - 预警时间（如任务完成截止前2小时）
    - 预警消息模板（可自定义）
  - "保存为草稿"和"发布"按钮
**And** 模板保存为草稿后，仅管理员可见
**And** 点击"发布"按钮时，显示确认对话框："发布后，所有家长都能看到此模板"
**And** 发布成功后，模板状态变为"已发布"，对所有家长可见
**And** 家长在Combo规则配置页面可以看到并应用管理员模板
**And** 创建成功后，显示成功提示："Combo规则模板创建成功"
**And** 操作记录到审计日志（NFR14）
**And** API响应时间<500ms（NFR3: P95）
**And** 参考Architecture: Combo规则存储在`admin_templates`表中，家庭通过`combo_rule_template_id`外键引用

---

### Story 6.4: Admin Manages Image Hosting

As a 管理员,
I want 上传、查看和删除系统使用的图片,
So that 家长可以为孩子的任务和愿望选择图标，保持系统整洁。

**Acceptance Criteria:**

**Given** 我已登录Family Reward系统并有管理员权限
**When** 我进入管理员"图床管理"页面
**Then** 系统显示图床管理界面，包含：
  - 图片上传区域（拖拽上传或点击选择文件）
  - 图片列表（网格视图，每行显示图片预览、上传时间、文件大小）
  - 支持的图片格式：JPG、PNG、WebP、GIF
  - 上传文件大小限制：单图<2MB（NFR7: 性能要求）
  - 批量操作支持：多选删除
  - 图片分类标签：
    - 任务图标（刷牙、学习、运动）
    - 徽章图标（金/银/铜）
    - 愿望图片（玩具、活动、书籍）
  - 搜索框：按文件名或标签快速查找
  - 每张图片卡片显示：
    - 图片预览（200x200px）
    - 上传时间
    - 文件大小
    - 操作按钮：预览、下载、删除
**And** 当我点击"上传图片"并选择文件时
**Then** 系统验证图片格式和大小
**And** 图片上传到图床存储（本地目录或预留OSS接口）
**Then** 生成唯一文件名（UUID + 时间戳）避免冲突
**Then** 返回图片访问URL（如`/api/images/[filename]`）
**Then** 图片信息存储在`images`表中，包含：
  - 文件名、URL、上传时间、上传者（管理员ID）、文件大小、分类标签
**And** 上传成功后，图片自动添加到对应的分类标签
**And** 显示上传成功提示："图片上传成功"
**And** 如果是GIF格式，自动标记为"动画资源"
**And** 操作记录到审计日志（NFR14）
**And** API响应时间<1秒（图片上传可接受较慢）
**And** 参考Architecture: 图片存储在`images`表中，预留云OSS接口
**And** 参考FR52: 管理员可以管理图床（上传、查看、删除）

---

### Story 6.5: Admin Views Global Statistics

As a 管理员,
I want 查看平台全局统计数据,
So that 我可以了解系统使用情况和业务指标，指导运营决策。

**Acceptance Criteria:**

**Given** 我已登录Family Reward系统并有管理员权限
**When** 我进入管理员"全局统计"Dashboard
**Then** 系统显示统计概览页面，包含：
  - 关键指标卡片：
    - 总家庭数（当前注册家庭）
    - 活跃家庭数（WAF：周活跃家庭，上周活跃家庭）
    - 日活跃用户数（DAU：当天登录用户）
    - 周活跃用户数（WAU：上周登录用户）
    - 任务完成率（所有任务/周平均）
    - 愿望兑换数（本周/本月）
    - 积分累计总量（所有家庭积分总和）
  - 趋势图表区域：
    - 活跃家庭趋势图（折线图，最近30天）
    - DAU趋势图（折线图，最近30天）
    - 任务完成率趋势图（柱状图，最近7天对比）
  - 时间范围选择器：7天 / 30天 / 90天
  - 导出功能按钮：导出统计报表（CSV格式）
**And** 当我选择时间范围（如最近30天）时
**Then** 系统查询数据库聚合统计数据
**And** 趋势图表使用聚合数据点（按日期分组）
**And** 任务完成率计算：完成的任务数 / 总任务数
**Then** 页面加载时间<3秒（NFR2: 数据统计页面加载）
**And** 如果数据量较大，显示加载动画（骨架屏简化实现）
**And** 关键指标显示为带颜色标签的数字卡片
**And** 活跃指标用绿色（增长）、红色（下降）显示
**And** 点击导出按钮时，生成CSV文件并自动下载
**And** 导出文件命名：`family-reward-stats-[日期范围].csv`
**And** 操作记录到审计日志（NFR14）
**And** 参考Architecture: 使用Drizzle ORM聚合查询，`lib/db/queries/`函数式查询
**And** 参考FR53: 管理员可以查看全局统计数据
**And** 参考PRD: 业务指标（WAF、DAU、任务完成率、愿望兑换数、积分累计）

---

### Story 6.6: Admin Sends System Announcement

As a 管理员,
I want 向所有家长发送系统公告或重要通知,
So that 家长可以了解系统更新、新功能发布、重要事件。

**Acceptance Criteria:**

**Given** 我已登录Family Reward系统并有管理员权限
**When** 我进入管理员"系统通知"页面并点击"发送通知"按钮
**Then** 系统显示通知发送表单，包含：
  - 通知类型选择器：
    - 系统公告（默认）
    - 新功能发布
    - 重要提醒
    - 活动通知
  - 标题输入框（必填，最多100字）
  - 内容输入框（必填，最多500字，支持Markdown格式）
  - 目标群体选择器：
    - 所有家长
    - 特定年龄段（可选）
    - 特定家庭ID（可选）
  - 发送方式：
    - 立即发送：推送到所有在线家长设备
    - 定时发送：选择具体时间发送
  - 发布开关：
    - 草稿：保存后不立即发送
    - 发布：立即推送通知
**And** 当我输入完标题和内容后，可以点击"预览"按钮查看最终效果
**Then** 预览显示在对话框中，支持Markdown渲染（标题加粗、列表格式、链接）
**And** 如果选择"立即发送"，验证内容是否为空
**And** 点击"发送"按钮后，通知推送到所有家长设备（PWA和小程序）
**Then** 通知内容显示在家长"通知中心"页面（已从Epic 6迁移）
**Then** 通知在PWA中显示为弹窗或横幅，在小程序中显示为消息条
**Then** 通知包含：
  - 管理员头像和姓名
  - 发送时间
  - 通知类型标签（不同颜色）
  - 标题和内容
  - 阅读状态（未读/已读）
**And** 发送成功后，显示成功提示："通知已发送到X个家长"
**And** 通知记录存储在`notifications`表中，关联到所有家长账户
**And** 家长可以标记通知为已读
**And** 操作记录到审计日志（NFR14）
**And** 通知类型标记为"系统公告"（便于家长筛选）
**And** API响应时间<500ms（NFR3: P95）
**And** 参考Architecture: 使用`lib/notifications/push.ts`服务发送通知
**And** 参考FR54: 管理员可以向家长发送系统通知

---

### Story 6.7: Global Notification Center (Migrated from Epic 6)

As a 家长,
I want 集中查看所有类型的通知（任务、积分、愿望、Combo、系统公告）,
So that 我不会错过任何重要信息，并能按类型筛选查看。

**Acceptance Criteria:**

**Given** 我已登录Family Reward系统并有家长权限
**When** 我进入"通知中心"页面（已从Epic 6迁移）
**Then** 系统显示通知列表，包含：
  - 通知类型标签页签：
    - 全部通知（未读计数）
    - 任务提醒（已从Epic 2迁移，FR55）
    - 积分变动（已从Epic 3迁移）
    - 愿望相关（已从Epic 4迁移，FR57）
    - Combo预警（已从Epic 5迁移，FR58）
    - 系统公告（Epic 6本机，FR54）
  - 每个通知类型显示未读计数徽章
  - 支持按类型筛选：点击标签页签只显示该类型通知
  - 支持按时间排序：最新通知在前（最近7天/30天/全部）
  - 通知列表项显示：
    - 通知类型图标（不同颜色区分）
    - 发送者头像（儿童/管理员/系统）和姓名
    - 通知标题
    - 通知内容（预览文本，长文本折叠）
    - 发送时间（相对时间：刚刚/2分钟前/今天X点）
    - 操作按钮：
      - 任务通知：跳转到审批页面
      - 愿望通知：跳转到愿望管理
      - 积分通知：跳转到积分历史
      - Combo通知：查看Combo状态
      - 系统通知：标记为已读
    - 支持滑动批量标记为已读
**And** 当我点击通知类型标签时，列表自动刷新为该类型通知
**And** 点击通知卡片时，执行该类型关联的操作
**And** 未读通知总数实时更新（3秒内同步，AC20）
**And** 通知列表分页加载，每页显示20个通知
**And** 如果通知数量超过50个，显示"加载更多"按钮
**And** 页面加载时间<3秒（NFR2: 家长端页面）
**And** 支持下拉刷新手动同步最新通知
**And** 操作记录到审计日志（标记已读操作）
**And** 参考FR59: 家长可以集中查看所有通知
**And** 参考Architecture: 通知聚合所有Epic的通知类型，存储在`notifications`表中
**And** 通知支持离线模式：如果家长离线，通知缓存在本地，上线后标记

---

### Story 6.8: Family Rule Configuration Interface

As a 家长,
I want 配置家庭全局规则（积分规则、Combo规则、愿望策略）,
So that 我可以为整个家庭设置一致的行为管理标准。

**Acceptance Criteria:**

**Given** 我已登录Family Reward系统并有主要家长权限
**When** 我进入"家庭设置"页面（已从Epic 6迁移）
**Then** 系统显示家庭规则配置界面，包含：
  - 配置区域分组：
    - 积分规则配置
    - Combo规则配置
    - 愿望策略配置
    - 系统通知偏好设置
  - 积分规则配置选项：
    - 日积分上限（默认200分，可调500-2000分）
    - 负分下限（默认-999分，可调-999到-50分）
    - 积分有效期（默认永久，可设置有效期）
    - 单个任务最大积分（默认100分，可调1-200分）
    - 是否允许负分（默认允许）
    - 积分调整频率限制（默认无限制）
  - Combo规则配置选项：
    - 线性Combo开关（开/关）
    - 线性Combo奖励积分（可配置）
    - 阶梯Combo奖励规则（可配置多段阈值）
    - Combo中断预警开关（开/关）
    - Combo宽限次数（默认1次，可调1-3次）
  - 愿望策略配置选项：
    - 单个儿童最大愿望数（默认5个，可调1-20个）
    - 单个愿望积分门槛下限（默认50分，可调10-500分）
    - 家长审核必填开关（开/关，默认开）
    - 愿望有效期（默认永久，可设置有效期）
  - 系统通知偏好设置：
    - 任务提醒开关
    - 积分变动通知开关
    - 愿望审核通知开关
    - Combo预警通知开关
    - 系统公告通知开关
    - 通知推送时段（如8:00-22:00，防止深夜打扰）
  - "保存规则"按钮：保存所有配置项
  - "重置为默认"按钮：恢复所有配置项到系统默认值
**And** 当我修改配置项时，显示即时预览（或确认对话框，对于重要规则）
**Then** 点击"保存规则"按钮后，所有配置项保存到`family_settings`表
**Then** 配置生效时间：立即生效（部分规则如新任务）或次日生效（如积分上限）
**Then** 保存成功后，显示成功提示："家庭规则已保存"
**And** 如果修改了重要规则（如关闭负分），显示二次确认对话框："确认要关闭负分功能吗？关闭后儿童无法获得负分"
**And** 如果家庭有多个儿童，配置项可针对特定儿童设置（次要家长可能只读）
**And** 所有家长查看相同的家庭规则（主要家长设置全局，次要家长只读）
**And** 操作记录到审计日志（NFR14）
**And** API响应时间<500ms（NFR3: P95）
**And** 参考Architecture: 家庭规则存储在`family_settings`表中，Epic 6保留配置功能
**And** 参考FR60: 家长可以配置家庭全局规则

---

### Epic 6 Summary

**User Outcome:** System administrators can manage templates and monitor the platform

**FRs covered:** FR49-FR54 + FR59-FR60 (7 requirements)

**Stories included:**
- Story 6.1: Admin Creates Task Template
- Story 6.2: Admin Creates Wish Template
- Story 6.3: Admin Creates Combo Rules Template
- Story 6.4: Admin Manages Image Hosting
- Story 6.5: Admin Views Global Statistics
- Story 6.6: Admin Sends System Announcement
- Story 6.7: Global Notification Center (Migrated)
- Story 6.8: Family Rule Configuration Interface

**Notes:**
- Notification push stories (FR55, FR56, FR57, FR58) migrated to respective Epics (2, 3, 4, 5)
- Epic 6 retains centralized notification center and rule configuration

---

### Epic 7: Offline Support & Data Synchronization (Simplified)

**User Outcome:** Core features work seamlessly even with poor connectivity; data syncs automatically when online

**Technical Requirements from Architecture & UX:**
- IndexedDB for offline operation queue (ADR-4)
- Background Sync API for automatic synchronization
- Optimistic UI with instant feedback
- Timestamp-based conflict resolution
- Network status indicator (top bar: green/orange/red)

**Stories included:**

1. **Story 7.1: Offline Task Completion Marking**
   - **Given:** 儿童处于离线状态
   - **When:** 标记任务为完成
   - **Then:**
     - 如果该任务的完成需要审批（没有权限）→ 状态变为"等待家长审批"，加入离线队列
     - 如果该任务直接完成（有权限，如签到）→ 状态变为"已完成"，加入离线队列
   - **And:** 显示乐观UI更新（立即反馈）

2. **Story 7.2: Offline Wish Creation**
   - **Given:** 儿童处于离线状态
   - **When:** 创建愿望
   - **Then:** 愿望状态为"等待审批"，加入离线队列
   - **And:** 网络恢复后自动同步并请求家长审核

3. **Story 7.3: Queue Limit & Blocking Prompt**
   - **Given:** 离线队列中已有5个待同步操作
   - **When:** 用户尝试进行新的离线操作
   - **Then:** 阻止操作，显示提示："已达到离线操作上限（5个），请连接互联网后继续"
   - **And:** 顶部栏显示网络状态指示器（橙色/红色）

4. **Story 7.4: Automatic Synchronization on Network Restore**
   - **Given:** 设备从离线恢复到在线状态
   - **When:** Background Sync API触发
   - **Then:** 批量上传离线队列中的操作到服务器
   - **And:** 如检测到冲突，显示用户选择对话框：
     - "保留离线版本"
     - "使用服务器版本"

5. **Story 7.5: Network Status Indicator**
   - **Given:** 用户打开应用
   - **When:** 检测网络状态
   - **Then:** 顶部栏显示：
     - 绿色 ✓：已连接且已同步
     - 橙色 ⟳：同步进行中
     - 红色 ⚠：离线模式

**Value:** 无论网络条件如何都能无缝使用

**Simplification Notes:**
- 聚焦3个核心离线能力
- 队列限制防止过度的离线债务
- 冲突解决给予用户控制

---

### Epic 7 Summary

**User Outcome:** Core features work seamlessly even with poor connectivity; data syncs automatically when online

**Technical Requirements from Architecture & UX:**
- IndexedDB for offline operation queue (ADR-4)
- Background Sync API for automatic synchronization
- Optimistic UI with instant feedback
- Timestamp-based conflict resolution
- Network status indicator (top bar: green/orange/red)

**Stories included:**
- Story 7.1: Offline Task Completion Marking
- Story 7.2: Offline Wish Creation
- Story 7.3: Queue Limit & Blocking Prompt
- Story 7.4: Automatic Synchronization on Network Restore
- Story 7.5: Network Status Indicator

**Value:** 无论网络条件如何都能无缝使用

**Simplification Notes:**
- 聚焦3个核心离线能力
- 队列限制防止过度的离线债务
- 冲突解决给予用户控制

---

## Epic Summary

**Total Epics:** 7
**Natural Dependencies:**
- Epic 1 (Foundation)
- → Epics 2-5 (Core Features) can run in parallel
- → Epic 7 (Offline Support) enhances Epics 2-5
- → Epic 6 (Admin) is independent

**Epic Refactoring Applied:**
- ✅ Notification stories migrated from Epic 6 to Epics 2, 3, 4, 5
- ✅ Each Epic now contains complete "action → feedback" user value loop
- ✅ Epic 7 simplified to 3 core offline capabilities
- ✅ Clear Epic boundaries and logical flow maintained

**Total Epics:** 7
**Natural Dependencies:**
- Epic 1 (Foundation)
- → Epics 2-5 (Core Features) can run in parallel
- → Epic 7 (Offline Support) enhances Epics 2-5
- → Epic 6 (Admin) is independent

**Epic Refactoring Applied:**
- ✅ Notification stories migrated from Epic 6 to Epics 2, 3, 4, 5
- ✅ Each Epic now contains complete "action → feedback" user value loop
- ✅ Epic 7 simplified to 3 core offline capabilities
- ✅ Clear Epic boundaries and logical flow maintained
