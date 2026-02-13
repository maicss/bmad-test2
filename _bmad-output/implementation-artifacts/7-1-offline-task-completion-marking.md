# Story 7.1: Offline Task Completion Marking

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 儿童,
I want 在离线状态下标记任务为完成,
So that 我可以在没有网络时仍然可以完成日常任务，并在恢复连接后自动同步。

## Acceptance Criteria

1. **Given** 儿童已登录Family Reward系统
   **And** 儿童处于离线状态（网络断开或连接不稳定）
   **When** 儿童标记一个任务为完成
   **Then** 系统检测到该任务是否需要家长审批：
     - 如果任务需要审批（如常规任务，儿童没有直接完成权限）：
       - 任务状态更新为"等待家长审批"
       - 任务操作加入离线队列（IndexedDB）
       - 显示乐观UI更新：任务立即显示为"已标记完成"状态
       - 顶部网络状态指示器显示为红色（离线模式）
       - 离线队列计数器更新（如"离线队列：1个操作"）
     - 如果任务可以直接完成（如签到任务，有直接完成权限）：
       - 任务状态更新为"已完成"
       - 任务操作加入离线队列（IndexedDB）
       - 显示乐观UI更新：任务立即显示为"已完成"状态
       - 顶部网络状态指示器显示为红色（离线模式）
       - 离线队列计数器更新

2. **Given** 儿童在离线状态下已标记多个任务为完成
   **When** 儿童查看任务列表
   **Then** 所有离线操作的任务显示乐观UI状态（立即反馈）
   **And** 顶部网络状态指示器持续显示为红色
   **And** 离线队列计数器准确显示待同步操作数量

3. **Given** 设备从离线状态恢复到在线状态
   **When** Background Sync API触发（浏览器自动检测网络恢复）
   **Then** 系统自动批量上传离线队列中的所有操作到服务器
   **And** 每个操作的同步状态更新：
     - 同步成功：从离线队列移除
     - 同步失败：保留在队列中，显示错误提示
   **And** 如果检测到冲突（如服务器版本与离线版本不一致）：
     - 显示用户选择对话框：
       - "保留离线版本"
       - "使用服务器版本"
     - 用户选择后更新为对应版本
   **And** 顶部网络状态指示器：
     - 同步进行中：显示为橙色（⟳ 同步中）
     - 同步完成：显示为绿色（✓ 已连接且已同步）

4. **Given** 离线队列中已有5个待同步操作
   **When** 儿童尝试进行新的离线操作（如标记另一个任务为完成）
   **Then** 系统阻止该操作
   **And** 显示提示对话框："已达到离线操作上限（5个），请连接互联网后继续"
   **And** 顶部网络状态指示器显示为红色（离线模式）
   **And** 提示用户连接网络后继续

5. **Given** 儿童在离线状态下标记任务为完成
   **When** 网络恢复并完成同步
   **Then** 服务器验证任务完成状态：
     - 如果任务需要审批：向家长推送审批通知
     - 如果任务可以直接完成：直接结算积分
   **And** 家长收到审批通知（如需要）
   **And** 儿童的任务状态最终更新为服务器确认的状态

6. **Given** 儿童在离线状态下标记任务为完成
   **When** 操作加入离线队列
   **Then** 离线队列数据存储在IndexedDB中，包含：
     - 操作类型（mark_task_complete）
     - 任务ID（taskId）
     - 操作时间戳（timestamp，用于冲突解决）
     - 操作数据（如任务状态、备注等）
   **And** 队列操作按时间戳排序
   **And** 数据持久化，刷新页面后不丢失

7. **Given** 儿童在离线状态下
   **When** 查看任务列表
   **Then** 所有任务数据从IndexedDB缓存加载
   **And** 页面加载时间 < 2秒（NFR1：儿童端页面加载时间要求）
   **And** 乐观UI更新响应时间 < 100ms（即时反馈）

8. **Given** 系统执行离线操作同步
   **When** 同步完成
   **Then** API响应时间 < 500ms（NFR3：API响应时间要求）
   **And** 同步失败时显示明确的错误提示
   **And** 操作记录到审计日志（NFR14）

## Tasks / Subtasks

