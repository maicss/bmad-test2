# TECH_SPEC_API.md

> API 规范、错误处理、认证与授权

---

## API 设计原则

1. **RESTful 设计**：使用 HTTP 方法表达操作语义
2. **统一响应格式**：所有响应遵循统一结构
3. **错误码规范**：使用标准错误码，便于前端处理
4. **权限控制**：每个端点验证用户权限

---

## 统一响应格式

### 成功响应

```json
{
  "success": true,
  "data": {
    // 响应数据
  },
  "meta": {
    "timestamp": "2026-02-06T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

### 错误响应

```json
{
  "success": false,
  "error": {
    "code": "BIZ_2001",
    "message": "任务不存在",
    "details": {
      "taskId": "task-123",
      "suggestion": "请检查任务ID是否正确"
    }
  },
  "meta": {
    "timestamp": "2026-02-06T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

---

## 错误码规范

```typescript
// constants/error-codes.ts

export const ErrorCodes = {
  // 认证错误 (1xxx)
  AUTH_INVALID_CREDENTIALS: 'AUTH_1001',
  AUTH_SESSION_EXPIRED: 'AUTH_1002',
  AUTH_PIN_LOCKED: 'AUTH_1003',
  AUTH_UNAUTHORIZED: 'AUTH_1004',
  AUTH_FORBIDDEN: 'AUTH_1005',
  
  // 业务错误 (2xxx)
  TASK_NOT_FOUND: 'BIZ_2001',
  TASK_ALREADY_COMPLETED: 'BIZ_2002',
  TASK_EXPIRED: 'BIZ_2003',
  INSUFFICIENT_POINTS: 'BIZ_2004',
  WISHLIST_NOT_FOUND: 'BIZ_2005',
  WISHLIST_ALREADY_REDEEMED: 'BIZ_2006',
  INVALID_DATE_RANGE: 'BIZ_2007',
  COMBO_CONFIG_INVALID: 'BIZ_2008',
  
  // 验证错误 (3xxx)
  VALIDATION_REQUIRED_FIELD: 'VAL_3001',
  VALIDATION_INVALID_FORMAT: 'VAL_3002',
  VALIDATION_OUT_OF_RANGE: 'VAL_3003',
  
  // 系统错误 (9xxx)
  DB_CONNECTION_ERROR: 'SYS_9001',
  DB_TRANSACTION_ERROR: 'SYS_9002',
  INTERNAL_ERROR: 'SYS_9999',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];
```

---

## 认证机制

### Better-Auth 集成

```typescript
// lib/auth/index.ts
import { betterAuth } from 'better-auth';
import { phone } from 'better-auth/plugins/phone';

export const auth = betterAuth({
  database: {
    provider: 'sqlite',
    url: Bun.env.DATABASE_URL,
  },
  plugins: [
    phone({
      otpLength: 6,
      expiresIn: 300,      // 5分钟
      rateLimit: 5,        // 5次/15分钟
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 24,  // 24小时
    updateAge: 60 * 60,       // 1小时刷新
  },
});
```

### PIN 码登录（儿童）

```typescript
// lib/auth/pin-auth.ts
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function verifyPin(userId: string, pin: string): Promise<boolean> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
  
  if (!user?.pin) return false;
  
  // 检查锁定状态
  if (user.pinLockedUntil && user.pinLockedUntil > new Date()) {
    throw new Error('PIN temporarily locked');
  }
  
  const isValid = await Bun.password.verify(pin, user.pin);
  
  if (!isValid) {
    await incrementPinAttempts(userId);
    
    // 3次失败锁定5分钟
    if (user.pinAttempts >= 3) {
      await lockPin(userId, 5 * 60 * 1000);
    }
    
    return false;
  }
  
  await resetPinAttempts(userId);
  return true;
}
```

### 权限验证中间件

```typescript
// lib/auth/verify.ts
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { sessions, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export interface SessionUser {
  id: string;
  role: 'admin' | 'parent' | 'child';
  familyId?: string;
}

export async function verifyAuth(req: Request): Promise<SessionUser | null> {
  const sessionId = cookies().get('session')?.value;
  if (!sessionId) return null;
  
  const session = await db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
    with: { user: true },
  });
  
  if (!session || session.expiresAt < new Date()) {
    cookies().delete('session');
    return null;
  }
  
  return {
    id: session.userId,
    role: session.user.role,
    familyId: session.user.familyId,
  };
}

// 权限检查辅助函数
export function requireAuth(user: SessionUser | null): SessionUser {
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

export function requireFamilyAccess(user: SessionUser, familyId: string): void {
  if (user.role !== 'admin' && user.familyId !== familyId) {
    throw new Error('Forbidden');
  }
}
```

---

## API 端点规范

### 任务 API

#### GET /api/tasks
查询任务列表

**Query 参数**:
- `familyId` (required): 家庭ID
- `status` (optional): 状态过滤
- `assigneeId` (optional): 执行者ID
- `page` (optional): 页码，默认 1
- `pageSize` (optional): 每页数量，默认 20

**响应**:
```json
{
  "success": true,
  "data": {
    "tasks": [...],
    "pagination": {
      "total": 100,
      "page": 1,
      "pageSize": 20,
      "totalPages": 5
    }
  }
}
```

#### POST /api/tasks
创建任务

**请求体**:
```json
{
  "title": "完成作业",
  "points": 10,
  "assigneeId": "user-123",
  "dueDate": "2026-02-07",
  "planId": "plan-456"
}
```

**实现**:
```typescript
// app/api/tasks/route.ts
import { db } from '@/lib/db';
import { tasks } from '@/lib/db/schema';
import { verifyAuth, requireAuth, requireFamilyAccess } from '@/lib/auth/verify';
import { ErrorCodes } from '@/constants/error-codes';

export async function GET(req: Request) {
  try {
    const user = await verifyAuth(req);
    requireAuth(user);
    
    const { searchParams } = new URL(req.url);
    const familyId = searchParams.get('familyId');
    
    if (!familyId) {
      return Response.json({
        success: false,
        error: {
          code: ErrorCodes.VALIDATION_REQUIRED_FIELD,
          message: 'familyId is required'
        }
      }, { status: 400 });
    }
    
    requireFamilyAccess(user, familyId);
    
    // 查询任务
    const tasks = await db.query.tasks.findMany({
      where: eq(tasks.familyId, familyId),
    });
    
    return Response.json({
      success: true,
      data: { tasks }
    });
    
  } catch (error) {
    return Response.json({
      success: false,
      error: {
        code: ErrorCodes.INTERNAL_ERROR,
        message: error.message
      }
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await verifyAuth(req);
    requireAuth(user);
    
    const body = await req.json();
    
    // 验证必填字段
    if (!body.title || !body.assigneeId || !body.dueDate) {
      return Response.json({
        success: false,
        error: {
          code: ErrorCodes.VALIDATION_REQUIRED_FIELD,
          message: 'Missing required fields'
        }
      }, { status: 400 });
    }
    
    // 创建任务
    const [task] = await db.insert(tasks).values({
      title: body.title,
      points: body.points || 0,
      assigneeId: body.assigneeId,
      dueDate: new Date(body.dueDate),
      status: 'pending',
    }).returning();
    
    return Response.json({
      success: true,
      data: { task }
    }, { status: 201 });
    
  } catch (error) {
    return Response.json({
      success: false,
      error: {
        code: ErrorCodes.INTERNAL_ERROR,
        message: error.message
      }
    }, { status: 500 });
  }
}
```

### 任务完成 API

#### POST /api/tasks/:id/complete
标记任务完成

```typescript
// app/api/tasks/[id]/complete/route.ts
import { db } from '@/lib/db';
import { tasks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(req);
    requireAuth(user);
    
    const taskId = params.id;
    
    // 查询任务
    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId),
    });
    
    if (!task) {
      return Response.json({
        success: false,
        error: {
          code: ErrorCodes.TASK_NOT_FOUND,
          message: 'Task not found'
        }
      }, { status: 404 });
    }
    
    // 检查权限（儿童只能完成自己的任务）
    if (user.role === 'child' && task.assigneeId !== user.id) {
      return Response.json({
        success: false,
        error: {
          code: ErrorCodes.AUTH_FORBIDDEN,
          message: 'Can only complete your own tasks'
        }
      }, { status: 403 });
    }
    
    // 更新任务状态
    await db.update(tasks)
      .set({
        status: 'completed',
        completedAt: new Date(),
        completedBy: user.id,
      })
      .where(eq(tasks.id, taskId));
    
    return Response.json({
      success: true,
      data: { message: 'Task completed' }
    });
    
  } catch (error) {
    return Response.json({
      success: false,
      error: {
        code: ErrorCodes.INTERNAL_ERROR,
        message: error.message
      }
    }, { status: 500 });
  }
}
```

### 任务审批 API

#### POST /api/tasks/:id/approve
审批任务（家长）

```typescript
// app/api/tasks/[id]/approve/route.ts
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(req);
    requireAuth(user);
    
    // 只有家长和管理员可以审批
    if (user.role === 'child') {
      return Response.json({
        success: false,
        error: {
          code: ErrorCodes.AUTH_FORBIDDEN,
          message: 'Only parents can approve tasks'
        }
      }, { status: 403 });
    }
    
    const body = await req.json();
    const approved = body.approved ?? true;
    
    // 使用事务处理审批和积分结算
    const result = await db.transaction(async (tx) => {
      const [task] = await tx.update(tasks)
        .set({
          status: approved ? 'completed' : 'cancelled',
          approvedAt: new Date(),
          approvedBy: user.id,
        })
        .where(eq(tasks.id, params.id))
        .returning();
      
      if (approved) {
        // 计算并添加积分
        await addPoints(tx, task);
      }
      
      return task;
    });
    
    return Response.json({
      success: true,
      data: { task: result }
    });
    
  } catch (error) {
    return Response.json({
      success: false,
      error: {
        code: ErrorCodes.INTERNAL_ERROR,
        message: error.message
      }
    }, { status: 500 });
  }
}
```

---

## 权限矩阵

| 操作 | Admin | Parent | Child |
|------|-------|--------|-------|
| **任务管理** ||||
| 查看所有任务 | ✅ | ❌ | ❌ |
| 查看本家庭任务 | ✅ | ✅ | ✅ (仅自己的) |
| 创建任务 | ✅ | ✅ | ❌ |
| 修改任务 | ✅ | ✅ | ❌ |
| 删除任务 | ✅ | ✅ | ❌ |
| 标记完成 | ❌ | ❌ | ✅ (自己) |
| 审批任务 | ✅ | ✅ | ❌ |
| **愿望单** ||||
| 创建愿望单 | ✅ | ✅ | ✅ |
| 修改愿望单 | ✅ | ✅ | ✅ (自己) |
| 删除愿望单 | ✅ | ✅ | ✅ (自己) |
| 激活愿望单 | ✅ | ✅ | ❌ |
| 发起兑换 | ❌ | ❌ | ✅ |
| 确认兑换 | ✅ | ✅ | ❌ |

---

## HTTP 状态码

| 状态码 | 含义 | 使用场景 |
|--------|------|----------|
| 200 | OK | GET 请求成功 |
| 201 | Created | POST 创建成功 |
| 204 | No Content | DELETE 删除成功 |
| 400 | Bad Request | 请求参数错误 |
| 401 | Unauthorized | 未登录 |
| 403 | Forbidden | 无权限 |
| 404 | Not Found | 资源不存在 |
| 409 | Conflict | 资源冲突（如重复创建） |
| 422 | Unprocessable Entity | 验证失败 |
| 500 | Internal Server Error | 服务器错误 |

---

## 扩展阅读

- [TECH_SPEC_ARCHITECTURE.md](./TECH_SPEC_ARCHITECTURE.md) - 架构设计
- [TECH_SPEC_DATABASE.md](./TECH_SPEC_DATABASE.md) - 数据库设计
- [AGENTS.md](../AGENTS.md) - AI 代理快速参考
