# Story 3.6: Parent Views Points History

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 家长,
I want 查看积分历史记录,
so that 我可以了解儿童积分的来源和变动情况。

## Acceptance Criteria

1. Given 我已登录系统并有家长权限
   When 我进入"积分历史"页面
   Then 系统显示积分变动列表，包含：
   - 每条记录显示：时间、类型、积分值（正/负）、原因、相关任务（如果有）
   - 积分值颜色标识：绿色为增加，红色为减少
   - 支持时间筛选：最近7天 / 最近30天 / 全部
   - 支持类型筛选：全部 / 任务奖励 / 手动调整 / 愿望兑换
2. And 列表按时间倒序排列，最新在前
3. And 支持导出功能：导出为CSV文件（NFR20: GDPR数据导出权）
4. And 页面加载时间<3秒（NFR2）

## Tasks / Subtasks

- [ ] Task 1: Create parent points history page (AC: 1)
  - [ ] Subtask 1.1: Create page route `app/(parent)/points/history/page.tsx`
  - [ ] Subtask 1.2: Create PointsHistoryList component
  - [ ] Subtask 1.3: Add filtering UI (time: 7d/30d/all, type: all/task/adjust/redemption)
  - [ ] Subtask 1.4: Add unit tests for filtering logic
- [ ] Task 2: Implement points history API endpoint (AC: 1, 2)
  - [ ] Subtask 2.1: Create `/api/points/history` endpoint with filtering
  - [ ] Subtask 2.2: Sort results by time descending
  - [ ] Subtask 2.3: Add integration tests for filtering and sorting
- [ ] Task 3: Integrate with points display formatting (AC: 1)
  - [ ] Subtask 3.1: Reuse PointsDisplay component from Story 3.2/3.3
  - [ ] Subtask 3.2: Ensure green display for positive, red for negative
  - [ ] Subtask 3.3: Add integration test for display formatting
- [ ] Task 4: Implement CSV export functionality (AC: 3)
  - [ ] Subtask 4.1: Create CSV export utility
  - [ ] Subtask 4.2: Add export button to points history page
  - [ ] Subtask 4.3: Add unit tests for CSV export format validation
- [ ] Task 5: Optimize page loading performance (AC: 4)
  - [ ] Subtask 5.1: Implement pagination for large history datasets
  - [ ] Subtask 5.2: Add performance tests for <3 second load time

## Dev Notes

### Architecture Patterns & Constraints

**Database Queries (RED LIST - MUST FOLLOW):**
- Location: `lib/db/queries/` directory, split by table
- Points queries file: `lib/db/queries/points.ts` (created in Story 3.1)
- MUST use Drizzle ORM query builder (NEVER native SQL or string concatenation)
- Export functions, NOT Repository pattern

**Technology Stack (from architecture.md):**
- Runtime: Bun 1.3.x+ (NO Node.js compatibility layer)
- Database: bun:sqlite + Drizzle ORM 0.45.x+
- UI System: Tailwind CSS 4 + Shadcn UI 3.7.0+

**CSV Export Format Specification:**

```typescript
// CSV File Format
export const CSV_EXPORT_CONFIG = {
  // Column names (in order)
  columns: [
    '时间',        // createdAt (ISO 8601 format: 2026-01-01T12:00:00Z)
    '类型',        // type: 'task_reward' | 'manual_adjust' | 'wish_redemption'
    '积分值',      // amount (positive/negative, e.g., +10, -50)
    '原因',        // reason (task name or adjustment reason)
    '相关任务'     // taskId (optional, task name or empty string)
  ],

  // File encoding
  encoding: 'UTF-8',

  // CSV format (RFC 4180 compliant)
  delimiter: ',',
  quote: '"',
  escape: '"',
  newline: '\n',

  // File naming rule
  filenameTemplate: (childName: string, dateRange: string) => {
    return `积分历史_${childName}_${dateRange}.csv`;
    // Example: "积分历史_张小明_2026-01-01_to_2026-01-31.csv"
    // Example: "积分历史_张小明_all.csv"
  },

  // Data volume limit (GDPR compliance - NFR20)
  maxRecords: 1000, // Maximum records per export
  // If > 1000 records, prompt user to narrow date range
} as const;

// CSV export utility implementation
export async function exportPointsHistoryToCSV(
  pointsHistory: PointsHistory[],
  childName: string,
  dateRange: string
): Promise<Blob> {
  // Check data volume limit
  if (pointsHistory.length > CSV_EXPORT_CONFIG.maxRecords) {
    throw new Error(
      `数据量过大（${pointsHistory.length}条），请缩小时间范围或联系管理员导出全部数据`
    );
  }

  // Generate CSV content
  const headers = CSV_EXPORT_CONFIG.columns.join(',');
  const rows = pointsHistory.map(record => {
    const date = new Date(record.createdAt).toISOString(); // ISO 8601 format
    const type = getTypeDisplayName(record.type); // Convert to Chinese
    const amount = record.amount >= 0 ? `+${record.amount}` : `${record.amount}`;
    const reason = record.reason || '';
    const taskId = record.taskId || '';

    return [date, type, amount, reason, taskId]
      .map(field => `"${field.replace(/"/g, '""')}"`) // Escape quotes
      .join(',');
  });

  const csvContent = `${headers}\n${rows.join('\n')}`;

  // Create Blob with UTF-8 encoding and BOM for Excel compatibility
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  return blob;
}
```

**Database Schema References:**
- `points` table: points history/ledger for tracking all changes
  - Fields: `amount`, `reason`, `type`, `createdAt`, `taskId` (optional)
- Types: "task_reward", "manual_adjust", "wish_redemption"
- Positive amounts: green color, negative amounts: red color

**BDD Development Requirements:**
- Tests MUST use Given-When-Then format
- Tests MUST use business language (not technical terms)
- Tests MUST be written BEFORE implementation

### File Structure Requirements

**Files to Create:**
```
app/
├── (parent)/
│   └── points/
│       └── history/
│           └── page.tsx            # NEW: Parent points history page

