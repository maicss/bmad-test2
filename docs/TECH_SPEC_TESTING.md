# TECH_SPEC_TESTING.md

> 测试策略、覆盖率、测试示例

---

## 测试金字塔

```
     /\
    /  \   E2E Tests (Playwright)
   /____\     10% - 关键用户旅程
  /      \
 /        \ Integration Tests (bun test)
/__________\   60% - API 端点、数据库查询
/            \
/              \ Unit Tests (bun test)
/________________\ 30% - 纯函数、工具类
```

---

## 测试文件规范

```
__tests__/
├── unit/                    # 单元测试
│   ├── lib/
│   │   └── utils.test.ts    # 对应 lib/utils.ts
│   └── types/
│       └── guards.test.ts   # 类型守卫测试
├── integration/             # 集成测试
│   ├── api/
│   │   ├── tasks.test.ts    # API 端点测试
│   │   └── auth.test.ts
│   └── db/
│       └── queries.test.ts  # 数据库查询测试
└── e2e/                     # E2E 测试（Playwright）
    ├── auth-flow.spec.ts
    └── task-lifecycle.spec.ts
```

**命名规则**：
- 单元/集成测试：`.test.ts`
- E2E 测试：`.spec.ts`

---

## 测试配置

### Bun 测试配置

```json
// package.json
{
  "scripts": {
    "test": "bun test",
    "test:watch": "bun test --watch",
    "test:coverage": "bun test --coverage"
  }
}
```

### Playwright 配置

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './__tests__/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3344',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:3344',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## 覆盖率目标

| 模块类型 | 覆盖率目标 | 说明 |
|----------|------------|------|
| API 路由 | 90% | 必须覆盖所有错误处理分支 |
| 数据库查询 | 85% | 复杂查询必须测试 |
| 业务逻辑 | 80% | 核心积分计算、权限判断 |
| 工具函数 | 70% | 简单函数可降低要求 |

---

## 单元测试示例

### 工具函数测试

```typescript
// __tests__/unit/lib/utils.test.ts
import { describe, it, expect } from 'bun:test';
import { calculatePoints, formatDate } from '@/lib/utils';

describe('calculatePoints', () => {
  it('should calculate points with combo bonus', () => {
    const result = calculatePoints(10, 3, {
      type: 'linear',
      tiers: [{ minStreak: 3, maxStreak: 7, bonusPoints: 5 }]
    });
    
    expect(result).toBe(15); // 10 + 5
  });
  
  it('should return base points without combo', () => {
    const result = calculatePoints(10, 1, null);
    expect(result).toBe(10);
  });
  
  it('should handle negative points (penalty)', () => {
    const result = calculatePoints(-5, 0, null);
    expect(result).toBe(-5);
  });
});

describe('formatDate', () => {
  it('should format date to YYYY-MM-DD', () => {
    const date = new Date('2026-02-06');
    expect(formatDate(date)).toBe('2026-02-06');
  });
  
  it('should handle string input', () => {
    expect(formatDate('2026-02-06')).toBe('2026-02-06');
  });
});
```

### 类型守卫测试

```typescript
// __tests__/unit/types/guards.test.ts
import { describe, it, expect } from 'bun:test';
import { isValidTaskStatus, validateTaskBase } from '@/types/guards/task';

describe('isValidTaskStatus', () => {
  it('should return true for valid statuses', () => {
    expect(isValidTaskStatus('pending')).toBe(true);
    expect(isValidTaskStatus('completed')).toBe(true);
    expect(isValidTaskStatus('cancelled')).toBe(true);
  });
  
  it('should return false for invalid statuses', () => {
    expect(isValidTaskStatus('invalid')).toBe(false);
    expect(isValidTaskStatus('')).toBe(false);
    expect(isValidTaskStatus(null)).toBe(false);
  });
});

describe('validateTaskBase', () => {
  it('should validate correct task data', () => {
    const data = {
      id: 'task-1',
      title: 'Test Task',
      points: 10,
      status: 'pending',
    };
    
    expect(() => validateTaskBase(data)).not.toThrow();
  });
  
  it('should throw for missing fields', () => {
    const data = { id: 'task-1' };
    
    expect(() => validateTaskBase(data)).toThrow('title must be string');
  });
  
  it('should throw for invalid status', () => {
    const data = {
      id: 'task-1',
      title: 'Test',
      points: 10,
      status: 'invalid',
    };
    
    expect(() => validateTaskBase(data)).toThrow('status must be valid');
  });
});
```

---

## 集成测试示例

### API 端点测试

