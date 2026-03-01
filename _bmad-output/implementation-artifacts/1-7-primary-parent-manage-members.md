# Story 1.7: Primary Parent Manage Members

Status: ready-for-dev

## Story

As a 主要家长 (Primary Parent),
I want 管理家庭其他成员账户（创建、挂起、转移主要家长角色）,
so that 我可以完全控制家庭成员的访问权限。

## Acceptance Criteria

1. 主要家长可以查看所有家庭成员列表，包括：
   - 成员姓名
   - 成员类型（家长/儿童）
   - 账户状态（活跃/挂起）
   - 主要家长标记
   - 创建时间
   - 最后登录时间（AC #5）

2. 主要家长可以挂起儿童账户：
   - 挂起后儿童无法登录（返回错误提示"账户已被家长挂起"）
   - 保留儿童数据和积分
   - 记录操作到审计日志（NFR14: AC #4）

3. 主要家长可以恢复已挂起的儿童账户：
   - 恢复后儿童可以正常登录
   - 记录操作到审计日志（NFR14: AC #4）

4. 主要家长可以转移主要家长角色给其他家长：
   - 转移前需要二次验证（密码确认）
   - 转移后新主要家长获得完全控制权
   - 旧主要家长变为普通家长
   - 记录操作到审计日志（NFR14: AC #4）

5. 主要家长可以查看成员的操作日志：
   - 包括登录/登出记录
   - 包括挂起/恢复操作
   - 包括角色转移操作

6. 系统限制主要家长转移频率：
   - 30天内只能转移一次
   - 防止频繁转移导致权限混乱

7. 儿童账户被挂起时，已登录的会话立即失效：
   - 登出所有活跃会话
   - 强制重新登录（被拒绝）

8. 挂起/恢复操作立即生效，无需等待系统同步

## Tasks / Subtasks

