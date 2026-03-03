# Story 3.11: Points Milestone Achievement Notification

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 系统,
I want 在积分达到里程碑时推送通知,
So that 激励儿童持续努力，增强成就感。

## Acceptance Criteria

1. Given 儿童积分达到特定里程碑值
   When 积分变动后检查里程碑
   Then 系统推送里程碑通知，包含：
     - 通知标题："恭喜！"
     - 通知内容："你已经积累了{总分}分！继续加油！"
   And 里程碑设置：
     - 100分："小小起步"
     - 500分："初露头角"
     - 1000分："积分达人"
     - 2000分："超级明星"
     - 5000分："传奇人物"
   And 每个里程碑只通知一次（记录已通知里程碑）
   And 通知存储在`notifications`表中，类型为"points_milestone"

## Tasks / Subtasks

- [ ] Task 1: Add user milestone tracking fields (AC: 1)
  - [ ] Subtask 1.1: Add `notified_milestones` JSON field to users table
  - [ ] Subtask 1.2: Create migration script for notified_milestones field
  - [ ] Subtask 1.3: Update database schema types

- [ ] Task 2: Implement milestone checking logic (AC: 1)
  - [ ] Subtask 2.1: Create milestone-achiever.ts service
  - [ ] Subtask 2.2: Define milestone thresholds (100, 500, 1000, 2000, 5000)
  - [ ] Subtask 2.3: Implement checkMilestoneAchievement() function
  - [ ] Subtask 2.4: Add milestone titles mapping

- [ ] Task 3: Integrate milestone check with points settlement (AC: 1)
  - [ ] Subtask 3.1: Modify points-calculator.ts service to trigger milestone check
  - [ ] Subtask 3.2: Call checkMilestoneAchievement() after points change
  - [ ] Subtask 3.3: Update user's notified_milestones array on success
  - [ ] Subtask 3.4: Ensure atomic transaction with points settlement

- [ ] Task 4: Create milestone notification content (AC: 1)
  - [ ] Subtask 4.1: Extend notification-sender.ts service for milestone type
  - [ ] Subtask 4.2: Format notification title and message dynamically
  - [ ] Subtask 4.3: Add milestone title to notification metadata
  - [ ] Subtask 4.4: Store notification with type="points_milestone"

- [ ] Task 5: Implement milestone database queries (AC: 1)
  - [ ] Subtask 5.1: Create lib/db/queries/users.ts milestone functions
  - [ ] Subtask 5.2: Implement getNotifiedMilestones() function
  - [ ] Subtask 5.3: Implement updateNotifiedMilestones() function
  - [ ] Subtask 5.4: Add tests for milestone tracking queries

- [ ] Task 6: Write BDD tests for milestone notification (AC: 1)
  - [ ] Subtask 6.1: Test milestone detection on points increase
  - [ ] Subtask 6.2: Test no duplicate notification for same milestone
  - [ ] Subtask 6.3: Test milestone titles are correct
  - [ ] Subtask 6.4: Test all milestone thresholds (100, 500, 1000, 2000, 5000)

## Dev Notes

### Relevant Architecture Patterns and Constraints

**Technical Stack:**
- Bun 1.3.x+ runtime (NO Node.js compatibility layer)
- Next.js 16.x + React 19.x
- bun:sqlite + Drizzle ORM 0.45.x+ (NO native SQL)
- Better-Auth 1.4.x
- Zustand for state management

**Architecture Decisions:**
- ADR-1: Real-time communication via polling (2-3s) → SSE upgrade path
- ADR-3: Better-Auth with phone plugin + PIN login
- ADR-5: Function-based queries in lib/db/queries/ (NOT Repository pattern)

**Critical RED LIST Rules:**
- ❌ PROHIBITED: Native SQL, `any` type, Node.js tools, process.env
- ✅ REQUIRED: Drizzle ORM, TypeScript strict mode, Bun native tools
- ✅ REQUIRED: BDD development (Given-When-Then), tests BEFORE implementation
- ✅ REQUIRED: Database queries in lib/db/queries/ per table (users.ts)
- ✅ REQUIRED: File length ≤ 800 lines

### Source Tree Components to Touch

**Database Schema:**
- `lib/db/schema.ts` - MODIFY: Add notified_milestones JSON field to users table
- `database/migrations/` - ADD: Migration script for notified_milestones field

**Database Queries (EXTEND - lib/db/queries/users.ts):**
- `getNotifiedMilestones(userId)` - Fetch user's notified milestones array
- `updateNotifiedMilestones(userId, milestones)` - Update notified milestones