lib/
├── db/queries/
│   └── points.ts                 # Extend for history query with filters
└── utils/
    └── csv-export.ts              # NEW: CSV export utility

components/
└── features/
    └── points-history-list.tsx    # NEW: History list component

tests/
├── unit/
│   ├── lib/
│   │   └── utils/
│   │       └── csv-export.spec.ts      # NEW
│   └── components/
│       └── features/
│           └── points-history-list.spec.ts  # NEW
└── integration/
    └── api/
        └── points.spec.ts              # Extend for history tests
```

**API Routes to Create:**
- `app/api/points/history/route.ts` - Get points history with filters

### Testing Standards

**BDD Format Example:**
```typescript
it('given 家长已登录系统并有家长权限，when 进入积分历史页面，then 系统显示积分变动列表', async () => {
  // Given: 家长已登录且有积分历史记录
  const parent = await createParent();
  const child = await createChild({ familyId: parent.familyId });
  await createPointsHistory([
    { amount: 10, reason: '任务奖励：刷牙', type: 'task_reward', childId: child.id },
    { amount: -5, reason: '家长扣分：不听话', type: 'manual_adjust', childId: child.id },
    { amount: -50, reason: '愿望兑换：乐高玩具', type: 'wish_redemption', childId: child.id }
  ]);

  // When: 进入"积分历史"页面
  const page = render(<PointsHistoryPage childId={child.id} />);

  // Then: 系统显示积分变动列表
  const historyItems = page.getAllByTestId('points-history-item');
  expect(historyItems).toHaveLength(3);

  // And: 每条记录显示：时间、类型、积分值、原因
  expect(historyItems[0]).toHaveTextContent('50'); // 余额变化
  expect(historyItems[0]).toHaveTextContent('愿望兑换');
  expect(historyItems[0]).toHaveTextContent('乐高玩具');

  // And: 积分值颜色标识：绿色为增加，红色为减少
  const positiveItem = historyItems[0]; // Latest
  expect(positiveItem.querySelector('.points-amount')).toHaveClass('text-red-500'); // -50 (red)
  
  const rewardItem = historyItems[2]; // Oldest
  expect(rewardItem.querySelector('.points-amount')).toHaveClass('text-green-500'); // +10 (green)
});

it('given 家长查看积分历史，when 选择类型筛选，then 显示对应类型的记录', async () => {
  // Given: 家长已登录且有多种类型的积分历史
  const parent = await createParent();
  const child = await createChild({ familyId: parent.familyId });
  await createPointsHistory([
    { amount: 10, type: 'task_reward', childId: child.id },
    { amount: -5, type: 'manual_adjust', childId: child.id },
    { amount: -50, type: 'wish_redemption', childId: child.id }
  ]);

  // When: 选择类型筛选为"任务奖励"
  const response = await request(app)
    .get('/api/points/history')
    .query({ childId: child.id, type: 'task_reward' })
    .set('Cookie', parentSession);

  // Then: 只显示任务奖励类型的记录
  expect(response.status).toBe(200);
  expect(response.body.history).toHaveLength(1);
  expect(response.body.history[0].type).toBe('task_reward');
});

