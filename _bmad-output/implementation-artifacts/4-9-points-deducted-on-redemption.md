# Story 4.9: Points Deducted on Redemption

Status: ready-for-dev

## Story

As a 系统,
I want 兑换成功后自动扣除积分,
so that 积分系统保持正确。

## Acceptance Criteria

1. Given 家长确认了孩子的兑换请求（或无需家长确认）
   When 兑换操作被确认
   Then 系统自动扣除愿望所需的积分
   And 积分扣除使用原子事务保证
   And 事务失败时回滚所有更改

2. Given 积分扣除执行成功
   Then 系统在points_history表创建交易记录
   And 交易记录包含：
     - 用户ID（儿童）
     - 家庭ID
     - 交易类型：'redemption'
     - 积分变动：-pointsCost（负数）
     - 变动前余额
     - 变动后余额
     - 关联愿望ID
     - 关联兑换请求ID（如有）
     - 描述："兑换愿望：{愿望名称}"

3. Given 积分扣除执行成功
   Then 系统更新child的points_balance
   And 新余额 = 旧余额 - 消耗积分
   And 更新timestamp字段

4. Given 积分扣除执行成功
   Then 系统更新wishlists表中的愿望状态
   And 愿望状态变为'redeemed'
   And 更新timestamp字段

5. Given 积分扣除事务执行
   Then 系统验证事务的ACID特性
   And 步骤包括：
     1. 锁定redemption_requests行
     2. 验证积分充足度
     3. 扣除积分
     4. 更新兑换请求状态
     5. 更新愿望状态
     6. 创建交易记录
   And 所有步骤在一个事务中完成或全部回滚

6. Given 积分扣除过程中出现错误
   When 任何步骤失败
   Then 系统回滚事务
   And 不扣分
   And 不更新状态
   And 不创建交易记录
   And 向调用方返回详细错误信息

7. Given 积分扣除执行成功
   Then 系统向该儿童发送通知（NFR4）
   And 通知内容："恭喜！你成功兑换「{愿望名称}」，消耗{X}分，剩余{Y}分"
   And 通知在3秒内送达

8. Given 儿童收到积分变动通知
   When 儿童端实时同步（2-3秒，NFR4）
   Then 儿童端显示最新积分余额
   And 愿望列表中对应愿望状态更新为'已兑换'
   And 愿望从"可兑换"列表移除

9. Given 儿童同时发起多个兑换请求
   当系统并行处理这些请求时
   Then 系统逐个验证每个请求的积分充足度
   And 系统按顺序处理请求（避免并发扣分导致负余额）
   And 系统支持乐观锁防止超额兑换

10. Given 积分扣除时检测到积分不足
    当child的当前积分 < 消耗积分时
    Then 系统返回错误："积分不足"
    And 错误码：INSUFFICIENT_POINTS
    And 不执行扣分操作
    And 不更新任何状态
    And 事务立即回滚

11. Given 积分扣除成功但后续操作失败
    当扣除积分成功但其他操作失败时
    Then 系统回滚整个事务
    And 恢复积分余额
    And 恢复所有状态更新
    And 记录回滚日志

12. Given 积分扣除操作
    Then 系统记录操作到审计日志（NFR14）
    And 审计日志包含：
     - 操作人（系统或家长用户ID）
     - 操作类型：'points_deduction'
     - 操作时间
     - 关联资源类型：'redemption'
     - 关联资源ID：兑换请求ID
     - 操作详情：{消耗积分, 儿童ID, 愿望ID, 变动前余额, 变动后余额}

13. Given 积分扣除事务执行
    Then 系统使用数据库事务级别保证
    And 不依赖应用层事务逻辑
    And 数据库事务失败时自动回滚

14. Given 积分扣除成功
    Then 系统返回详细响应给调用方
    And 响应包含：
     - 成功标志
     - 新积分余额
     - 消耗积分数量
     - 交易记录ID
     - 愿望新状态
     - 时间戳

15. Given 积分扣除响应
    Then 系统包含时间戳字段
    And 时间戳为ISO 8601格式
    And 用于客户端同步和调试