- [ ] Task 1: 实现IndexedDB离线队列存储 (AC: 6)
  - [ ] Subtask 1.1: 创建`lib/offline/queue.ts`模块，定义队列数据结构
  - [ ] Subtask 1.2: 实现IndexedDB数据库初始化（数据库名：family-reward-offline）
  - [ ] Subtask 1.3: 实现队列操作：addOperation（添加操作）、getOperations（获取所有操作）、removeOperation（移除操作）、clearQueue（清空队列）
  - [ ] Subtask 1.4: 为队列操作添加时间戳字段（用于冲突解决）

- [ ] Task 2: 实现网络状态检测 (AC: 1, 2, 3, 4)
  - [ ] Subtask 2.1: 创建`lib/offline/network-status.ts`模块
  - [ ] Subtask 2.2: 使用navigator.onLine和window.addEventListener('online'/'offline')监听网络状态
  - [ ] Subtask 2.3: 创建网络状态指示器组件（顶部栏：绿色/橙色/红色）
  - [ ] Subtask 2.4: 集成到主布局组件（`app/layout.tsx`）

- [ ] Task 3: 实现乐观UI更新 (AC: 1, 2, 7)
  - [ ] Subtask 3.1: 修改任务状态管理（Zustand store），支持乐观更新
  - [ ] Subtask 3.2: 在`components/features/task-card.tsx`中实现即时UI反馈
  - [ ] Subtask 3.3: 添加乐观更新回滚逻辑（同步失败时恢复原状态）
  - [ ] Subtask 3.4: 确保UI响应时间 < 100ms

- [ ] Task 4: 实现离线任务完成标记 (AC: 1, 2, 6)
  - [ ] Subtask 4.1: 创建API端点`/api/tasks/[id]/complete`（标记任务完成）
  - [ ] Subtask 4.2: 在`lib/db/queries/tasks.ts`中添加`markTaskComplete()`函数
  - [ ] Subtask 4.3: 实现权限检查：检查儿童是否可以直接完成任务（如签到任务）或需要审批
  - [ ] Subtask 4.4: 在任务组件中调用API，如果网络断开则加入离线队列
  - [ ] Subtask 4.5: 根据权限设置任务状态（"等待家长审批"或"已完成"）

- [ ] Task 5: 实现队列限制（5个操作上限） (AC: 4)
  - [ ] Subtask 5.1: 在队列模块中添加队列长度检查（`getOperations().length >= 5`）
  - [ ] Subtask 5.2: 创建提示对话框组件（Shadcn Dialog）
  - [ ] Subtask 5.3: 在操作前检查队列长度，达到上限时阻止操作并显示提示
  - [ ] Subtask 5.4: 添加离线队列计数器UI组件

- [ ] Task 6: 实现Background Sync API自动同步 (AC: 3, 5)
  - [ ] Subtask 6.1: 在`public/sw/sync-handler.js`中实现Background Sync事件监听
  - [ ] Subtask 6.2: 创建同步服务（`lib/offline/sync.ts`），批量上传离线队列操作
  - [ ] Subtask 6.3: 实现同步状态跟踪（进行中/成功/失败）
  - [ ] Subtask 6.4: 注册Background Sync事件（navigator.serviceWorker.ready.then(...register('sync-tasks'))）
  - [ ] Subtask 6.5: 触发同步逻辑：网络恢复时自动同步

- [ ] Task 7: 实现冲突解决机制 (AC: 3)
  - [ ] Subtask 7.1: 创建冲突检测逻辑（`lib/offline/conflict-resolver.ts`）
  - [ ] Subtask 7.2: 实现时间戳比较策略（离线版本 vs 服务器版本）
  - [ ] Subtask 7.3: 创建冲突解决UI对话框（Shadcn Dialog）
  - [ ] Subtask 7.4: 实现"保留离线版本"逻辑：用离线数据覆盖服务器数据
  - [ ] Subtask 7.5: 实现"使用服务器版本"逻辑：用服务器数据更新本地状态