it('given 家长查看积分历史，when 点击导出CSV，then 下载CSV文件', async () => {
  // Given: 家长已登录且有积分历史
  const parent = await createParent();
  const child = await createChild({ familyId: parent.familyId });
  await createPointsHistory([
    { amount: 10, reason: '任务奖励：刷牙', type: 'task_reward', childId: child.id }
  ]);

  // When: 点击导出CSV
  const response = await request(app)
    .get('/api/points/history/export')
    .query({ childId: child.id, format: 'csv' })
    .set('Cookie', parentSession);

  // Then: 下载CSV文件
  expect(response.status).toBe(200);
  expect(response.headers['content-type']).toBe('text/csv');
  expect(response.headers['content-disposition']).toMatch(/attachment; filename="points-history.csv"/);
  
  // And: CSV格式正确
  const csvContent = response.text;
  expect(csvContent).toContain('时间,类型,积分值,原因');
  expect(csvContent).toContain('任务奖励');
});
```

**Coverage Requirements:**
- Unit tests for PointsHistoryList component rendering
- Unit tests for filtering logic (time: 7d/30d/all, type: all/task/adjust/redemption)
- Unit tests for CSV export format validation
- Unit tests for pagination logic
- Integration test for history API with filters
- Integration test for CSV export endpoint
- Performance test for <3 second page load time

### Performance Requirements (from PRD)

- API response time < 500ms (P95) [NFR3]
- Parent stats page load time < 3 seconds [NFR2]
- CSV export must complete within 10 seconds for 1000 records

### Security & Compliance

**COPPA/GDPR Compliance:**
- Data retention: 3 years for points history [NFR18]
- CSV export must be authenticated (parent only) [NFR20]
- Export must include timestamp and child identifier

### Integration Notes

**Depends on:**
- Story 3.1: System Calculates Points on Task Approval (creates points history service)
- Story 3.2: Positive Points Reward (creates PointsDisplay component)
- Story 3.3: Negative Points Deduction (extends points display)
- Story 3.4: Points Settlement After Approval (adds parent approval check)
- Story 3.5: Parent Temporary Points Adjustment (adds adjustment history)
- Epic 1: User Authentication & Family Management (parent authentication)
- Database tables: points

**Previous Story Intelligence (Story 3.1):**
- Story 3.1 creates `lib/db/queries/points.ts` with history tracking
- Story 3.1 implements atomic transaction for points transfer
- This story adds UI for viewing that history

**Previous Story Intelligence (Story 3.2):**
- Story 3.2 creates PointsDisplay component with positive formatting (green)
- This story reuses PointsDisplay for history display

**Previous Story Intelligence (Story 3.3):**
- Story 3.3 extends points display for negative values (red)
- This story reuses red display for history

**Previous Story Intelligence (Story 3.5):**
- Story 3.5 adds manual adjustment history records
- This story displays those adjustment records in history view

### Project Structure Notes

**Alignment with unified project structure:**
- New page route follows Next.js App Router conventions
- New components in `components/features/` follow feature component pattern
- Modifying existing `lib/db/queries/points.ts` from Story 3.1
- No conflicts detected

### References

**Functional Requirements:**
- FR25: 家长可以查看积分历史 [Source: _bmad-output/planning-artifacts/prd.md#FR25]
- FR26: 积分历史包含时间、类型、数值、原因 [Source: _bmad-output/planning-artifacts/prd.md#FR26]

**Non-Functional Requirements:**
- NFR2: 家长端统计页面加载时间 < 3秒 [Source: _bmad-output/planning-artifacts/prd.md#NFR2]
- NFR3: API 响应时间 < 500ms（P95） [Source: _bmad-output/planning-artifacts/prd.md#NFR3]
- NFR18: 数据留存：积分历史3年 [Source: _bmad-output/planning-artifacts/prd.md#NFR18]
- NFR20: GDPR数据导出权 [Source: _bmad-output/planning-artifacts/prd.md#NFR20]

**Architecture Decisions:**
- ADR-2: SQLite + Drizzle ORM (初期) → PostgreSQL升级路径（二期） [Source: _bmad-output/planning-artifacts/architecture.md#ADR-2]
- Database queries: Function-based (NOT Repository pattern) [Source: _bmad-output/planning-artifacts/architecture.md#ADR-5]
- BDD Development: Given-When-Then format, tests BEFORE implementation [Source: _bmad-output/planning-artifacts/architecture.md#ADR-5]

**Database Schema:**
- Points table with fields: amount, reason, type, createdAt, taskId (optional) [Source: _bmad-output/planning-artifacts/architecture.md#Project-Structure-&-Boundaries]

**Acceptance Criteria:**
- AC9: 积分变动历史记录完整，支持按时间范围查询 [Source: _bmad-output/planning-artifacts/prd.md#AC9]

**UX Design Specifications:**
- Parent efficiency design: batch operations, data visualization [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design-Directions]
- Color system: Success green for positive, Error red for negative [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design-System-Foundation]
- Filter UI: Time and type filters [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Journey-Patterns]

**Integration Points:**
- Points history populated by Stories 3.1, 3.3, 3.5 [Source: _bmad-output/planning-artifacts/prd.md#Integration-Notes]

**Previous Story Intelligence:**
- Story 3.1 created points history tracking with atomic transactions
- Story 3.2 created PointsDisplay component with positive formatting (green)
- Story 3.3 extended PointsDisplay for negative values (red)
- Story 3.4 added parent approval gate for task-based settlements
- Story 3.5 added manual adjustment history records
- This story provides UI to view all that history

## Dev Agent Record

### Agent Model Used
glm-4.7 (zai-coding-plan/glm-4.7)

### Debug Log References
N/A

### Completion Notes List
Story context created from comprehensive analysis of epics.md, PRD, architecture.md, and UX specifications. Builds on Stories 3.1, 3.2, 3.3, 3.4, and 3.5 foundation.

### File List
Story file: _bmad-output/implementation-artifacts/3-6-parent-views-points-history.md
