# Story 6.5: Admin Views Global Statistics

Status: ready-for-dev

## Story

As a **管理员**,
I want **查看平台全局统计数据**,
So that **我可以了解系统使用情况和业务指标，指导运营决策**。

## Acceptance Criteria

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

## Tasks / Subtasks

- [ ] Task 1: Create database aggregation queries for statistics (AC: Then)
  - [ ] Subtask 1.1: Create lib/db/queries/statistics.ts
  - [ ] Subtask 1.2: Implement getGlobalStats() function (key metrics)
  - [ ] Subtask 1.3: Implement getActiveFamiliesTrend() function (line chart data)
  - [ ] Subtask 1.4: Implement getDAUTrend() function (line chart data)
  - [ ] Subtask 1.5: Implement getTaskCompletionRateTrend() function (bar chart data)
  - [ ] Subtask 1.6: Implement exportStatisticsCSV() function (CSV export)

- [ ] Task 2: Create API endpoints for statistics (AC: When/Then)
  - [ ] Subtask 2.1: Create GET /api/admin/stats/overview endpoint (key metrics)
  - [ ] Subtask 2.2: Create GET /api/admin/stats/trends endpoint (chart data)
  - [ ] Subtask 2.3: Create GET /api/admin/stats/export endpoint (CSV download)
  - [ ] Subtask 2.4: Add time range query parameter (7/30/90 days)
  - [ ] Subtask 2.5: Add admin authentication middleware

- [ ] Task 3: Create admin statistics dashboard page (AC: When)
  - [ ] Subtask 3.1: Create app/admin/stats/page.tsx (dashboard layout)
  - [ ] Subtask 3.2: Create components/features/stats-overview-cards.tsx (key metrics)
  - [ ] Subtask 3.3: Create components/features/stats-trend-charts.tsx (trend charts)
  - [ ] Subtask 3.4: Create components/features/stats-export-button.tsx (CSV export)

- [ ] Task 4: Implement key metrics cards (AC: Then)
  - [ ] Subtask 4.1: Display total families count
  - [ ] Subtask 4.2: Display active families count (WAF)
  - [ ] Subtask 4.3: Display DAU count
  - [ ] Subtask 4.4: Display WAU count
  - [ ] Subtask 4.5: Display task completion rate
  - [ ] Subtask 4.6: Display wish redemption count (week/month)
  - [ ] Subtask 4.7: Display total points accumulated
  - [ ] Subtask 4.8: Add color-coded growth/decline indicators

- [ ] Task 5: Implement trend charts (AC: Then)
  - [ ] Subtask 5.1: Add active families trend line chart (30 days)
  - [ ] Subtask 5.2: Add DAU trend line chart (30 days)
  - [ ] Subtask 5.3: Add task completion rate bar chart (7 days comparison)
  - [ ] Subtask 5.4: Add time range selector (7/30/90 days)
  - [ ] Subtask 5.5: Update charts on time range change

- [ ] Task 6: Implement CSV export functionality (AC: Then)
  - [ ] Subtask 6.1: Generate CSV file with statistics data
  - [ ] Subtask 6.2: Format filename: family-reward-stats-[date-range].csv
  - [ ] Subtask 6.3: Trigger automatic download on button click
  - [ ] Subtask 6.4: Include all key metrics and trend data in CSV

- [ ] Task 7: Add loading states and optimization (AC: NFR2)
  - [ ] Subtask 7.1: Add skeleton loading animation for initial load
  - [ ] Subtask 7.2: Optimize page load time < 3 seconds
  - [ ] Subtask 7.3: Add loading states for time range changes
  - [ ] Subtask 7.4: Cache frequently accessed statistics

- [ ] Task 8: Write BDD tests (AC: NFR2, NFR14)
  - [ ] Subtask 8.1: Write integration tests for API endpoints
  - [ ] Subtask 8.2: Write unit tests for query functions
  - [ ] Subtask 8.3: Write E2E tests with Playwright (view stats, export CSV)
  - [ ] Subtask 8.4: Verify page load time < 3 seconds
  - [ ] Subtask 8.5: Verify trend data accuracy

## Dev Notes

### Technical Stack & Requirements

**Core Technologies:**
- Bun 1.3.x+ (runtime)
- Next.js 16.1.6 + React 19.2.3
- Drizzle ORM 0.45.1+ (database queries)
- TypeScript 5 strict mode
- Recharts (charting library - from Architecture Decision 4)
- Shadcn UI 3.7.0+ (UI components)
- Tailwind CSS 4 (styling)

### Database Query Patterns

