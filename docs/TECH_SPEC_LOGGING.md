# TECH_SPEC_LOGGING.md

> 日志规范 - 日志级别、格式、表设计、API日志规范
>
> **AI 代理**：快速决策参考请查看 [AGENTS.md](../AGENTS.md)

---

## 概述

本文档定义了 Family Reward 项目的日志规范，要求每个 API endpoint 都进行日志记录。日志存储在项目数据库（SQLite）的 `logs` 表中。

### 日志的重要性

- **问题诊断** - 快速定位和修复问题
- **性能分析** - 识别慢请求和瓶颈
- **安全审计** - 追踪用户操作和安全事件
- **业务分析** - 了解用户行为和系统使用情况

---

## 🔴 RED LIST（绝对禁止）

- ❌ **使用第三方日志库** - 优先使用 Bun 的能力
- ❌ **记录敏感信息** - 禁止记录密码、PIN、token、信用卡号等
- ❌ **忽略日志性能影响** - 必须异步记录，不影响请求性能
- ❌ **记录过大请求体** - 请求体超过 1KB 时截断
- ❌ **使用 console.log 作为唯一日志** - 必须同时写入数据库
- ❌ **日志未分级** - 必须使用日志级别区分重要性

---

## 日志级别

| 级别 | 数值 | 使用场景 | 示例 |
|------|------|----------|------|
| **DEBUG** | 10 | 详细调试信息 | 查询参数、中间变量 |
| **INFO** | 20 | 一般信息 | 用户登录、任务创建 |
| **WARN** | 30 | 警告信息 | 慢查询、缓存未命中 |
| **ERROR** | 40 | 错误信息 | API 错误、数据库失败 |
| **FATAL** | 50 | 致命错误 | 服务不可用 |

---

## 日志表设计

### Schema 定义

```typescript
// lib/db/schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const logs = sqliteTable('logs', {
  id: text('id').primaryKey(),
  timestamp: integer('timestamp', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),

  // 日志级别和类型
  level: text('level').notNull(),              // DEBUG, INFO, WARN, ERROR, FATAL
  type: text('type').notNull(),                // API, SYSTEM, SECURITY

  // 请求信息
  method: text('method'),                      // GET, POST, PUT, DELETE
  endpoint: text('endpoint'),                  // /api/tasks
  path: text('path'),                        // 完整路径（带参数）

  // 用户信息
  userId: text('user_id'),                    // 用户 ID（如已认证）
  userRole: text('user_role'),                // admin, parent, child
  familyId: text('family_id'),               // 家庭 ID

  // 请求头信息
  ip: text('ip'),                           // 客户端 IP
  userAgent: text('user_agent'),             // User-Agent 头
  referer: text('referer'),                 // Referer 头

  // 请求和响应数据
  requestBody: text('request_body'),         // 请求体（截断）
  responseBody: text('response_body'),       // 响应体（截断）

  // 状态和错误信息
  statusCode: integer('status_code'),       // HTTP 状态码
  error: text('error'),                     // 错误信息
  errorStack: text('error_stack'),           // 错误堆栈

  // 性能指标
  duration: integer('duration').notNull(),  // 请求耗时（毫秒）

  // 其他信息
  tags: text('tags', { mode: 'json' }),    // 标签数组（JSON）
  metadata: text('metadata', { mode: 'json' }),  // 额外元数据（JSON）
});
```

### SQL 创建语句

```sql
-- database/migrations/010_create_logs_table.sql

CREATE TABLE IF NOT EXISTS logs (
  id TEXT PRIMARY KEY,
  timestamp INTEGER NOT NULL,

  level TEXT NOT NULL,
  type TEXT NOT NULL,

  method TEXT,
  endpoint TEXT,
  path TEXT,

  user_id TEXT,
  user_role TEXT,
  family_id TEXT,

  ip TEXT,
  user_agent TEXT,
  referer TEXT,

  request_body TEXT,
  response_body TEXT,

  status_code INTEGER,
  error TEXT,
  error_stack TEXT,

  duration INTEGER NOT NULL,

  tags TEXT,        -- JSON
  metadata TEXT     -- JSON
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_logs_timestamp
ON logs(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_logs_level
ON logs(level);

CREATE INDEX IF NOT EXISTS idx_logs_user
ON logs(user_id);

CREATE INDEX IF NOT EXISTS idx_logs_endpoint
ON logs(endpoint);

CREATE INDEX IF NOT EXISTS idx_logs_family
ON logs(family_id);

-- 分析索引
ANALYZE logs;
```

---

## API 日志规范

### 必须记录的内容

每个 API endpoint 必须记录以下信息：