```typescript
// __tests__/integration/api/tasks.test.ts
import { describe, it, expect, beforeEach } from 'bun:test';
import { db } from '@/lib/db';
import { tasks, users, families } from '@/lib/db/schema';

describe('Tasks API', () => {
  beforeEach(async () => {
    // 清理测试数据
    await db.delete(tasks);
    await db.delete(users);
    await db.delete(families);
  });
  
  describe('GET /api/tasks', () => {
    it('should return tasks for family', async () => {
      // 准备测试数据
      const [family] = await db.insert(families).values({
        id: 'family-1',
        name: 'Test Family',
        region: '全国',
      }).returning();
      
      const [user] = await db.insert(users).values({
        id: 'user-1',
        name: 'Test User',
        role: 'child',
        familyId: family.id,
      }).returning();
      
      await db.insert(tasks).values({
        id: 'task-1',
        title: 'Test Task',
        points: 10,
        assigneeId: user.id,
        status: 'pending',
        dueDate: new Date(),
      });
      
      // 发送请求
      const response = await fetch(
        `http://localhost:3344/api/tasks?familyId=${family.id}`,
        {
          headers: {
            Cookie: 'session=test-session-id',
          },
        }
      );
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.tasks).toHaveLength(1);
      expect(data.data.tasks[0].title).toBe('Test Task');
    });
    
    it('should return 400 for missing familyId', async () => {
      const response = await fetch('http://localhost:3344/api/tasks');
      
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VAL_3001');
    });
  });
  
  describe('POST /api/tasks', () => {
    it('should create a new task', async () => {
      const [family] = await db.insert(families).values({
        id: 'family-1',
        name: 'Test Family',
        region: '全国',
      }).returning();
      
      const [user] = await db.insert(users).values({
        id: 'user-1',
        name: 'Test User',
        role: 'child',
        familyId: family.id,
      }).returning();
      
      const response = await fetch('http://localhost:3344/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: 'session=test-session-id',
        },
        body: JSON.stringify({
          title: 'New Task',
          points: 20,
          assigneeId: user.id,
          dueDate: '2026-02-07',
        }),
      });
      
      expect(response.status).toBe(201);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.task.title).toBe('New Task');
    });
    
    it('should return 400 for invalid data', async () => {
      const response = await fetch('http://localhost:3344/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: 'session=test-session-id',
        },
        body: JSON.stringify({
          title: '', // 无效数据
        }),
      });
      
      expect(response.status).toBe(400);
    });
  });
});
```

### 数据库查询测试

```typescript
// __tests__/integration/db/queries.test.ts
import { describe, it, expect, beforeEach } from 'bun:test';
import { db } from '@/lib/db';
import { tasks, users, families, taskPlans } from '@/lib/db/schema';
import { 
  getTasksByFamily, 
  getPendingTasks,
  completeTask 
} from '@/lib/db/queries';

describe('Database Queries', () => {
  beforeEach(async () => {
    await db.delete(tasks);
    await db.delete(taskPlans);
    await db.delete(users);
    await db.delete(families);
  });
  
  describe('getTasksByFamily', () => {
    it('should return tasks for specific family', async () => {
      // 准备数据
      const [family1] = await db.insert(families).values({
        id: 'family-1',
        name: 'Family 1',
        region: '全国',
      }).returning();
      
      const [family2] = await db.insert(families).values({
        id: 'family-2',
        name: 'Family 2',
        region: '全国',
      }).returning();
      
      const [user1] = await db.insert(users).values({
        id: 'user-1',
        name: 'User 1',
        role: 'child',
        familyId: family1.id,
      }).returning();
      
      const [user2] = await db.insert(users).values({
        id: 'user-2',
        name: 'User 2',
        role: 'child',
        familyId: family2.id,
      }).returning();
      
      await db.insert(tasks).values([
        {
          id: 'task-1',
          title: 'Task 1',
          assigneeId: user1.id,
          status: 'pending',
          dueDate: new Date(),
        },
        {
          id: 'task-2',
          title: 'Task 2',
          assigneeId: user2.id,
          status: 'pending',
          dueDate: new Date(),
        },
      ]);
      
      // 测试查询
      const family1Tasks = await getTasksByFamily(family1.id);
      expect(family1Tasks).toHaveLength(1);
      expect(family1Tasks[0].title).toBe('Task 1');
    });
  });
  
  describe('completeTask', () => {
    it('should complete task and add points', async () => {
      const [family] = await db.insert(families).values({
        id: 'family-1',
        name: 'Test Family',
        region: '全国',
      }).returning();
      
      const [user] = await db.insert(users).values({
        id: 'user-1',
        name: 'Test User',
        role: 'child',
        familyId: family.id,
      }).returning();
      
      const [task] = await db.insert(tasks).values({
        id: 'task-1',
        title: 'Test Task',
        assigneeId: user.id,
        status: 'pending',
        dueDate: new Date(),
        points: 10,
      }).returning();
      
      // 完成任务
      const result = await completeTask(task.id, 10);
      
      expect(result.status).toBe('completed');
      expect(result.actualPoints).toBe(10);
    });
  });
});
```

---

## E2E 测试示例

```typescript
// __tests__/e2e/auth-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('parent can login with phone', async ({ page }) => {
    await page.goto('/login');
    
    // 输入手机号
    await page.fill('[name="phone"]', '13800000100');
    await page.click('button[type="submit"]');
    
    // 输入密码
    await page.fill('[name="password"]', '1111');
    await page.click('button[type="submit"]');
    
    // 验证跳转到仪表板
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('仪表板');
  });
  
  test('child can login with PIN', async ({ page }) => {
    await page.goto('/login');
    
    // 选择儿童登录
    await page.click('[data-testid="child-login"]');
    
    // 输入 PIN
    await page.fill('[name="pin"]', '1111');
    await page.click('button[type="submit"]');
    
    // 验证跳转到任务页面
    await expect(page).toHaveURL('/tasks');
  });
  
  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('[name="phone"]', '13800000100');
    await page.fill('[name="password"]', 'wrong-password');
    await page.click('button[type="submit"]');
    
    // 验证错误消息
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('密码错误');
  });
});