16. Given 积分扣除操作完成
    Then 系统触发相关更新
    And 更新儿童的积分统计（如每日获取积分趋势）
    And 更新家庭积分统计
    And 触发可能的徽章判定（Epic 5）

17. Given 积分扣除完成
    当积分余额下降到新低点时
    Then 系统记录最低积分历史（用于Combo中断判定）
    And 系统可能触发Combo中断警报

18. Given 积分扣除事务
    Then 系统使用数据库锁防止并发问题
    And 锁定redemption_requests行
    And 防止同一请求被重复处理
    And 锁在事务完成后释放

19. Given 积分扣除响应
    Then 响应时间<500ms（NFR3: P95）
    And 数据库事务时间<200ms
    And 整个操作流畅高效

20. Given 积分扣除失败
    Then 系统记录失败日志
    And 日志包含：
     - 失败原因
     - 失败时间
     - 涉及的兑换请求ID
     - 儿童ID
     - 期望消耗积分
    And 系统监控系统错误率并报警

## Tasks / Subtasks

- [ ] Task 1: Create points deduction service (AC: #1-#5, #13-#18)
  - [ ] Create lib/services/points-deduction.ts
  - [ ] Implement deductPointsOnRedemption() function
  - [ ] Implement atomic transaction logic with database locks
  - [ ] Implement concurrent request handling with optimism locking
  - [ ] Validate points sufficiency before deduction
  - [ ] Update redemption request status
  - [ ] Update wish status to 'redeemed'
  - [ ] Create points history transaction record
  - [ ] Update child's points balance
  - [ ] Error handling and rollback
  - [ ] Audit logging

- [ ] Task 2: Extend points queries for deduction (AC: #2-#4, #17)
  - [ ] Extend lib/db/queries/points.ts (from Epic 3)
  - [ ] Create createTransaction() - Create points history record
  - [ ] Create getPointsBalance() - Get current balance
  - [ ] Create updatePointsBalance() - Update balance and timestamp
  - [ ] Create lockRedemptionRequest() - Lock for processing
  - [ ] Create unlockRedemptionRequest() - Unlock after processing
  - [ ] Create updateLowestPointsHistory() - Track new low point

- [ ] Task 3: Create redemption points API endpoint (AC: #1-#5, #10, #14, #19)
  - [ ] Create POST /api/redemptions/[id]/deduct-points
  - [ ] Verify user authentication (Better-Auth session)
  - [ ] Verify user role is 'parent' or system (called by Story 4.8)
  - [ ] Validate request body (Zod schema)
  - [ ] Call pointsDeductionOnRedemption service
  - [ ] Handle errors and return appropriate responses
  - [ ] Record audit logs for all operations
  - [ ] Return detailed response with timestamp

- [ ] Task 4: Implement notification integration (AC: #7)
  - [ ] Extend lib/notifications/redemption-notifications.ts
  - [ ] Create sendRedemptionSuccessNotification() function
  - [ ] Notification type: 'redemption_completed'
  - [ ] Send to child
  - [ ] Include wish name, points cost, new balance
  - [ ] Deliver within 3 seconds (NFR4)
  - [ ] Link to wish history page

- [ ] Task 5: Update statistics after redemption (AC: #16)
  - [ ] Create lib/services/statistics-update.ts
  - [ ] Update child's daily points acquisition trend
  - [ ] Update family's points statistics
  - [ ] Trigger badge evaluation (integrate with Epic 5 when available)
  - [ ] Update lowest points history (for Combo中断判定)

- [ ] Task 6: Implement error logging and monitoring (AC: #20)
  - [ ] Create lib/services/error-logger.ts (extend from project)
  - [ ] Log redemption deduction failures
  - [ ] Include failure reason, time, request ID
  - [ ] Monitor error rate and alert on anomalies
  - [ ] Aggregate error metrics for debugging

- [ ] Task 7: Write BDD tests (AC: #1-#20)
  - [ ] **Given** 兑换请求确认 **When** 积分足够 **Then** 扣除积分并更新状态
  - [ ] **Given** 兑换请求确认 **When** 积分不足 **Then** 返回错误不扣分
  - [ ] **Given** 事务处理中 **When** 出现错误 **Then** 回滚所有更改
  - [ ] **Given** 并发兑换请求 **When** 同时处理 **Then** 逐个验证并顺序执行
  - [ ] **Given** 扣分成功 **When** 儿童**在线 **Then** 3秒内收到通知
  - [ ] **Given** 扣分完成 **When** 积分到新低点 **Then** 记录最低积分历史
  - [ ] **Given** 重复请求处理 **When** 系统检测到 **Then** 锁定并拒绝重复处理
  - [ ] **Given** 扣分操作 **Then** 记录审计日志
  - [ ] **Given** 响应返回 **Then** 包含时间戳和新余额
  - [ ] Use Bun Test for unit tests, Playwright for E2E tests

- [ ] Task 8: Performance and compliance verification (AC: #13, #19, #20)
  - [ ] Verify atomic transaction guarantee (ACID compliance)
  - [ ] Verify API response time < 500ms (NFR3: P95)
  - [ ] Verify database transaction time < 200ms
  - [ ] Verify notification delivery < 3 seconds (NFR4)
  - [ ] Verify audit logging completeness (NFR14)
  - [ ] Verify child data privacy (COPPA/GDPR)
  - [ ] Verify error rate monitoring

## Dev Notes

### Project Structure Notes

**Alignment with unified project structure:**
- Service: `lib/services/points-deduction.ts` (new)
- Queries: `lib/db/queries/points.ts` (extend from Epic 3)
- API: `app/api/redemptions/[id]/deduct-points/route.ts` (new)
- Notifications: Extend `lib/notifications/redemption-notifications.ts` (from Story 4.8)
- Statistics: `lib/services/statistics-update.ts` (new)
- Error logging: Extend existing error logging infrastructure
- Types: `types/points.ts` (extend from Epic 3), `types/redemption.ts` (extend from Story 4.7)

**Detected conflicts/variances:**
- None identified at story creation time

### Previous Story Intelligence

**From Story 4.8 (Parent Confirms/Rejects Wish Redemption):**
- redemption_requests table created with status tracking
- Notification infrastructure exists
- **Can reuse:** redemption_requests for locking
- **Can reuse:** Notification system for redemption success

**From Epic 3 (Points System):**
- points_balance table exists
- points_history table exists
- lib/db/queries/points.ts exists with balance queries
- Points tracking infrastructure exists
- **Can reuse:** Points balance queries
- **Can reuse:** Points history recording
- **Can reuse:** Database transaction patterns

**From Story 4.7 (Child Initiates Wish Redemption):**
- Points calculation logic exists (current balance - threshold)
- **Can reuse:** Same calculation for verification

### Points Deduction Service Implementation

**Main Service Function:**
```typescript
// lib/services/points-deduction.ts
export async function deductPointsOnRedemption(
  redemptionRequestId: string,
  confirmedBy?: string // Parent ID if confirmed by parent
): Promise<DeductionResult> {
  const db = getDatabase();
  
  // Start atomic transaction
  return db.transaction(async (tx) => {
    // 1. Lock redemption request
    const request = await tx.query.redemptionRequests.findFirst({
      where: eq(redemptionRequests.id, redemptionRequestId),
      for: 'update' // Lock row
    });
    
    if (!request) {
      throw new Error('Redemption request not found');
    }
    
    if (request.status !== 'pending_confirmation') {
      throw new Error(`Request already processed: ${request.status}`);
    }
    
    // 2. Get child's current balance
    const balance = await tx.query.pointBalances.findFirst({
      where: eq(pointBalances.userId, request.childId)
    });
    
    if (!balance) {
      throw new Error('Points balance not found for child');
    }
    
    // 3. Verify points sufficiency
    if (balance.balance < request.pointsCost) {
      throw new Error('Insufficient points for redemption', {
        code: 'INSUFFICIENT_POINTS',
        currentBalance: balance.balance,
        required: request.pointsCost
      });
    }
    
    // 4. Calculate new balance
    const newBalance = balance.balance - request.pointsCost;
    
    // 5. Deduct points
    await tx.update(pointBalances)
      .set({
        balance: newBalance,
        updatedAt: Date.now()
      })
      .where(eq(pointBalances.userId, request.childId));
    
    // 6. Update redemption request status
    await tx.update(redemptionRequests)
      .set({
        status: 'confirmed',
        confirmedBy: confirmedBy || 'system',
        confirmedAt: Date.now(),
        updatedAt: Date.now()
      })
      .where(eq(redemptionRequests.id, redemptionRequestId));
    
    // 7. Update wish status
    await tx.update(wishlists)
      .set({
        status: 'redeemed',
        updatedAt: Date.now()
      })
      .where(eq(wishlists.id, request.wishId));
    
    // 8. Create points history transaction
    await tx.insert(pointsHistory)
      .values({
        userId: request.childId,
        familyId: request.familyId,
        type: 'redemption',
        points: -request.pointsCost,
        balanceBefore: balance.balance,
        balanceAfter: newBalance,
        relatedWishId: request.wishId,
        relatedRedemptionId: redemptionRequestId,
        description: `兑换愿望（确认：${confirmedBy || '系统'}）`,
        createdAt: Date.now()
      });
    
    // 9. Update lowest points history (for Combo中断判定)
    await updateLowestPointsHistory(tx, request.childId, newBalance);
    
    return {
      success: true,
      newBalance,
      pointsDeducted: request.pointsCost,
      transactionId: Date.now(),
      redemptionRequestId
    };
  });
}

// Optimistic locking for concurrent requests
export async function lockRedemptionRequest(
  redemptionRequestId: string,
  tx: Transaction
): Promise<void> {
  // Try to lock the request row
  const request = await tx.query.redemptionRequests.findFirst({
    where: eq(redemptionRequests.id, redemptionRequestId),
    for: 'update'
  });
  
  if (!request) {
    throw new Error('Redemption request not found');
  }
  
  // Check if already processed
  if (request.status !== 'pending_confirmation') {
    throw new Error(`Request already processed: ${request.status}`);
  }
  
  // No explicit locking needed - FOR UPDATE locks the row
  // The transaction itself provides the lock
}
```

### Database Query Extensions

**Points Queries:**
```typescript
// lib/db/queries/points.ts (extend from Epic 3)
import { db } from '@/lib/db';
import { pointBalances, pointsHistory, users } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';

// Create transaction record
export async function createTransaction(data: {
  userId: string;
  familyId: string;
  type: 'redemption' | 'task_approval' | 'task_completion' | 'adjustment';
  points: number;
  balanceBefore: number;
  balanceAfter: number;
  relatedWishId?: string;
  relatedRedemptionId?: string;
  description: string;
}) {
  return await db.insert(pointsHistory).values({
    ...data,
    createdAt: Date.now()
  }).returning();
}

// Update points balance
export async function updatePointsBalance(
  userId: string,
  newBalance: number
) {
  return await db.update(pointBalances)
    .set({
      balance: newBalance,
      updatedAt: Date.now()
    })
    .where(eq(pointBalances.userId, userId))
    .returning();
}

// Lock redemption request for processing
export async function lockRedemptionRequestForUpdate(
  redemptionRequestId: string,
  tx: Transaction
): Promise<RedemptionRequest | null> {
  return tx.query.redemptionRequests.findFirst({
    where: eq(redemptionRequests.id, redemptionRequestId)
  });
}

// Update lowest points history
export async function updateLowestPointsHistory(
  tx: Transaction,
  userId: string,
  newBalance: number
): Promise<void> {
  // Get current lowest
  const user = await tx.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { lowestPoints: true }
  });
  
  // Update if new balance is lower
  if (!user.lowestPoints || newBalance < user.lowestPoints) {
    await tx.update(users)
      .set({
        lowestPoints: newBalance,
        lowestPointsAt: Date.now()
      })
      .where(eq(users.id, userId));
  }
}
```

### API Endpoint Implementation

**POST /api/redemptions/[id]/deduct-points:**
```typescript
// app/api/redemptions/[id]/deduct-points/route.ts
import { db } from '@/lib/db';
import { redemptionRequests } from '@/lib/db/schema';
import { deductPointsOnRedemption } from '@/lib/services/points-deduction';
import { sendRedemptionSuccessNotification } from '@/lib/notifications/redemption-notifications';
import { updateStatisticsAfterRedemption } from '@/lib/services/statistics-update';
import { logError } from '@/lib/services/error-logger';
import { verifyParentPermission } from '@/lib/auth/permissions';

export async function POST(
  req: Request,
  { params }
: { params: { id: string } }
) {
  try {
    // 1. Verify authentication
    const session = await getSession(req);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }
    
    // 2. Verify parent permission
    const hasPermission = await verifyParentPermission(session.user.id, params.id);
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Permission denied', code: 'PERMISSION_DENIED' },
        { status: 403 }
      );
    }
    
    // 3. Get redemption request
    const request = await db.query.redemptionRequests.findFirst({
      where: eq(redemptionRequests.id, params.id)
    });
    
    if (!request) {
      return NextResponse.json(
        { error: 'Redemption request not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }
    
    // 4. Execute points deduction
    const result = await deductPointsOnRedemption(
      params.id,
      session.user.id
    );
    
    // 5. Send notification to child
    await sendRedemptionSuccessNotification({
      childId: request.childId,
      wishId: request.wishId,
      wishTitle: request.wishTitle, // Need to fetch or pass in request
      pointsCost: request.pointsCost,
      newBalance: result.newBalance
    });
    
    // 6. Update statistics
    await updateStatisticsAfterRedemption({
      childId: request.childId,
      familyId: request.familyId,
      pointsDeducted: request.pointsCost
    });
    
    // 7. Log audit entry
    await createAuditLog({
      userId: session.user.id,
      action: 'points_deduction',
      resourceType: 'redemption',
      resourceId: params.id,
      details: {
        childId: request.childId,
        wishId: request.wishId,
        pointsCost: request.pointsCost,
        newBalance: result.newBalance
      }
    });
    
    // 8. Return success response
    return NextResponse.json({
      success: true,
      newBalance: result.newBalance,
      pointsDeducted: request.pointsCost,
      transactionId: result.transactionId,
      redemptionRequestId: params.id,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    // Log error
    await logError({
      error: 'points_deduction_failed',
      redemptionRequestId: params.id,
      message: error.message,
      stack: error.stack
    });
    
    // Return error response
    return NextResponse.json(
      {
        error: error.message,
        code: error.code || 'DEDUCTION_FAILED',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
```

### Notification Implementation

**Redemption Success Notification:**
```typescript
// lib/notifications/redemption-notifications.ts
import { sendNotification } from '@/lib/notifications';

export async function sendRedemptionSuccessNotification({
  childId,
  wishId,
  wishTitle,
  pointsCost,
  newBalance
}: {
  childId: string;
  wishId: string;
  wishTitle: string;
  pointsCost: number;
  newBalance: number;
}) {
  return await sendNotification({
    type: 'redemption_completed',
    recipientId: childId,
    title: '兑换成功！',
    message: `恭喜！你成功兑换「${wishTitle}」，消耗${pointsCost}分，剩余${newBalance}分`,
    actionUrl: `/child/wishlist/history`,
    relatedWishId: wishId,
    createdAt: Date.now()
  });
}
```

### Testing Strategy

**BDD Tests (Given-When-Then):**
1. Parent confirms redemption → points deducted, status updated
2. Points insufficient → error returned, no deduction
3. Transaction error → all changes rolled back
4. Concurrent redemptions → validated and processed sequentially
5. Duplicate request → locked and rejected
6. Deduction success → child notified in 3 seconds
7. Low points recorded → updated for Combo判定
8. Audit log recorded → all operations tracked
9. Response includes timestamp and new balance
10. API response time < 500ms
11. Database transaction time < 200ms
12. Error logging monitors failure rate

**Integration Tests:**
- Atomic transaction guarantee
- Points sufficiency validation
- Balance update accuracy
- Wish status update
- Transaction history recording
- Concurrent request handling
- Error rollback verification
- Notification delivery
- Statistics updates

**E2E Tests (Playwright):**
- Complete redemption flow with points deduction
- Insufficient points error handling
- Concurrent request handling
- Real-time balance updates on child端
- Notification delivery verification

### Performance Requirements

- API response time: < 500ms (NFR3: P95) - AC #19
- Database transaction: < 200ms - AC #19
- Notification delivery: < 3 seconds (NFR4) - AC #7
- Database lock duration: < 100ms - AC #18
- Error logging overhead: < 50ms

### Security Requirements

- Authentication required (parent or system) - AC from Story 4.8
- Permission checks (family membership) - AC from Story 4.8
- Atomic transactions (ACID compliance) - AC #5
- Points sufficiency validation - AC #10
- Audit logging (NFR14 compliance) - AC #12
- Child data privacy (COPPA/GDPR) - AC #8, #20
- Database locks prevent fraud - AC #18

### Compliance Requirements

**COPPA/GDPR Compliance:**
- Child data privacy (only child/parent can see transactions)
- Audit trail for all operations (NFR14)
- Data retention: 3 years (NFR18)
- Clear, age-appropriate notifications
- Transaction history complete with details

### Open Questions / Decisions Needed

1. **Transaction Lock Strategy:**
   - Option A: Explicit lock table
   - Option B: Row-level locks (FOR UPDATE)
   - **Decision:** Row-level locks (simpler, per AC #18)

2. **Low Points History Threshold:**
   - Option A: Always update after redemption
   - Option B: Only update if below current low
   - Option C: Configurable threshold
   - **Decision:** Always update (per AC #17, for Combo中断判定)

3. **Statistics Update Timing:**
   - Option A: Synchronous (in same transaction)
   - Option B: Asynchronous (background job)
   - **Decision:** Synchronous (simpler, per AC #16)

4. **Error Logging Retention:**
   - Option A: Keep forever
   - Option B: 90 days
   - Option C: 1 year
   - **Decision:** 90 days (per NFR18 retention, per AC #20)

### Success Criteria

1. [ ] All tasks completed
2. [ ] All BDD tests passing
3. [ ] All E2E tests passing
4. [ ] Performance requirements met (<500ms API, <200ms transaction)
5. [ ] Security requirements met (auth, permissions, atomic transactions)
6. [ ] Atomic transaction reliability verified
7. [ ] Notification system integration working
8. [ ] Audit logging complete
9. [ ] Error monitoring implemented
10. [ ] Child data privacy maintained
11. [ ] Code review passed
12. [ ] Sprint status updated to ready-for-dev

### Tasks Blocked By

**Prerequisites:**
- Story 4.8: Parent Confirms/Rejects Wish Redemption - Complete ✅
- redemption_requests table exists - Complete ✅
- points_balance table exists - Complete ✅
- points_history table exists - Complete ✅
- Points system queries exist - Complete ✅
- Notification infrastructure exists - Complete ✅
- Error logging infrastructure exists - Complete ✅

**None identified at story creation time.**

## Dev Agent Record

### Agent Model Used

GLM-4.7 (zai-coding-plan/glm-4.7)

### Debug Log References

None at story creation time.

### Completion Notes List

Story created with comprehensive implementation guidance including:
- Complete points deduction service with atomic transaction guarantee
- Database query extensions for points operations
- API endpoint with authentication and validation
- Notification system integration (redemption success)
- Statistics update service integration
- Error logging and monitoring system
- Real-time balance updates for child端
- Lowest points history tracking (for Combo中断判定)
- BDD test scenarios covering all acceptance criteria
- Performance targets (API <500ms, transaction <200ms)
- Security requirements (ACID compliance, audit logging)
- Child data privacy and COPPA/GDPR compliance
- Integration with previous stories (4.8 redemption requests, Epic 3 points system)

### File List

**Files to Create:**
- lib/services/points-deduction.ts
- app/api/redemptions/[id]/deduct-points/route.ts

**Files to Modify:**
- lib/db/queries/points.ts (add transaction functions, lock functions)
- lib/notifications/redemption-notifications.ts (add success notification)
- lib/services/statistics-update.ts (new)
- types/redemption.ts (extend if needed)
- lib/services/error-logger.ts (extend)

**Test Files:**
- tests/integration/points-deduction.spec.ts
- tests/e2e/points-deduction.spec.ts
- tests/fixtures/points-deduction.ts
