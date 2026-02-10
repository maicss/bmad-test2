# TECH_SPEC_PERFORMANCE.md

> 性能优化规范 - 前端、后端、数据库、缓存优化策略
>
> **AI 代理**：快速决策参考请查看 [AGENTS.md](../AGENTS.md)

---

## 概述

本文档定义了 Family Reward 项目的性能优化策略，涵盖前端、后端、数据库、缓存等各个层面。

### 性能目标

| 指标 | 目标值 | 说明 |
|------|--------|------|
| **首屏加载时间 (LCP)** | < 2.5s | 最大内容绘制时间 |
| **首次输入延迟 (FID)** | < 100ms | 用户首次交互响应时间 |
| **累积布局偏移 (CLS)** | < 0.1 | 布局稳定性 |
| **API 响应时间** | < 200ms (P95) | 95% 的请求在 200ms 内完成 |
| **数据库查询时间** | < 50ms (P95) | 95% 的查询在 50ms 内完成 |
| **缓存命中率** | > 80% | 缓存请求的比例 |

---

## 🔴 RED LIST（绝对禁止）

- ❌ **未优化的大图片** - 必须使用 Next.js Image 组件，自动压缩和懒加载
- ❌ **未缓存的重复查询** - 相同的数据库查询必须使用缓存
- ❌ **缺少索引的查询** - 常用查询字段必须添加索引
- ❌ **前端阻塞主线程** - 大计算任务必须使用 Web Workers 或服务端计算
- ❌ **未分页的大列表** - 超过 50 条数据必须分页或虚拟滚动
- ❌ **未压缩的静态资源** - JS/CSS 必须压缩和代码分割
- ❌ **同步阻塞的 I/O 操作** - 所有 I/O 必须异步

---

## 前端性能优化

### 1. Next.js Server Components

```typescript
// ✅ 正确 - 使用 Server Components（默认）
// app/tasks/page.tsx
import { db } from '@/lib/db';
import { tasks } from '@/lib/db/schema';

export default async function TasksPage() {
  // 数据在服务端获取，减少客户端负载
  const tasksList = await db.query.tasks.findMany({
    where: eq(tasks.familyId, 'family-001'),
  });

  return (
    <div>
      <h1>任务列表</h1>
      <TaskList tasks={tasksList} />
    </div>
  );
}

// ❌ 避免 - 过度使用 Client Components
'use client';
import { useEffect, useState } from 'react';

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    fetch('/api/tasks').then(res => res.json()).then(setTasks);
  }, []);

  return <div>...</div>;
}
```

### 2. 图片优化

```typescript
// ✅ 正确 - 使用 Next.js Image 组件
import Image from 'next/image';

export function TaskImage({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={200}
      height={200}
      loading="lazy"  // 懒加载
      placeholder="blur"  // 模糊占位
    />
  );
}

// ❌ 禁止 - 使用原生 img 标签
export function TaskImage({ src, alt }: { src: string; alt: string }) {
  return <img src={src} alt={alt} width={200} height={200} />;
}
```

### 3. 代码分割和懒加载

```typescript
// ✅ 正确 - 动态导入
import dynamic from 'next/dynamic';

const TaskDialog = dynamic(() => import('@/components/TaskDialog'), {
  loading: () => <div>Loading...</div>,
  ssr: false,  // 客户端渲染
});

export function TasksPage() {
  return (
    <div>
      <button onClick={() => setDialogOpen(true)}>
        创建任务
      </button>
      {dialogOpen && <TaskDialog />}
    </div>
  );
}

// ❌ 避免 - 直接导入大型组件
import TaskDialog from '@/components/TaskDialog';  // 打包在一起
```

### 4. 虚拟滚动（长列表）

```typescript
// ✅ 正确 - 使用虚拟滚动
import { useVirtualizer } from '@tanstack/react-virtual';

export function TaskList({ tasks }: { tasks: Task[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,  // 每行高度
  });

  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((item) => (
          <TaskItem
            key={item.key}
            task={tasks[item.index]}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${item.start}px)`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ❌ 避免 - 渲染所有项目