**Services:**
- `lib/services/milestone-achiever.ts` - NEW: Milestone checking logic
- `lib/services/points-calculator.ts` - MODIFY: Add milestone trigger
- `lib/services/notification-sender.ts` - EXTEND: Add milestone notification type

**Components:**
- `components/features/notification-list.tsx` - USE: Display milestone notifications
- `components/ui/toast.tsx` - USE: Shadcn toast for notifications

**API Routes:**
- `app/api/notifications/route.ts` - USE: Milestone notification endpoints

**Store:**
- `lib/store/notification-store.ts` - USE: Zustand store for notifications

### Testing Standards Summary

**BDD Development Required:**
- Format: Given-When-Then
- Tests must be written BEFORE implementation
- Use business language, not technical terminology

**Example BDD Test:**
```typescript
it('given child reaches 100 points milestone when points change then milestone notification sent', async () => {
  // Given: Child has 95 points and has not been notified for 100-point milestone
  const child = await createChildUser({ points: 95 });
  await setNotifiedMilestones(child.id, []);

  // When: Child completes task earning 10 points (total: 105 points)
  const task = await createTask({ points: 10 });
  await approveTask(task.id, child.id);

  // Then: Milestone notification is sent for 100-point milestone
  const notifications = await getUserNotifications(child.id);
  const milestoneNotif = notifications.find(n => n.type === 'points_milestone');
  expect(milestoneNotif).toBeDefined();
  expect(milestoneNotif.title).toBe('恭喜！');
  expect(milestoneNotif.content).toContain('100');
  expect(milestoneNotif.milestoneTitle).toBe('小小起步');
  
  // And: 100-point milestone is now recorded in user's notified_milestones
  const updatedUser = await getUser(child.id);
  expect(updatedUser.notifiedMilestones).toContain(100);
});
```

**Test Coverage:**
- Unit tests: milestone-achiever.ts, points-calculator.ts milestone integration
- Integration tests: database queries for milestone tracking
- E2E tests: Complete points change → milestone notification flow

## Project Structure Notes

### Alignment with Unified Project Structure

**Following established patterns:**
- Milestone module follows Epic 3 pattern (like points-history, points-trend, points-change-notification)
- Database queries in lib/db/queries/users.ts for milestone tracking (per ADR-5)
- Service layer in lib/services/milestone-achiever.ts
- Reuses notification-sender.ts service from Story 3.10

**Consistent with similar modules:**
- Pattern follows Story 3.10 (points_change_notification)
- Extends existing notification infrastructure created in Story 3.10
- Uses same notification table structure with type="points_milestone"
- Milestone checking integrated into points-calculator.ts service

### Detected Conflicts or Variances

None - Story aligns with established architecture patterns.

## References

- **Source: _bmad-output/planning-artifacts/epics.md#Epic3-Story3.11** - Story requirements and acceptance criteria
- **Source: _bmad-output/planning-artifacts/epics.md#Epic3** - Epic context and integration notes
- **Source: _bmad-output/planning-artifacts/epics.md#FR20-28** - Functional requirements for points system
- **Source: _bmad-output/planning-artifacts/architecture.md#ADR-1** - Real-time communication decision
- **Source: _bmad-output/planning-artifacts/architecture.md#ADR-5** - Database query layer architecture
- **Source: docs/TECH_SPEC_DATABASE.md** - Database schema specifications
- **Source: docs/TECH_SPEC_PWA.md** - PWA and push notification requirements

## Dev Agent Record

### Agent Model Used

glm-4.7 (zai-coding-plan/glm-4.7)

### Debug Log References

None - This is a new story file.

### Completion Notes List

Story context file created with comprehensive developer guidance including:
- Complete user story and acceptance criteria
- Task breakdown with subtasks
- Architecture alignment and constraints
- RED LIST rules compliance
- BDD testing standards
- File structure and integration points
- Integration with Story 3.10 (points_change_notification)

### File List

**Story File:**
- `_bmad-output/implementation-artifacts/3-11-points-milestone-achievement-notification.md`

**Related Planning Artifacts:**
- `_bmad-output/planning-artifacts/epics.md` (Story 3.11 definition)
- `_bmad-output/planning-artifacts/prd.md` (FR20-28, NFR4)
- `_bmad-output/planning-artifacts/architecture.md` (ADR-1, ADR-5)

**Related Story Files (Epic 3):**
- Story 3.10: Points Change Notification (ready-for-dev) - BASE STORY
- Story 3.1: System Calculates Points on Task Approval (ready-for-dev)
- Story 3.5: Parent Temporary Points Adjustment (ready-for-dev)
