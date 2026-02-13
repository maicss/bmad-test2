# Story 1.3: Child PIN Login

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 儿童 (Child),
I want 使用4位PIN码登录账户 (login to account using 4-digit PIN code),
so that 我可以在共享设备上快速访问Family Reward系统并查看我的任务和积分 (I can quickly access Family Reward system on shared device and view my tasks and points).

## Acceptance Criteria

1. 儿童可以在PIN登录页面输入4位PIN码（0000-9999），系统验证PIN码正确后创建/刷新36小时HttpOnly Cookie会话，儿童被重定向到儿童Dashboard（AC2, NFR13）
2. 系统必须验证儿童账户存在且role='child'，PIN码与账户匹配，并且该儿童属于有效家庭（family_id不为空）
3. PIN登录成功后，系统返回用户信息（角色：Child，家庭ID，儿童姓名），并在3秒内完成会话创建（NFR3: P95）
4. PIN登录失败时（如PIN码错误、账户不存在、非儿童角色），系统显示友好的中文错误提示，使用Shadcn Dialog/Toast组件（AGENTS.md）
5. 系统对PIN登录失败次数进行限制（5次失败后锁定10分钟），防止暴力破解（安全增强，与Story 1-2保持一致）
6. PIN码必须加密存储在users表的password_hash字段中，使用Bun.password.hash()进行哈希处理（NFR9, NFR10）
7. 操作响应时间 < 500ms（NFR3: P95），页面加载时间 < 2秒（NFR1: 儿童端页面加载）
8. 操作记录到审计日志（NFR14），包含：登录时间、儿童ID（脱敏）、IP地址、登录状态

## Tasks / Subtasks

