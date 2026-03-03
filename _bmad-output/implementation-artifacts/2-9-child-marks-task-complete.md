# Story 2.9: Child Marks Task Complete

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 儿童,
I want 标记任务为完成,
So that 我可以记录自己完成的任务并获得积分。

## Acceptance Criteria

**Given** 我有未完成的任务
**When** 我点击任务卡片上的"完成"按钮
**Then** 系统显示完成确认对话框：
  - 显示任务名称和积分值
  - 可选的完成证明上传（拍照或相册选择）
  - "确认完成"和"取消"按钮
**And** 点击确认后：
  - 如果任务需要家长审批 → 状态变为"待审批"
  - 如果任务无需审批（如自行打卡类） → 状态变为"已完成"，积分立即到账
**And** 任务卡片状态更新显示"待审批"或"已完成"
**And** 显示乐观UI更新：立即反馈成功状态，后台处理实际请求

## Tasks / Subtasks

- [ ] Task 1: 扩展tasks表支持任务完成证明 (AC: 完成证明上传（拍照或相册选择）)
  - [ ] 1.1 验证tasks表已有proof_image字段（从Story 2.7）
  - [ ] 1.2 创建图片上传API端点（app/api/upload/image/route.ts）
  - [ ] 1.3 实现图片存储（本地或图床）
  - [ ] 1.4 更新lib/db/queries/tasks.ts支持proof_image字段查询
  - [ ] 1.5 实现图片压缩（优化存储大小）

- [ ] Task 2: 实现任务完成对话框UI (AC: 点击任务卡片上的"完成"按钮，显示完成确认对话框)
  - [ ] 2.1 创建TaskCompleteDialog组件（Shadcn Dialog）
  - [ ] 2.2 实现任务信息展示（任务名称、积分值）
  - [ ] 2.3 实现完成证明上传区域（拍照/相册选择）
  - [ ] 2.4 实现"确认完成"和"取消"按钮
  - [ ] 2.5 添加加载状态指示器（图片上传中）

