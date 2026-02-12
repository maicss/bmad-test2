---
project_name: 'bmad-test2'
user_name: 'boss'
date: '2026-02-12T08:52:00Z'
sections_completed: ['technology_stack', 'critical_implementation_rules', 'language_specific_rules', 'bun_testing_rules']
existing_patterns_found: 20
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

### Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| Bun | 1.3.x+ | Runtime, package manager, test runner |
| Next.js | 16.1.6 | Frontend framework (PWA Web App + Mini-program support) |
| React | 19.2.3 | UI library |
| Drizzle ORM | 0.45.1+ | Database ORM (SQLite) |
| Better-Auth | 1.4.18+ | Authentication |
| Tailwind CSS | 4 | Styling |
| Shadcn UI | 3.7.0+ | UI components |
| TypeScript | 5 | Language |

### Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `zod` | 4.3.6+ | Schema validation |
| `lucide-react` | 0.563.0 | Icons |
| `sonner` | 2.0.7 | Toast notifications |
| `@playwright/test` | 1.58.0 | E2E testing |
| `drizzle-kit` | 0.31.8 | Database migrations |

### Database

- **Type**: SQLite via `bun:sqlite`
- **ORM**: Drizzle ORM
- **File**: `database/db.sql` (development, Git-tracked)
- **Migrations**: `database/migrations/`

---

## Critical Implementation Rules

### 🔴 RED LIST - ABSOLUTE PROHIBITIONS

#### Database Operations (FORCED Drizzle ORM)

❌ **NEVER use raw SQL** - Must use Drizzle ORM query builder
❌ **NEVER string-concatenate SQL** - Use Drizzle's query builder
❌ **NEVER write SQL in components/routes** - All queries MUST be in `lib/db/queries/`
❌ **NEVER use third-party database drivers** - Only `bun:sqlite` + Drizzle ORM

```typescript
// ✅ CORRECT - Use Drizzle ORM
import { db } from '@/lib/db';
import { tasks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Query
const result = await db.query.tasks.findMany({
  where: eq(tasks.familyId, familyId)
});

// Insert
await db.insert(tasks).values({ title: 'xxx', points: 10 });

// ❌ ABSOLUTELY FORBIDDEN - Raw SQL
const result = db.execute(`SELECT * FROM tasks WHERE id = ${id}`);
```

#### Runtime & Types

❌ **NEVER use `any` type** - Must use `unknown` + type guards
❌ **NEVER use `@ts-ignore` / `@ts-expect-error`** - Fix type errors
❌ **NEVER use Node.js compatibility layer** - `node-fetch`, `node-crypto`, `fs/promises`
❌ **NEVER use `process.env`** - Use `Bun.env`
❌ **NEVER use `alert()` for errors** - Must use Shadcn Dialog/Toast
❌ **NEVER add dependencies** - Without explicit confirmation

#### Bun Built-in Tools (MANDATORY)

**Detailed spec: [docs/TECH_SPEC_BUN.md](docs/TECH_SPEC_BUN.md)**

❌ **NEVER duplicate Bun's built-in tools** - MUST prioritize Bun's internal tools
❌ **NEVER manually implement file operations** - Must use `Bun.file()`, `Bun.write()`
❌ **NEVER manually implement password hashing** - Must use `Bun.password.hash()`, `Bun.password.verify()`
❌ **NEVER manually implement UUID** - Must use `Bun.randomUUIDv7()`
❌ **NEVER manually implement HTTP server** - Must use `Bun.serve()`
❌ **NEVER manually implement environment variable reading** - Must use `Bun.env`
❌ **NEVER manually implement path joining** - Must use `import.meta.dir`, `import.meta.resolve()`

```typescript
// ✅ CORRECT - Use Bun built-in tools
import { Bun } from 'bun';

// File operations
const file = Bun.file('./data.txt');
const content = await file.text();
await Bun.write('./output.txt', 'content');

// Password hashing
const hash = await Bun.password.hash('password', 'bcrypt');
const isValid = await Bun.password.verify('password', hash);

// UUID generation
const id = Bun.randomUUIDv7();

// Environment variables
const dbUrl = Bun.env.DATABASE_URL;

// ❌ FORBIDDEN - Duplicate implementation
import { readFile } from 'fs/promises';     // FORBIDDEN
import { hash, compare } from 'bcrypt';      // FORBIDDEN
import { createServer } from 'http';         // FORBIDDEN
import { v4 as uuidv4 } from 'uuid';         // FORBIDDEN - Use Bun.randomUUIDv7()
const env = process.env;                     // FORBIDDEN
```