export function TaskList({ tasks }: { tasks: Task[] }) {
  return (
    <div>
      {tasks.map(task => (
        <TaskItem key={task.id} task={task} />
      ))}
    </div>
  );
}
```

---

## 后端性能优化

### 1. Bun 运行时优化

```typescript
// ✅ 正确 - 使用 Bun 的内置功能
import { Bun } from 'bun';

// 快速文件读取
const file = Bun.file('./data.json');
const data = await file.json();

// 快速密码哈希
const hash = await Bun.password.hash(password, 'bcrypt');

// ❌ 避免 - 使用 Node.js 兼容层
import { readFile } from 'fs/promises';
const data = JSON.parse(await readFile('./data.json', 'utf-8'));
```

### 2. 并发处理

```typescript
// ✅ 正确 - 并发执行独立任务
export async function getFamilyData(familyId: string) {
  const [tasks, wishlists, users] = await Promise.all([
    getTasksByFamily(familyId),
    getWishlistsByFamily(familyId),
    getUsersByFamily(familyId),
  ]);

  return { tasks, wishlists, users };
}

// ❌ 避免 - 顺序执行
export async function getFamilyData(familyId: string) {
  const tasks = await getTasksByFamily(familyId);
  const wishlists = await getWishlistsByFamily(familyId);  // 等待第一个完成
  const users = await getUsersByFamily(familyId);  // 等待第二个完成
  return { tasks, wishlists, users };
}
```

### 3. 响应压缩

```typescript
// next.config.js
module.exports = {
  compress: true,  // 启用 gzip 压缩
  swcMinify: true,  // 使用 SWC 压缩
};

// ✅ 正确 - 手动压缩大数据响应
import { compress } from 'bun';

export async function GET() {
  const data = JSON.stringify(largeData);
  const compressed = compress(data);

  return new Response(compressed, {
    headers: {
      'Content-Type': 'application/json',
      'Content-Encoding': 'gzip',
    },
  });
}
```

---

## 数据库性能优化

### 1. 索引策略

```typescript
// ✅ 正确 - 为常用查询字段添加索引
// database/migrations/003_add_indexes.sql

CREATE INDEX IF NOT EXISTS idx_tasks_family
ON tasks(family_id);

CREATE INDEX IF NOT EXISTS idx_tasks_status
ON tasks(status);

CREATE INDEX IF NOT EXISTS idx_tasks_due_date
ON tasks(due_date);

CREATE INDEX IF NOT EXISTS idx_tasks_family_status
ON tasks(family_id, status);  -- 复合索引

-- 分析索引使用情况
ANALYZE;
```

```typescript
// ✅ 正确 - 在 Schema 中定义索引
// lib/db/schema.ts
import { sqliteTable, index } from 'drizzle-orm/sqlite-core';

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  familyId: text('family_id').notNull(),
  status: text('status').notNull(),
  dueDate: integer('due_date').notNull(),
}, (table) => ({
  familyIdx: index('idx_tasks_family').on(table.familyId),
  statusIdx: index('idx_tasks_status').on(table.status),
  familyStatusIdx: index('idx_tasks_family_status').on(table.familyId, table.status),
}));
```

### 2. 查询优化

```typescript
// ✅ 正确 - 使用索引字段
export async function getTasksByFamily(familyId: string) {
  return db.query.tasks.findMany({
    where: eq(tasks.familyId, familyId),  -- 使用索引
    orderBy: desc(tasks.dueDate),  -- 使用索引
  });
}

// ✅ 正确 - 限制返回数据量
export async function getPendingTasks(familyId: string, limit = 50) {
  return db.query.tasks.findMany({
    where: and(
      eq(tasks.familyId, familyId),
      eq(tasks.status, 'pending')
    ),
    orderBy: asc(tasks.dueDate),
    limit,  -- 限制返回数量
  });
}