- ✅ 请求时间（timestamp）
- ✅ 请求方法（method）
- ✅ 请求路径（path）
- ✅ 用户信息（userId, userRole, familyId）
- ✅ 客户端信息（ip, userAgent）
- ✅ 请求体（requestBody，截断）
- ✅ 响应状态码（statusCode）
- ✅ 响应体（responseBody，截断）
- ✅ 请求耗时（duration）
- ✅ 错误信息（error, errorStack，如有）

### 日志记录时机

| 时机 | 级别 | 说明 |
|------|------|------|
| **请求开始** | DEBUG | 记录请求基本信息 |
| **请求成功** | INFO | 记录成功响应 |
| **请求错误** | ERROR | 记录错误详情 |
| **慢请求** | WARN | 请求耗时 > 500ms |
| **验证失败** | WARN | 输入验证错误 |

### 日志工具函数

```typescript
// lib/logging/logger.ts
import { db } from '@/lib/db';
import { logs } from '@/lib/db/schema';
import { nanoid } from 'nanoid';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL',
}

export enum LogType {
  API = 'API',
  SYSTEM = 'SYSTEM',
  SECURITY = 'SECURITY',
}

interface LogEntry {
  level: LogLevel;
  type: LogType;
  method?: string;
  endpoint?: string;
  path?: string;
  userId?: string;
  userRole?: string;
  familyId?: string;
  ip?: string;
  userAgent?: string;
  referer?: string;
  requestBody?: string;
  responseBody?: string;
  statusCode?: number;
  error?: string;
  errorStack?: string;
  duration: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

/**
 * 截断过长的字符串
 */
function truncateString(str: string, maxLength = 1000): string {
  if (!str) return str;
  return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
}

/**
 * 过滤敏感信息
 */
function filterSensitiveData(body: any): any {
  const sensitiveFields = ['password', 'pin', 'token', 'apiKey', 'secret'];
  const filtered = { ...body };

  for (const field of sensitiveFields) {
    if (filtered[field]) {
      filtered[field] = '***REDACTED***';
    }
  }

  return filtered;
}

/**
 * 记录日志
 */
export async function log(entry: LogEntry): Promise<void> {
  try {
    // 过滤敏感信息
    const filteredRequestBody = entry.requestBody
      ? JSON.stringify(filterSensitiveData(JSON.parse(entry.requestBody)))
      : undefined;

    const filteredResponseBody = entry.responseBody
      ? truncateString(entry.responseBody)
      : undefined;

    await db.insert(logs).values({
      id: nanoid(),
      timestamp: new Date(),
      level: entry.level,
      type: entry.type,
      method: entry.method,
      endpoint: entry.endpoint,
      path: entry.path,
      userId: entry.userId,
      userRole: entry.userRole,
      familyId: entry.familyId,
      ip: entry.ip,
      userAgent: entry.userAgent,
      referer: entry.referer,
      requestBody: truncateString(filteredRequestBody || ''),
      responseBody: filteredResponseBody,
      statusCode: entry.statusCode,
      error: entry.error,
      errorStack: entry.errorStack,
      duration: entry.duration,
      tags: entry.tags ? JSON.stringify(entry.tags) : undefined,
      metadata: entry.metadata ? JSON.stringify(entry.metadata) : undefined,
    });
  } catch (error) {
    // 日志记录失败不应影响业务逻辑
    console.error('[Logger] Failed to write log:', error);
  }
}

/**
 * 记录 API 请求（便捷方法）
 */
export async function logApiRequest(params: {
  method: string;
  path: string;
  endpoint: string;
  userId?: string;
  userRole?: string;
  familyId?: string;
  ip?: string;
  userAgent?: string;
  referer?: string;
  requestBody?: any;
  responseBody?: any;
  statusCode?: number;
  error?: Error;
  duration: number;
  tags?: string[];
  metadata?: Record<string, any>;
}): Promise<void> {
  const level = params.error
    ? LogLevel.ERROR
    : params.duration > 500
    ? LogLevel.WARN
    : LogLevel.INFO;

  await log({
    ...params,
    level,
    type: LogType.API,
    requestBody: params.requestBody ? JSON.stringify(params.requestBody) : undefined,
    responseBody: params.responseBody ? JSON.stringify(params.responseBody) : undefined,
    error: params.error?.message,
    errorStack: params.error?.stack,
  });
}
```

### 日志中间件