- [ ] Task 8: 实现同步后业务逻辑处理 (AC: 5, 8)
  - [ ] Subtask 8.1: 同步成功后触发通知服务（`lib/notifications/push.ts`）
  - [ ] Subtask 8.2: 如果任务需要审批，向家长推送审批通知
  - [ ] Subtask 8.3: 如果任务可以直接完成，触发积分结算服务（`lib/services/points-calculator.ts`）
  - [ ] Subtask 8.4: 记录操作到审计日志（NFR14）
  - [ ] Subtask 8.5: 确保API响应时间 < 500ms（NFR3）

- [ ] Task 9: 编写BDD测试 (All ACs)
  - [ ] Subtask 9.1: 编写集成测试（`tests/integration/offline/task-completion-offline.spec.ts`）
  - [ ] Subtask 9.2: 测试场景：离线标记任务完成，网络恢复后自动同步
  - [ ] Subtask 9.3: 测试场景：离线队列达到上限，阻止新操作
  - [ ] Subtask 9.4: 测试场景：冲突检测与解决（离线版本 vs 服务器版本）
  - [ ] Subtask 9.5: 测试场景：乐观UI更新与回滚
  - [ ] Subtask 9.6: 测试场景：网络状态指示器显示正确
  - [ ] Subtask 9.7: 测试场景：API响应时间 < 500ms，UI响应时间 < 100ms

## Dev Notes

### Architecture Compliance (from ADR-4: Offline Queue & Conflict Resolution)

**ADR-4 Decision: IndexedDB + Background Sync API + Timestamp-based Conflict Resolution**

**Key Architecture Decisions:**
1. **IndexedDB for Offline Queue**: Supports complex data structures (operation type, taskId, timestamp, data)
2. **Background Sync API for Automatic Synchronization**: Triggers when network restores
3. **Optimistic UI with Instant Feedback**: User sees immediate feedback before server confirmation
4. **Timestamp-based Conflict Resolution**: User chooses between offline version and server version

**Technical Implementation Requirements:**
- Offline queue location: `lib/offline/queue.ts` (IndexedDB wrapper)
- Sync service: `lib/offline/sync.ts` (Background Sync handler)
- Conflict resolver: `lib/offline/conflict-resolver.ts` (Timestamp comparison)
- Network status: `lib/offline/network-status.ts` (Online/offline detection)
- Service Worker: `public/sw/sync-handler.js` (Background Sync registration)

### Technical Stack Requirements

**MUST USE (from project-context.md):**
- **Bun 1.3.x+ runtime** - NO Node.js compatibility layer
- **IndexedDB API** - Browser native API for offline storage
- **Background Sync API** - Service Worker API for automatic synchronization
- **Zustand for state management** - Optimistic UI updates
- **Shadcn UI 3.7.0+** - Dialog components for conflict resolution and blocking prompts

**FORBIDDEN (RED LIST):**
- ❌ Use Node.js `fs` or `path` modules - Use browser APIs only
- ❌ Use `process.env` - Use `Bun.env` (server-side) or browser APIs (client-side)
- ❌ Use `alert()` - Must use Shadcn Dialog/Toast
- ❌ Use any external IndexedDB wrapper libraries - Use native IndexedDB API

### Database Query Requirements

**MUST USE Drizzle ORM (RED LIST):**
```typescript
// ✅ CORRECT - Use Drizzle ORM
import { db } from '@/lib/db';
import { tasks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Query task
const task = await db.query.tasks.findFirst({
  where: eq(tasks.id, taskId)
});

// Update task status
await db.update(tasks)
  .set({ status: 'completed' })
  .where(eq(tasks.id, taskId));

// ❌ FORBIDDEN - Raw SQL
const result = db.execute(`UPDATE tasks SET status = 'completed' WHERE id = ${taskId}`);
```

**ALL database queries MUST be in `lib/db/queries/tasks.ts`:**
```typescript
// lib/db/queries/tasks.ts
import { db } from '@/lib/db';
import { tasks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function markTaskComplete(taskId: string, userId: string) {
  return db.update(tasks)
    .set({ status: 'completed', completedAt: new Date() })
    .where(eq(tasks.id, taskId));
}

export async function getTaskById(taskId: string) {
  return db.query.tasks.findFirst({
    where: eq(tasks.id, taskId)
  });
}
```

### IndexedDB Implementation Pattern

**Native IndexedDB API (No wrapper libraries):**

