# Story 1.4: Invite Other Parent

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 主要家长 (Primary Parent),
I want 邀请其他家长加入我的家庭 (invite other parents to join my family),
so that 我可以和配偶或其他监护人共同管理孩子的行为和积分 (I can jointly manage my child's behavior and points with my spouse or other guardians).

## Acceptance Criteria

1. 主要家长可以在家庭设置页面输入其他家长的手机号（11位），系统验证格式正确后发送邀请短信，被邀请者在60秒内收到邀请链接（AC3, FR4）
2. 系统生成唯一的邀请token（UUID + 时间戳），存储在pending_invitations表中，包含：token、inviter_user_id、family_id、invited_phone（加密）、status、created_at
3. 被邀请家长点击邀请链接后，系统验证token有效性（未过期、未使用），并跳转到注册页面，预填手机号
4. 被邀请家长完成注册后，系统创建用户账户（role='parent'），并自动关联到已有家庭（users.family_id = families.id），用户成为次要家长（Secondary Parent）
5. 主要家长可以查看家庭中所有家长列表，区分主要家长和次要家长，查看邀请状态（已发送/已接受/已过期）
6. 邀请失败时（如手机号格式错误、token无效、已过期），系统显示友好的中文错误提示，使用Shadcn Dialog/Toast组件（AGENTS.md）
7. 邀请成功后，主要家长和被邀请家长都收到确认通知（主要家长：邀请已发送/已接受；被邀请家长：已加入家庭）
8. 操作响应时间 < 500ms（NFR3: P95），页面加载时间 < 3秒（NFR2）
9. 操作记录到审计日志（NFR14），包含：邀请时间、邀请者ID（脱敏）、被邀请手机号（脱敏）、家庭ID、邀请状态

## Tasks / Subtasks

- [ ] Task 1: Create pending_invitations database schema (AC: #2)
  - [ ] Create `database/schema/pending-invitations.ts` with fields: id, token (UUID + timestamp), inviter_user_id, family_id, invited_phone (encrypted), status (enum: pending/accepted/expired), created_at, expires_at
  - [ ] Add foreign key: inviter_user_id → users.id
  - [ ] Add foreign key: family_id → families.id
  - [ ] Generate Drizzle migration: `bun drizzle-kit generate`
- [ ] Task 2: Create invitation query functions (AC: #2, #5)
  - [ ] Create `lib/db/queries/invitations.ts` with function: `createInvitation(inviterUserId: string, familyId: string, invitedPhone: string)`
  - [ ] Create `lib/db/queries/invitations.ts` with function: `getInvitationByToken(token: string)`
  - [ ] Create `lib/db/queries/invitations.ts` with function: `updateInvitationStatus(token: string, status: string)`
  - [ ] Create `lib/db/queries/invitations.ts` with function: `getFamilyInvitations(familyId: string)`
  - [ ] **MUST USE Drizzle ORM query builder - NO native SQL**
  - [ ] **MUST use Bun.password.hash() for invited_phone encryption**
- [ ] Task 3: Implement invitation creation API endpoint (AC: #1, #2, #7, #9)
  - [ ] Create `app/api/families/invite-parent/route.ts` with POST endpoint
  - [ ] Verify current user is primary parent (users.id === families.primary_parent_id)
  - [ ] Validate phone number format (11 digits, starts with 1)
  - [ ] Generate unique invitation token (UUID + timestamp)
  - [ ] Create invitation record in pending_invitations table
  - [ ] Encrypt invited phone using Bun.password.hash()
  - [ ] Send invitation SMS using Better-Auth phone plugin (invitation link contains token)
  - [ ] Set expiration time (24 hours from creation)
  - [ ] Log invitation event to audit logs
  - [ ] Send confirmation notification to primary parent (invitation sent)
- [ ] Task 4: Implement invitation verification and registration API endpoint (AC: #3, #4, #7, #9)
  - [ ] Create `app/api/auth/accept-invitation/route.ts` with POST endpoint
  - [ ] Verify invitation token exists and is valid (status='pending', not expired)
  - [ ] Pre-fill registration form with invited phone number
  - [ ] On registration completion (reuse Story 1-1 flow):
    - Create user account (role='parent')
    - Associate user to existing family (users.family_id = family_id from invitation)
    - **DO NOT create new family** - user joins existing family
    - Update invitation status to 'accepted'
    - Create 36-hour HttpOnly Cookie session (REUSE from Story 1-1)
  - [ ] Log invitation acceptance to audit logs
  - [ ] Send confirmation notifications: primary parent (invitation accepted), invited parent (joined family)
- [ ] Task 5: Create invitation management UI pages (AC: #1, #5, #6)
  - [ ] Create `app/(parent)/settings/family/page.tsx` with family management interface
  - [ ] Display family members list: primary parent, secondary parents, children
  - [ ] "Invite Parent" button - opens invitation form
  - [ ] Invitation form: phone input field (11 digits, validation)
  - [ ] Invitation status list: phone (masked), status (pending/accepted/expired), created_at
  - [ ] **Error handling using Shadcn Toast component** (REUSE from Story 1-1, 1-2, 1-3)
  - [ ] Responsive design (mobile-first, < 450px for mini-program optimization)
  - [ ] Reuse `app/(parent)/layout.tsx` (parent navigation from Epic 1)
- [ ] Task 6: Implement invitation status cleanup (AC: #5)
  - [ ] Create `lib/services/invitation-cleanup.ts` with cleanup job
  - [ ] Run cleanup job daily (or via cron job) to mark expired invitations
  - [ ] Mark invitations as 'expired' if created_at > 24 hours
  - [ ] Log cleanup operations
- [ ] Task 7: Write BDD tests (AGENTS.md requirement: Given-When-Then)
  - [ ] **Given** 主要家长输入其他家长手机号 **When** 点击发送邀请 **Then** 60秒内收到邀请短信
  - [ ] **Given** 被邀请家长点击邀请链接 **When** 完成注册流程 **Then** 加入已有家庭，角色为次要家长
  - [ ] **Given** 非主要家长尝试发送邀请 **When** 点击发送邀请 **Then** 显示权限错误提示
  - [ ] **Given** 邀请链接已过期（24小时）**When** 点击链接 **Then** 显示邀请已过期提示
  - [ ] **Given** 主要家长查看家庭成员列表 **When** 进入家庭设置页面 **Then** 显示所有家长及其角色和邀请状态
  - [ ] Use Bun Test for unit tests, Playwright for E2E tests
- [ ] Task 8: Performance and compliance verification (AC: #6, #8)
  - [ ] Verify API response time < 500ms (load testing)
  - [ ] Verify page load time < 3 seconds
  - [ ] Verify invited phone is encrypted in database using Bun.password.hash()
  - [ ] Verify session cookie is HttpOnly and 36-hour expiration (for invited parent)
  - [ ] Verify audit logs are recording invitation events (create, accept, expire)
  - [ ] Verify SMS notifications are sent correctly via Better-Auth phone plugin
  - [ ] Verify cleanup job marks expired invitations correctly

## Dev Notes

### Previous Story Intelligence (Stories 1-1, 1-2, 1-3)

**From Story 1-1: Parent Phone Registration**

**Better-Auth Setup:**
- Better-Auth 1.4.18+ configured with phone plugin in `lib/auth/index.ts`
- 36-hour rolling session refresh enabled (NFR13)
- HttpOnly Cookie for session token storage
- **Can reuse phone plugin for invitation SMS notifications**

**Database Schema:**
- users table already created: `id`, `phone` (encrypted), `role` (enum: parent/child/admin), `password_hash`, `family_id`, `created_at`
- families table already created: `id`, `primary_parent_id`, `created_at`
- audit-logs table already created: `id`, `user_id`, `action_type`, `timestamp`, `ip_address`
- **Role enum exists: parent/child/admin** - Secondary parent uses role='parent' (same as primary)
- **Need to add: pending_invitations table** for invitation tokens

**Database Queries:**
- `lib/db/queries/users.ts`: `getUserByPhone(phone: string)` - REUSE from Story 1-1
- `lib/db/queries/users.ts`: `createUser(phone: string, role: string)` - REUSE from Story 1-1, but DON'T create new family
- `lib/db/queries/families.ts`: `createFamily(primaryParentId: string)` - exists but NOT needed (join existing family)
- `lib/db/queries/audit-logs.ts`: `logUserAction(userId: string, action: string)` - REUSE from Story -1
- **Need to add: invitation queries in new file** `lib/db/queries/invitations.ts`

**File Structure:**
- `lib/auth/index.ts` - Better-Auth configuration (REUSE from Story 1-1)
- `lib/auth/session.ts` - Session management utilities (REUSE from Story 1-1)
- `lib/auth/guards.ts` - Role guards (EXTEND from Story 1-1, add primary parent guard)

**Code Patterns Established:**
- **Drizzle ORM query builder** - MUST use for all database operations (NO native SQL)
- **Bun.password.hash()** - for password/phone hashing (reuse for invited_phone encryption)
- **Bun.password.verify()** - for password/PIN verification (not needed for invitation flow)
- **Bun.env** - for environment variables (NO process.env)
- **Shadcn Toast** - for error display (NO alert())
- **TypeScript strict mode** - NO `any` type, NO `@ts-ignore`
- **BDD testing** - Given-When-Then format, tests BEFORE implementation

**From Story 1-2: Parent Phone Login**

**Session Management:**
- Create/refresh HttpOnly Cookie (36-hour expiration) - REUSE for invited parent after registration
- Session utilities in `lib/auth/session.ts` - REUSE from Story 1-2

**Rate Limiting:**
- `lib/auth/rate-limit.ts` with in-memory rate limiter - can reuse for invitation rate limiting
- Prevent invitation spam: limit primary parent to 10 invitations per day

**Error Handling:**
- Shadcn Toast for error display - REUSE from Story 1-2
- User-friendly error messages in Chinese

**From Story 1-3: Child PIN Login**

**Role-Based Access:**
- Verify user.role === 'child' for PIN login - similar pattern for primary parent verification
- Verify user.role === 'parent' AND user.id === family.primary_parent_id for invitation permission

**Database Query Patterns:**
- Added `getChildByPIN(pin: string)` to `lib/db/queries/users.ts` - similar pattern for `getInvitationByToken(token: string)`

### Architecture Patterns and Constraints

**Technical Stack:**
- Bun 1.3.x+ runtime (NO Node.js compatibility layer)
- Next.js 16.x + React 19.x
- bun:sqlite + Drizzle ORM 0.45.x+ (NO native SQL)
- Better-Auth 1.4.18+ with phone plugin
- TypeScript 5 strict mode (NO `any` type, NO `@ts-ignore`)

**Critical RED LIST Rules:**
1. **Database Operations:** MUST use Drizzle ORM query builder - NO native SQL, NO string concatenation
2. **Database Query Location:** All queries must be in `lib/db/queries/` directory, per-table files (users.ts, families.ts, invitations.ts)
3. **Password Hashing:** MUST use `Bun.password.hash()` - NO bcrypt or other external libraries
4. **Environment Variables:** MUST use `Bun.env` - NO `process.env`
5. **Type Safety:** NO `any` type, use `unknown` + type guards if needed
6. **Error Display:** NO `alert()` - MUST use Shadcn Dialog/Toast components
7. **Testing:** MUST use Given-When-Then BDD format, tests BEFORE implementation

**Authentication Architecture (ADR-3):**
- Better-Auth 1.4.18+ with phone plugin for OTP verification and SMS notifications
- 36-hour session rolling refresh (NFR13) - SAME for primary and secondary parents
- HttpOnly Cookie for session token storage
- Session management via `lib/auth/session.ts`

**Family Management Architecture:**
- Primary parent creates family (Story 1-1)
- Secondary parents can be added to existing families (this story)
- Role enum: parent (both primary and secondary), child, admin
- Family linkage: users.family_id = families.id for all family members
- Primary parent identification: families.primary_parent_id = users.id

**Security Requirements:**
- Phone number encryption required (NFR9) - use Bun.password.hash() for invited_phone
- Password hashing using bcrypt algorithm (NFR10) - but MUST use Bun.password.hash()
- All data transmission over HTTPS/TLS 1.3 (NFR8)
- HttpOnly Cookie for session tokens (NFR11)
- Based on role access control (RBAC) (NFR12) - verify primary parent permission
- Session management (36-hour expiration, rolling refresh) (NFR13)
- Operation log audit (record all key operations) (NFR14)

**Invitation Flow Requirements:**
- Invitation token: UUID + timestamp for uniqueness
- Token expiration: 24 hours from creation
- Phone number encryption: invited_phone stored encrypted using Bun.password.hash()
- SMS notification: Better-Auth phone plugin sends invitation link
- Registration flow: Invited parent reuses Story 1-1 registration, but joins existing family
- Role assignment: Invited parent becomes secondary parent (role='parent', does not change primary_parent_id)
- Family linkage: users.family_id = families.id (same as primary parent)
- Invitation status: pending/accepted/expired
- Permission check: Only primary parent can send invitations

### Source Tree Components to Touch

**Files to Create:**
1. `database/schema/pending-invitations.ts` - Pending invitations table schema
2. `lib/db/queries/invitations.ts` - Invitation queries: createInvitation, getInvitationByToken, updateInvitationStatus, getFamilyInvitations
3. `app/api/families/invite-parent/route.ts` - Invitation creation API endpoint
4. `app/api/auth/accept-invitation/route.ts` - Invitation acceptance and registration API endpoint
5. `lib/services/invitation-cleanup.ts` - Invitation cleanup job (mark expired invitations)
6. `app/(parent)/settings/family/page.tsx` - Family management UI page
7. `types/invitation.ts` - Invitation TypeScript types

**Files to Modify:**
1. `lib/auth/guards.ts` - Add primary parent guard (verify users.id === families.primary_parent_id)
2. `lib/db/queries/users.ts` - Modify createUser to support joining existing family (optional family_id parameter)
3. `database/migrations/` - Run `bun drizzle-kit generate` to create migration for pending_invitations table

**Files to Reuse (from Stories 1-1, 1-2, 1-3):**
1. `lib/auth/index.ts` - Better-Auth configuration (no changes needed - use phone plugin for SMS)
2. `lib/auth/session.ts` - Session management utilities (no changes needed - reuse for invited parent)
3. `database/schema/users.ts` - Users table (no changes needed - already has family_id)
4. `database/schema/families.ts` - Families table (no changes needed - already has primary_parent_id)
5. `database/schema/audit-logs.ts` - Audit logs table (no changes needed)
6. `lib/db/queries/users.ts` - User queries (modify createUser to support joining existing family)
7. `lib/db/queries/families.ts` - Family queries (no changes needed)
8. `lib/db/queries/audit-logs.ts` - Audit log queries (no changes needed - use existing logUserAction)
9. `app/(parent)/layout.tsx` - Parent navigation (create parent layout if not exists)
10. `types/user.ts` - User TypeScript types (no changes needed)
11. `types/auth.ts` - Auth DTO types (no changes needed)

**Dependencies:**
- Better-Auth (already configured in Story 1-1)
- Drizzle ORM (already configured in Story 1-1)

### Testing Standards

**BDD Testing Requirements (AGENTS.md):**

All tests MUST use Given-When-Then format with business language, NOT technical terms.

**Example Test Format:**

```typescript
// ✅ CORRECT - BDD style (Given-When-Then)
it('given 主要家长输入其他家长手机号，when 点击发送邀请，then 60秒内收到邀请短信', async () => {
  // Given: 主要家长输入其他家长手机号
  const inviterPhone = '13800000100'; // Primary parent from Story 1-1
  const invitedPhone = '13800000200'; // Secondary parent to invite

  // When: 点击发送邀请
  const response = await request(app)
    .post('/api/families/invite-parent')
    .set('Cookie', primaryParentSession) // Login session from Story 1-2
    .send({ invitedPhone });

  // Then: 60秒内收到邀请短信
  expect(response.status).toBe(200);
  expect(response.body.message).toContain('邀请已发送');
  // Verify invitation token created in database
  // Verify SMS sent via Better-Auth phone plugin
});

it('given 被邀请家长点击邀请链接，when 完成注册流程，then 加入已有家庭，角色为次要家长', async () => {
  // Given: 被邀请家长点击邀请链接
  const invitationToken = 'abc-123-token'; // From invitation response
  const invitedPhone = '13800000200';

  // When: 完成注册流程
  const response = await request(app)
    .post('/api/auth/accept-invitation')
    .send({
      token: invitationToken,
      phone: invitedPhone,
      otp: '123456' // OTP from SMS
    });

  // Then: 加入已有家庭，角色为次要家长
  expect(response.status).toBe(200);
  expect(response.body.user.role).toBe('parent');
  expect(response.body.user.familyId).toBe(primaryParentFamilyId); // Same family as primary parent
  expect(response.headers['set-cookie']).toBeDefined(); // Session cookie created
});

// ❌ INCORRECT - Traditional unit test
it('should create invitation and send SMS', async () => {
  const response = await request(app).post('/api/families/invite-parent').send({ phone: '13800000200' });
  expect(response.status).toBe(200);
});
```

**Test Types:**
- **Unit Tests (Bun Test):** Test individual functions (createInvitation, getInvitationByToken, token generation)
- **Integration Tests (Bun Test):** Test API endpoints with database
- **E2E Tests (Playwright):** Test complete invitation flow (send invite → click link → register → join family)

**Test Requirements:**
1. Write tests BEFORE implementation (TDD/BDD approach)
2. All tests must pass before marking story complete
3. Test coverage ≥ 60% for new code
4. Performance tests: API response time < 500ms (P95)
5. Invitation flow tests: verify family linkage, role assignment, token expiration, permission checks

### Project Structure Notes

**Alignment with Unified Project Structure:**

The story implementation follows project structure defined in architecture.md (lines 376-756):

```
bmad-test2/
├── database/
│   ├── schema/
│   │   ├── users.ts               # REUSE: Users table (no changes needed)
│   │   ├── families.ts            # REUSE: Families table (no changes needed)
│   │   ├── pending-invitations.ts  # NEW: Pending invitations table
│   │   └── audit-logs.ts          # REUSE: Audit logs (no changes needed)
│   └── migrations/                # NEW: Migration file for pending_invitations
├── src/
│   ├── app/
│   │   ├── (parent)/
│   │   │   ├── layout.tsx         # CREATE or REUSE: Parent navigation
│   │   │   └── settings/
│   │   │       └── family/
│   │   │           └── page.tsx    # NEW: Family management UI
│   │   ├── api/
│   │   │   ├── families/
│   │   │   │   └── invite-parent/
│   │   │   │       └── route.ts   # NEW: Invitation creation API
│   │   │   └── auth/
│   │   │       ├── accept-invitation/
│   │   │       │   └── route.ts   # NEW: Invitation acceptance API
│   │   │       ├── register/      # REUSE: Registration API (from Story 1-1)
│   │   │       ├── login/         # REUSE: Login API (from Story 1-2)
│   │   │       └── pin-login/     # REUSE: PIN login API (from Story 1-3)
│   ├── lib/
│   │   ├── auth/
│   │   │   ├── index.ts           # REUSE: Better-Auth config (from Story 1-1)
│   │   │   ├── session.ts         # REUSE: Session utilities (from Story 1-1)
│   │   │   └── guards.ts          # MODIFY: Add primary parent guard
│   │   ├── db/
│   │   │   └── queries/
│   │   │       ├── users.ts        # MODIFY: Add optional family_id to createUser
│   │   │       ├── families.ts     # REUSE: Family queries (from Story 1-1)
│   │   │       ├── invitations.ts  # NEW: Invitation queries
│   │   │       └── audit-logs.ts  # REUSE: Audit log queries (from Story 1-1)
│   │   └── services/
│   │       └── invitation-cleanup.ts  # NEW: Invitation cleanup job
│   └── types/
│       ├── user.ts                # REUSE: User types (from Story 1-1)
│       ├── auth.ts                # REUSE: Auth DTO types (from Story 1-1)
│       └── invitation.ts          # NEW: Invitation types
└── tests/
    ├── unit/
    │   └── lib/
    │       ├── db/
    │       │   └── invitations.test.ts  # NEW: Invitation query tests
    │       └── auth/
    │           └── invitation.test.ts   # NEW: Invitation auth tests
    ├── integration/
    │   └── api/
    │       ├── invite-parent.test.ts     # NEW: Invitation creation tests
    │       └── accept-invitation.test.ts # NEW: Invitation acceptance tests
    └── e2e/
        └── family-management.spec.ts    # NEW: Complete invitation flow
```

**Naming Conventions:**
- Files: kebab-case (e.g., `invite-parent-page.tsx`)
- Functions: camelCase (e.g., `createInvitation`, `getInvitationByToken`)
- Components: PascalCase (e.g., `InvitationForm`, `FamilyMembersList`)
- Types: PascalCase (e.g., `Invitation`, `CreateInvitationRequest`)

**File Length Constraint:**
- All files must be ≤ 800 lines (AGENTS.md requirement)
- If files exceed limit, split into smaller modules

**Detected Conflicts or Variances:**
None - this story builds on Stories 1-1, 1-2, 1-3, extending family management capabilities.

### References

**Epic and Requirements:**
- [Source: _bmad-output/planning-artifacts/epics.md#L260-L274] - Epic 1: User Authentication & Family Management
- [Source: _bmad-output/planning-artifacts/prd.md#L445] - FR4: 家长可以邀请其他家长加入家庭
- [Source: _bmad-output/planning-artifacts/prd.md#L607] - AC3: 主要家长可以邀请其他家长，被邀请者收到短信通知

**Previous Story Learnings:**
- [Source: _bmad-output/implementation-artifacts/1-1-parent-phone-registration.md#L74-L100] - Better-Auth Setup (phone plugin, 36-hour session, HttpOnly Cookie)
- [Source: _bmad-output/implementation-artifacts/1-1-parent-phone-registration.md#L101-L107] - Database Schema (users, families, audit-logs tables, role enum)
- [Source: _bmad-output/implementation-artifacts/1-1-parent-phone-registration.md#L108-L121] - Database Queries (getUserByPhone, createUser, logUserAction)
- [Source: _bmad-output/implementation-artifacts/1-2-parent-phone-login.md#L73-L109] - Session Management and Rate Limiting
- [Source: _bmad-output/implementation-artifacts/1-2-parent-phone-login.md#L168-L208] - BDD Testing Requirements (Given-When-Then format)
- [Source: _bmad-output/implementation-artifacts/1-3-child-pin-login.md#L76-L135] - Role-Based Access and Database Query Patterns

**Architecture Decisions:**
- [Source: _bmad-output/planning-artifacts/architecture.md#L228-L247] - ADR-3: 认证与会话管理架构 (Better-Auth + phone plugin)
- [Source: _bmad-output/planning-artifacts/architecture.md#L376-L756] - Complete Project Structure
- [Source: _bmad-output/planning-artifacts/architecture.md#L408-L431] - Database schema directory structure
- [Source: _bmad-output/planning-artifacts/architecture.md#L584-L597] - Database queries: lib/db/queries/ per-table files
- [Source: _bmad-output/planning-artifacts/architecture.md#L599-L602] - Auth configuration: lib/auth/index.ts
- [Source: _bmad-output/planning-artifacts/architecture.md#L444-L449] - Auth routes: app/(auth)/login/ and pin/

**Technical Specifications:**
- [Source: AGENTS.md#L139-L154] - RED LIST: Database constraints (Drizzle ORM only, no native SQL, lib/db/queries/ per-table files)
- [Source: AGENTS.md#L156-L165] - RED LIST: Bun runtime requirements (Bun.password.hash, Bun.env, no Node.js tools)
- [Source: AGENTS.md#L167-L170] - RED LIST: Type safety (no any type, no @ts-ignore)
- [Source: AGENTS.md#L171-L173] - RED LIST: Error handling (no alert, use Shadcn Dialog/Toast)
- [Source: AGENTS.md#L197-L207] - BDD Testing requirements (Given-When-Then format, tests before implementation)
- [Source: docs/TECH_SPEC_DATABASE.md] - Database schema and Drizzle ORM usage
- [Source: docs/TECH_SPEC_BUN.md] - Bun runtime tools and password hashing
- [Source: docs/TECH_SPEC_BDD.md] - BDD development methodology

**Security and Compliance:**
- [Source: _bmad-output/planning-artifacts/prd.md#L544-L545] - NFR9: 敏感数据（手机号、PIN码）加密存储
- [Source: _bmad-output/planning-artifacts/prd.md#L546] - NFR10: 密码哈希使用 bcrypt 算法 (but use Bun.password.hash per AGENTS.md)
- [Source: _bmad-output/planning-artifacts/prd.md#L547] - NFR11: 会话令牌使用 HttpOnly Cookie
- [Source: _bmad-output/planning-artifacts/prd.md#L548] - NFR12: 基于角色的权限控制（RBAC）
- [Source: _bmad-output/planning-artifacts/prd.md#L549] - NFR13: 会话管理（36小时过期，滚动刷新）
- [Source: _bmad-output/planning-artifacts/prd.md#L551] - NFR14: 操作日志审计（记录所有关键操作）

**Performance Requirements:**
- [Source: _bmad-output/planning-artifacts/prd.md#L531] - NFR2: 家长端数据统计页面加载 < 3秒
- [Source: _bmad-output/planning-artifacts/prd.md#L532] - NFR3: API 响应时间 < 500ms（P95）

**Test Data (from AGENTS.md):**
- Primary Parent User: Zhang 1, Phone: 13800000100, Password: 1111
- Secondary Parent User: Zhang 2, Phone: 13800000200 (to be invited)
- Child User: Zhang 3, PIN: 1111
- Reference: AGENTS.md testing data section

## Dev Agent Record

### Agent Model Used

glm-4.7

### Debug Log References

None - this is initial story creation.

### Completion Notes List

- Fourth story in Epic 1, extending family management capabilities from Stories 1-1, 1-2, 1-3
- All technical constraints from AGENTS.md RED LIST enforced
- Architecture alignment verified with ADR-3 (Better-Auth + phone plugin) for SMS notifications
- BDD testing requirements specified with Given-When-Then format
- New database schema: pending_invitations table for invitation tokens
- Extends family management: secondary parent support, invitation mechanism
- Reuses authentication infrastructure from Stories 1-1, 1-2, 1-3
- Key innovation: invitation flow reuses registration, but links to existing family instead of creating new family
- Permission check: only primary parent can send invitations

### File List

**New Files:**
1. `database/schema/pending-invitations.ts`
2. `lib/db/queries/invitations.ts`
3. `app/api/families/invite-parent/route.ts`
4. `app/api/auth/accept-invitation/route.ts`
5. `lib/services/invitation-cleanup.ts`
6. `app/(parent)/settings/family/page.tsx`
7. `app/(parent)/layout.tsx` (if not exists)
8. `types/invitation.ts`

**Test Files:**
9. `tests/unit/lib/db/invitations.test.ts`
10. `tests/unit/lib/auth/invitation.test.ts`
11. `tests/integration/api/invite-parent.test.ts`
12. `tests/integration/api/accept-invitation.test.ts`
13. `tests/e2e/family-management.spec.ts`

**Modified Files:**
14. `lib/auth/guards.ts` (add primary parent guard)
15. `lib/db/queries/users.ts` (modify createUser to support joining existing family)
16. `_bmad-output/implementation-artifacts/sprint-status.yaml` (update story status from backlog to ready-for-dev)

**Reused Files (from Stories 1-1, 1-2, 1-3, no changes needed):**
- `lib/auth/index.ts`
- `lib/auth/session.ts`
- `database/schema/users.ts`
- `database/schema/families.ts`
- `database/schema/audit-logs.ts`
- `lib/db/queries/families.ts`
- `lib/db/queries/audit-logs.ts`
- `types/user.ts`
- `types/auth.ts`

**Migration Files:**
- Auto-generated by `bun drizzle-kit generate` after schema creation
