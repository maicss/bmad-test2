# Story 1.2: Parent Phone Login

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 家长 (Parent),
I want 使用手机号登录账户（支持OTP验证码或密码两种方式）(login to account using phone number with either OTP or password),
so that 我可以访问Family Reward系统并管理家庭行为 (I can access the Family Reward system and manage family behavior).

## Acceptance Criteria

1. 家长可以在登录页面输入已注册的手机号（11位），选择认证方式：OTP验证码 或 密码
   - **方式 A: OTP 验证码** - 系统验证格式正确后发送OTP，验证码在60秒内到达
   - **方式 B: 密码** - 系统验证格式正确后，家长输入注册时设置的密码
2. 家长验证成功后（OTP验证通过 或 密码验证通过），系统验证用户身份并创建/刷新36小时HttpOnly Cookie会话，家长被重定向到家长Dashboard（NFR13）
3. 登录失败时（如手机号未注册、OTP错误、已过期、密码错误），系统显示友好的中文错误提示，使用Shadcn Dialog/Toast组件（AGENTS.md）
4. 系统对登录失败次数进行限制（5次失败后锁定10分钟），防止暴力破解（安全增强）
5. 登录成功后，系统返回用户信息（角色：Parent，家庭ID），并在3秒内完成会话创建（NFR3: P95）
6. 操作响应时间 < 500ms（NFR3: P95），页面加载时间 < 3秒（NFR2）
7. 操作记录到审计日志（NFR14），包含：登录时间、手机号（脱敏）、IP地址、登录状态、认证方式（OTP/密码）

## Tasks / Subtasks