```typescript
// lib/offline/queue.ts
interface OfflineOperation {
  id: string;
  type: 'mark_task_complete' | 'create_wish' | 'adjust_points';
  taskId?: string;
  timestamp: number;
  data: unknown;
}

class OfflineQueue {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'family-reward-offline';
  private readonly STORE_NAME = 'operations';

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async addOperation(operation: OfflineOperation): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.STORE_NAME, 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.add(operation);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getOperations(): Promise<OfflineOperation[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.STORE_NAME, 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index('timestamp');
      const request = index.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async removeOperation(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.STORE_NAME, 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const offlineQueue = new OfflineQueue();
```

### Background Sync API Implementation Pattern

```javascript
// public/sw/sync-handler.js
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-tasks') {
    event.waitUntil(syncOfflineQueue());
  }
});

async function syncOfflineQueue() {
  try {
    // Fetch offline operations from IndexedDB
    const operations = await getOfflineOperations();

    // Upload to server in batch
    for (const operation of operations) {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(operation),
      });

      if (response.ok) {
        // Remove from queue
        await removeOfflineOperation(operation.id);
      }
    }

    // Notify clients of sync completion
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({ type: 'SYNC_COMPLETE' });
      });
    });
  } catch (error) {
    console.error('Sync failed:', error);
  }
}
```

### Conflict Resolution Pattern

```typescript
// lib/offline/conflict-resolver.ts
export interface ConflictInfo {
  taskId: string;
  offlineVersion: { status: string; timestamp: number };
  serverVersion: { status: string; timestamp: number };
}

export function resolveConflict(conflict: ConflictInfo, choice: 'offline' | 'server') {
  if (choice === 'offline') {
    // Use offline version (overwrite server)
    return {
      version: conflict.offlineVersion,
      action: 'overwrite_server'
    };
  } else {
    // Use server version (update local)
    return {
      version: conflict.serverVersion,
      action: 'update_local'
    };
  }
}
```

### Optimistic UI Pattern (Zustand)

```typescript
// lib/store/task-store.ts
import { create } from 'zustand';

interface TaskStore {
  tasks: Task[];
  markTaskComplete: (taskId: string) => Promise<void>;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],

  markTaskComplete: async (taskId: string) => {
    const { tasks } = get();

    // Optimistic update (immediate UI feedback)
    set({
      tasks: tasks.map((task) =>
        task.id === taskId ? { ...task, status: 'completed' } : task
      ),
    });

    try {
      // Try to sync with server
      await fetch(`/api/tasks/${taskId}/complete`, { method: 'POST' });
    } catch (error) {
      // Rollback on error
      set({ tasks }); // Revert to original state

      // Add to offline queue
      await offlineQueue.addOperation({
        id: Bun.randomUUIDv7(),
        type: 'mark_task_complete',
        taskId,
        timestamp: Date.now(),
        data: { status: 'completed' }
      });
    }
  },
}));
```

### Network Status Detection Pattern

```typescript
// lib/offline/network-status.ts
import { create } from 'zustand';

type NetworkStatus = 'online' | 'syncing' | 'offline';

interface NetworkState {
  status: NetworkStatus;
  queueCount: number;
  setStatus: (status: NetworkStatus) => void;
  setQueueCount: (count: number) => void;
}

export const useNetworkStatus = create<NetworkState>((set) => ({
  status: navigator.onLine ? 'online' : 'offline',
  queueCount: 0,
  setStatus: (status) => set({ status }),
  setQueueCount: (count) => set({ queueCount: count }),
}));

// Initialize event listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useNetworkStatus.getState().setStatus('syncing');
  });

  window.addEventListener('offline', () => {
    useNetworkStatus.getState().setStatus('offline');
  });
}
```

### File Structure Requirements

**ALL files MUST follow this structure:**