test.describe('Task Lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    // 登录
    await page.goto('/login');
    await page.fill('[name="phone"]', '13800000100');
    await page.fill('[name="password"]', '1111');
    await page.click('button[type="submit"]');
  });
  
  test('parent can create task', async ({ page }) => {
    await page.click('[data-testid="create-task"]');
    
    await page.fill('[name="title"]', '完成数学作业');
    await page.fill('[name="points"]', '10');
    await page.selectOption('[name="assignee"]', 'Zhang 3');
    await page.click('button[type="submit"]');
    
    // 验证任务创建成功
    await expect(page.locator('[data-testid="task-title"]')).toContainText('完成数学作业');
  });
  
  test('child can complete task', async ({ page }) => {
    // 先创建任务
    await page.click('[data-testid="create-task"]');
    await page.fill('[name="title"]', '整理房间');
    await page.fill('[name="points"]', '5');
    await page.click('button[type="submit"]');
    
    // 切换到儿童账户
    await page.click('[data-testid="switch-user"]');
    await page.click('[data-testid="user-zhang-3"]');
    
    // 完成任务
    await page.click('[data-testid="complete-task"]');
    
    // 验证状态变为"待审批"
    await expect(page.locator('[data-testid="task-status"]')).toContainText('待审批');
  });
});
```

---

## 测试数据管理

### 测试数据套件

```typescript
// __tests__/fixtures/test-data.ts
export const testData = {
  admin: {
    id: 'admin-1',
    name: 'admin',
    phone: '13800000001',
    password: '1111',
    role: 'admin' as const,
  },
  parent: {
    id: 'parent-1',
    name: 'Zhang 1',
    phone: '13800000100',
    password: '1111',
    role: 'parent' as const,
    familyId: 'family-001',
  },
  child: {
    id: 'child-1',
    name: 'Zhang 3',
    pin: '1111',
    role: 'child' as const,
    familyId: 'family-001',
  },
};

export async function seedTestData(db: any) {
  // 插入测试数据
  await db.insert(families).values({
    id: 'family-001',
    name: 'Test Family',
    region: '全国',
  });
  
  await db.insert(users).values([
    testData.admin,
    testData.parent,
    testData.child,
  ]);
}
```

---

## 运行测试

```bash
# 运行所有测试
bun test

# 运行特定测试文件
bun test __tests__/unit/lib/utils.test.ts

# 监视模式
bun test --watch

# 生成覆盖率报告
bun test --coverage

# 运行 E2E 测试
npx playwright test

# 运行特定 E2E 测试
npx playwright test auth-flow

#  headed 模式（有界面）
npx playwright test --headed
```

---

## 扩展阅读

- [Bun 测试文档](https://bun.sh/docs/cli/test)
- [Playwright 文档](https://playwright.dev/docs/intro)
- [TECH_SPEC_ARCHITECTURE.md](./TECH_SPEC_ARCHITECTURE.md) - 架构设计