#### BDD (Behavior-Driven Development)

**Detailed spec: [docs/TECH_SPEC_BDD.md](docs/TECH_SPEC_BDD.md)**

❌ **NEVER implement before tests** - Must write tests/spec first, then implement (Red-Green-Refactor)
❌ **NEVER use technical terms in tests** - Must use business language (Given-When-Then format)
❌ **NEVER disconnect tests from requirements** - Each test must correspond to a business scenario

```typescript
// ❌ FORBIDDEN - Traditional unit testing
it('should return 200', async () => {
  const res = await request(app).get('/api/tasks');
  expect(res.status).toBe(200);
});

// ✅ CORRECT - BDD style (Given-When-Then)
it('given 家长已登录，when 查询任务列表，then 返回该家庭的任务', async () => {
  // Given: 家长已登录且有任务
  const parent = await createParent();
  const task = await createTask({ familyId: parent.familyId });

  // When: 查询任务列表
  const res = await request(app)
    .get('/api/tasks')
    .set('Cookie', parent.session);

  // Then: 返回该家庭的任务
  expect(res.status).toBe(200);
  expect(res.body.tasks).toHaveLength(1);
  expect(res.body.tasks[0].id).toBe(task.id);
});
```

#### Git

❌ **NEVER commit `.env` files** - Sensitive config must not be in repository

---

## Code Organization & Patterns

### Directory Structure

```
bmad-test2/
├── app/                    # Next.js app directory (when created)
├── lib/
│   ├── db/
│   │   ├── index.ts        # Drizzle database instance
│   │   ├── schema.ts       # Database schema definitions
│   │   └── queries.ts      # ALL database queries (MANDATORY)
│   └── utils/              # Utility functions
├── components/             # React components (Shadcn UI)
├── types/                  # Type definitions (by module)
├── constants/              # Constants (error codes, provinces, etc.)
├── docs/                   # Technical specifications
│   ├── TECH_SPEC.md        # Technical specs index
│   ├── TECH_SPEC_BUN.md    # Bun runtime specs
│   ├── TECH_SPEC_DATABASE.md # Database specs
│   ├── TECH_SPEC_BDD.md    # BDD testing specs
│   └── ...                 # Other specs
├── database/
│   ├── db.sql             # Development database (Git-tracked)
│   └── migrations/        # SQL migrations
├── tests/
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests (BDD main force)
│   └── e2e/               # E2E tests (Playwright)
├── specs/                 # Product requirements
│   └── prd.md             # Product Requirements Document
└── AGENTS.md              # AI agent decision handbook (CRITICAL)
```

### Database Schema

**Detailed spec: [docs/TECH_SPEC_DATABASE.md](docs/TECH_SPEC_DATABASE.md)**

Tables:
- `users` - Users (parents/children)
- `families` - Families
- `task_plans` - Planned task templates
- `tasks` - Concrete task instances
- `wishlists` - Wish lists
- `date_strategies` - Date strategies for tasks
- `points_history` - Points transaction history

### Naming Conventions

- **Files**: kebab-case for components, PascalCase for type files
- **Components**: PascalCase
- **Functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Test files**: `*.test.ts` or `*.spec.ts`

### TypeScript Configuration

- **Strict mode**: Enabled
- **Target**: ES2017
- **Module resolution**: bundler
- **Path alias**: `@/*` maps to `./`
- **JSX**: react-jsx

---

## Testing Standards

### Test Structure (BDD Given-When-Then)

```typescript
describe('[Feature Name]', () => {
  it('given [precondition], when [action], then [expected result]', async () => {
    // Given: Setup initial state
    // When: Execute action
    // Then: Verify result
  });
});
```

### Test Commands

```bash
bun test tests/unit tests/integration           # Run all unit and integration tests
bun test:coverage                                # Run tests with coverage
bun test:watch                                   # Watch mode
bun test:e2e                                     # Run E2E tests (Playwright)
```

### Test Organization

- **Unit tests**: `tests/unit/` - Pure function tests
- **Integration tests**: `tests/integration/` - BDD scenarios (main focus)
- **E2E tests**: `tests/e2e/` - Playwright browser tests

---

## Language-Specific Rules

### TypeScript Configuration Requirements

- **Strict mode**: Enabled - never use `any`, use `unknown` + type guards
- **Target**: ES2017
- **Module resolution**: bundler
- **Path alias**: `@/*` maps to `./`
- **No `@ts-ignore` or `@ts-expect-error`** - Must fix type errors