**Aggregation Queries:**
```typescript
// lib/db/queries/statistics.ts
import { db } from '@/lib/db';
import { users, families, tasks, points, wishlists } from '@/lib/db/schema';
import { sql, count, sum, avg, and, gte, lte, eq } from 'drizzle-orm';

// Key Metrics Query
export async function getGlobalStats() {
  const totalFamilies = await db.select({ count: count() }).from(families);
  
  const activeFamilies = await db.select({ count: count() })
    .from(families)
    .where(sql`last_login >= datetime('now', '-7 days')`);
  
  const dau = await db.select({ count: count() })
    .from(users)
    .where(sql`last_login >= date('now')`);
  
  const wau = await db.select({ count: count() })
    .from(users)
    .where(sql`last_login >= date('now', '-7 days')`);
  
  const taskCompletion = await db.select({
      total: count(),
      completed: count()
    })
    .from(tasks)
    .where(and(
      gte(tasks.completedAt, sql`date('now', '-7 days')`),
      eq(tasks.status, 'completed')
    ));
  
  const totalPoints = await db.select({ sum: sum() }).from(points);
  
  return {
    totalFamilies: totalFamilies[0].count,
    activeFamilies: activeFamilies[0].count,
    dau: dau[0].count,
    wau: wau[0].count,
    taskCompletionRate: taskCompletion[0].total > 0 
      ? taskCompletion[0].completed / taskCompletion[0].total 
      : 0,
    totalPoints: totalPoints[0].sum || 0,
  };
}

// Trend Data Query
export async function getTrendData(days: number) {
  const startDate = sql`date('now', '-${days} days')`;
  
  const activeFamiliesTrend = await db.select({
      date: sql`DATE(last_login)`,
      count: count()
    })
    .from(families)
    .where(gte(families.lastLogin, startDate))
    .groupBy(sql`DATE(last_login)`)
    .orderBy(sql`DATE(last_login)`);
  
  const dauTrend = await db.select({
      date: sql`DATE(last_login)`,
      count: count()
    })
    .from(users)
    .where(gte(users.lastLogin, startDate))
    .groupBy(sql`DATE(last_login)`)
    .orderBy(sql`DATE(last_login)`);
  
  return {
    activeFamiliesTrend,
    dauTrend,
  };
}
```

### API Endpoints

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| GET | `/api/admin/stats/overview` | Get key metrics | Admin |
| GET | `/api/admin/stats/trends` | Get trend chart data | Admin |
| GET | `/api/admin/stats/export` | Export statistics CSV | Admin |

**Request/Response DTOs:**

```typescript
// Get Trends Request
{
  days?: number; // 7, 30, 90 (default: 30)
}

// Overview Response
{
  totalFamilies: number;
  activeFamilies: number;
  dau: number;
  wau: number;
  taskCompletionRate: number; // 0-1
  wishRedemptions: {
    week: number;
    month: number;
  };
  totalPoints: number;
}

// Trends Response
{
  activeFamiliesTrend: Array<{
    date: string; // YYYY-MM-DD
    count: number;
  }>;
  dauTrend: Array<{
    date: string;
    count: number;
  }>;
  taskCompletionRateTrend: Array<{
    date: string;
    rate: number; // 0-1
  }>;
}
```

### CSV Export Format

```csv
Metric,Value
Total Families,150
Active Families,120
DAU,85
WAU,300
Task Completion Rate,0.85
Wish Redemptions (Week),25
Wish Redemptions (Month),95
Total Points,25000

Date,Active Families,DAU,Task Completion Rate
2026-02-01,118,80,0.82
2026-02-02,119,82,0.84
...
```

### Project Structure Notes

**Files to Create/Modify:**

```
lib/db/queries/
├── statistics.ts        # NEW: Aggregation queries

app/admin/stats/
├── page.tsx            # NEW: Dashboard page

components/features/
├── stats-overview-cards.tsx      # NEW: Key metrics cards
├── stats-trend-charts.tsx       # NEW: Recharts trend components
└── stats-export-button.tsx       # NEW: CSV export button

tests/integration/
├── stats.spec.ts         # NEW: API tests

tests/e2e/
├── stats.spec.ts         # NEW: E2E tests
```

**Alignment with Unified Project Structure:**

- ✅ Queries in `lib/db/queries/statistics.ts` (per-table file pattern)
- ✅ API routes in `app/api/admin/stats/` (RESTful pattern)
- ✅ Components in `components/features/` (feature-based)
- ✅ No conflicts detected

### References

