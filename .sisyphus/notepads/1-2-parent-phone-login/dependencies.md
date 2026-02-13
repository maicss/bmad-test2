# Dependencies - Story 1-2: Parent Phone Login

## Internal Dependencies

### From Story 1-1: Parent Phone Registration (Completed)

#### Database Schema
- `database/schema/users.ts`
  - Table: users
  - Fields: id, phone (encrypted), role (enum: parent/child/admin), password_hash, family_id, created_at
  - Dependency: Login needs to verify user exists and role=parent
  - Status: ✅ Already created in Story 1-1

- `database/schema/families.ts`
  - Table: families
  - Fields: id, primary_parent_id, created_at
  - Dependency: Login returns familyId for user's family
  - Status: ✅ Already created in Story 1-1

- `database/schema/audit-logs.ts`
  - Table: audit-logs
  - Fields: id, user_id, action_type, timestamp, ip_address
  - Dependency: Login needs to log authentication events
  - Status: ✅ Already created in Story 1-1

#### Database Queries
- `lib/db/queries/users.ts`
  - Function: `getUserByPhone(phone: string)`
  - Purpose: Retrieve user by encrypted phone number
  - Used in: Login API to verify user exists and check role
  - Status: ✅ Already created in Story 1-1

- `lib/db/queries/audit-logs.ts`
  - Function: `logUserAction(userId: string, action: string)`
  - Purpose: Log user actions for audit trail
  - Used in: Login API to record login success/failure
  - Status: ✅ Already created in Story 1-1

#### Authentication Infrastructure
- `lib/auth/index.ts`
  - Purpose: Better-Auth configuration with phone plugin
  - Features: 36-hour session, HttpOnly Cookie, OTP verification
  - Used in: Login API for session creation
  - Status: ✅ Already created in Story 1-1

- `lib/auth/session.ts`
  - Purpose: Session management utilities
  - Features: Session creation, refresh, validation
  - Used in: Login API to manage user sessions
  - Status: ✅ Already created in Story 1-1

- `lib/auth/guards.ts`
  - Purpose: Role-based access control guards
  - Features: Parent, Child, Admin role guards
  - Used in: Login API to enforce parent role access
  - Status: ⚠️ Needs extension (add parent guard)
  - Action: Extend with `requireParentRole()` function

#### UI Components
- `app/(auth)/layout.tsx`
  - Purpose: Shared authentication layout
  - Features: Responsive design, consistent styling
  - Used in: Login page reuse
  - Status: ✅ Already created in Story 1-1

#### Type Definitions
- `types/user.ts`
  - Purpose: User TypeScript type definitions
  - Types: User, UserRole (enum: parent/child/admin)
  - Used in: Login API and UI for type safety
  - Status: ✅ Already created in Story 1-1

- `types/auth.ts`
  - Purpose: Authentication DTO types
  - Types: LoginRequest, LoginResponse, SessionData
  - Used in: Login API for request/response validation
  - Status: ✅ Already created in Story 1-1

#### Test Fixtures
- `tests/fixtures/users.ts`
  - Purpose: Test user data for registration/login
  - Data: Test parent users with phone numbers
  - Used in: Login tests to verify registered user login
  - Status: ✅ Already created in Story 1-1
  - Note: Reuse phone '13800000100' for login tests

## External Dependencies

### Runtime Dependencies
- **Bun 1.3.x+**
  - Purpose: JavaScript runtime
  - Features: password.hash(), env, file API
  - Used in: Session management, environment variables
  - Status: ✅ Already installed

- **Next.js 16.x**
  - Purpose: React framework and API routes
  - Features: App Router, Server Components, API routes
  - Used in: Login API endpoint and UI pages
  - Status: ✅ Already installed

- **Drizzle ORM 0.45.x+**
  - Purpose: Database ORM
  - Features: Query builder, schema management, migrations
  - Used in: getUserByPhone query (from Story 1-1)
  - Status: ✅ Already installed

- **Better-Auth 1.4.18+**
  - Purpose: Authentication library
  - Features: Phone plugin, session management, OTP verification
  - Used in: Login API for OTP verification and session creation
  - Status: ✅ Already installed

- **TypeScript 5**
  - Purpose: Type safety and compilation
  - Features: Strict mode, type inference
  - Used in: All TypeScript files (type safety)
  - Status: ✅ Already installed