### Import/Export Patterns

- Use `@/*` alias for absolute imports, avoid relative paths when possible
- Bun built-in functions use `import.meta.dir` and `import.meta.resolve()`
- Don't use Node.js style `__dirname` or `path.join`

### Error Handling Patterns

- Use `unknown` type for caught errors with type guards
- UI errors must use Shadcn Dialog/Toast (never `alert()`)
- Fix type errors, never use `@ts-ignore` or `@ts-expect-error`

### Bun Runtime API (Mandatory)

**Pure Bun Environment - No Node.js Dependencies:**

🚨 **This project runs in pure Bun environment, no Node.js runtime:**
- All code must use Bun native APIs
- Forbidden: any Node.js compatibility layers, polyfills, or Node.js-specific libraries
- `node-fetch`, `node-crypto`, `fs/promises`, `path` are all prohibited

**File Operations:**
- Use `Bun.file()`, `Bun.write()` for file operations (not `fs/promises`)
- Use `Bun.glob()` for file finding - supports wildcards, faster and more powerful
- Forbid manual recursion or using `fs.readdir()`

**Password Hashing:**
- Use `Bun.password.hash()`, `Bun.password.verify()` for hashing (not `bcrypt`)

**UUID Generation:**
- Use `Bun.randomUUIDv7()` for UUID generation (not `uuid` package)

**Environment Variables:**
- Use `Bun.env` for environment variables (not `process.env`)

**Path Operations:**
- Use `import.meta.dir`, `import.meta.resolve()` for paths (not `__dirname`, `path.join`)

```typescript
// ❌ FORBIDDEN - Node.js imports
import { readFile } from 'fs/promises';     // FORBIDDEN
import { hash, compare } from 'bcrypt';      // FORBIDDEN
import { createServer } from 'http';         // FORBIDDEN
import { v4 as uuidv4 } from 'uuid';         // FORBIDDEN - Use Bun.randomUUIDv7()
const env = process.env;                     // FORBIDDEN

// ✅ CORRECT - Bun native APIs
import { Bun } from 'bun';

const file = Bun.file('./data.txt');
const content = await file.text();
await Bun.write('./output.txt', content);

const hash = await Bun.password.hash('password', 'bcrypt');
const isValid = await Bun.password.verify('password', hash);

const id = Bun.randomUUIDv7();

const dbUrl = Bun.env.DATABASE_URL;
```

### Async/Await Usage

- Prefer async/await over Promise chains
- Handle errors properly with try/catch
- All async tests must correctly handle Promises

### Third-Party Package Installation Flow

**If a Node.js-only third-party package is detected, MUST ask user first:**

- [ ] Package necessity explanation
- [ ] Bun native alternative comparison
- [ ] Potential risk explanation
- Only install after explicit user approval

---

## Bun Testing Rules

### Test Runner

- **Use `bun test` as primary test runner**
- Forbidden: `jest`, `vitest`, `mocha`, `jasmine`, `ava` (unless special reason + approval)
- Forbidden: Node.js test tools like `mocha`, `jasmine`

### Test Assertions

- **Use Bun built-in `expect()` API**
- Forbidden: `@jest/globals` or other assertion libraries

### Test File Organization

```
tests/
├── unit/           # Pure function tests
├── integration/    # Integration tests (BDD main force)
├── e2e/           # E2E tests (Playwright)
└── fixtures/       # Shared test data and factories
```

### Parallel vs Serial Execution

**Parallel Execution Rules (Clear Boundaries):**

```typescript
// ✅ Can run in parallel - No shared state
describe.concurrent('Pure function tests', () => {
  it('given correct input, when calculate points, then return correct result', () => {
    // Pure logic, no database
  });
});

// ⚠️ Must run serial - Has shared state
describe('Database integration tests', () => {
  beforeEach(async () => {
    // Cleanup database state
    await db.delete(tasks);
    await db.delete(users);
  });

  it('given existing data, when query tasks, then return correct results', async () => {
    // Database operations, need serial execution
  });
});
```

**Parallel vs Serial Decision Tree:**
```
Test has database operations?
├─ Yes → Use serial `describe()`
│  ├─ Has shared memory state?
│  │  └─ Yes → MUST be serial
│  └─ No → Can be concurrent (needs transaction isolation)
└─ No → Use concurrent `describe.concurrent()`
```

### Test Isolation & Cleanup