```typescript
// lib/middleware/logger.ts
import { NextRequest, NextResponse } from 'next/server';
import { logApiRequest } from '@/lib/logging/logger';

export async function withLogging(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const startTime = performance.now();
    const url = new URL(req.url);

    // 提取请求信息
    const ip = req.headers.get('x-forwarded-for') ||
              req.headers.get('x-real-ip') ||
              'unknown';
    const userAgent = req.headers.get('user-agent') || '';
    const referer = req.headers.get('referer') || '';

    let responseBody: any;
    let statusCode: number;
    let error: Error | undefined;

    try {
      // 执行处理程序
      const response = await handler(req);
      statusCode = response.status;

      // 尝试读取响应体
      if (response.headers.get('content-type')?.includes('application/json')) {
        const clonedResponse = response.clone();
        responseBody = await clonedResponse.json();
      }

      return response;
    } catch (err) {
      statusCode = 500;
      error = err as Error;

      throw err;  // 重新抛出错误
    } finally {
      const duration = performance.now() - startTime;

      // 异步记录日志（不阻塞响应）
      logApiRequest({
        method: req.method,
        path: url.pathname + url.search,
        endpoint: url.pathname,
        ip,
        userAgent,
        referer,
        statusCode,
        responseBody,
        error,
        duration,
      }).catch(console.error);
    }
  };
}
```

### 使用示例

```typescript
// app/api/tasks/route.ts
import { withLogging } from '@/lib/middleware/logger';
import { verifyAuth } from '@/lib/auth';

export const GET = withLogging(async (req: NextRequest) => {
  const user = await verifyAuth(req);

  const url = new URL(req.url);
  const familyId = url.searchParams.get('familyId');

  // 业务逻辑
  const tasks = await getTasksByFamily(familyId);

  return NextResponse.json({
    success: true,
    data: { tasks },
  });
});

export const POST = withLogging(async (req: NextRequest) => {
  const user = await verifyAuth(req);
  const body = await req.json();

  // 业务逻辑
  const task = await createTask(body);

  return NextResponse.json({
    success: true,
    data: { task },
  }, { status: 201 });
});
```

---

## 敏感信息处理

### 禁止记录的敏感信息

| 字段 | 说明 | 替换值 |
|------|------|--------|
| `password` | 密码 | `***REDACTED***` |
| `pin` | PIN 码 | `***REDACTED***` |
| `token` | 访问令牌 | `***REDACTED***` |
| `apiKey` | API 密钥 | `***REDACTED***` |
| `secret` | 密钥 | `***REDACTED***` |
| `creditCard` | 信用卡号 | `**** **** **** 1234` |
| `ssn` | 社会安全号 | `***-**-****` |

### 敏感信息过滤

```typescript
// 示例 - 过滤请求体
const requestBody = {
  username: 'john',
  password: 'secret123',  // 敏感
  pin: '1234',            // 敏感
  email: 'john@example.com',
};

// 过滤后
const filtered = filterSensitiveData(requestBody);
// {
//   username: 'john',
//   password: '***REDACTED***',
//   pin: '***REDACTED***',
//   email: 'john@example.com'
// }
```

---

## 日志查询与分析

### 查询工具函数

```typescript
// lib/logging/analyzer.ts
import { db } from '@/lib/db';
import { logs, LogLevel } from '@/lib/db/schema';
import { and, eq, gte, lte, desc, count, sql } from 'drizzle-orm';

/**
 * 查询用户操作日志
 */
export async function getUserLogs(
  userId: string,
  limit = 100
): Promise<Log[]> {
  return db.query.logs.findMany({
    where: eq(logs.userId, userId),
    orderBy: desc(logs.timestamp),
    limit,
  });
}

/**
 * 查询家庭日志
 */
export async function getFamilyLogs(
  familyId: string,
  limit = 100
): Promise<Log[]> {
  return db.query.logs.findMany({
    where: eq(logs.familyId, familyId),
    orderBy: desc(logs.timestamp),
    limit,
  });
}

/**
 * 查询错误日志
 */
export async function getErrorLogs(limit = 100): Promise<Log[]> {
  return db.query.logs.findMany({
    where: eq(logs.level, LogLevel.ERROR),
    orderBy: desc(logs.timestamp),
    limit,
  });
}

/**
 * 查询慢请求
 */
export async function getSlowRequests(
  minDuration = 500,
  limit = 100
): Promise<Log[]> {
  return db.query.logs.findMany({
    where: sql`${logs.duration} >= ${minDuration}`,
    orderBy: desc(logs.duration),
    limit,
  });
}

/**
 * 统计日志级别分布
 */
export async function getLogLevelStats(): Promise<
  Record<LogLevel, number>
> {
  const result = await db
    .select({
      level: logs.level,
      count: count(),
    })
    .from(logs)
    .groupBy(logs.level);

  return result.reduce((acc, { level, count }) => {
    acc[level as LogLevel] = count;
    return acc;
  }, {} as Record<LogLevel, number>);
}

/**
 * 统计 API 调用次数
 */
export async function getApiCallStats(
  startDate: Date,
  endDate: Date
): Promise<
  Record<string, number>
> {
  const result = await db
    .select({
      endpoint: logs.endpoint,
      count: count(),
    })
    .from(logs)
    .where(
      and(
        gte(logs.timestamp, startDate),
        lte(logs.timestamp, endDate)
      )
    )
    .groupBy(logs.endpoint)
    .orderBy(desc(count()));

  return result.reduce((acc, { endpoint, count }) => {
    acc[endpoint || 'unknown'] = count;
    return acc;
  }, {} as Record<string, number>);
}

/**
 * 计算平均响应时间
 */
export async function getAverageResponseTime(
  endpoint?: string
): Promise<number> {
  const where = endpoint ? eq(logs.endpoint, endpoint) : undefined;

  const result = await db
    .select({
      avgDuration: sql<number>`AVG(${logs.duration})`,
    })
    .from(logs)
    .where(where);

  return result[0]?.avgDuration || 0;
}
```

