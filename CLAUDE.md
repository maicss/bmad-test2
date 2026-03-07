# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Family Reward is a family behavior management gamification platform. Parents create tasks with points, children complete tasks to earn points, and points can be exchanged for wishes.

**Tech Stack**: Bun runtime, Next.js 16, Drizzle ORM, SQLite, Better-Auth, Shadcn UI, Playwright

## Common Commands

```bash
# Development
bun run dev              # Start dev server (Next.js on PORT from env)
bun run build            # Production build
bun run start            # Start production server

# Testing
bun test                 # Run unit/integration tests
bun run test:watch       # Watch mode
bun run test:e2e         # Run Playwright E2E tests
bun run test:coverage    # Generate coverage report

# Database
bun run database/seed-test-users.ts  # Seed test users

# Linting/Type checking
bun run lint             # ESLint
bun tsc --noEmit         # Type check
```

## Critical Constraints (RED LIST)

**Violating these will cause task failure:**

- **Database**: MUST use Drizzle ORM only. No raw SQL, no string interpolation. All queries in `lib/db/queries/` organized by table (e.g., `queries/tasks.ts`, `queries/users.ts`)
- **Bun runtime**: Use Bun built-ins (`Bun.file()`, `Bun.password.hash()`, `Bun.env`). No Node.js polyfills (`fs/promises`, `bcrypt`, `process.env`)
- **Types**: No `any` type. Use `unknown` with type guards. No `@ts-ignore`
- **BDD Testing**: Tests use Given-When-Then format with business language, not technical terms
- **E2E Testing Required**: After each story development, MUST add E2E tests for all happy paths and ensure all cases pass before marking story complete
- **File length**: Max 800 lines per file
- **UI**: Use Shadcn components for dialogs/toasts, no `alert()`

## Architecture

### Data Flow
```
PWA UI → API Routes (app/api/) → Query Layer (lib/db/queries/) → Drizzle ORM → SQLite
```

**Key Rule**: Never query database directly in routes/components. All queries go through `lib/db/queries/`.

### Directory Structure
- `app/` - Next.js App Router. Routes: `(auth)`, `(parent)`, `(child)`, `dashboard`, `api/`
- `lib/db/` - Database layer. `schema.ts` (tables), `queries/` (query functions by table), `index.ts` (connection)
- `components/` - React components. `ui/` (Shadcn), `forms/` (form components)
- `types/` - TypeScript types by module
- `tests/` - `unit/`, `integration/`, `e2e/`, `bdd/`
- `database/` - SQLite file (`db.sqlite`) and migrations

### User Roles & Routing
- `parent` - Adults who create tasks/approve completions. Redirects to `/dashboard` or `/parent`
- `child` - Children who complete tasks. Redirects to `/child-dashboard`
- `admin` - System administrator

### Authentication (Better-Auth)
- Session-based auth via HttpOnly cookies (`better-auth.session_token`)
- Parents: phone + password login
- Children: PIN code login
- Protected routes: `/dashboard`, `/parent`, `/settings`
- Middleware handles auth redirects (see `middleware.ts`)

### Database Schema (Key Tables)
- `users` - id, name, phone, role (parent/child), password_hash, pin, family_id
- `families` - id, name, points
- `task_plans` - Template tasks with date strategies
- `tasks` - Actual task instances with status
- `wishlists` - Wishes with cost and status
- `sessions` - Better-Auth sessions
- `date_strategies` - Recurrence rules for tasks

## Git Workflow

**Feature branch naming**: `feature/story-{Epic}-{Story}-{description}`
- Example: `feature/story-2-2-points-setting`

**Forbidden**: Do NOT develop on `main`, `fix-e2e`, `hotfix-*`, or `experiment-*` branches for features

**Flow**:
1. `git checkout main && git pull`
2. `git checkout -b feature/story-X-Y-name`
3. Develop, commit with conventional format (`feat:`, `fix:`, `test:`, etc.)
4. Run tests and type check before committing
5. **Add E2E tests for all happy paths and ensure all pass**
6. Push to remote feature branch
7. Code review, then merge to main

## Testing Approach

**BDD Style** (Given-When-Then):
```typescript
it('given 家长已登录，when 查询任务列表，then 返回该家庭的任务', async () => {
  // Given: 家长已登录且有任务
  const parent = await createParent();
  const task = await createTask({ familyId: parent.familyId });

  // When: 查询任务列表
  const res = await request(app).get('/api/tasks').set('Cookie', parent.session);

  // Then: 返回该家庭的任务
  expect(res.status).toBe(200);
  expect(res.body.tasks[0].id).toBe(task.id);
});
```

**Playwright E2E**: Uses local Chrome (see `playwright.config.ts`). Test files in `tests/e2e/`

## Story Completion Checklist

Before marking a story as complete, ensure:

- [ ] All acceptance criteria implemented
- [ ] Unit/integration tests written and passing
- [ ] **E2E tests added for ALL happy paths**
- [ ] **E2E tests passing** (`bun run test:e2e`)
- [ ] Type check passes (`bun tsc --noEmit`)
- [ ] Lint passes (`bun run lint`)
- [ ] Code follows RED LIST constraints
- [ ] Files are ≤800 lines (split if needed)

## Key Conventions

- **Naming**: camelCase for functions, PascalCase for components, kebab-case for files
- **Comments**: Chinese for business logic explanations
- **Error handling**: Use `constants/error-codes.ts` for error codes
- **Path aliases**: `@/*` maps to project root

## Documentation

- `AGENTS.md` - AI decision manual with RED LIST constraints (READ THIS FIRST)
- `WORKFLOW.md` - Development workflow and progress reporting rules
- `docs/TECH_SPEC.md` - Technical specification index
- `docs/GIT_WORKFLOW.md` - Git branch management rules
- `specs/` - PRD and requirement documents

## Test Data

Test users are seeded via `bun run database/seed-test-users.ts`:
- Admin: phone 13800000001, password 1111
- Parent Zhang 1: phone 13800000100, password 1111, family-001
- Child Zhang 3: PIN 1111, family-001