### UI Dependencies
- **Shadcn UI 3.7.0+**
  - Purpose: UI component library
  - Features: Toast, Dialog, Input, Button components
  - Used in: Login form and error display (Toast)
  - Status: ✅ Already installed

- **Tailwind CSS 4**
  - Purpose: CSS framework
  - Features: Utility classes, responsive design
  - Used in: Login page styling
  - Status: ✅ Already installed

- **React 19.x**
  - Purpose: UI library
  - Features: Hooks, Server Components
  - Used in: Login page and form components
  - Status: ✅ Already installed

### Testing Dependencies
- **Bun Test**
  - Purpose: Unit and integration testing
  - Features: Built-in test runner
  - Used in: Login unit tests and API integration tests
  - Status: ✅ Already installed

- **Playwright 1.58.0**
  - Purpose: E2E testing
  - Features: Browser automation, cross-browser testing
  - Used in: Login E2E tests (complete flow)
  - Status: ✅ Already installed

## File Dependencies Graph

```
Story 1-2: Parent Phone Login
│
├── app/
│   ├── (auth)/login/page.tsx (NEW)
│   │   ├── depends on: app/(auth)/layout.tsx (from Story 1-1)
│   │   ├── uses: Shadcn UI components (Toast, Input, Button)
│   │   └── types: types/user.ts, types/auth.ts (from Story 1-1)
│   │
│   └── api/auth/login/route.ts (NEW)
│       ├── depends on: lib/auth/index.ts (from Story 1-1)
│       ├── depends on: lib/auth/session.ts (from Story 1-1)
│       ├── depends on: lib/db/queries/users.ts (from Story 1-1)
│       ├── depends on: lib/db/queries/audit-logs.ts (from Story 1-1)
│       ├── uses: lib/auth/rate-limit.ts (NEW)
│       └── types: types/auth.ts (from Story 1-1)
│
├── lib/
│   ├── auth/
│   │   ├── index.ts (REUSE from Story 1-1) ✅
│   │   ├── session.ts (REUSE from Story 1-1) ✅
│   │   ├── guards.ts (EXTEND from Story 1-1) ⚠️
│   │   └── rate-limit.ts (NEW)
│   │
│   └── db/queries/
│       ├── users.ts (REUSE from Story 1-1) ✅
│       └── audit-logs.ts (REUSE from Story 1-1) ✅
│
├── database/schema/
│   ├── users.ts (REUSE from Story 1-1) ✅
│   ├── families.ts (REUSE from Story 1-1) ✅
│   └── audit-logs.ts (REUSE from Story 1-1) ✅
│
└── types/
    ├── user.ts (REUSE from Story 1-1) ✅
    └── auth.ts (REUSE from Story 1-1) ✅

Legend:
✅ REUSE: Already exists, no changes needed
⚠️ EXTEND: Already exists, needs modifications
NEW: New file to create
```

## Dependency Risks

### Low Risk
- **Better-Auth phone plugin**: Well-documented, stable API
- **Drizzle ORM queries**: Follows established patterns from Story 1-1
- **Shadcn UI components**: Stable, widely used
- **Bun runtime**: Mature, stable API

### Medium Risk
- **Rate limiting implementation**: In-memory solution for MVP only
  - Mitigation: Plan Redis migration for production
  - Timeline: Story 6 or later

### Low Risk (Documentation)
- **Session refresh behavior**: Need to verify Better-Auth automatic refresh
  - Verification: Test in E2E tests
  - Timeline: Before marking story complete

## Dependency Timeline

### Completed (Story 1-1)
- ✅ Better-Auth configuration (lib/auth/index.ts)
- ✅ Session management (lib/auth/session.ts)
- ✅ Database schema (users, families, audit-logs)
- ✅ Database queries (getUserByPhone, logUserAction)
- ✅ Auth layout (app/(auth)/layout.tsx)
- ✅ Type definitions (types/user.ts, types/auth.ts)

### In Progress (Story 1-2)
- ⚠️ Extend auth guards (lib/auth/guards.ts)
- 🚧 Create rate limiting utility (lib/auth/rate-limit.ts)
- 🚧 Create login API endpoint (app/api/auth/login/route.ts)
- 🚧 Create login UI page (app/(auth)/login/page.tsx)
- 🚧 Write unit and integration tests

### Future (Story 1-3: Child PIN Login)
- 🔮 Reuse session infrastructure (from Story 1-1)
- 🔮 Reuse rate limiting pattern (from Story 1-2)
- 🔮 Extend auth guards for child role
- 🔮 Create child login API endpoint
- 🔮 Create child login UI page

