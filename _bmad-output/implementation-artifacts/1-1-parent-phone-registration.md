# Story 1.1: Parent Phone Registration

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 家长 (Parent),
I want 使用手机号注册账户（支持OTP验证码或密码两种方式）(register account using phone number with either OTP or password),
so that 我可以登录Family Reward系统并开始管理家庭行为 (I can log into the Family Reward system and start managing family behavior).

## Acceptance Criteria

1. 家长可以在注册页面输入中国手机号（11位），选择认证方式：OTP验证码 或 密码
   - **方式 A: OTP 验证码** - 系统验证格式正确后发送OTP，验证码在60秒内到达
   - **方式 B: 密码** - 系统验证格式正确后，家长设置密码（8-20位），密码必须加密存储
2. 家长验证成功后（OTP验证通过 或 密码设置完成），系统创建用户账户，默认角色为Parent，并自动创建一个新家庭记录，该家长被设为主要家长（Primary Parent）
3. 注册成功后，系统自动创建36小时HttpOnly Cookie会话，家长被重定向到家长Dashboard（NFR13）
4. 系统存储手机号和密码时必须**双重存储**（NFR9）：
   - `phone` 字段：明文存储（用于发送OTP短信）
   - `phone_hash` 字段：哈希存储（用于登录查询），使用Bun.password.hash(phone, 'bcrypt')
   - `password_hash` 字段：密码哈希存储，使用Bun.password.hash(password, 'bcrypt')（NFR10）
5. 注册失败时（如手机号已存在、OTP错误、密码强度不足），系统显示友好的中文错误提示，使用Shadcn Dialog/Toast组件（AGENTS.md）
6. 操作响应时间 < 500ms（NFR3: P95），页面加载时间 < 3秒（NFR2）
7. 操作记录到审计日志（NFR14），包含：注册时间、手机号（脱敏）、IP地址、认证方式（OTP/密码）

## Tasks / Subtasks