- [ ] Task 1: Add child query functions (AC: #2, #6)
  - [ ] Add `getChildByPIN(pin: string)` function to `lib/db/queries/users.ts`
  - [ ] Query users table where role = 'child' and password_hash matches PIN
  - [ ] **MUST USE Drizzle ORM query builder - NO native SQL**
  - [ ] Use Bun.password.verify() to compare PIN with stored hash
- [ ] Task 2: Implement child PIN login API endpoint (AC: #1, #2, #3, #4, #5, #8)
  - [ ] Create `app/api/auth/pin-login/route.ts` with POST endpoint
  - [ ] Validate PIN format (4 digits, numeric only)
  - [ ] On PIN verification: verify user exists with role='child' and password_hash matches
  - [ ] Verify child belongs to valid family (family_id is not null)
  - [ ] Create/refresh HttpOnly Cookie session (36-hour expiration) - REUSE from Story 1-1
  - [ ] Implement rate limiting: 5 failed attempts → lock for 10 minutes (REUSE from Story 1-2)
  - [ ] Return 200 with user data (role: child, familyId, name)
  - [ ] Log successful and failed PIN login attempts to audit logs
- [ ] Task 3: Create child PIN login UI page (AC: #1, #3, #4)
  - [ ] Create `app/(auth)/pin/page.tsx` with PIN login form
  - [ ] PIN input field (4 digits, numeric keypad on mobile)
  - [ ] Auto-focus on PIN field on page load
  - [ ] Submit button with loading state
  - [ ] **Error handling using Shadcn Toast component** (REUSE from Story 1-1 and 1-2)
  - [ ] Redirect to child dashboard on success
  - [ ] Responsive design (tablet-optimized, ≥768px landscape for child-end)
  - [ ] Reuse `app/(auth)/layout.tsx` from Story 1-1
- [ ] Task 4: Reuse audit logging from Story 1-1 (AC: #8)
  - [ ] Verify `lib/db/queries/audit-logs.ts` exists with `logUserAction` function (from Story 1-1)
  - [ ] Log PIN login events: timestamp, userId (masked), IP, action_type, success/failure
  - [ ] No new schema needed - reuse audit-logs table from Story 1-1
- [ ] Task 5: Reuse rate limiting from Story 1-2 (AC: #5)
  - [ ] Verify `lib/auth/rate-limit.ts` exists with rate limiter (from Story 1-2)
  - [ ] Reuse rate limiting logic for PIN login attempts
  - [ ] Track failed PIN login attempts by IP address
  - [ ] Implement 5 failures → 10-minute lockout
  - [ ] Return user-friendly error: "PIN码错误次数过多，请10分钟后再试"
- [ ] Task 6: Write BDD tests (AGENTS.md requirement: Given-When-Then)
  - [ ] **Given** 已注册儿童输入正确PIN码 **When** 提交PIN登录表单 **Then** 创建会话并重定向到儿童Dashboard
  - [ ] **Given** 儿童输入错误PIN码 **When** 提交PIN登录表单 **Then** 显示PIN码错误提示
  - [ ] **Given** 使用家长账号的PIN码登录 **When** 尝试登录 **Then** 显示错误提示（非儿童角色）
  - [ ] **Given** 连续5次PIN登录失败 **When** 尝试第6次登录 **Then** 显示锁定提示（10分钟）
  - [ ] **Given** 无family_id的儿童账号 **When** 尝试登录 **Then** 显示错误提示（无效家庭）
  - [ ] Use Bun Test for unit tests, Playwright for E2E tests
- [ ] Task 7: Performance and compliance verification (AC: #6, #7)
  - [ ] Verify API response time < 500ms (load testing)
  - [ ] Verify page load time < 2 seconds (child-end requirement)
  - [ ] Verify PIN code is encrypted in database using Bun.password.hash()
  - [ ] Verify session cookie is HttpOnly and 36-hour expiration
  - [ ] Verify audit logs are recording PIN login events (success and failure)
  - [ ] Verify rate limiting is working correctly for PIN login attempts

## Dev Notes

### Previous Story Intelligence (Story 1-1 and 1-2)

**From Story 1-1: Parent Phone Registration**

**Better-Auth Setup:**
- Better-Auth 1.4.18+ configured with phone plugin in `lib/auth/index.ts`
- 36-hour rolling session refresh enabled (NFR13)
- HttpOnly Cookie for session token storage
- **Can extend Better-Auth for PIN authentication** (no phone verification needed for children)

**Database Schema:**
- users table already created: `id`, `phone` (encrypted), `role` (enum: parent/child/admin), `password_hash`, `family_id`, `created_at`
- families table already created: `id`, `primary_parent_id`, `created_at`
- audit-logs table already created: `id`, `user_id`, `action_type`, `timestamp`, `ip_address`
- **Role enum exists: parent/child/admin** - MUST verify role='child' for PIN login
- **No new schema needed for PIN login story**

**Database Queries:**
- `lib/db/queries/users.ts`: `getUserByPhone(phone: string)` - exists but need to add `getChildByPIN(pin: string)`
- `lib/db/queries/users.ts`: `createUser(phone: string, role: string)` - exists but not needed for PIN login
- `lib/db/queries/audit-logs.ts`: `logUserAction(userId: string, action: string)` - REUSE from Story 1-1
- **Need to add: getChildByPIN(pin: string)** - uses same users table

**File Structure:**
- `app/(auth)/layout.tsx` - Auth layout (SHARED from Story 1-1)
- `lib/auth/index.ts` - Better-Auth configuration (REUSE from Story 1-1)
- `lib/auth/session.ts` - Session management utilities (REUSE from Story 1-1)
- `lib/auth/guards.ts` - Role guards (EXTEND from Story 1-1 and 1-2)

**Code Patterns Established:**
- **Drizzle ORM query builder** - MUST use for all database operations (NO native SQL)
- **Bun.password.hash()** - for password/PIN hashing (reuse pattern from Story 1-1)
- **Bun.password.verify()** - for PIN verification (new function, but follows Bun pattern)
- **Bun.env** - for environment variables (NO process.env)
- **Shadcn Toast** - for error display (NO alert())
- **TypeScript strict mode** - NO `any` type, NO `@ts-ignore`
- **BDD testing** - Given-When-Then format, tests BEFORE implementation

**From Story 1-2: Parent Phone Login**

**Login Flow Patterns:**
- API route: `app/api/auth/login/route.ts` - can reuse pattern for `app/api/auth/pin-login/route.ts`
- Session creation/refresh after authentication - REUSE from Story 1-2
- Rate limiting implementation in `lib/auth/rate-limit.ts` - REUSE for PIN login
- Error handling with Shadcn Toast - REUSE from Story 1-2

**Session Management:**
- Create/refresh HttpOnly Cookie (36-hour expiration) - REUSE from Story 1-2
- Session utilities in `lib/auth/session.ts` - REUSE from Story 1-2

**UI Patterns:**
- Input validation (4-6 digits for OTP, similar for PIN) - REUSE pattern
- Loading states, error display - REUSE from Story 1-2
- Redirect to dashboard on success - REUSE pattern

**Rate Limiting:**
- `lib/auth/rate-limit.ts` with in-memory rate limiter - REUSE for PIN login
- Track failed attempts by IP address - REUSE pattern
- 5 failures → 10-minute lockout - REUSE same limits

### Architecture Patterns and Constraints

**Technical Stack:**
- Bun 1.3.x+ runtime (NO Node.js compatibility layer)
- Next.js 16.x + React 19.x
- bun:sqlite + Drizzle ORM 0.45.x+ (NO native SQL)
- Better-Auth 1.4.18+ with phone plugin (extend for PIN)
- TypeScript 5 strict mode (NO `any` type, NO `@ts-ignore`)

**Critical RED LIST Rules:**
1. **Database Operations:** MUST use Drizzle ORM query builder - NO native SQL, NO string concatenation
2. **Database Query Location:** All queries must be in `lib/db/queries/` directory, per-table files (users.ts, families.ts)
3. **Password Hashing:** MUST use `Bun.password.hash()` for PIN hashing - NO bcrypt or other external libraries
4. **PIN Verification:** MUST use `Bun.password.verify()` for PIN verification
5. **Environment Variables:** MUST use `Bun.env` - NO `process.env`
6. **Type Safety:** NO `any` type, use `unknown` + type guards if needed
7. **Error Display:** NO `alert()` - MUST use Shadcn Dialog/Toast components
8. **Testing:** MUST use Given-When-Then BDD format, tests BEFORE implementation

**Authentication Architecture (ADR-3):**
- Better-Auth 1.4.18+ with phone plugin for parents, PIN login for children
- 36-hour session rolling refresh (NFR13) - SAME for parents and children
- HttpOnly Cookie for session token storage - SAME for parents and children
- Session management via `lib/auth/session.ts` - REUSE from Stories 1-1 and 1-2
- Role-based access: Parent uses phone+OTP, Child uses PIN

**Security Requirements:**
- PIN code encryption required (NFR9) - use Bun.password.hash()
- PIN hashing using bcrypt algorithm (NFR10) - but MUST use Bun.password.hash()
- All data transmission over HTTPS/TLS 1.3 (NFR8)
- HttpOnly Cookie for session tokens (NFR11)
- Based on role access control (RBAC) (NFR12) - verify role='child'
- Session management (36-hour expiration, rolling refresh) (NFR13)
- Operation log audit (record all key operations) (NFR14)
- Rate limiting for PIN login attempts (security enhancement, same as Story 1-2)

**Child-Specific Requirements:**
- PIN authentication: 4-digit numeric code (0000-9999)
- Family association: Verify child belongs to family (family_id is not null)
- Role verification: Ensure user.role === 'child'
- Session management: Create/refresh 36-hour HttpOnly Cookie session (same as parents)
- Security: PIN attempts rate limiting (separate from parent phone login, but same limits)
- UI: PIN input with 4-digit format validation, auto-focus, numeric keypad on mobile

### Source Tree Components to Touch

**Files to Create:**
1. `app/api/auth/pin-login/route.ts` - PIN login API endpoint
2. `app/(auth)/pin/page.tsx` - PIN login UI page

**Files to Modify:**
1. `lib/db/queries/users.ts` - Add `getChildByPIN(pin: string)` function
2. `lib/auth/guards.ts` - Add child role guard (extend from Story 1-1 and 1-2)

**Files to Reuse (from Stories 1-1 and 1-2):**
1. `lib/auth/index.ts` - Better-Auth configuration (no changes needed, can extend for PIN)
2. `lib/auth/session.ts` - Session management utilities (no changes needed)
3. `database/schema/users.ts` - Users table (no changes needed - already has role enum and password_hash)
4. `database/schema/families.ts` - Families table (no changes needed)
5. `database/schema/audit-logs.ts` - Audit logs table (no changes needed)
6. `lib/db/queries/users.ts` - User queries (ADD getChildByPIN, reuse existing patterns)
7. `lib/db/queries/audit-logs.ts` - Audit log queries (no changes needed - use existing logUserAction)
8. `lib/auth/rate-limit.ts` - Rate limiting utility (no changes needed - REUSE from Story 1-2)
9. `app/(auth)/layout.tsx` - Auth layout (no changes needed)
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
it('given 已注册儿童输入正确PIN码，when 提交PIN登录表单，then 创建会话并重定向到儿童Dashboard', async () => {
  // Given: 已注册儿童输入正确PIN码
  const pin = '1111'; // PIN for child user created in setup

  // When: 提交PIN登录表单
  const response = await request(app)
    .post('/api/auth/pin-login')
    .send({ pin });

  // Then: 创建会话并重定向到儿童Dashboard
  expect(response.status).toBe(200);
  expect(response.body.user.role).toBe('child');
  expect(response.body.user.name).toBe('Zhang 3'); // Test data from AGENTS.md
  expect(response.headers['set-cookie']).toBeDefined(); // Session cookie created
});

// ❌ INCORRECT - Traditional unit test
it('should return 200 for valid PIN', async () => {
  const response = await request(app).post('/api/auth/pin-login').send({ pin: '1111' });
  expect(response.status).toBe(200);
});
```

**Test Types:**
- **Unit Tests (Bun Test):** Test individual functions (getChildByPIN, PIN verification, rate limiting)
- **Integration Tests (Bun Test):** Test API endpoints with database
- **E2E Tests (Playwright):** Test complete PIN login flow in browser (child role)

**Test Requirements:**
1. Write tests BEFORE implementation (TDD/BDD approach)
2. All tests must pass before marking story complete
3. Test coverage ≥ 60% for new code
4. Performance tests: API response time < 500ms (P95)
5. Child-specific tests: verify role='child', family_id validation, PIN format validation

### Project Structure Notes

**Alignment with Unified Project Structure:**

The story implementation follows project structure defined in architecture.md (lines 376-756):

```
bmad-test2/
├── database/
│   ├── schema/
│   │   ├── users.ts          # REUSE: Users table (no changes needed)
│   │   ├── families.ts       # REUSE: Families table (no changes needed)
│   │   └── audit-logs.ts      # REUSE: Audit logs (no changes needed)
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── pin/
│   │   │   │   └── page.tsx  # NEW: PIN login UI
│   │   │   └── layout.tsx    # REUSE: Auth layout (from Story 1-1)
│   │   └── api/
│   │       └── auth/
│   │           ├── pin-login/
│   │           │   └── route.ts  # NEW: PIN login API
│   │           ├── login/        # REUSE: Parent login API (from Story 1-2)
│   │           └── register/     # REUSE: Parent register API (from Story 1-1)
│   ├── lib/
│   │   ├── auth/
│   │   │   ├── index.ts      # REUSE: Better-Auth config (from Story 1-1)
│   │   │   ├── session.ts    # REUSE: Session utilities (from Story 1-1)
│   │   │   ├── guards.ts     # MODIFY: Add child guard
│   │   │   └── rate-limit.ts # REUSE: Rate limiting (from Story 1-2)
│   │   └── db/
│   │       └── queries/
│   │           ├── users.ts      # MODIFY: Add getChildByPIN
│   │           ├── families.ts   # REUSE: Family queries (from Story 1-1)
│   │           └── audit-logs.ts # REUSE: Audit log queries (from Story 1-1)
│   └── types/
│       ├── user.ts        # REUSE: User types (from Story 1-1)
│       └── auth.ts        # REUSE: Auth DTO types (from Story 1-1)
└── tests/
    ├── unit/
    │   └── lib/
    │       ├── db/
    │       │   └── users.test.ts  # MODIFY: Add getChildByPIN tests
    │       └── auth/
    │           └── pin-login.test.ts  # NEW: PIN login tests
    ├── integration/
    │   └── api/
    │       └── pin-login.test.ts    # NEW: API integration tests
    └── e2e/
        └── auth.spec.ts             # MODIFY: Add PIN login flow (child role)
```

**Naming Conventions:**
- Files: kebab-case (e.g., `pin-login-page.tsx`)
- Functions: camelCase (e.g., `getChildByPIN`)
- Components: PascalCase (e.g., `PinLoginForm`)
- Types: PascalCase (e.g., `PinLoginRequest`)

**File Length Constraint:**
- All files must be ≤ 800 lines (AGENTS.md requirement)
- If files exceed limit, split into smaller modules

**Detected Conflicts or Variances:**
None - this story builds on Stories 1-1 and 1-2, reusing all authentication infrastructure.

### References

**Epic and Requirements:**
- [Source: _bmad-output/planning-artifacts/epics.md#L260-L274] - Epic 1: User Authentication & Family Management
- [Source: _bmad-output/planning-artifacts/prd.md#L444] - FR3: 儿童可以使用PIN码登录账户
- [Source: _bmad-output/planning-artifacts/prd.md#L606] - AC2: 儿童可以使用4位PIN码在共享设备上快速登录

**Previous Story Learnings:**
- [Source: _bmad-output/implementation-artifacts/1-1-parent-phone-registration.md#L74-L100] - Better-Auth Setup (phone plugin, 36-hour session, HttpOnly Cookie)
- [Source: _bmad-output/implementation-artifacts/1-1-parent-phone-registration.md#L101-L107] - Database Schema (users, families, audit-logs tables, role enum)
- [Source: _bmad-output/implementation-artifacts/1-1-parent-phone-registration.md#L108-L121] - Database Queries (getUserByPhone, createUser, logUserAction)
- [Source: _bmad-output/implementation-artifacts/1-2-parent-phone-login.md#L73-L109] - Login Flow Patterns (API routes, session management, error handling)
- [Source: _bmad-output/implementation-artifacts/1-2-parent-phone-login.md#L52-L57] - Rate Limiting Implementation (5 failures, 10-minute lockout)
- [Source: _bmad-output/implementation-artifacts/1-2-parent-phone-login.md#L168-L208] - BDD Testing Requirements (Given-When-Then format)

**Architecture Decisions:**
- [Source: _bmad-output/planning-artifacts/architecture.md#L228-L247] - ADR-3: 认证与会话管理架构 (Better-Auth + phone plugin + PIN login)
- [Source: _bmad-output/planning-artifacts/architecture.md#L376-L756] - Complete Project Structure
- [Source: _bmad-output/planning-artifacts/architecture.md#L408-L431] - Database schema directory structure
- [Source: _bmad-output/planning-artifacts/architecture.md#L584-L597] - Database queries: lib/db/queries/ per-table files
- [Source: _bmad-output/planning-artifacts/architecture.md#L599-L602] - Auth configuration: lib/auth/index.ts
- [Source: _bmad-output/planning-artifacts/architecture.md#L444-L449] - Auth routes: app/(auth)/login/ and pin/

**Technical Specifications:**
- [Source: AGENTS.md#L139-L154] - RED LIST: Database constraints (Drizzle ORM only, no native SQL, lib/db/queries/ per-table files)
- [Source: AGENTS.md#L156-L165] - RED LIST: Bun runtime requirements (Bun.password.hash, Bun.password.verify, Bun.env, no Node.js tools)
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
- [Source: _bmad-output/planning-artifacts/prd.md#L530] - NFR1: 孩子端页面加载时间 < 2秒
- [Source: _bmad-output/planning-artifacts/prd.md#L532] - NFR3: API 响应时间 < 500ms（P95）

**Test Data (from AGENTS.md):**
- Child User: Zhang 3, PIN: 1111, No phone number
- Reference: AGENTS.md testing data section

## Dev Agent Record

### Agent Model Used

glm-4.7

### Debug Log References

None - this is initial story creation.

### Completion Notes List

- Third story in Epic 1, reusing authentication infrastructure from Stories 1-1 and 1-2
- All technical constraints from AGENTS.md RED LIST enforced
- Architecture alignment verified with ADR-3 (Better-Auth + phone plugin + PIN login)
- BDD testing requirements specified with Given-When-Then format
- No new database schema needed - all tables created in Story 1-1 (users table with role enum)
- Reuses existing query functions from Stories 1-1 and 1-2
- Extends query functions with getChildByPIN for PIN-specific lookup
- Reuses rate limiting from Story 1-2 for security
- Child-specific requirements: 4-digit PIN, role verification, family association

### File List

**New Files:**
1. `app/api/auth/pin-login/route.ts`
2. `app/(auth)/pin/page.tsx`

**Test Files:**
3. `tests/unit/lib/db/users.test.ts` (modify - add getChildByPIN tests)
4. `tests/unit/lib/auth/pin-login.test.ts`
5. `tests/integration/api/pin-login.test.ts`
6. `tests/e2e/auth.spec.ts` (modify - add PIN login flow for child role)

**Modified Files:**
7. `lib/db/queries/users.ts` (add getChildByPIN function)
8. `lib/auth/guards.ts` (add child role guard)
9. `_bmad-output/implementation-artifacts/sprint-status.yaml` (update story status from backlog to ready-for-dev)

**Reused Files (from Stories 1-1 and 1-2, no changes needed):**
- `lib/auth/index.ts`
- `lib/auth/session.ts`
- `lib/auth/rate-limit.ts`
- `database/schema/users.ts`
- `database/schema/families.ts`
- `database/schema/audit-logs.ts`
- `lib/db/queries/audit-logs.ts`
- `app/(auth)/layout.tsx`
- `types/user.ts`
- `types/auth.ts`

**Migration Files:**
- No new migrations needed - schema already created in Story 1-1