// ❌ 避免 - 全表扫描
export async function searchTasks(keyword: string) {
  return db.query.tasks.findMany({
    where: sql`title LIKE ${`%${keyword}%`},  -- 无法使用索引
  });
}
```

### 3. 事务优化

```typescript
// ✅ 正确 - 最小化事务范围
export async function completeTask(taskId: string) {
  return db.transaction(async (tx) => {
    // 更新任务状态
    await tx.update(tasks)
      .set({ status: 'completed' })
      .where(eq(tasks.id, taskId));

    // 添加积分
    await tx.insert(pointsHistory).values({
      taskId,
      amount: 10,
    });
  });
}

// ❌ 避免 - 事务中执行慢查询
export async function completeTask(taskId: string) {
  return db.transaction(async (tx) => {
    // ❌ 慢查询 - 计算用户所有历史任务
    const allTasks = await tx.query.tasks.findMany();
    const completedCount = allTasks.filter(t => t.status === 'completed').length;

    await tx.update(tasks)
      .set({ status: 'completed' })
      .where(eq(tasks.id, taskId));
  });
}
```

### 4. WAL 模式（Write-Ahead Logging）

```typescript
// ✅ 正确 - 启用 WAL 模式
// lib/db/index.ts
import { Database } from 'bun:sqlite';

const sqlite = new Database(Bun.env.DATABASE_URL);

// 启用 WAL 模式 - 提高并发性能
sqlite.run('PRAGMA journal_mode = WAL');
sqlite.run('PRAGMA synchronous = NORMAL');  -- 平衡性能和安全

// ❌ 避免 - 使用默认模式（低并发）
const sqlite = new Database(Bun.env.DATABASE_URL);
// 默认模式：journal_mode = DELETE，性能较差
```

---

## 缓存策略

### 1. Redis 缓存

```typescript
// ✅ 正确 - 使用 Redis 缓存常用数据
// lib/cache/redis.ts
import { Redis } from 'ioredis';

const redis = new Redis(Bun.env.REDIS_URL);

export async function getCachedTasks(familyId: string) {
  const key = `tasks:${familyId}`;

  // 尝试从缓存获取
  const cached = await redis.get(key);
  if (cached) {
    return JSON.parse(cached);
  }

  // 缓存未命中，从数据库获取
  const tasks = await db.query.tasks.findMany({
    where: eq(tasks.familyId, familyId),
  });

  // 写入缓存（5分钟过期）
  await redis.setex(key, 300, JSON.stringify(tasks));

  return tasks;
}

// ✅ 正确 - 缓存失效策略
export async function updateTask(taskId: string, data: UpdateTaskDto) {
  const task = await db.update(tasks)
    .set(data)
    .where(eq(tasks.id, taskId))
    .returning()
    .get();

  // 清除相关缓存
  const familyTasksKey = `tasks:${task.familyId}`;
  await redis.del(familyTasksKey);

  return task;
}
```

### 2. 内存缓存

```typescript
// ✅ 正确 - 使用内存缓存（LRU）
// lib/cache/memory.ts
interface CacheEntry<T> {
  value: T;
  expires: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 100;

  set<T>(key: string, value: T, ttl: number) {
    // 删除过期项
    this.cleanup();

    // 如果超出大小，删除最旧的项
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      expires: Date.now() + ttl * 1000,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (entry.expires < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expires < now) {
        this.cache.delete(key);
      }
    }
  }
}

export const memoryCache = new MemoryCache();

// 使用示例
export async function getPublicTemplates() {
  const cached = memoryCache.get<Template[]>('public-templates');
  if (cached) return cached;

  const templates = await db.query.taskPlans.findMany({
    where: and(
      eq(taskPlans.isTemplate, true),
      eq(taskPlans.isPublic, true)
    ),
  });

  memoryCache.set('public-templates', templates, 600);  // 10分钟
  return templates;
}
```

### 3. Service Worker 缓存（PWA）

```javascript
// ✅ 正确 - 使用 Service Worker 缓存静态资源
// public/sw.js
const CACHE_NAME = 'family-reward-v1';

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // API 请求：Network First
  if (request.url.includes('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // 静态资源：Cache First
  event.respondWith(cacheFirst(request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  await caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
  return response;
}
```

---

## 监控与诊断

### 1. 性能监控指标

```typescript
// ✅ 正确 - 添加性能监控
// lib/monitoring/metrics.ts
import { Bun } from 'bun';

export async function measurePerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = Bun.nanoseconds();
  const result = await fn();
  const duration = (Bun.nanoseconds() - start) / 1_000_000;  // 转换为毫秒

  console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);

  // 记录慢查询
  if (duration > 50) {
    console.warn(`[Slow] ${name} took ${duration.toFixed(2)}ms`);
  }

  return result;
}

// 使用示例
export async function getTasksByFamily(familyId: string) {
  return measurePerformance('getTasksByFamily', async () => {
    return db.query.tasks.findMany({
      where: eq(tasks.familyId, familyId),
    });
  });
}
```

### 2. API 响应时间监控

```typescript
// ✅ 正确 - 中间件记录响应时间
// lib/middleware/performance.ts
export function withPerformanceMetrics(handler: NextHandler) {
  return async (req: NextRequest) => {
    const start = performance.now();

    const response = await handler(req);

    const duration = performance.now() - start;
    response.headers.set('X-Response-Time', `${duration.toFixed(2)}ms`);

    // 记录慢请求
    if (duration > 200) {
      console.warn(`[Slow Request] ${req.method} ${req.url} took ${duration.toFixed(2)}ms`);
    }

    return response;
  };
}
```

### 3. 数据库查询分析

```typescript
// ✅ 正确 - 分析慢查询
// lib/db/analyze.ts
import { Database } from 'bun:sqlite';

export function analyzeSlowQueries() {
  const sqlite = new Database(Bun.env.DATABASE_URL);

  // 启用查询日志
  sqlite.run('PRAGMA cache_trace = ON');

  // 分析查询
  const result = sqlite.exec(`
    SELECT
      name,
      sql,
      ( CAST(bustime AS REAL) / CAST(total_time AS REAL) ) * 100 AS percent_cpu
    FROM sqlite_master
    WHERE type = 'table'
    ORDER BY total_time DESC
    LIMIT 10;
  `);

  console.log('Slow queries:', result);
}
```

---

## 性能检查清单

### 前端

- [ ] 所有图片使用 Next.js Image 组件
- [ ] 大列表使用虚拟滚动
- [ ] 动态导入大型组件
- [ ] 使用 Server Components 优先
- [ ] 启用代码分割和懒加载
- [ ] 压缩和优化静态资源

### 后端

- [ ] 使用 Bun 内置功能（Bun.file, Bun.password 等）
- [ ] 独立任务并发执行
- [ ] 响应数据压缩
- [ ] 避免阻塞主线程

### 数据库

- [ ] 常用查询字段添加索引
- [ ] 限制返回数据量
- [ ] 最小化事务范围
- [ ] 启用 WAL 模式
- [ ] 避免全表扫描

### 缓存

- [ ] 常用数据使用 Redis 缓存
- [ ] 内存缓存使用 LRU 策略
- [ ] Service Worker 缓存静态资源
- [ ] 缓存失效策略正确

---

## 扩展阅读

- [Next.js 性能优化](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Bun 性能文档](https://bun.sh/docs/runtime/performance)
- [SQLite 优化指南](https://www.sqlite.org/optoverview.html)
- [Redis 性能最佳实践](https://redis.io/topics/best-practices)
- [TECH_SPEC_BUN.md](./TECH_SPEC_BUN.md) - Bun 使用规范
- [TECH_SPEC_DATABASE.md](./TECH_SPEC_DATABASE.md) - 数据库规范
- [AGENTS.md](../AGENTS.md) - AI 代理快速参考

---

## 变更日志

| 日期 | 版本 | 变更 |
|------|------|------|
| 2026-02-10 | 1.0 | 初始版本 |