### Future (Story 1-6: Multi-Device Login)
- 🔮 Reuse session infrastructure (from Story 1-1)
- 🔮 Implement session management UI
- 🔮 Add device tracking and remote logout

## Technical Debt

### 1. Rate Limiting Storage
- **Current:** In-memory rate limiting
- **Debt:** Not scalable for multi-server deployment
- **Plan:** Migrate to Redis-backed rate limiting (Story 6 or later)
- **Priority:** Medium

### 2. Session Management UI
- **Current:** No UI for users to view/manage active sessions
- **Debt:** Security risk if account is compromised
- **Plan:** Implement session management UI (Story 1-6 or Epic 1 retrospective)
- **Priority:** Low (nice-to-have for MVP)

### 3. Audit Log Retention
- **Current:** Audit logs stored indefinitely
- **Debt:** Database growth over time
- **Plan:** Implement log retention policy (90 days or per GDPR requirements)
- **Priority:** Low (nice-to-have for MVP)

## Dependency Conflicts

### None
No dependency conflicts identified for Story 1-2.

## Dependency Testing

### Required Tests
1. ✅ Better-Auth phone plugin OTP verification
2. ✅ Session creation and refresh (36-hour expiration)
3. ✅ getUserByPhone query with encrypted phone
4. ✅ logUserAction audit logging
5. ⚠️ Rate limiting with in-memory storage
6. 🚧 Auth guards for parent role
7. 🚧 Login API endpoint with error handling
8. 🚧 Login UI form with validation

### Test Coverage
- Unit tests: Rate limiting, OTP verification
- Integration tests: Login API endpoint, database queries
- E2E tests: Complete login flow (phone → OTP → dashboard)

## Dependency Ownership

### Team Responsibilities
- **Backend:** Login API endpoint, rate limiting, auth guards
- **Frontend:** Login UI page, form validation, error display
- **Database:** No schema changes (reuse from Story 1-1)
- **Testing:** Unit, integration, and E2E tests

### Code Review Requirements
- Review rate limiting implementation for security
- Review error messages for user-friendliness (Chinese)
- Review session management for consistency with Story 1-1
- Review audit logging for completeness and security

## External API Dependencies

### None
Story 1-2 has no external API dependencies.
- OTP verification: Better-Auth phone plugin (internal)
- Session management: Better-Auth (internal)
- Database: bun:sqlite (local)
- All operations are self-contained within the application

## Dependency Documentation

### Better-Auth Phone Plugin
- **Documentation:** https://better-auth.com/docs/plugins/phone
- **Features:** OTP verification, SMS sending (configurable)
- **Configuration:** Already configured in Story 1-1
- **OTP Settings:** Verify default expiration time (recommend 5 minutes)

### Drizzle ORM
- **Documentation:** https://orm.drizzle.team/
- **Query Pattern:** Use query builder (NO native SQL)
- **Examples:** Refer to Story 1-1 query functions
- **Type Safety:** Full TypeScript support

### Shadcn UI
- **Documentation:** https://ui.shadcn.com/
- **Toast Component:** For error display (login failures)
- **Input Component:** For phone and OTP input
- **Button Component:** For submit and resend OTP

## Next Story Dependencies

### Story 1-3: Child PIN Login
Will reuse from Story 1-2:
- ✅ Rate limiting pattern (lib/auth/rate-limit.ts)
- ✅ Session management (lib/auth/session.ts)
- ✅ Audit logging (lib/db/queries/audit-logs.ts)
- ✅ Auth layout (app/(auth)/layout.tsx)
- ✅ Type definitions (types/user.ts, types/auth.ts)

Will extend:
- ⚠️ Auth guards (add child role guard)
- 🚧 Login API endpoint (change OTP to PIN validation)
- 🚧 Login UI page (change form fields for PIN input)

### Story 1-6: Multi-Device Login
Will reuse from Story 1-1 and 1-2:
- ✅ Session infrastructure (lib/auth/index.ts, lib/auth/session.ts)
- ✅ User queries (lib/db/queries/users.ts)
- ✅ Type definitions (types/user.ts, types/auth.ts)

Will add:
- 🚧 Session management UI (view active sessions)
- 🚧 Device tracking and fingerprinting
- 🚧 Remote logout functionality
- 🚧 Login notifications (new device detected)