**Each test must run independently:**
- Use `beforeEach` to cleanup database state
- **Bun's `beforeEach` may not run as expected in concurrent tests**
- Concurrent tests need internal cleanup per test, not relying on hooks

```typescript
// ✅ Correct - Internal cleanup for concurrent tests
describe.concurrent('Pure function tests', () => {
  it('test isolation example', () => {
    const tempData = createTempData();
    try {
      // Test logic
    } finally {
      cleanupTempData(tempData); // Internal cleanup
    }
  });
});

// ✅ Correct - Serial tests use beforeEach
describe('Database tests', () => {
  beforeEach(async () => {
    await db.transaction(async (tx) => {
      await tx.delete(tasks);
      await tx.delete(users);
    });
  });
});
```

### Mock Usage Principles (Clear Boundaries)

**Priority Order:**
1. **Integration tests** (priority) - Use real database and dependencies
2. **Spy/Stub** (second choice) - Monitor calls, don't replace behavior
3. **Mock** (last resort) - Only for:
   - External APIs (payment gateway, SMS service)
   - Network calls
   - Third-party services

**Forbidden to Mock:**
- ❌ Database queries - Use real SQLite
- ❌ Business logic - Test real code
- ❌ Better-Auth sessions - Integration tests

```typescript
// ❌ Forbidden - Mock database
vi.mock('@/lib/db', () => ({
  db: { query: { tasks: { findMany: vi.fn() } } }
}));

// ✅ Correct - Use real database + cleanup
beforeEach(async () => {
  await db.delete(tasks);
});

// ✅ Correct - Mock external API (only this scenario)
vi.mock('@/lib/payment-gateway', () => ({
  chargeCard: vi.fn(() => Promise.resolve({ success: true }))
}));
```

### Coverage Targets (Intelligent Layering)

**No more uniform 90% requirement, but intelligent layering:**

| Code Type | Coverage Requirement | Rationale |
|-----------|---------------------|-------------|
| Core business logic (points, task status) | 95%+ | High impact, high error cost |
| API endpoints | 100% | Must verify all routes |
| Utility functions (date formatting, validation) | 85%+ | Easy to test, should be high coverage |
| UI components | 60%+ | E2E covers main scenarios |
| Edge cases and error handling | Flexible | Prioritize high-impact scenarios |

**Coverage command:**
```bash
bun test:coverage --threshold=90
```

If threshold not met:
- Check if low-value edge tests
- If yes, adjust threshold rather than blindly adding tests
- Document risk acceptance decisions for uncovered areas

### Test Timeout Settings (Flexible Configuration)

**Default timeout**: 5000ms (Bun default)

**Adjustment rules:**
```typescript
// Integration tests - may need longer
it('given database query, when fetch task list, then return results', async () => {
  // Default 5000ms
}, { timeout: 10000 }); // Extend to 10s

// E2E tests - may need much longer
it('given parent logged in, when create complete task flow, then task created', async () => {
  // 15s timeout
}, { timeout: 15000 });
```

**Timeout configuration recommendations:**
| Test Type | Recommended Timeout | Rationale |
|-----------|-------------------|-------------|
| Unit tests | 5000ms (default) | Should be fast |
| Integration tests | 10000ms | Database operations + network |
| E2E tests | 15000-30000ms | Browser operations |

### Fixtures and Test Data Factories

**Must use unified fixtures:**
```
__tests__/
├── fixtures/
│   ├── users.ts          # User data factory
│   ├── tasks.ts          # Task data factory
│   ├── families.ts       # Family data factory
│   └── cleanup.ts       # Cleanup utility functions
├── unit/
└── integration/
```

**Data factory example:**
```typescript
// __tests__/fixtures/users.ts
export function createParent(overrides = {}) {
  return {
    name: 'Test Parent',
    phone: '13800000001',
    password: 'hashed_password',
    role: 'parent',
    ...overrides,
  };
}

export function createChild(overrides = {}) {
  return {
    name: 'Test Child',
    pin: 'hashed_pin',
    role: 'child',
    ...overrides,
  };
}
```

---

## Platform Detection

**Always detect platform at session start:**

```bash
# Windows
ver

# Linux/macOS
uname -s
```

| Platform | Detection | Command Style |
|----------|-----------|---------------|
| Windows | `ver` succeeds | PowerShell / CMD |
| Linux | `uname -s` = Linux | Bash |
| macOS | `uname -s` = Darwin | Bash/Zsh |

**Command selection priority:**
1. User-specified platform
2. Windows → PowerShell commands
3. Others → standard Unix commands

---

## Pre-Commit Checklist

