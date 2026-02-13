# Story 1.5: Add Child to Family

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 家长 (Parent),
I want 添加儿童账户到我的家庭 (add child account to my family),
so that 我的孩子可以使用PIN码登录系统并查看任务和积分 (my child can log into the system using PIN code and view tasks and points).

## Acceptance Criteria

1. 家长可以在家庭设置页面输入儿童姓名和年龄（6-12岁），系统自动生成唯一的4位PIN码（0000-9999）并创建儿童账户（FR5）
2. 系统必须验证儿童PIN码唯一性，确保与现有儿童账户PIN码不冲突，PIN码加密存储在users表的password_hash字段中（NFR9, NFR10）
3. 儿童账户创建时，role设置为'child'，并自动关联到家长的已有家庭（users.family_id = families.id），用户成为儿童角色（从Story 1-1, 1-3）
4. 系统为儿童生成PIN码后，家长可以查看PIN码，并可以选择：
   - 直接告知孩子PIN码，让孩子使用PIN码登录（从Story 1-3）
   - 家长登录后切换到儿童账户，为孩子设置PIN码（可选）
5. 儿童账户创建失败时（如姓名为空、PIN码生成冲突、家庭未找到），系统显示友好的中文错误提示，使用Shadcn Dialog/Toast组件（AGENTS.md）
6. 家长可以查看家庭中所有儿童列表，包括：儿童姓名、PIN码（可查看）、创建时间、账户状态（激活/挂起）（从Story 1-4的family管理模式）
7. 家长可以挂起/激活儿童账户，挂起后儿童无法使用PIN码登录（从Story 1-7的主要家长管理家庭成员功能）
8. 操作响应时间 < 500ms（NFR3: P95），页面加载时间 < 3秒（NFR2）
9. 操作记录到审计日志（NFR14），包含：创建儿童账户时间、家长ID（脱敏）、儿童ID、家庭ID、PIN码（脱敏）、操作类型

## Tasks / Subtasks