```
src/
├── lib/
│   ├── db/
│   │   └── queries/
│   │       └── tasks.ts            # Task queries (MUST be here)
│   ├── offline/                    # NEW - Offline support
│   │   ├── queue.ts                # IndexedDB wrapper
│   │   ├── sync.ts                # Sync service
│   │   ├── conflict-resolver.ts    # Conflict resolution
│   │   └── network-status.ts      # Network detection
│   ├── store/
│   │   └── task-store.ts          # Zustand store
│   └── services/
│       └── points-calculator.ts   # Points calculation
├── components/
│   ├── features/
│   │   ├── task-card.tsx          # Task card with offline support
│   │   └── network-indicator.tsx   # Network status indicator
│   └── ui/
│       └── dialog.tsx              # Shadcn Dialog (conflicts, prompts)
├── app/
│   ├── api/
│   │   └── tasks/
│   │       └── [id]/
│   │           └── complete.ts    # API endpoint
│   └── layout.tsx                 # Root layout with indicator
└── public/
    └── sw/
        ├── sw.js                   # Service Worker entry
        └── sync-handler.js         # Background Sync handler
```

### Testing Standards (BDD Style)

**MUST use Given-When-Then format:**

```typescript
// tests/integration/offline/task-completion-offline.spec.ts
import { describe, it, expect, beforeEach } from 'bun:test';
import { offlineQueue } from '@/lib/offline/queue';
import { markTaskComplete } from '@/lib/db/queries/tasks';

describe('Offline Task Completion', () => {
  beforeEach(async () => {
    await offlineQueue.clearQueue();
  });

  it('given 儿童处于离线状态，when 标记任务为完成，then 状态变为"等待家长审批"并加入离线队列', async () => {
    // Given: 儿童处于离线状态且有任务
    const child = await createChild();
    const task = await createTask({ familyId: child.familyId, requiresApproval: true });
    const originalStatus = task.status;

    // When: 标记任务为完成（离线）
    const result = await markTaskCompleteOffline(task.id, child.id);

    // Then: 状态变为"等待家长审批"
    expect(result.status).toBe('awaiting_approval');

    // And: 加入离线队列
    const operations = await offlineQueue.getOperations();
    expect(operations).toHaveLength(1);
    expect(operations[0].type).toBe('mark_task_complete');
    expect(operations[0].taskId).toBe(task.id);
  });

  it('given 离线队列中已有5个待同步操作，when 用户尝试新的离线操作，then 阻止操作并显示提示', async () => {
    // Given: 离线队列中已有5个待同步操作
    for (let i = 0; i < 5; i++) {
      await offlineQueue.addOperation({
        id: Bun.randomUUIDv7(),
        type: 'mark_task_complete',
        taskId: `task-${i}`,
        timestamp: Date.now(),
        data: {}
      });
    }

    // When: 用户尝试新的离线操作
    const child = await createChild();
    const task = await createTask({ familyId: child.familyId });

    // Then: 阻止操作
    const result = await tryMarkTaskCompleteOffline(task.id, child.id);
    expect(result.success).toBe(false);
    expect(result.error).toBe('QUEUE_LIMIT_REACHED');

    // And: 队列数量仍为5
    const operations = await offlineQueue.getOperations();
    expect(operations).toHaveLength(5);
  });

  it('given 设备从离线恢复到在线，when Background Sync API触发，then 批量上传操作到服务器', async () => {
    // Given: 离线队列中有操作
    const child = await createChild();
    const task = await createTask({ familyId: child.familyId });
    await offlineQueue.addOperation({
      id: Bun.randomUUIDv7(),
      type: 'mark_task_complete',
      taskId: task.id,
      timestamp: Date.now(),
      data: { status: 'completed' }
    });

    // When: 网络恢复并触发同步
    await syncOfflineQueue();

    // Then: 服务器任务状态已更新
    const updatedTask = await getTaskById(task.id);
    expect(updatedTask.status).toBe('completed');

    // And: 队列已清空
    const operations = await offlineQueue.getOperations();
    expect(operations).toHaveLength(0);
  });
});
```

### Performance Requirements

**From NFRs:**
- **NFR1**: 儿童端页面加载时间 < 2秒
- **NFR3**: API响应时间 < 500ms（P95）
- **NFR4**: 实时数据同步延迟 < 3秒
- **UI Response**: 乐观UI更新响应时间 < 100ms

**Optimization Strategies:**
- Use IndexedDB for fast offline data access
- Implement batch API requests (group multiple operations)
- Use debounce/throttle for network status updates
- Lazy load task lists (virtualization for large lists)