- [ ] Task 1: Reuse Better-Auth configuration for login (AC: #1, #2, #5)
  - [ ] Verify `lib/auth/index.ts` has phone AND password plugins configured (from Story 1-1)
  - [ ] Verify 36-hour rolling session refresh is enabled (from Story 1-1)
  - [ ] Verify HttpOnly Cookie is configured (from Story 1-1)
  - [ ] No changes needed - reuse existing configuration
- [ ] Task 2: Implement parent login API endpoint (AC: #1, #2, #4, #5, #7)
  - [ ] Create `app/api/auth/login/route.ts` with POST endpoint
  - [ ] Validate phone number format (11 digits, starts with 1)
  - [ ] **Support two login flows with phone_hash query for security:**
    - **Flow A (OTP):** 
      - Verify user exists using `getUserByPhonePlain(phone)` (plain query for OTP)
      - Verify OTP code using Better-Auth phone plugin
      - On OTP verification: Create/refresh session
    - **Flow B (Password):** 
      - Hash input phone using `Bun.password.hash(inputPhone, 'bcrypt')`
      - Verify user exists using `getUserByPhone(inputPhone)` (hashed query for security)
      - Verify password using `Bun.password.verify(password, user.password_hash)`
      - Create/refresh session
  - [ ] **Security enhancement:**
    - Password login uses phone_hash query (hashed) for enhanced security
    - OTP login uses phone plain query (required by Better-Auth)
  - [ ] Create/refresh HttpOnly Cookie session (36-hour expiration)
  - [ ] Implement rate limiting: 5 failed attempts → lock for 10 minutes (applies to both flows)
  - [ ] Return 200 with user data (role: parent, familyId)
  - [ ] Log login events: successful/failed, auth_method (otp/password), query_type (hashed/plain)

**Implementation Example:**
```typescript
// Password login flow with phone_hash
async function loginWithPassword(phone: string, password: string) {
  // 步骤1: 哈希输入的手机号
  const phoneHash = await Bun.password.hash(phone, 'bcrypt');
  
  // 步骤2: 使用哈希查询用户（安全）
  const user = await getUserByPhone(phoneHash);
  
  if (!user) {
    return { success: false, message: '手机号未注册' };
  }
  
  // 步骤3: 验证密码
  const passwordValid = await Bun.password.verify(password, user.password_hash);
  if (!passwordValid) {
    return { success: false, message: '密码错误' };
  }
  
  // 步骤4: 创建会话
  const session = await createSession(user);
  return { success: true, user };
}
```
- [ ] Task 3: Create parent login UI page (AC: #1, #2, #3, #5)
  - [ ] Create `app/(auth)/login/page.tsx` with login form
  - [ ] Phone input field (validation: 11 digits, format checking)
  - [ ] **Authentication method selector:**
    - **Option 1: OTP 验证码** - Toggle selection, show OTP input when selected
    - **Option 2: 密码** - Toggle selection, show password field when selected
  - [ ] **OTP flow components:** OTP input field (4-6 digits, auto-focus), Send OTP button, Resend OTP countdown
  - [ ] **Password flow components:** Password input field (show/hide toggle), "忘记密码？" link (not implemented in MVP)
  - [ ] **Privacy mode (optional enhancement):** Add toggle to hide phone number during login (user preference)
  - [ ] Submit button with loading state
  - [ ] **Error handling using Shadcn Toast component** (phone not found, OTP error, password incorrect, account locked)
  - [ ] Redirect to parent dashboard on success
  - [ ] Responsive design (mobile-first, < 450px for mini-program optimization)
  - [ ] Reuse `app/(auth)/layout.tsx` from Story 1-1
- [ ] Task 4: Add audit logging for login (AC: #7)
  - [ ] Verify `lib/db/queries/audit-logs.ts` exists with `logUserAction` function (from Story 1-1)
  - [ ] Log login events: timestamp, phone (masked), IP, action_type, success/failure, **auth_method** (otp/password)
  - [ ] No new schema needed - reuse audit-logs table from Story 1-1
- [ ] Task 5: Implement rate limiting for security (AC: #4)
  - [ ] Create `lib/auth/rate-limit.ts` with in-memory rate limiter
  - [ ] Track failed login attempts by IP address
  - [ ] Implement 5 failures → 10-minute lockout
  - [ ] Return user-friendly error: "登录失败次数过多，请10分钟后再试"
- [ ] Task 6: Write BDD tests (AGENTS.md requirement: Given-When-Then)
  - [ ] **Given** 已注册家长选择OTP方式输入正确手机号 **When** 点击发送验证码 **Then** 60秒内收到验证码
  - [ ] **Given** 已注册家长选择OTP方式输入正确验证码 **When** 提交登录表单 **Then** 创建会话并重定向到Dashboard
  - [ ] **Given** 已注册家长选择密码方式输入正确密码 **When** 提交登录表单 **Then** 创建会话并重定向到Dashboard
  - [ ] **Given** 未注册手机号 **When** 尝试登录 **Then** 显示友好错误提示
  - [ ] **Given** 验证码错误 **When** 提交登录表单 **Then** 显示验证码错误提示
  - [ ] **Given** 密码错误 **When** 提交登录表单 **Then** 显示密码错误提示
  - [ ] **Given** 连续5次登录失败 **When** 尝试第6次登录 **Then** 显示锁定提示（10分钟）
  - [ ] Use Bun Test for unit tests, Playwright for E2E tests
- [ ] Task 7: Performance and compliance verification (AC: #5, #6)
  - [ ] Verify API response time < 500ms (load testing) for both flows
  - [ ] Verify page load time < 3 seconds
  - [ ] Verify phone_hash query performance (should be < 5ms with index)
  - [ ] Verify session cookie is HttpOnly and 36-hour expiration
  - [ ] Verify audit logs record auth_method (otp/password) and query_type (hashed/plain)
  - [ ] Verify rate limiting is working correctly for both flows
  - [ ] Verify password login uses phone_hash query for security

## Dev Notes

### Previous Story Intelligence (Story 1-1)

**From Story 1-1: Parent Phone Registration**

**Better-Auth Setup:**
- Better-Auth 1.4.18+ configured with phone plugin in `lib/auth/index.ts`
- 36-hour rolling session refresh enabled (NFR13)
- HttpOnly Cookie for session token storage
- No changes needed - reuse existing configuration

**Database Schema:**
- users table already created: `id`, `phone` (encrypted), `role` (enum: parent/child/admin), `password_hash`, `family_id`, `created_at`
- families table already created: `id`, `primary_parent_id`, `created_at`
- audit-logs table already created: `id`, `user_id`, `action_type`, `timestamp`, `ip_address`
- **No new schema needed for login story**

**Database Queries:**
- `lib/db/queries/users.ts`: `getUserByPhone(phone: string)` - REUSE from Story 1-1
- `lib/db/queries/users.ts`: `createUser(phone: string, role: string)` - exists but not needed for login
- `lib/db/queries/families.ts`: `createFamily(primaryParentId: string)` - exists but not needed for login
- `lib/db/queries/audit-logs.ts`: `logUserAction(userId: string, action: string)` - REUSE from Story 1-1
- **NO new query functions needed**

**File Structure:**
- `app/(auth)/layout.tsx` - Auth layout (SHARED from Story 1-1)
- `lib/auth/index.ts` - Better-Auth configuration (REUSE from Story 1-1)
- `lib/auth/session.ts` - Session management utilities (REUSE from Story 1-1)
- `lib/auth/guards.ts` - Role guards (EXTEND from Story 1-1)

**Code Patterns Established:**
- **Drizzle ORM query builder** - MUST use for all database operations (NO native SQL)
- **Bun.password.hash()** - for password hashing (not needed for login, but pattern established)
- **Bun.env** - for environment variables (NO process.env)
- **Shadcn Toast** - for error display (NO alert())
- **TypeScript strict mode** - NO `any` type, NO `@ts-ignore`
- **BDD testing** - Given-When-Then format, tests BEFORE implementation

### Architecture Patterns and Constraints

**Technical Stack:**
- Bun 1.3.x+ runtime (NO Node.js compatibility layer)
- Next.js 16.x + React 19.x
- bun:sqlite + Drizzle ORM 0.45.x+ (NO native SQL)
- Better-Auth 1.4.18+ with phone plugin
- TypeScript 5 strict mode (NO `any` type, NO `@ts-ignore`)

**Critical RED LIST Rules:**
1. **Database Operations:** MUST use Drizzle ORM query builder - NO native SQL, NO string concatenation
2. **Database Query Location:** All queries must be in `lib/db/queries/` directory, per-table files (users.ts, families.ts)
3. **Password Hashing:** MUST use `Bun.password.hash()` - NO bcrypt or other external libraries
4. **Environment Variables:** MUST use `Bun.env` - NO `process.env`
5. **Type Safety:** NO `any` type, use `unknown` + type guards if needed
6. **Error Display:** NO `alert()` - MUST use Shadcn Dialog/Toast components
7. **Testing:** MUST use Given-When-Then BDD format, tests BEFORE implementation

**Authentication Architecture (ADR-3):**
- Better-Auth 1.4.18+ with phone plugin for OTP verification
- 36-hour session rolling refresh (NFR13)
- HttpOnly Cookie for session token storage
- Session management via `lib/auth/session.ts`

**Security Requirements:**
- All data transmission over HTTPS/TLS 1.3 (NFR8)
- HttpOnly Cookie for session tokens (NFR11)
- Based on role access control (RBAC) (NFR12)
- Session management (36-hour expiration, rolling refresh) (NFR13)
- Operation log audit (record all key operations) (NFR14)
- Rate limiting for login attempts (security enhancement)

### Source Tree Components to Touch

**Files to Create:**
1. `app/api/auth/login/route.ts` - Login API endpoint
2. `app/(auth)/login/page.tsx` - Login UI page
3. `lib/auth/rate-limit.ts` - Rate limiting utility

**Files to Modify:**
1. `lib/auth/guards.ts` - Add parent role guard (extend from Story 1-1)

**Files to Reuse (from Story 1-1):**
1. `lib/auth/index.ts` - Better-Auth configuration (no changes needed)
2. `lib/auth/session.ts` - Session management utilities (no changes needed)
3. `database/schema/users.ts` - Users table (no changes needed)
4. `database/schema/families.ts` - Families table (no changes needed)
5. `database/schema/audit-logs.ts` - Audit logs table (no changes needed)
6. `lib/db/queries/users.ts` - User queries (no changes needed - use existing getUserByPhone)
7. `lib/db/queries/audit-logs.ts` - Audit log queries (no changes needed - use existing logUserAction)
8. `app/(auth)/layout.tsx` - Auth layout (no changes needed)
9. `types/user.ts` - User TypeScript types (no changes needed)
10. `types/auth.ts` - Auth DTO types (no changes needed)

**Dependencies:**
- Better-Auth (already configured in Story 1-1)
- Drizzle ORM (already configured in Story 1-1)

### Testing Standards

**BDD Testing Requirements (AGENTS.md):**

All tests MUST use Given-When-Then format with business language, NOT technical terms.

**Example Test Format:**

```typescript
// ✅ CORRECT - BDD style (Given-When-Then)
it('given 已注册家长输入正确手机号，when 点击发送验证码，then 60秒内收到验证码', async () => {
  // Given: 已注册家长输入正确手机号
  const phone = '13800000100'; // This phone is registered from Story 1-1

  // When: 点击发送验证码
  const response = await request(app)
    .post('/api/auth/login/send-otp')
    .send({ phone });

  // Then: 60秒内收到验证码
  expect(response.status).toBe(200);
  expect(response.body.message).toContain('验证码已发送');
});

// ❌ INCORRECT - Traditional unit test
it('should return 200 for valid phone', async () => {
  const response = await request(app).post('/api/auth/login/send-otp').send({ phone: '13800000100' });
  expect(response.status).toBe(200);
});
```

**Test Types:**
- **Unit Tests (Bun Test):** Test individual functions (rate limiting, OTP verification)
- **Integration Tests (Bun Test):** Test API endpoints with database
- **E2E Tests (Playwright):** Test complete login flow in browser

**Test Requirements:**
1. Write tests BEFORE implementation (TDD/BDD approach)
2. All tests must pass before marking story complete
3. Test coverage ≥ 60% for new code
4. Performance tests: API response time < 500ms (P95)

### Project Structure Notes

**Alignment with Unified Project Structure:**

The story implementation follows project structure defined in architecture.md (lines 376-756):

```
bmad-test2/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx  # NEW: Login UI
│   │   │   └── layout.tsx    # REUSE: Auth layout (from Story 1-1)
│   │   └── api/
│   │       └── auth/
│   │           └── login/
│   │               └── route.ts  # NEW: Login API
│   ├── lib/
│   │   ├── auth/
│   │   │   ├── index.ts      # REUSE: Better-Auth config (from Story 1-1)
│   │   │   ├── session.ts    # REUSE: Session utilities (from Story 1-1)
│   │   │   ├── guards.ts     # MODIFY: Add parent guard
│   │   │   └── rate-limit.ts # NEW: Rate limiting utility
│   └── types/
│       ├── user.ts        # REUSE: User types (from Story 1-1)
│       └── auth.ts        # REUSE: Auth DTO types (from Story 1-1)
└── tests/
    ├── unit/
    │   └── lib/
    │       └── auth/
    │           └── login.test.ts  # NEW: Login tests
    ├── integration/
    │   └── api/
    │       └── login.test.ts       # NEW: API integration tests
    └── e2e/
        └── auth.spec.ts            # MODIFY: Add login flow
```

**Naming Conventions:**
- Files: kebab-case (e.g., `login-page.tsx`)
- Functions: camelCase (e.g., `rateLimitLoginAttempts`)
- Components: PascalCase (e.g., `LoginForm`)
- Types: PascalCase (e.g., `LoginRequest`)

**File Length Constraint:**
- All files must be ≤ 800 lines (AGENTS.md requirement)
- If files exceed limit, split into smaller modules

**Detected Conflicts or Variances:**
None - this story builds on Story 1-1, reusing all authentication infrastructure.

### References

**Epic and Requirements:**
- [Source: _bmad-output/planning-artifacts/epics.md#L260-L274] - Epic 1: User Authentication & Family Management
- [Source: _bmad-output/planning-artifacts/prd.md#L442] - FR2: 家长可以使用手机号登录账户
- [Source: _bmad-output/planning-artifacts/prd.md#L605] - AC1: 家长可以使用手机号完成注册，验证码在60秒内到达 (registration AC applies to login)

**Previous Story Learnings:**
- [Source: _bmad-output/implementation-artifacts/1-1-parent-phone-registration.md#L74-L100] - Better-Auth Setup (phone plugin, 36-hour session, HttpOnly Cookie)
- [Source: _bmad-output/implementation-artifacts/1-1-parent-phone-registration.md#L101-L107] - Database Schema (users, families, audit-logs tables)
- [Source: _bmad-output/implementation-artifacts/1-1-parent-phone-registration.md#L108-L121] - Database Queries (getUserByPhone, createUser, createFamily, logUserAction)
- [Source: _bmad-output/implementation-artifacts/1-1-parent-phone-registration.md#L132-L172] - BDD Testing Requirements (Given-When-Then format)

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
- [Source: _bmad-output/planning-artifacts/prd.md#L547] - NFR11: 会话令牌使用 HttpOnly Cookie
- [Source: _bmad-output/planning-artifacts/prd.md#L548] - NFR12: 基于角色的权限控制（RBAC）
- [Source: _bmad-output/planning-artifacts/prd.md#L549] - NFR13: 会话管理（36小时过期，滚动刷新）
- [Source: _bmad-output/planning-artifacts/prd.md#L551] - NFR14: 操作日志审计（记录所有关键操作）

**Performance Requirements:**
- [Source: _bmad-output/planning-artifacts/prd.md#L531] - NFR2: 家长端数据统计页面加载 < 3秒
- [Source: _bmad-output/planning-artifacts/prd.md#L532] - NFR3: API 响应时间 < 500ms（P95）

## Dev Agent Record

### Agent Model Used

glm-4.7

### Debug Log References

None - this is initial story creation.

### Completion Notes List

- Second story in Epic 1, reusing authentication infrastructure from Story 1-1
- All technical constraints from AGENTS.md RED LIST enforced
- Architecture alignment verified with ADR-3 (Better-Auth + phone plugin)
- BDD testing requirements specified with Given-When-Then format
- No new database schema needed - all tables created in Story 1-1
- Reuses existing query functions from Story 1-1
- Enhances security with rate limiting for login attempts

### File List

**New Files:**
1. `app/api/auth/login/route.ts`
2. `app/(auth)/login/page.tsx`
3. `lib/auth/rate-limit.ts`

**Test Files:**
4. `tests/unit/lib/auth/login.test.ts`
5. `tests/integration/api/login.test.ts`
6. `tests/e2e/auth.spec.ts` (modify existing)

**Modified Files:**
7. `lib/auth/guards.ts` (add parent role guard)
8. `_bmad-output/implementation-artifacts/sprint-status.yaml` (update story status)

**Reused Files (from Story 1-1, no changes needed):**
- `lib/auth/index.ts`
- `lib/auth/session.ts`
- `database/schema/users.ts`
- `database/schema/families.ts`
- `database/schema/audit-logs.ts`
- `lib/db/queries/users.ts`
- `lib/db/queries/audit-logs.ts`
- `app/(auth)/layout.tsx`
- `types/user.ts`
- `types/auth.ts`