Before submitting code:

- [ ] `bun tsc --noEmit` passes
- [ ] `bun test` passes
- [ ] New features have tests
- [ ] Database migrations created (if schema changed)
- [ ] No `any` types used
- [ ] UI errors use Shadcn components
- [ ] **File length check: All files ≤ 800 lines** - Split if too large
- [ ] **BDD compliance check**
  - Tests use Given-When-Then format
  - Business language used (no technical terms)
  - Tests/spec written before implementation

---

## Quick Reference Links

| Resource | Path | Description |
|----------|------|-------------|
| **Database file** | `database/db.sql` | Dev/prod shared (Git tracked) |
| **Database queries** | `lib/db/queries/` | All Drizzle queries (MANDATORY) |
| **Type definitions** | `types/[module].ts` | By module naming |
| **Migrations** | `database/migrations/` | SQL migrations |
| **Error codes** | `constants/error-codes.ts` | Unified error codes |
| **AGENTS.md** | `AGENTS.md` | AI agent handbook (CRITICAL) |

---

## Critical Project Context

### Product Overview

**Family Reward** is a family behavior management game platform for children. It quantifies daily behaviors through a gamified points system and wish redemption (items + interactive experiences), helping parents move from "emotional control" to "rule co-governance" and creating a transparent, fair, and safe growth environment for children.

### Key Features

- User accounts and authentication (parent/child/admin roles, multi-device login, PIN code)
- Task management system (planned tasks with schedule rules, auto-generation)
- Points reward system (good tasks earn points, bad tasks deduct points)
- Combo incentive system (linear combo, tiered combo)
- Wish redemption system (items + interactive experiences)
- Gamification (sign-in, badges, levels,道具卡, points bank)
- Multi-child management (data isolation, one-click switching)
- Family calendar and collaboration

### Database Query Pattern

**ALL database operations MUST use the query abstraction layer:**

```typescript
// lib/db/queries/tasks.ts - lib/db/queries/ is the ONLY place for database queries
import { db } from '@/lib/db';
import { tasks, users } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

// ✅ CORRECT - Encapsulate here
export async function getTasksByFamily(familyId: string) {
  return db.query.tasks.findMany({
    where: eq(tasks.familyId, familyId),
    orderBy: desc(tasks.createdAt),
  });
}
```

Then import and use in routes/components:
```typescript
import { getTasksByFamily } from '@/lib/db/queries';
const tasks = await getTasksByFamily(familyId);
```

---

## UX Design Context

### Product Vision

**Family Reward** is a family behavior management game platform for children. It quantifies daily behaviors through a gamified points system and wish redemption (items + interactive experiences), helping parents move from "emotional control" to "rule co-governance" and creating a transparent, fair, and safe growth environment for children.

### Target Users

| Role | Age | Device | Core Needs |
|-------|-------|---------|------------|
| **职场家长** | 30-45 | 小程序 | Efficient management, batch operations, data insights, flexible adjustments |
| **儿童** | 6-12 | 平板 | Clear task visibility, instant feedback, gamification elements, autonomy in wish creation |
| **次要家长** | - | 小程序/PWA | Understand current rules, simple quick confirm operations, data synchronization |
| **管理员** | - | 平板 + 小程序 + PC | Template management, family audit, global statistics, batch operations |

### Key Design Decisions

#### Decision 1: Dual-Platform Design Strategy
**Date:** 2026-02-11
**Problem:** Child端（平板）needs gamified, visual, instant feedback; Parent端（小程序）needs efficiency priority, batch operations, data analysis

**Decision:** **Hybrid Approach** - Shared core logic + Responsive breakpoint adaptation + Contextualized interface

**Rationale:**
- Balance development cost and experience optimization
- Shared core layout logic and data flow
- Responsive breakpoints: Tablet (horizontal layout) vs Mini-program (vertical optimization)
- Contextual interface: Child login → Game mode; Parent login → Management mode

**Rejected Options:**
- Complete unified design system (compromised experience)
- Complete independent design systems (too high cost)

---

#### Decision 2: First-Time Onboarding Flow
**Date:** 2026-02-11
**Problem:** Parents need to create child identity, set task types, review badge suggestions, then reference admin templates to create tasks, understand "planned task generation rules"

**Decision:** **5-Step Process with "Quick Copy"** - Required process + Optional optimization flow

**Specific Approach:**