- [ ] Task 3: 实现图片上传功能 (AC: 可选的完成证明上传拍照或相册选择）
  - 3.1 实现拍照功能（相机API调用）
  - [ ] 3.2 实现相册选择（Web SpeechRecognition API或文件选择）
  - [ ] 3.3 实现图片预览（上传前确认）
  [ ] 3.4 实现图片压缩和格式转换（JPEG优化）
  [ ] 3.5 实现图片删除功能（重新选择）

- [ ] Task 4: 实现任务完成API端点 (AC: 点击确认后，状态变更为待审批或已完成)
  - [ ] 4.1 创建app/api/tasks/[id]/complete/route.ts（POST端点）
  [ ] 4.2 实现任务状态转换逻辑
  - [ ] 4.3 检测任务是否需要审批（task_type字段）
  - [ 4.4 如需审批 → 状态变更为"pending_approval"
  - [ ] 4.5 如无需审批 → 状态变更为"completed" + 积分结算

- [ ] Task 5: 实现无需审批任务的积分结算 (AC: 无需审批，积分立即到账)
  - [ ] 5.1 扩展PointsCalculator服务（从Story 2.2）
  [ ] 5.2 实现即时积分结算逻辑
  [ 5.3 更新儿童积分余额（lib/db/queries/point-balances.ts）
  [ ] 5.4 创建积分历史记录（lib/db/queries/points-history.ts）
  [ 5.5 使用事务保证原子性（任务状态+积分同时更新）

- [ ] Task 6: 实现乐观UI更新机制 (AC: 显示乐观UI更新：立即反馈成功状态，后台处理实际请求)
  - [ ] 6.1 实现客户端状态乐观更新（点击确认后立即更新UI）
  [ ] 6.2 实现请求失败回滚（API失败时恢复原状态）
  [ ] 6.3 实现加载状态指示器（上传中/处理中）
  [ ] 6.4 添加成功/失败音效反馈

- [ ] Task 7: 集成到TaskCard组件 (AC: 点击任务卡片上的"完成"按钮)
  - [ ] 7.1 更新TaskCard组件添加"完成"按钮
  [ ] 7.2 实现点击事件处理（打开完成对话框）
  - [ ] 7.3 实现任务状态显示（待完成/已完成/待审批）
  - [ ] 7.4 集成TaskCompleteDialog到TaskCard
  - [ ] 7.5 实现按钮状态管理（已完成任务禁用"完成"按钮）

- [ ] Task 8: 实现任务状态动画和反馈 (AC: 任务卡片状态更新显示)
  - [ ] 8.1 实现状态变化过渡动画（使用Framer Motion）
  [ ] 8.2 实现音效播放（Shadcn Audio或Bun内置）
  - [ ] 8.3 实现震动反馈（如设备支持）
  [ ] 8.4 实现游戏化元素（表情、"小助手"表扬）

- [ ] 9: 编写BDD测试 (AC: 所有验收条件)
  - [ ] 9.1 Given-When-Then格式：任务完成集成测试
  - [ ] 9.2 测试需要审批的任务状态转换
  - [ ] 9.3 测试无需审批的任务状态转换和积分结算
  - [ ] 9.4 测试图片上传功能
  - 9.5 测试乐观UI更新机制
  - [ ] 9.6 测试任务完成音效和动画

- [ ] Task 10: 实现错误处理和用户反馈 (AC: 用户体验要求)
  - [ ] 10.1 使用Shadcn Toast显示错误提示
  [ ] 10.2 处理网络错误（离线状态指示）
  [ 10.3 处理图片上传失败（重试机制）
  - [ ] 10.4 实现友好错误提示（"网络连接失败，请重试"）
  - [ ] 10.5 实现任务状态冲突处理（任务已完成时标记）

## Dev Notes

### Technical Requirements

**Technology Stack (MUST USE):**
- Runtime: Bun 1.3.x+ (NO Node.js compatibility layer)
- Framework: Next.js 16.x + React 19.x
- Database: bun:sqlite + Drizzle ORM 0.45.1+ (NO native SQL)
- Auth: Better-Auth 1.4.x+ with phone plugin
- UI: Tailwind CSS 4 + Shadcn UI 3.7.0+
- Testing: Bun Test + Playwright (BDD style)
- Types: TypeScript 5 strict mode (NO `any`, NO `@ts-ignore`)

**RED LIST Rules (CRITICAL - DO NOT VIOLATE):**
1. ❌ NO native SQL - MUST use Drizzle ORM
2. ❌ NO string concatenation for SQL - use Drizzle query builder
3. ❌ NO SQL in components/routes - encapsulate in lib/db/queries/
4. ❌ NO `any` type - use `unknown` + type guards
5. ❌ NO `@ts-ignore` - fix type errors
6. ❌ NO Node.js compatibility layer - use Bun built-ins
7. ❌ NO process.env - use Bun.env
8. ❌ NO alert() - use Shadcn Dialog/Toast
9. ❌ NO new dependencies without explicit approval

**Database Schema (from Story 2.7):**
```typescript
// database/schema/tasks.ts
export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  taskPlanId: text('task_plan_id'), // NULL for manual tasks
  childId: text('child_id').notNull(),
  title: text('title').notNull(),
  taskType: text('task_type').notNull(),
  points: integer('points').notNull(),
  status: text('status').notNull().default('pending'), 
    // 'pending' | 'pending_approval' | 'completed' | 'rejected'
  date: text('date').notNull(),
  notes: text('notes'),
  isManual: boolean('is_manual').notNull().default(false),
  proofImage: text('proof_image'), // Base64 or image URL
  rejectionReason: text('rejection_reason'),
  approvedBy: text('approved_by'), // Parent who approved
  approvedAt: timestamp('approved_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`)
});
```

**Task Type Definition (for approval detection):**
```typescript
// types/task-type.ts
export type TaskType = 
  | 'brushing'      // 刷牙
  | 'study'        // 学习
  | 'sports'       // 运动
  | 'housework'     // 家务
  | 'checkin'       // 签到（自动审批）
  | 'custom';       // 自定义

export const TASK_TYPES_NEEDING_APPROVAL = [
  'brushing',
  'study',
  'sports',
  'housework',
  'custom'
] as const;

export const TASK_TYPES_AUTO_APPROVED = [
  'checkin'
] as const;
```

**API Pattern:**
```typescript
// app/api/tasks/[id]/complete/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { markTaskComplete } from '@/lib/db/queries/tasks';
import { requireChildAuth } from '@/lib/auth/guards';
import { calculatePointsOnApproval } from '@/lib/services/points-calculator';
import { TASK_TYPES_NEEDING_APPROVAL, TASK_TYPES_AUTO_APPROVED } from '@/types/task-type';

export async function POST(req: NextRequest, { params }) {
  try {
    const session = await requireChildAuth(req);
    const { proofImage } = await req.json();

    const taskId = params.id;
    const task = await getTaskById(taskId);

    if (!task) {
      return NextResponse.json({ 
        error: 'Task not found' 
      }, { status: 404 });
    }

    if (task.childId !== session.childId) {
      return NextResponse.json({ 
        error: 'Not your task' 
      }, { status: 403 });
    }

    if (task.status !== 'pending') {
      return NextResponse.json({ 
        error: 'Task already completed or in progress' 
      }, { status: 400 });
    }

    const taskType = task.taskType as TaskType;
    const needsApproval = TASK_TYPES_NEEDING_APPROVAL.includes(taskType);
    const autoApproved = TASK_TYPES_AUTO_APPROVED.includes(taskType);

    let newStatus: 'pending_approval';
    let pointsAwarded = 0;

    if (!needsApproval) {
      // Auto-approved: complete and award points immediately
      newStatus = 'completed';
      
      // Calculate and award points
      await calculatePointsOnApproval(taskId);
      pointsAwarded = task.points;
    } else {
      // Needs parent approval
      newStatus = 'pending_approval';
    }

    // Update task status
    const updatedTask = await markTaskComplete(taskId, {
      status: newStatus,
      proofImage: proofImage,
      completedAt: new Date()
    });

    return NextResponse.json({ 
      success: true,
      task: updatedTask,
      pointsAwarded,
      message: needsApproval 
        ? '任务已提交审批' 
        : '任务完成！+' + pointsAwarded + '分'
    });

  } catch (error) {
    console.error('Task completion failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
```

**Query Pattern (MUST FOLLOW):**
```typescript
// lib/db/queries/tasks.ts
import { db } from '@/lib/db';
import { tasks } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function markTaskComplete(
  taskId: string,
  data: { 
    proofImage?: string; 
    completedAt?: Date 
  }
) {
  const now = data.completedAt || new Date();

  return await db.update(tasks)
    .set({
      status: 'pending_approval',
      proofImage: data.proofImage,
      completedAt: now,
      updatedAt: now
    })
    .where(eq(tasks.id, taskId))
    .returning();
}

export async function getTaskById(taskId: string) {
  return await db.query.tasks.findFirst({
    where: eq(tasks.id, taskId)
  });
}
```

**Image Upload Service:**
```typescript
// lib/services/image-upload.ts
export class ImageUploadService {
  /**
   * Upload and process image for task proof
   * @param file - File from input
   * @returns Base64 encoded image string
   */
  async uploadTaskProofImage(file: File): Promise<string> {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Only image files are allowed');
    }

    // Validate file size (<2MB)
    if (file.size > 2 * 1024 * 1024) {
      throw new Error('Image must be less than 2MB');
    }

    // Resize and compress image (use Canvas API)
    const compressedImage = await this.compressImage(file, 800); // Max width 800px

    // Convert to Base64
    const base64 = await compressedImage.text('base64');
    return `data:image/jpeg;base64,${base64}`;
  }

  private async compressImage(file: File, maxWidth: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate scaled dimensions
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Compress to JPEG quality 0.7
        canvas.toBlob(resolve, 'image/jpeg', 0.7);
        URL.revokeObjectURL(url);
      };
      
      img.onerror = reject;
    });
  }
}
```

### Architecture Compliance

**Component Location:**
- Task complete dialog: `components/dialogs/task-complete-dialog.tsx`
- Image upload component: `components/forms/image-upload.tsx`
- Integration: `components/features/task-card.tsx` (from Story 2.8)
- Image service: `lib/services/image-upload.ts`
- Queries: `lib/db/queries/tasks.ts` (extend from Story 2.7)

**Design System:**
- Use Shadcn UI components: Dialog, Button, Textarea, Avatar, Badge, Toast
- Image upload: Drag & drop area, camera icon, gallery icon
- Child-friendly UI: Large buttons, colorful, gamified
- Progress indicators: Loading spinners for image upload
- Task card status: From Story 2.8 (pending/completed/pending_approval)

**Performance Requirements:**
- Task completion API: <500ms (NFR3: P95)
- Image compression: <1 second
- Optimistic UI updates: <50ms
- Auto-approved task total time: <1 second (including points calculation)

### Testing Requirements

**BDD Format (GIVEN-WHEN-THEN):**
```typescript
// tests/integration/task-completion.spec.ts
import { TASK_TYPES_NEEDING_APPROVAL, TASK_TYPES_AUTO_APPROVED } from '@/types/task-type';

it('given 儿童有刷牙任务（需审批），when 标记完成，then 状态变更为待审批', async () => {
  // Given: 儿童已登录，有待完成的刷牙任务
  const family = await createFamily();
  const child = await createChild({ familyId: family.id });

  const task = await createTask({
    childId: child.id,
    title: '每日刷牙',
    taskType: 'brushing',
    status: 'pending',
    date: new Date().toISOString().split('T')[0]
  });

  // When: 标记任务完成
  const response = await request(app)
    .post(`/api/tasks/${task.id}/complete`)
    .set('Cookie', await createSession(child))
    .send({}); // No proof image

  // Then: 任务状态变更为待审批
  expect(response.status).toBe(200);
  expect(response.body.task.status).toBe('pending_approval');
  expect(response.body.needsApproval).toBe(true);
  expect(response.body.pointsAwarded).toBe(0); // No points awarded yet
});

it('given 儿童有签到任务（无需审批），when 标记完成，then 状态变更为已完成，积分立即到账', async () => {
  // Given: 儿童已登录，有待完成的签到任务
  const family = await createFamily();
  const parent = await createParent({ familyId: family.id });
  const child = await createChild({ familyId: family.id });

  const task = await createTask({
    childId: child.id,
    title: '每日签到',
    taskType: 'checkin',
    points: 5,
    status: 'pending',
    date: new Date().toISOString().split('T')[0]
  });

  const initialBalance = 0;

  // When: 标记任务完成
  const response = await request(app)
    .post(`/api/tasks/${task.id}/complete`)
    .set('Cookie', await createSession(child))
    .send({}); // No proof image

  // Then: 任务状态变更为已完成，积分立即到账
  expect(response.status).toBe(200);
  expect(response.body.task.status).toBe('completed');
  expect(response.body.needsApproval).toBe(false);
  expect(response.body.pointsAwarded).toBe(5);

  // And: 积分立即累加到儿童账户
  const balance = await getPointsBalance(child.id);
  expect(balance.balance).toBe(initialBalance + 5);
});

it('given 儿童标记完成时上传照片，when 提交，then 照片存储在task记录中', async () => {
  // Given: 儿童已登录，有待完成任务
  const family = await createFamily();
  const child = await createChild({ familyId: family.id });

  const task = await createTask({
    childId: child.id,
    title: '每日刷牙',
    taskType: 'brushing',
    status: 'pending',
    date: new Date().toISOString().split('T')[0]
  });

  // When: 标记完成并上传照片
  const imageFile = await createTestImageFile('task-proof.jpg');
  const formData = new FormData();
  formData.append('proofImage', imageFile);

  const response = await request(app)
    .post(`/api/tasks/${task.id}/complete`)
    .set('Cookie', await createSession(child))
    .send({ proofImage: formData });

  // Then: 照片存储在task记录中
  expect(response.status).toBe(200);
  const updatedTask = await getTaskById(task.id);
  expect(updatedTask.proofImage).not.toBeNull();
  expect(updatedTask.proofImage).toContain('data:image');
});

  // And: 照片压缩（存储优化）
  const base64Data = updatedTask.proofImage.split(',')[1];
  const decodedImage = await decodeBase64Image(base64Data);
  const width = decodedImage.width;
  expect(width).toBeLessThanOrEqual(800); // Max width 800px
});
```

**Test Coverage:**
- Unit tests for ImageUploadService
- Unit tests for task completion logic
- Unit tests for task type approval detection
- Integration tests for API endpoints
- Integration tests for points calculation (from Story 2.2)
- Integration tests for image upload
- E2E tests for complete user journey (Playwright)
- Optimistic UI tests

### Security & Compliance

**COPPA/GDPR Compliance:**
- Child's photo proof is stored securely (encrypted or access restricted)
- Parent cannot force child to mark task complete
- Audit trail for all task completions
- No personal data in logs

**RBAC:**
- Only Child role can mark their own tasks complete
- Child cannot mark other children's tasks
- Parent can still approve/reject child's marked tasks

**Data Integrity:**
- Image validation (type and size limits)
- Status transitions are validated (pending → pending_approval → completed/rejected)
- Points calculation is atomic (task status + balance updated together)
- Proof image is optional (not required for completion)

### File Length Constraint

**MAX 800 lines per file** - If component exceeds limit, split into:
- task-complete-dialog.tsx (main dialog)
- image-upload.tsx (upload component)
- image-upload-service.ts (image processing logic)

### Project Structure Notes

**Alignment:**
- Follows unified project structure (paths, modules, naming)
- Database queries in lib/db/queries/tasks.ts (per-table file)
- Service layer in lib/services/
- Function-based queries (NOT Repository pattern)
- BDD development (Given-When-Then, tests BEFORE implementation)

**Dependencies:**
- Depends on Story 2.1: Parent Creates Task Plan Template (task_plans table)
- Depends on Story 2.2: Parent Sets Task Points Value (PointsCalculator, points history)
- Depends on Story 2.4: System Auto-Generates Task Instances (tasks table with schema)
- Depends on Story 2.8: Child Views Today's Task List (TaskCard component exists)
- Prerequisite: Users table, Families table exist (Epic 1)

**Cross-Story Impact:**
- Story 2.10 (Parent Approves Task Completion) - processes pending_approval tasks
- Story 2.11 (Parent Rejects Task Completion) - processes rejected tasks
- Story 2.14 (Real-Time Approval Notification) - sends notification when parent approves

### Previous Story Intelligence

**From Story 2.2 (Parent Sets Task Points Value):**
- PointsCalculator class created with calculatePointsOnApproval method
- Points history and balance queries established
- Learnings: Use transactions for atomic updates, batch insert for efficiency

**From Story 2.7 (Parent Batch Approves Tasks):**
- proof_image field added to tasks table
- Task status transitions established (pending → pending_approval → completed/rejected)
- rejectionReason field added
- approvedBy, approvedAt fields added
- Learnings: Status management is critical, use proper validation

**From Story 2.8 (Child Views Today's Task List):**
- TaskCard component created with status display
- Task state management patterns established
- Learnings: Child interface needs gamification, large touch targets

### References

- Source: docs/TECH_SPEC.md - Technical specifications
- Source: docs/TECH_SPEC_DATABASE.md - Database schema
- Source: docs/TECH_SPEC_BUN.md - Bun runtime requirements
- Source: docs/TECH_SPEC_BDD.md - BDD development guidelines
- Source: docs/TECH_SPEC_PWA.md - PWA requirements
- Source: _bmad-output/planning-artifacts/epics.md#Story-2.9 - Story requirements
- Source: _bmad-output/planning-artifacts/architecture.md#ADR-5 - Database query layer architecture
- Source: _bmad-output/planning-artifacts/ux-design-specification.md - UI/UX specifications (child-end design)
- Source: _bmad-output/implementation-artifacts/2-1-parent-creates-task-plan-template.md - Story 2.1 context
- Source: _bmad-output/implementation-artifacts/2-2-parent-sets-task-points-value.md - Story 2.2 context
- Source: _bmad-output/implementation-artifacts/2-7-parent-batch-approves-tasks.md - Story 2.7 context
- Source: _bmad-output/implementation-artifacts/2-8-child-views-todays-task-list.md - Story 2.8 context

### Dev Agent Record

### Agent Model Used

glm-4.7

### Debug Log References

### Completion Notes List

### File List

- `types/task-type.ts` - Task type definitions with approval rules
- `lib/services/image-upload.ts` - Image upload and compression service
- `components/dialogs/task-complete-dialog.tsx` - Task completion dialog
- `components/forms/image-upload.tsx` - Image upload component
- `app/api/tasks/[id]/complete/route.ts` - Task completion API
- `tests/integration/task-completion.spec.ts` - Integration tests
- `tests/unit/image-upload.spec.ts` - Unit tests for image upload
- tests/e2e/task-completion.spec.ts` - E2E tests