### Security & Compliance Requirements

**From NFRs:**
- **NFR8**: 所有数据传输使用 HTTPS/TLS 1.3
- **NFR9**: 敏感数据（儿童信息）加密存储
- **NFR14**: 操作日志审计（记录所有关键操作）

**Privacy Compliance (COPPA/GDPR/China):**
- Offline data must be encrypted at rest (IndexedDB encryption)
- Parent consent required before storing child data offline
- Data retention: 3 years compliance
- Soft delete: 7-day recovery window

### Accessibility Requirements

**From UX Design:**
- **NFR28**: 大按钮、简洁界面（适合7岁以上儿童独立使用）
- **NFR29**: 视觉反馈（动画、进度条、音效）
- **NFR30**: 图标+文字组合，降低阅读门槛
- **NFR31**: 色彩对比度符合 WCAG AA 标准

**Network Status Indicator:**
- Green ✓: Online and synced (accessible text: "已连接")
- Orange ⟳: Syncing in progress (accessible text: "同步中")
- Red ⚠: Offline mode (accessible text: "离线模式")

### Error Handling Requirements

**Use Shadcn Dialog/Toast (NEVER alert()):**

```typescript
// ✅ CORRECT - Use Shadcn Toast
import { toast } from 'sonner';

toast.error('已达到离线操作上限（5个），请连接互联网后继续');

// ❌ FORBIDDEN - Use alert()
alert('已达到离线操作上限（5个），请连接互联网后继续');
```

**Error Cases:**
1. **Queue Limit Reached**: Show Shadcn Dialog with message and "Connect to Internet" button
2. **Sync Failure**: Show Shadcn Toast with retry option
3. **Conflict Detected**: Show Shadcn Dialog with "Keep Offline Version" and "Use Server Version" buttons
4. **Network Error**: Show Shadcn Toast with "Connection failed, will retry when online"

### Project Structure Notes

- **Alignment with unified project structure**: Offline support module follows `lib/offline/` pattern
- **Service Worker location**: `public/sw/` for PWA compliance
- **State management**: Zustand stores in `lib/store/`
- **No Node.js APIs**: Client-side code uses browser APIs only

### References

- [Source: _bmad-output/project-context.md#Offline-Support](../_bmad-output/project-context.md)
- [Source: _bmad-output/planning-artifacts/epics.md#Epic-7](../_bmad-output/planning-artifacts/epics.md)
- [Source: _bmad-output/planning-artifacts/architecture.md#ADR-4](../_bmad-output/planning-artifacts/architecture.md)
- [Source: docs/TECH_SPEC_PWA.md](../docs/TECH_SPEC_PWA.md)
- [Source: docs/TECH_SPEC_BDD.md](../docs/TECH_SPEC_BDD.md)

## Dev Agent Record

### Agent Model Used

glm-4.7

### Debug Log References

None (new story)

### Completion Notes List

- Epic 7 is now in-progress (first story in epic)
- Story 7.1 is ready-for-dev with comprehensive offline task completion marking guidance
- All technical requirements from ADR-4 (IndexedDB + Background Sync + Timestamp conflict resolution) documented
- BDD test structure defined with Given-When-Then format
- Performance requirements specified: UI response < 100ms, API response < 500ms, page load < 2s
- Queue limit enforcement (5 operations) and blocking prompt requirements included
- Conflict resolution UI pattern documented with Shadcn Dialog components

### File List

**Files to create/modify:**
- `lib/offline/queue.ts` (NEW)
- `lib/offline/sync.ts` (NEW)
- `lib/offline/conflict-resolver.ts` (NEW)
- `lib/offline/network-status.ts` (NEW)
- `lib/store/task-store.ts` (MODIFY - add optimistic update logic)
- `lib/db/queries/tasks.ts` (MODIFY - add markTaskComplete function)
- `components/features/task-card.tsx` (MODIFY - add offline support)
- `components/features/network-indicator.tsx` (NEW)
- `app/api/tasks/[id]/complete.ts` (NEW)
- `app/layout.tsx` (MODIFY - add network indicator)
- `public/sw/sync-handler.js` (NEW)
- `tests/integration/offline/task-completion-offline.spec.ts` (NEW)