**Required Flow (Must Complete):**
1. Create child identity (basic profile + avatar)
2. Use admin template with one-click copy trial view (recommended templates + quick preview)
3. Set task types (select from admin suggestions)
4. Review badge suggestions (system preset badges)
5. Understand basic rules (interactive demo: how cycle rules generate tasks)

**Optional Flow (Can Skip/Later):**
- Custom task type deep adjustment
- Badge modification and creation
- Advanced rule configuration (exclude dates, special rewards, etc.)

**Rationale:**
- 5-step process ensures complete guidance, users won't miss key features
- Step 2 provides "one-click copy trial view", quick value experience
- Subsequent steps can be skipped, reducing first-time use burden
- Clear labeling of "required" vs "optional" icons

---

#### Decision 3: Gamification and Educational Balance
**Date:** 2026-02-11
**Problem:** How to motivate children through gamification elements (badges, combos, levels) while not deviating from "behavior management" educational goals?

**Decision:** **Gamification Elements + Intrinsic Value Reinforcement**

**Specific Approach:**

**Each gamification element links to behavior and effort:**
- **Badges:** Include "why earned" explanation (e.g., "7 consecutive days brushing - proves you have the power of persistence")
- **Combo Interruption:** Emphasize "next restart is a new opportunity" (e.g., "Combo interruption is fine, today is a new start")
- **Progress Bar:** Display "X days away from wish (based on current speed)" (e.g., "At your speed, 5 more days to redeem Lego")
- **Levels:** Link to responsibility and growth (e.g., "You are now 'Little Helper' level because you completed tasks for 3 consecutive weeks")

**Rationale:**
- High child engagement
- Gamification serves educational value
- Reinforces the meaning of effort and progress

---

#### Decision 4: Real-Time Synchronization & Offline Experience
**Date:** 2026-02-11
**Problem:** Real-time data sync delay < 3s, while supporting offline operation queue

**Decision:**
- **Pending Approval State:** Child marks task complete, displays "awaiting parent confirmation" status, does not immediately increase points
- **Offline Queue:** IndexedDB storage, Background Sync API sync on reconnect
- **Conflict Handling:** Timestamp priority + user confirmation prompt
- **Network Status Indicator:** Top bar shows connection status (green/orange/red)

---

#### Decision 5: Secondary vs Primary Parent Permissions
**Date:** 2026-02-11
**Problem:** Distinguish permission levels for different parent roles

**Decision:** **Single Permission Difference** - Only "Manage Family Members" permission differs

**Permission Matrix:**

| Permission | Primary Parent | Secondary Parent |
|------------|----------------|------------------|
| **Manage Family Members** | ✅ Yes | ❌ No |
| Create task plans | ✅ Yes | ✅ Yes |
| Approve/reject tasks | ✅ Yes | ✅ Yes |
| Adjust points | ✅ Yes | ✅ Yes |
| View data statistics | ✅ Yes | ✅ Yes |
| Family settings | ✅ Yes | ✅ Yes |

**Rationale:**
- Simplify secondary parent experience
- Reduce learning curve
- Single clear permission boundary

---

#### Decision 6: Admin Template Publishing Flow
**Date:** 2026-02-11
**Problem:** How should admin publish templates to families?

**Decision:** **Two-Step Flow** - Draft → Publish

**Specific Approach:**
1. **Draft:** Create and edit templates, save as draft status
2. **Publish:** One-click publish template, visible to all families

**Design Considerations:**
- Draft status: Only visible in admin panel, parents cannot select
- Publish operation: Confirmation prompt "After publishing, all families will see this template"
- Published templates: Can be set as "unlisted" (not visible but data preserved), support re-publishing

**Rationale:**
- Simple and clear workflow
- Easy to manage template lifecycle
- Fast publishing process for efficiency

---

#### Decision 7: Sign-in Auto-Approval
**Date:** 2026-02-11
**Problem:** Every task requires parent approval, children feel frustrated

**Decision:** **Daily sign-in auto-approves for points**

**Rationale:**
- Sign-in is a simple, verifiable action (just clicking button)
- Reduces parent approval burden
- Auto-approval only for sign-in, not for tasks
- Maintains parent control over task completion

---

## Escalation Path

**Must ask humans before deciding on:**

- Using unlisted npm packages
- Changing tech stack (e.g., switching databases)
- Modifying database schema (with existing data)
- Requirements are ambiguous or conflicting
- Better-Auth/Drizzle/Next.js has breaking changes
- Potential security vulnerabilities found

---

## Change Log

| Date | Version | Change |
|------|---------|--------|
| 2026-02-12 | 1.0 | Initial project context generation |