- [ ] Task 1: Extend users table to support suspension (AC: #2, #3, #7)
  - [ ] Add is_suspended column to users table (boolean)
  - [ ] Add suspended_at column to users table (timestamp)
  - [ ] Add suspended_by column to users table (user_id reference)
  - [ ] Add suspended_reason column to users table (text)
  - [ ] Add primary_parent_transfer_count column (integer)
  - [ ] Add last_primary_transfer_at column (timestamp)
  - [ ] Generate Drizzle migration
  - [ ] Apply migration to database

- [ ] Task 2: Create family member management query functions (AC: #1)
  - [ ] Create getFamilyMembers() - Get all members of a family
  - [ ] Create getMemberById() - Get member details by ID
  - [ ] Create getMemberAuditLogs() - Get audit logs for a member
  - [ ] Create transferPrimaryParentRole() - Transfer primary role
  - [ ] Create suspendUserAccount() - Suspend user account
  - [ ] Create resumeUserAccount() - Resume suspended account

- [ ] Task 3: Create member management API endpoints (AC: #1, #2, #3, #4, #5)
  - [ ] Create GET /api/families/members - List all family members
  - [ ] Create POST /api/families/members/[memberId]/suspend - Suspend member
  - [ ] Create POST /api/families/members/[memberId]/resume - Resume member
  - [ ] Create POST /api/families/members/transfer-primary - Transfer primary role
  - [ ] Create GET /api/families/members/[memberId]/audit-logs - Get member audit logs
  - [ ] Verify user is primary parent before allowing operations
  - [ ] Verify transfer frequency limits (30 days)

- [ ] Task 4: Implement account suspension logic (AC: #2, #7)
  - [ ] Create lib/services/account-suspension.ts
  - [ ] Update is_suspended flag when suspending
  - [ ] Record suspended_at timestamp
  - [ ] Record suspended_by (primary parent user ID)
  - [ ] Record suspension reason
  - [ ] Invalidate all active sessions for suspended user
  - [ ] Log suspension to audit logs

- [ ] Task 5: Implement account resumption logic (AC: #3)
  - [ ] Update is_suspended flag when resuming
  - [ ] Clear suspended_at timestamp
  - [ ] Clear suspended_by and suspended_reason
  - [ ] Log resumption to audit logs

- [ ] Task 6: Implement primary role transfer logic (AC: #4, #6)
  - [ ] Verify current user is primary parent
  - [ ] Verify transfer frequency limit (30 days)
  - [ ] Verify password confirmation
  - [ ] Update old primary parent role to 'parent'
  - [ ] Update new primary parent role to 'parent'
  - [ ] Update families.primary_parent_id
  - [ ] Increment primary_parent_transfer_count for old parent
  - [ ] Record last_primary_transfer_at
  - [ ] Log transfer to audit logs
  - [ ] Require password confirmation

- [ ] Task 7: Create family members management UI (AC: #1, #5)
  - [ ] Create app/(parent)/settings/members/page.tsx
  - [ ] Display member list with status indicators
  - [ ] Add suspend/resume buttons for children
  - [ ] Add "Transfer Primary Role" button
  - [ ] Add audit logs view for each member
  - [ ] Show member details (role, status, created_at, last_login)
  - [ ] Responsive design (mobile-first)

- [ ] Task 8: Enhanced security checks
  - [ ] Prevent child account from suspending themselves
  - [ ] Prevent non-primary parents from managing members
  - [ ] Prevent transfer to non-family members
  - [ ] Require password confirmation for critical operations

- [ ] Task 9: Write BDD tests (AC: #1-#8)
  - [ ] **Given** 主要家长查看成员 **When** 进入家庭设置 **Then** 显示所有成员
  - [ ] **Given** 主要家长挂起儿童 **When** 儿童尝试登录 **Then** 提示"账户已被家长挂起"
  - [ ] **Given** 主要家长恢复儿童 **When** 儿童登录 **Then** 登录成功
  - [ ] **Given** 主要家长转移角色 **When** 验证密码 **Then** 角色转移成功
  - [ ] **Given** 主要家长30天内转移两次 **When** 尝试第二次转移 **Then** 拒绝操作
  - [ ] **Given** 儿童被挂起 **When** 有活跃会话 **Then** 会话立即失效
  - [ ] Use Bun Test for unit tests, Playwright for E2E tests

- [ ] Task 10: Performance and compliance verification (AC: #1-#8)
  - [ ] Verify API response time < 500ms (NFR3: P95)
  - [ ] Verify page load time < 3 seconds (NFR2)
  - [ ] Verify audit logs recording (NFR14)
  - [ ] Verify session invalidation for suspended users
  - [ ] Verify transfer frequency limit enforcement

## Dev Notes

### Previous Story Intelligence (Stories 1-1 through 1-6)

**From Story 1.1: Parent Phone Registration**
- Users table already exists with role column
- Families table exists with primary_parent_id
- Better-Auth configured with session management

**From Story 1.6: Multi-device Login**
- Session management APIs already implemented
- Audit logging infrastructure exists
- Device tracking in place
- **Can reuse:** lib/db/queries/audit-logs.ts for audit logging

### Database Schema Updates Needed

**Users Table Enhancement:**
```sql
-- Add suspension fields
ALTER TABLE users ADD COLUMN is_suspended INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN suspended_at INTEGER;
ALTER TABLE users ADD COLUMN suspended_by TEXT REFERENCES users(id);
ALTER TABLE users ADD COLUMN suspended_reason TEXT;

-- Add primary role transfer tracking
ALTER TABLE users ADD COLUMN primary_parent_transfer_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN last_primary_transfer_at INTEGER;
```

### Security Considerations

**Account Suspension (AC #2, #7):**
- Suspended users cannot login (check is_suspended flag on login)
- Invalidate all active sessions when suspending
- Log all suspension operations to audit logs
- Only primary parent can suspend members

**Role Transfer (AC #4, #6):**
- Require password confirmation
- Enforce 30-day transfer frequency limit
- Update families.primary_parent_id atomically
- Log all transfers to audit logs
- Only primary parent can transfer role

**Child Protection:**
- Children cannot suspend themselves
- Children cannot manage members
- Suspended children cannot bypass suspension

### API Endpoints to Create

**Family Members Management:**
- `GET /api/families/members` - List all family members
- `POST /api/families/members/[memberId]/suspend` - Suspend member
- `POST /api/families/members/[memberId]/resume` - Resume member
- `POST /api/families/members/transfer-primary` - Transfer primary role
- `GET /api/families/members/[memberId]/audit-logs` - Get member audit logs

### UI Pages to Create

**Family Members Management:**
- `app/(parent)/settings/members/page.tsx` - Family members list and management

### Testing Strategy

**BDD Tests (Given-When-Then):**
1. View family members list
2. Suspend child account
3. Resume suspended child account
4. Transfer primary role with password confirmation
5. Transfer frequency limit (30 days)
6. Session invalidation on suspension
7. Audit logs recording

**Integration Tests:**
- Member CRUD operations
- Suspension/resumption logic
- Role transfer logic
- Audit log verification

**E2E Tests:**
- Member management UI interactions
- Suspend/resume workflows
- Role transfer with password confirmation
- Transfer frequency limit enforcement

### Performance Requirements

- Member list API: < 500ms (P95) - AC #1
- Suspend/resume API: < 500ms (P95) - AC #2, #3
- Transfer primary API: < 500ms (P95) - AC #4
- Page load: < 3 seconds - AC #1, #8

### Security Requirements

- Only primary parent can manage members - AC #1, #8
- Password confirmation for role transfer - AC #4
- Transfer frequency limit: 30 days - AC #6
- Audit logging: NFR14 - AC #4
- Session invalidation on suspension - AC #7

### Compliance Requirements

- Audit logging: NFR14 - AC #4
- Explicit confirmation: AC #4

### Open Questions / Decisions Needed

1. **Suspension Reason Types:**
   - Option A: Free text (any reason)
   - Option B: Predefined list (violation, request, etc.)
   - **Decision:** Use predefined list + optional text field

2. **Transfer Password Verification:**
   - Option A: Current password
   - Option B: PIN code
   - **Decision:** Use current password (more secure)

3. **Transfer Limit Reset:**
   - Option A: Reset on calendar month
   - Option B: Rolling 30 days
   - **Decision:** Rolling 30 days (no partial months)

### Success Criteria

1. [ ] All tasks completed
2. [ ] All BDD tests passing
3. [ ] All E2E tests passing
4. [ ] Performance requirements met (<500ms API, <3s page load)
5. [ ] Security requirements met (auth checks, rate limiting, audit logging)
6. [ ] Code review passed
7. [ ] Sprint status updated

### Tasks Blocked By

None identified at story creation time.