- [ ] Task 1: Add child creation query functions (AC: #1, #2)
  - [ ] Add `createChildAccount(name: string, age: number, familyId: string)` function to `lib/db/queries/users.ts`
  - [ ] Generate unique 4-digit PIN code (0000-9999) with conflict check
  - [ ] Query users table to ensure PIN uniqueness per child
  - [ ] **MUST USE Drizzle ORM query builder - NO native SQL**
  - [ ] **MUST use Bun.password.hash() for PIN encryption** (from Story 1-3)
  - [ ] Create user with role='child', family_id=parent's family_id
- [ ] Task 2: Implement child creation API endpoint (AC: #1, #2, #3, #4, #9)
  - [ ] Create `app/api/families/add-child/route.ts` with POST endpoint
  - [ ] Verify current user is parent (role='parent' AND belongs to valid family)
  - [ ] Validate child name (not empty, length limit) and age (6-12 years)
  - [ ] Generate unique 4-digit PIN code (ensure no conflict with existing children in family)
  - [ ] Encrypt PIN using Bun.password.hash() and store in password_hash field
  - [ ] Create child user account with role='child' and link to parent's family_id
  - [ ] Log child creation event to audit logs (timestamp, parent_id masked, child_id, family_id, PIN masked)
  - [ ] Return 200 with child data (name, PIN, familyId, role)
- [ ] Task 3: Create child management UI pages (AC: #1, #4, #6, #7)
  - [ ] Create `app/(parent)/settings/children/page.tsx` with child management interface
  - [ ] Display family children list: name, PIN (viewable), created_at, status (active/suspended)
  - [ ] "Add Child" button - opens child creation form
  - [ ] Child creation form: name input (required), age input (6-12 years, required), PIN display (auto-generated)
  - [ ] "Suspend/Activate" toggle for each child
  - [ ] **Error handling using Shadcn Toast component** (REUSE from Stories 1-1, 1-2, 1-3, 1-4)
  - [ ] Responsive design (mobile-first, < 450px for mini-program optimization)
  - [ ] Reuse `app/(parent)/layout.tsx` from Epic 1 (from Story 1-4)
- [ ] Task 4: Implement child account suspension/activation (AC: #7)
  - [ ] Add `suspendChildAccount(childId: string)` function to `lib/db/queries/users.ts`
  - [ ] Add `activateChildAccount(childId: string)` function to `lib/db/queries/users.ts`
  - [ ] Update users table status field (if exists) or use is_active boolean
  - [ ] Verify only parent can suspend/activate children in their family
  - [ ] Log suspension/activation events to audit logs
- [ ] Task 5: Reuse audit logging from Story 1-1 (AC: #9)
  - [ ] Verify `lib/db/queries/audit-logs.ts` exists with `logUserAction` function (from Story 1-1)
  - [ ] Log child creation events: timestamp, parent_id (masked), child_id, family_id, PIN (masked), action_type
  - [ ] Log child suspension/activation events: timestamp, parent_id (masked), child_id, status, action_type
  - [ ] No new schema needed - reuse audit-logs table from Story 1-1
- [ ] Task 6: Write BDD tests (AGENTS.md requirement: Given-When-Then)
  - [ ] **Given** 家长输入儿童姓名和年龄 **When** 点击添加儿童 **Then** 生成唯一PIN码并创建儿童账户
  - [ ] **Given** 家长添加儿童后 **When** 查看儿童列表 **Then** 显示儿童姓名、PIN、创建时间、状态
  - [ ] **Given** 家长挂起儿童账户 **When** 尝试使用儿童PIN登录 **Then** 显示账户已挂起提示
  - [ ] **Given** 家长激活儿童账户 **When** 使用儿童PIN登录 **Then** 成功登录并重定向到儿童Dashboard
  - [ ] **Given** 系统生成PIN码 **When** 家庭中已有相同PIN码的儿童 **Then** 自动生成新PIN码确保唯一性
  - [ ] Use Bun Test for unit tests, Playwright for E2E tests
- [ ] Task 7: Performance and compliance verification (AC: #5, #8)
  - [ ] Verify API response time < 500ms (load testing)
  - [ ] Verify page load time < 3 seconds
  - [ ] Verify PIN code is encrypted in database using Bun.password.hash()
  - [ ] Verify audit logs are recording child creation/suspension/activation events
  - [ ] Verify PIN uniqueness constraint (no duplicate PINs in same family)

## Dev Notes

### Previous Story Intelligence (Stories 1-1, 1-2, 1-3, 1-4)

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
- **Role enum exists: parent/child/admin** - MUST set role='child' for child accounts
- **No new schema needed for add child story** (users and families tables already support children)

**Database Queries:**
- `lib/db/queries/users.ts`: `getUserByPhone(phone: string)` - REUSE from Story 1-1
- `lib/db/queries/users.ts`: `createUser(phone: string, role: string)` - exists but need to extend for child creation (no phone, PIN instead)
- `lib/db/queries/audit-logs.ts`: `logUserAction(userId: string, action: string)` - REUSE from Story 1-1
- **Need to add: createChildAccount()** - uses same users table, generates PIN instead of phone

**File Structure:**
- `app/(parent)/layout.tsx` - Parent layout (SHARED from Story 1-4)
- `lib/auth/index.ts` - Better-Auth configuration (REUSE from Story 1-1)
- `lib/auth/session.ts` - Session management utilities (REUSE from Story 1-1)
- `lib/auth/guards.ts` - Role guards (EXTEND from Story 1-1 and 1-4)

**Code Patterns Established:**
- **Drizzle ORM query builder** - MUST use for all database operations (NO native SQL)
- **Bun.password.hash()** - for password hashing (reuse for PIN hashing)
- **Bun.env** - for environment variables (NO process.env)
- **Shadcn Toast** - for error display (NO alert())
- **TypeScript strict mode** - NO `any` type, NO `@ts-ignore`
- **BDD testing** - Given-When-Then format, tests BEFORE implementation

**From Story 1-2: Parent Phone Login**

**Login Flow Patterns:**
- API route: `app/api/auth/login/route.ts` - similar pattern for `app/api/families/add-child/route.ts`
- Session creation/refresh after authentication - REUSE from Story 1-2
- Rate limiting implementation in `lib/auth/rate-limit.ts` - can reuse for child creation rate limiting
- Error handling with Shadcn Toast - REUSE from Story 1-2

**Session Management:**
- Create/refresh HttpOnly Cookie (36-hour expiration) - REUSE for child login (from Story 1-3)

**From Story 1-3: Child PIN Login**

**PIN Authentication:**
- PIN code: 4-digit numeric code (0000-9999)
- PIN encryption: Use `Bun.password.hash()` for PIN storage in password_hash field
- PIN verification: Use `Bun.password.verify()` to compare input PIN with stored hash
- Role verification: Ensure user.role === 'child' during login
- Family association: Verify child belongs to family (family_id is not null)

**PIN Generation:**
- Generate random 4-digit PIN (0000-9999)
- PIN must be unique per child in family
- Format validation: 4 digits, numeric only

**Database Queries:**
- `lib/db/queries/users.ts`: `getChildByPIN(pin: string)` - exists from Story 1-3
- **Need to add: generateUniquePIN(familyId: string)** - ensures PIN uniqueness in family

**UI Patterns:**
- PIN input with 4-digit format validation - REUSE pattern from Story 1-3
- Loading states, error display - REUSE from Story 1-3

**From Story 1-4: Invite Other Parent**

**Family Management Patterns:**
- Primary parent identification: users.id === families.primary_parent_id
- Family linkage: users.family_id = families.id for all family members
- Parent permission check: Only primary parent can send invitations (similar pattern for child management)
- Family members listing: Display list with roles and status

**Family UI Patterns:**
- Family management interface: `app/(parent)/settings/family/page.tsx` - similar pattern for child management
- Member list display: name, role, status, actions
- "Invite Parent" button pattern - similar pattern for "Add Child" button

**Invitation Token Mechanism:**
- UUID + timestamp for uniqueness - similar pattern could be used for child invitation (optional)
- Not needed for direct child creation by parent

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
3. **Password/PIN Hashing:** MUST use `Bun.password.hash()` - NO bcrypt or other external libraries
4. **PIN Verification:** MUST use `Bun.password.verify()` for PIN verification
5. **Environment Variables:** MUST use `Bun.env` - NO `process.env`
6. **Type Safety:** NO `any` type, use `unknown` + type guards if needed
7. **Error Display:** NO `alert()` - MUST use Shadcn Dialog/Toast components
8. **Testing:** MUST use Given-When-Then BDD format, tests BEFORE implementation

**Authentication Architecture (ADR-3):**
- Better-Auth 1.4.18+ with phone plugin for parents, PIN login for children
- 36-hour session rolling refresh (NFR13) - SAME for parents and children
- HttpOnly Cookie for session token storage
- Session management via `lib/auth/session.ts`
- Role-based access: Parent uses phone+OTP, Child uses PIN

**Family Management Architecture:**
- Primary parent creates family (Story 1-1)
- Secondary parents can be added to existing families (Story 1-4)
- Children can be added to existing families (this story)
- Role enum: parent (primary and secondary), child, admin
- Family linkage: users.family_id = families.id for all family members
- Primary parent identification: families.primary_parent_id = users.id
- Child permission: Any parent (primary or secondary) can add children to their family

**Security Requirements:**
- PIN code encryption required (NFR9) - use Bun.password.hash()
- PIN hashing using bcrypt algorithm (NFR10) - but MUST use Bun.password.hash()
- All data transmission over HTTPS/TLS 1.3 (NFR8)
- HttpOnly Cookie for session tokens (NFR11)
- Based on role access control (RBAC) (NFR12) - verify role='child', role='parent'
- Session management (36-hour expiration, rolling refresh) (NFR13)
- Operation log audit (record all key operations) (NFR14)

**Child Account Creation Requirements:**
- Child creation: Parent adds child name, age, system generates PIN
- PIN generation: Random 4-digit code (0000-9999), unique per family
- PIN security: PIN encrypted with Bun.password.hash() and stored in password_hash
- Family linkage: Child automatically links to parent's existing family_id
- Role assignment: Child gets role='child'
- Session creation: Child can use PIN to login (from Story 1-3)
- Account management: Parent can suspend/activate child accounts

### Source Tree Components to Touch

**Files to Create:**
1. `app/api/families/add-child/route.ts` - Child creation API endpoint
2. `app/(parent)/settings/children/page.tsx` - Child management UI page

**Files to Modify:**
1. `lib/db/queries/users.ts` - Add createChildAccount(), suspendChildAccount(), activateChildAccount() functions
2. `lib/auth/guards.ts` - Add parent permission guard (already exists from Story 1-4, may need child suspension permission)

**Files to Reuse (from Stories 1-1, 1-2, 1-3, 1-4):**
1. `lib/auth/index.ts` - Better-Auth configuration (no changes needed)
2. `lib/auth/session.ts` - Session management utilities (no changes needed)
3. `database/schema/users.ts` - Users table (no changes needed - already has role enum and family_id)
4. `database/schema/families.ts` - Families table (no changes needed)
5. `database/schema/audit-logs.ts` - Audit logs table (no changes needed)
6. `lib/db/queries/users.ts` - User queries (ADD child management functions, reuse existing patterns)
7. `lib/db/queries/families.ts` - Family queries (no changes needed - can reuse from Story 1-4)
8. `lib/db/queries/audit-logs.ts` - Audit log queries (no changes needed - use existing logUserAction)
9. `lib/auth/rate-limit.ts` - Rate limiting utility (no changes needed - can reuse from Story 1-2)
10. `app/(parent)/layout.tsx` - Parent navigation (no changes needed - from Story 1-4)
11. `app/(parent)/settings/family/page.tsx` - Family management (can reference pattern for child management)
12. `types/user.ts` - User TypeScript types (no changes needed)
13. `types/auth.ts` - Auth DTO types (no changes needed)

**Dependencies:**
- Better-Auth (already configured in Story 1-1)
- Drizzle ORM (already configured in Story 1-1)

### Testing Standards

**BDD Testing Requirements (AGENTS.md):**

All tests MUST use Given-When-Then format with business language, NOT technical terms.

**Example Test Format:**

```typescript
// ✅ CORRECT - BDD style (Given-When-Then)
it('given 家长输入儿童姓名和年龄，when 点击添加儿童，then 生成唯一PIN码并创建儿童账户', async () => {
  // Given: 家长输入儿童姓名和年龄
  const parentPhone = '13800000100'; // Primary parent from Story 1-1
  const childName = '张小宝';
  const childAge = 9;

  // When: 点击添加儿童
  const response = await request(app)
    .post('/api/families/add-child')
    .set('Cookie', parentSession) // Login session from Story 1-2
    .send({ name: childName, age: childAge });

  // Then: 生成唯一PIN码并创建儿童账户
  expect(response.status).toBe(200);
  expect(response.body.child.name).toBe(childName);
  expect(response.body.child.role).toBe('child');
  expect(response.body.child.pin).toMatch(/^\d{4}$/); // 4-digit PIN
  expect(response.body.child.familyId).toBe(parentFamilyId); // Same family as parent
  // Verify child created in database
  // Verify PIN is encrypted in database
});

// ❌ INCORRECT - Traditional unit test
it('should create child and generate PIN', async () => {
  const response = await request(app).post('/api/families/add-child').send({ name: 'Test', age: 9 });
  expect(response.status).toBe(200);
});
```

**Test Types:**
- **Unit Tests (Bun Test):** Test individual functions (createChildAccount, generateUniquePIN, PIN encryption)
- **Integration Tests (Bun Test):** Test API endpoints with database
- **E2E Tests (Playwright):** Test complete child creation flow in browser (parent role)

**Test Requirements:**
1. Write tests BEFORE implementation (TDD/BDD approach)
2. All tests must pass before marking story complete
3. Test coverage ≥ 60% for new code
4. Performance tests: API response time < 500ms (P95)
5. Child-specific tests: verify role='child', family_id assignment, PIN uniqueness, PIN encryption

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
│   │   ├── (parent)/
│   │   │   ├── layout.tsx         # REUSE: Parent navigation (from Story 1-4)
│   │   │   └── settings/
│   │   │       ├── family/
│   │   │       │   └── page.tsx    # REUSE: Family management (from Story 1-4)
│   │   │       └── children/
│   │   │           └── page.tsx     # NEW: Child management UI
│   │   └── api/
│   │       ├── families/
│   │       │   ├── add-child/
│   │       │   │   └── route.ts   # NEW: Child creation API
│   │       │   ├── invite-parent/  # REUSE: Invitation API (from Story 1-4)
│   │       │   └── suspend-child/  # NEW: Child suspension API (optional in same file)
│   │       └── auth/
│   │           ├── register/        # REUSE: Registration API (from Story 1-1)
│   │           ├── login/           # REUSE: Parent login API (from Story 1-2)
│   │           ├── pin-login/       # REUSE: PIN login API (from Story 1-3)
│   │           └── accept-invitation/ # REUSE: Invitation acceptance API (from Story 1-4)
│   ├── lib/
│   │   ├── auth/
│   │   │   ├── index.ts           # REUSE: Better-Auth config (from Story 1-1)
│   │   │   ├── session.ts         # REUSE: Session utilities (from Story 1-1)
│   │   │   ├── guards.ts          # MODIFY: Add child management permission
│   │   │   └── rate-limit.ts      # REUSE: Rate limiting (from Story 1-2)
│   │   └── db/
│   │       └── queries/
│   │           ├── users.ts         # MODIFY: Add child management functions
│   │           ├── families.ts      # REUSE: Family queries (from Story 1-4)
│   │           ├── invitations.ts   # REUSE: Invitation queries (from Story 1-4)
│   │           └── audit-logs.ts   # REUSE: Audit log queries (from Story 1-1)
│   └── types/
│       ├── user.ts                # REUSE: User types (from Story 1-1)
│       ├── auth.ts                # REUSE: Auth DTO types (from Story 1-1)
│       └── invitation.ts          # REUSE: Invitation types (from Story 1-4)
└── tests/
    ├── unit/
    │   └── lib/
    │       └── db/
    │           └── users.test.ts    # MODIFY: Add child management tests
    ├── integration/
    │   └── api/
    │       └── add-child.test.ts   # NEW: Child creation API tests
    └── e2e/
        └── child-management.spec.ts  # NEW: Complete child management flow
```

**Naming Conventions:**
- Files: kebab-case (e.g., `child-management-page.tsx`)
- Functions: camelCase (e.g., `createChildAccount`, `generateUniquePIN`)
- Components: PascalCase (e.g., `ChildForm`, `ChildrenList`)
- Types: PascalCase (e.g., `Child`, `CreateChildRequest`)

**File Length Constraint:**
- All files must be ≤ 800 lines (AGENTS.md requirement)
- If files exceed limit, split into smaller modules

**Detected Conflicts or Variances:**
None - this story builds on Stories 1-1, 1-2, 1-3, 1-4, reusing all authentication and family management infrastructure.

### References

**Epic and Requirements:**
- [Source: _bmad-output/planning-artifacts/epics.md#L260-L274] - Epic 1: User Authentication & Family Management
- [Source: _bmad-output/planning-artifacts/prd.md#L446] - FR5: 家长可以添加儿童到家庭
- [Source: _bmad-output/planning-artifacts/prd.md#L608] - AC4: 家庭角色变更（主要/次要家长转移）需要双方确认 (family role changes require confirmation - similar pattern for child account creation)

**Previous Story Learnings:**
- [Source: _bmad-output/implementation-artifacts/1-1-parent-phone-registration.md#L74-L100] - Better-Auth Setup (phone plugin, 36-hour session, HttpOnly Cookie)
- [Source: _bmad-output/implementation-artifacts/1-1-parent-phone-registration.md#L101-L107] - Database Schema (users, families, audit-logs tables, role enum)
- [Source: _bmad-output/implementation-artifacts/1-1-parent-phone-registration.md#L108-L121] - Database Queries (getUserByPhone, createUser, logUserAction)
- [Source: _bmad-output/implementation-artifacts/1-2-parent-phone-login.md#L73-L109] - Session Management and Rate Limiting
- [Source: _bmad-output/implementation-artifacts/1-3-child-pin-login.md#L76-L135] - PIN Authentication (4-digit PIN, Bun.password.hash(), role verification)
- [Source: _bmad-output/implementation-artifacts/1-3-child-pin-login.md#L136-L179] - Child-Specific Requirements (PIN generation, family association, role='child')
- [Source: _bmad-output/implementation-artifacts/1-4-invite-other-parent.md#L94-L131] - Family Management Patterns (family linkage, primary parent identification, member listing)

**Architecture Decisions:**
- [Source: _bmad-output/planning-artifacts/architecture.md#L228-L247] - ADR-3: 认证与会话管理架构 (Better-Auth + phone plugin + PIN login)
- [Source: _bmad-output/planning-artifacts/architecture.md#L376-L756] - Complete Project Structure
- [Source: _bmad-output/planning-artifacts/architecture.md#L408-L431] - Database schema directory structure
- [Source: _bmad-output/planning-artifacts/architecture.md#L584-L597] - Database queries: lib/db/queries/ per-table files
- [Source: _bmad-output/planning-artifacts/architecture.md#L599-L602] - Auth configuration: lib/auth/index.ts

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
- [Source: _bmad-output/planning-artifacts/prd.md#L531] - NFR2: 家长端数据统计页面加载 < 3秒
- [Source: _bmad-output/planning-artifacts/prd.md#L532] - NFR3: API 响应时间 < 500ms（P95）

**Test Data (from AGENTS.md):**
- Primary Parent User: Zhang 1, Phone: 13800000100, Password: 1111
- Secondary Parent User: Zhang 2, Phone: 13800000200
- Child User: Zhang 3, PIN: 1111 (from Story 1-3)
- Reference: AGENTS.md testing data section

## Dev Agent Record

### Agent Model Used

glm-4.7

### Debug Log References

None - this is initial story creation.

### Completion Notes List

- Fifth story in Epic 1, extending family management capabilities from Stories 1-1, 1-2, 1-3, 1-4
- All technical constraints from AGENTS.md RED LIST enforced
- Architecture alignment verified with ADR-3 (Better-Auth + phone plugin + PIN login)
- BDD testing requirements specified with Given-When-Then format
- No new database schema needed - all tables created in Story 1-1 (users table with role enum, families table)
- Reuses authentication infrastructure from Stories 1-1, 1-2, 1-3
- Reuses family management patterns from Story 1-4
- Key innovation: Direct child creation by parent, automatic PIN generation, family linkage
- Permission check: Any parent (primary or secondary) can add children to their family
- Child account management: Parent can suspend/activate child accounts

### File List

**New Files:**
1. `app/api/families/add-child/route.ts`
2. `app/(parent)/settings/children/page.tsx`

**Test Files:**
3. `tests/unit/lib/db/users.test.ts` (modify - add child management tests)
4. `tests/integration/api/add-child.test.ts`
5. `tests/e2e/child-management.spec.ts`

**Modified Files:**
6. `lib/db/queries/users.ts` (add createChildAccount, suspendChildAccount, activateChildAccount functions)
7. `lib/auth/guards.ts` (add child management permission)
8. `_bmad-output/implementation-artifacts/sprint-status.yaml` (update story status from backlog to ready-for-dev)

**Reused Files (from Stories 1-1, 1-2, 1-3, 1-4, no changes needed):**
- `lib/auth/index.ts`
- `lib/auth/session.ts`
- `lib/auth/rate-limit.ts`
- `database/schema/users.ts`
- `database/schema/families.ts`
- `database/schema/audit-logs.ts`
- `lib/db/queries/families.ts`
- `lib/db/queries/audit-logs.ts`
- `app/(parent)/layout.tsx`
- `app/(parent)/settings/family/page.tsx`
- `types/user.ts`
- `types/auth.ts`

**Migration Files:**
- No new migrations needed - schema already created in Story 1-1