- [ ] Task 1: Configure Better-Auth with phone AND password plugins (AC: #1, #2, #3)
  - [ ] Create `lib/auth/index.ts` with Better-Auth 1.4.18+ configuration
  - [ ] Enable **phone plugin** for OTP verification
  - [ ] Enable **password plugin** for password-based registration
  - [ ] Configure 36-hour rolling session refresh (NFR13)
  - [ ] Set up HttpOnly Cookie for session management
- [ ] Task 2: Create users and families database schema (AC: #2, #4)
  - [ ] Create `database/schema/users.ts` with fields: 
    - id: string
    - phone: string (明文存储，用于发送OTP短信）
    - phone_hash: string (哈希存储，用于登录查询，使用Bun.password.hash(phone, 'bcrypt'))
    - role: (enum: parent/child/admin)
    - password_hash: string (密码哈希，使用Bun.password.hash(password, 'bcrypt'))
    - family_id: string (foreign key)
    - created_at: timestamp
  - [ ] Create `database/schema/families.ts` with fields: id, primary_parent_id, created_at
  - [ ] Add foreign key: users.family_id → families.id
  - [ ] Create index on phone_hash field for query performance
  - [ ] Generate Drizzle migration: `bun drizzle-kit generate`
- [ ] Task 3: Create database query functions (AC: #2, #4)
  - [ ] Create `lib/db/queries/users.ts` with functions:
    - `getUserByPhone(phone: string)` - 使用 phone_hash 查询（哈希输入的手机号）
    - `getUserByPhonePlain(phone: string)` - 使用 phone 明文查询（用于发送OTP短信场景）
    - `createUser(phone: string, role: string, password?: string)` - 创建时同时设置 phone 和 phone_hash
  - [ ] Create `lib/db/queries/families.ts` with function: `createFamily(primaryParentId: string)`
  - [ ] **MUST USE Drizzle ORM query builder - NO native SQL**
  - [ ] **MUST use Bun.password.hash() for both phone and password hashing**

**Implementation Example:**
```typescript
// lib/db/queries/users.ts
export async function getUserByPhone(phone: string) {
  const phoneHash = await Bun.password.hash(phone, 'bcrypt');
  return await db.query.users.findFirst({
    where: eq(users.phone_hash, phoneHash)
  });
}

export async function getUserByPhonePlain(phone: string) {
  return await db.query.users.findFirst({
    where: eq(users.phone, phone) // 明文查询，用于OTP场景
  });
}

export async function createUser(phone: string, role: string, password?: string) {
  const phoneHash = await Bun.password.hash(phone, 'bcrypt');
  const passwordHash = password ? await Bun.password.hash(password, 'bcrypt') : null;
  
  return await db.insert(users).values({
    phone,           // 明文存储
    phone_hash: phoneHash,  // 哈希存储
    role,
    password_hash: passwordHash,
    created_at: new Date()
  });
}
```
- [ ] Task 4: Implement parent registration API endpoint (AC: #1, #2, #3, #4, #6)
  - [ ] Create `app/api/auth/register/route.ts` with POST endpoint
  - [ ] Validate phone number format (11 digits, starts with 1)
  - [ ] **Support two registration flows:**
    - **Flow A (OTP):** Send OTP verification code (Better-Auth phone plugin), On OTP verification: 
      - Hash phone using Bun.password.hash(phone, 'bcrypt')
      - Create user with phone (plain) AND phone_hash (hashed), create family, set primary_parent_id
    - **Flow B (Password):** Validate password strength (8-20 chars), Hash password using Bun.password.hash(password, 'bcrypt'), 
      - Hash phone using Bun.password.hash(phone, 'bcrypt')
      - Create user with phone (plain), phone_hash (hashed), password_hash (hashed), create family, set primary_parent_id
  - [ ] **Double storage:**
    - Store phone in plain text for SMS sending
    - Store phone_hash in hashed format for login queries
    - Store password_hash if password provided
  - [ ] Create HttpOnly Cookie session (36-hour expiration)
  - [ ] Return 200 with user data (excluding sensitive info)
  - [ ] Log registration method (OTP or password) and storage approach to audit logs
- [ ] Task 5: Create parent registration UI page (AC: #1, #3, #5)
  - [ ] Create `app/(auth)/register/page.tsx` with registration form
  - [ ] Phone input field (validation: 11 digits, format checking)
  - [ ] **Authentication method selector:**
    - **Option 1: OTP 验证码** - Toggle selection, show OTP input when selected
    - **Option 2: 密码** - Toggle selection, show password fields when selected
  - [ ] **OTP flow components:** OTP input field (4-6 digits, auto-focus), Send OTP button
  - [ ] **Password flow components:**
    - Password input field (8-20 chars, show/hide toggle, validation: 1 uppercase, 1 number)
    - Confirm password input field (must match)
    - Password strength indicator (weak/medium/strong)
  - [ ] Submit button with loading state
  - [ ] **Error handling using Shadcn Toast component** (phone exists, OTP error, password mismatch, weak password)
  - [ ] Redirect to parent dashboard on success
  - [ ] Responsive design (mobile-first, < 450px for mini-program optimization)
- [ ] Task 6: Implement audit logging (AC: #7)
  - [ ] Create `lib/db/queries/audit-logs.ts` with function: `logUserAction(userId: string, action: string, metadata?: object)`
  - [ ] Log registration event: timestamp, phone (masked), IP, action_type, **auth_method** (otp/password)
  - [ ] Store in `database/schema/audit-logs.ts` table
- [ ] Task 7: Write BDD tests (AGENTS.md requirement: Given-When-Then)
  - [ ] **Given** 家长选择OTP方式输入正确手机号 **When** 点击发送验证码 **Then** 60秒内收到验证码
  - [ ] **Given** 家长选择OTP方式输入正确验证码 **When** 提交注册表单 **Then** 创建用户账户和家庭记录
  - [ ] **Given** 家长选择密码方式输入手机号和强密码 **When** 提交注册表单 **Then** 创建用户账户和家庭记录
  - [ ] **Given** 密码强度不足 **When** 提交注册表单 **Then** 显示密码强度提示
  - [ ] **Given** 两次密码输入不一致 **When** 提交注册表单 **Then** 显示密码不匹配错误
  - [ ] **Given** 手机号已存在 **When** 尝试注册 **Then** 显示友好错误提示
  - [ ] **Given** 验证码错误 **When** 提交注册表单 **Then** 显示验证码错误提示
  - [ ] Use Bun Test for unit tests, Playwright for E2E tests
- [ ] Task 8: Performance and compliance verification (AC: #4, #6)
  - [ ] Verify API response time < 500ms (load testing)
  - [ ] Verify page load time < 3 seconds
  - [ ] Verify double storage:
    - Phone stored in plain text (for SMS)
    - Phone_hash stored in hashed format (for login queries)
  - [ ] Verify password is encrypted in database using Bun.password.hash()
  - [ ] Verify phone_hash query works correctly (hash input phone before querying)
  - [ ] Verify session cookie is HttpOnly and 36-hour expiration
  - [ ] Verify audit logs record auth_method (otp/password) and storage approach

## Dev Notes

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
- Phone number encryption required (NFR9) - use Bun.password.hash()
- Password hashing using bcrypt algorithm (NFR10) - but MUST use Bun.password.hash()
- All data transmission over HTTPS/TLS 1.3 (NFR8)
- HttpOnly Cookie for session tokens (NFR11)

### Source Tree Components to Touch

**Files to Create:**
1. `lib/auth/index.ts` - Better-Auth configuration with phone plugin
2. `lib/auth/session.ts` - Session management utilities
3. `database/schema/users.ts` - Users table schema (id, phone, role, password_hash, family_id, created_at)
4. `database/schema/families.ts` - Families table schema (id, primary_parent_id, created_at)
5. `database/schema/audit-logs.ts` - Audit logs schema (id, user_id, action_type, timestamp, ip_address)
6. `lib/db/queries/users.ts` - User queries: getUserByPhone, createUser
7. `lib/db/queries/families.ts` - Family queries: createFamily
8. `lib/db/queries/audit-logs.ts` - Audit log queries: logUserAction
9. `app/api/auth/register/route.ts` - Registration API endpoint
10. `app/(auth)/register/page.tsx` - Registration UI page
11. `app/(auth)/layout.tsx` - Auth layout (shared with login)
12. `types/user.ts` - User TypeScript types
13. `types/auth.ts` - Auth DTO types

**Files to Modify:**
1. `database/migrations/` - Run `bun drizzle-kit generate` to create migration
2. `lib/auth/guards.ts` - Add role guard for parent access

**Dependencies:**
- Better-Auth (already in package.json)
- Drizzle ORM (already in package.json)

### Testing Standards

**BDD Testing Requirements (AGENTS.md):**

All tests MUST use Given-When-Then format with business language, NOT technical terms.

**Example Test Format:**

```typescript
// ✅ CORRECT - BDD style (Given-When-Then)
it('given 家长输入手机号，when 点击发送验证码，then 60秒内收到验证码', async () => {
  // Given: 家长输入手机号
  const phone = '13800000100';

  // When: 点击发送验证码
  const response = await request(app)
    .post('/api/auth/send-otp')
    .send({ phone });

  // Then: 60秒内收到验证码
  expect(response.status).toBe(200);
  expect(response.body.message).toContain('验证码已发送');
  // Verify OTP was stored in database
});

// ❌ INCORRECT - Traditional unit test
it('should return 200 for valid phone', async () => {
  const response = await request(app).post('/api/auth/send-otp').send({ phone: '13800000100' });
  expect(response.status).toBe(200);
});
```

**Test Types:**
- **Unit Tests (Bun Test):** Test individual functions (getUserByPhone, createUser, etc.)
- **Integration Tests (Bun Test):** Test API endpoints with database
- **E2E Tests (Playwright):** Test complete registration flow in browser

**Test Requirements:**
1. Write tests BEFORE implementation (TDD/BDD approach)
2. All tests must pass before marking story complete
3. Test coverage ≥ 60% for new code
4. Performance tests: API response time < 500ms (P95)

### Project Structure Notes

**Alignment with Unified Project Structure:**

The story implementation follows the project structure defined in architecture.md (lines 376-756):

```
bmad-test2/
├── database/
│   ├── schema/
│   │   ├── users.ts          # NEW: Users table
│   │   ├── families.ts       # NEW: Families table
│   │   └── audit-logs.ts      # NEW: Audit logs
│   └── migrations/           # NEW: Migration file
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── register/
│   │   │   │   └── page.tsx  # NEW: Registration UI
│   │   │   └── layout.tsx    # NEW: Auth layout
│   │   └── api/
│   │       └── auth/
│   │           └── register/
│   │               └── route.ts  # NEW: Registration API
│   ├── lib/
│   │   ├── auth/
│   │   │   ├── index.ts      # NEW: Better-Auth config
│   │   │   ├── session.ts    # NEW: Session utilities
│   │   │   └── guards.ts     # MODIFY: Add parent guard
│   │   └── db/
│   │       └── queries/
│   │           ├── users.ts      # NEW: User queries
│   │           ├── families.ts   # NEW: Family queries
│   │           └── audit-logs.ts # NEW: Audit log queries
│   └── types/
│       ├── user.ts        # NEW: User types
│       └── auth.ts        # NEW: Auth DTO types
└── tests/
    ├── unit/
    │   └── lib/
    │       ├── db/
    │       │   └── users.test.ts  # NEW: User query tests
    │       └── auth/
    │           └── register.test.ts  # NEW: Auth tests
    ├── integration/
    │   └── api/
    │       └── register.test.ts    # NEW: API integration tests
    └── e2e/
        └── auth.spec.ts             # MODIFY: Add registration flow
```

**Naming Conventions:**
- Files: kebab-case (e.g., `register-page.tsx`)
- Functions: camelCase (e.g., `getUserByPhone`)
- Components: PascalCase (e.g., `RegisterForm`)
- Types: PascalCase (e.g., `User`, `RegisterRequest`)

**File Length Constraint:**
- All files must be ≤ 800 lines (AGENTS.md requirement)
- If files exceed limit, split into smaller modules

**Detected Conflicts or Variances:**
None - this is the first story in Epic 1, establishing the authentication foundation for the project.

### References

**Epic and Requirements:**
- [Source: _bmad-output/planning-artifacts/epics.md#L260-L274] - Epic 1: User Authentication & Family Management
- [Source: _bmad-output/planning-artifacts/prd.md#L442] - FR1: 家长可以使用手机号注册账户
- [Source: _bmad-output/planning-artifacts/prd.md#L605] - AC1: 家长可以使用手机号完成注册，验证码在60秒内到达

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

## Dev Agent Record

### Agent Model Used

glm-4.7

### Debug Log References

None - this is the initial story creation.

### Completion Notes List

- First story in Epic 1 establishing authentication foundation
- All technical constraints from AGENTS.md RED LIST enforced
- Architecture alignment verified with ADR-3 (Better-Auth + phone plugin)
- BDD testing requirements specified with Given-When-Then format

### File List

**New Files:**
1. `database/schema/users.ts`
2. `database/schema/families.ts`
3. `database/schema/audit-logs.ts`
4. `database/migrations/0001_initial_auth_schema.sql` (auto-generated)
5. `lib/auth/index.ts`
6. `lib/auth/session.ts`
7. `lib/db/queries/users.ts`
8. `lib/db/queries/families.ts`
9. `lib/db/queries/audit-logs.ts`
10. `app/api/auth/register/route.ts`
11. `app/(auth)/register/page.tsx`
12. `app/(auth)/layout.tsx`
13. `types/user.ts`
14. `types/auth.ts`

**Test Files:**
15. `tests/unit/lib/db/users.test.ts`
16. `tests/unit/lib/auth/register.test.ts`
17. `tests/integration/api/register.test.ts`
18. `tests/e2e/auth.spec.ts` (modify existing)

**Modified Files:**
- `lib/auth/guards.ts` (add parent role guard)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (update story status)

**Migration Files:**
- Auto-generated by `bun drizzle-kit generate` after schema creation