- **Architecture Decision:** ADR-4 (Chart library: Recharts)
- **Database Pattern:** ADR-5 (Function-based queries, NOT Repository pattern)
- **API Pattern:** [Source: docs/TECH_SPEC_API.md#REST-endpoints]
- **Component System:** [Source: docs/TECH_SPEC_ARCHITECTURE.md#component-boundaries]
- **Testing Standard:** [Source: docs/TECH_SPEC_BDD.md#Given-When-Then]
- **FR53:** [Source: _bmad-output/planning-artifacts/prd.md#FR53] 管理员可以查看全局统计数据
- **PRD Metrics:** [Source: _bmad-output/planning-artifacts/prd.md#Business-Success]

### Critical Implementation Constraints

**🔴 RED LIST - MUST OBEY:**

1. **Database Operations:**
   - ✅ MUST use Drizzle ORM query builder
   - ❌ NEVER use raw SQL
   - ❌ NEVER write SQL in components/routes
   - ✅ All aggregation queries MUST be in `lib/db/queries/statistics.ts`

2. **Type Safety:**
   - ❌ NEVER use `any` type
   - ✅ MUST use `unknown` + type guards
   - ✅ NO `@ts-ignore` or `@ts-expect-error`

3. **Bun Runtime:**
   - ✅ MUST use `Bun.file()`, `Bun.write()` for CSV export
   - ✅ MUST use `Bun.env` for environment variables
   - ❌ NEVER use Node.js APIs (`fs/promises`, `process.env`)

4. **Performance Optimization:**
   - ✅ MUST optimize page load time < 3 seconds (NFR2)
   - ✅ MUST cache frequently accessed statistics
   - ✅ MUST use skeleton loading for large datasets
   - ✅ MUST use database indexes for aggregation queries

5. **BDD Testing:**
   - ✅ MUST write tests BEFORE implementation
   - ✅ MUST use Given-When-Then format
   - ✅ MUST use business language, NOT technical terms

6. **File Length:**
   - ✅ All files MUST be ≤ 800 lines
   - ✅ Split large components if needed

### UX/UI Requirements

**From UX Design Specification:**

- **Responsive Design:**
  - Admin PC layout: ≥1024px width
  - Large buttons for easy clicking
  - Clear visual hierarchy

- **Key Metrics Cards:**
  - Card-based layout for each metric
  - Color-coded indicators (green = growth, red = decline)
  - Large numbers for primary metrics
  - Percentage displays for rates

- **Trend Charts:**
  - Line charts for active families and DAU trends (30 days)
  - Bar chart for task completion rate (7 days comparison)
  - Interactive tooltips on hover
  - Smooth animations for data updates

- **Time Range Selector:**
  - 7 / 30 / 90 day options
  - Default: 30 days
  - Update all charts on selection change

- **Export Button:**
  - Prominent "导出" button
  - Download CSV file with all metrics and trends
  - Filename: family-reward-stats-[date-range].csv

- **Feedback:**
  - Success toast: "数据导出成功"
  - Error toast with clear message
  - Loading states during data fetch

### Testing Standards Summary

**BDD Format (Given-When-Then):**

```typescript
// Example: Get global stats
it('given 管理员已登录，when 查询全局统计数据，then 返回关键指标', async () => {
  // Given: 管理员已登录
  const admin = await createAdmin();

  // When: 查询全局统计数据
  const res = await request(app)
    .get('/api/admin/stats/overview')
    .set('Cookie', admin.session);

  // Then: 返回关键指标
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty('totalFamilies');
  expect(res.body).toHaveProperty('activeFamilies');
  expect(res.body).toHaveProperty('dau');
  expect(res.body).toHaveProperty('wau');
  expect(res.body).toHaveProperty('taskCompletionRate');
  expect(res.body).toHaveProperty('totalPoints');
});

// Example: Get trend data
it('given 管理员已登录，when 查询30天趋势数据，then 返回趋势数据点', async () => {
  // Given: 管理员已登录
  const admin = await createAdmin();

  // When: 查询30天趋势数据
  const res = await request(app)
    .get('/api/admin/stats/trends?days=30')
    .set('Cookie', admin.session);

  // Then: 返回趋势数据点
  expect(res.status).toBe(200);
  expect(res.body.activeFamiliesTrend).toHaveLength(30);
  expect(res.body.dauTrend).toHaveLength(30);
});

// Example: Export CSV
it('given 管理员已登录，when 导出统计数据，then 生成CSV文件并下载', async () => {
  // Given: 管理员已登录
  const admin = await createAdmin();

  // When: 导出统计数据
  const res = await request(app)
    .get('/api/admin/stats/export?days=30')
    .set('Cookie', admin.session);

  // Then: 生成CSV文件并下载
  expect(res.status).toBe(200);
  expect(res.headers['content-type']).toContain('text/csv');
  expect(res.headers['content-disposition']).toMatch(/family-reward-stats-/);
});
```

**Test Coverage Requirements:**
- API endpoints: 100% coverage
- Query functions: 95%+ coverage
- E2E tests: Main workflows (view stats, change time range, export CSV)
- Performance tests: Verify page load time < 3 seconds

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