### 日志 API

```typescript
// app/api/logs/route.ts
import { withLogging } from '@/lib/middleware/logger';
import { verifyAuth, requireAuth, requireFamilyAccess } from '@/lib/auth';
import { getFamilyLogs, getErrorLogs, getSlowRequests } from '@/lib/logging/analyzer';

// 查询家庭日志（仅家长和管理员）
export const GET = withLogging(async (req: NextRequest) => {
  const user = await verifyAuth(req);
  requireAuth(user);

  const url = new URL(req.url);
  const familyId = url.searchParams.get('familyId');
  const type = url.searchParams.get('type');  // family, error, slow

  if (user.role !== 'admin') {
    requireFamilyAccess(user, familyId);
  }

  let logsList;

  if (type === 'error') {
    logsList = await getErrorLogs(100);
  } else if (type === 'slow') {
    logsList = await getSlowRequests(500, 100);
  } else {
    logsList = await getFamilyLogs(familyId, 100);
  }

  return NextResponse.json({
    success: true,
    data: { logs: logsList },
  });
});
```

---

## 性能优化

### 异步日志记录

```typescript
// ✅ 正确 - 异步记录日志，不阻塞响应
export const POST = withLogging(async (req: NextRequest) => {
  const startTime = performance.now();

  // 业务逻辑
  const result = await processData();

  // 日志异步记录（在 finally 中）
  return NextResponse.json(result);
});

// ❌ 避免 - 同步记录日志
export const POST = async (req: NextRequest) => {
  const startTime = performance.now();

  const result = await processData();

  // 阻塞响应直到日志写入完成
  await logApiRequest({ ... });  // ❌ 阻塞

  return NextResponse.json(result);
};
```

### 批量日志插入

```typescript
// lib/logging/batch-logger.ts
class BatchLogger {
  private buffer: LogEntry[] = [];
  private flushInterval: number = 5000;  // 5秒
  private maxSize: number = 100;
  private timer: NodeJS.Timeout | null = null;

  constructor() {
    this.startTimer();
  }

  add(entry: LogEntry) {
    this.buffer.push(entry);

    if (this.buffer.length >= this.maxSize) {
      this.flush();
    }
  }

  private async flush() {
    if (this.buffer.length === 0) return;

    const batch = this.buffer.splice(0);
    await db.insert(logs).values(batch);

    console.log(`[BatchLogger] Flushed ${batch.length} logs`);
  }

  private startTimer() {
    this.timer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  destroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.flush();
  }
}

export const batchLogger = new BatchLogger();
```

---

## 检查清单

在提交代码前，确保：

- [ ] 所有 API endpoint 都使用了日志中间件
- [ ] 日志工具函数正确过滤敏感信息
- [ ] 请求体和响应体正确截断（不超过 1KB）
- [ ] 日志记录是异步的，不影响响应时间
- [ ] 日志表已创建并添加索引
- [ ] 日志级别使用正确（DEBUG/INFO/WARN/ERROR/FATAL）
- [ ] 慢请求（> 500ms）标记为 WARN 级别
- [ ] 错误日志包含完整的错误堆栈

---

## 扩展阅读

- [Next.js 中间件文档](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Drizzle ORM 文档](https://orm.drizzle.team/docs/overview)
- [SQLite 日志最佳实践](https://www.sqlite.org/logging.html)
- [AGENTS.md](../AGENTS.md) - AI 代理快速参考
- [TECH_SPEC_API.md](./TECH_SPEC_API.md) - API 规范
- [TECH_SPEC_DATABASE.md](./TECH_SPEC_DATABASE.md) - 数据库规范

---

## 变更日志

| 日期 | 版本 | 变更 |
|------|------|------|
| 2026-02-10 | 1.0 | 初始版本 |
