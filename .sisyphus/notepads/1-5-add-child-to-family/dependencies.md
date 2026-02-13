# Story 1-5: Add Child to Family - Dependencies

## File Dependencies

### Input Files (Read for Context)
- `_bmad-output/planning-artifacts/epics.md` - Epic 1 context, FR5 requirement
- `_bmad-output/planning-artifacts/architecture.md` - Database schema, child account creation architecture
- `_bmad-output/planning-artifacts/prd.md` - FR5 (line 446), AC4 (line 608)
- `_bmad-output/implementation-artifacts/1-1-parent-phone-registration.md` - Database schema (users, families tables), user creation patterns
- `_bmad-output/implementation-artifacts/1-2-parent-phone-login.md` - Login flow, session management, rate limiting
- `_bmad-output/implementation-artifacts/1-3-child-pin-login.md` - PIN login setup, child role verification, PIN encryption
- `_bmad-output/implementation-artifacts/1-4-invite-other-parent.md` - Family management patterns, parent permission checks
- `_bmad/bmm/workflows/4-implementation/create-story/template.md` - Story template structure
- `_bmad-output/implementation-artifacts/sprint-status.yaml` - Sprint status tracking

### Output Files (Created)
- `_bmad-output/implementation-artifacts/1-5-add-child-to-family.md` - Story document for implementation
- `.sisyphus/notepads/1-5-add-child-to-family/learnings.md` - Patterns and learnings from story creation
- `.sisyphus/notepads/1-5-add-child-to-family/issues.md` - Potential issues and gotchas
- `.sisyphus/notepads/1-5-add-child-to-family/dependencies.md` - This file

## Database Dependencies

### Existing Tables (from Story 1-1)
- **users table:** `id`, `phone` (encrypted), `role` (enum: parent/child/admin), `password_hash`, `family_id`, `created_at`
  - Already has role enum with 'child' option
  - password_hash field can store encrypted PIN (reuse from Story 1-3)
  - family_id links to families table
- **families table:** `id`, `primary_parent_id`, `created_at`
  - Already created from Story 1-1
  - Child accounts link to existing family via users.family_id = families.id
- **audit-logs table:** `id`, `user_id`, `action_type`, `timestamp`, `ip_address`
  - Already created from Story 1-1
  - Used for logging child creation and suspension events

### New Tables Needed
- **None** - All tables already created in Story 1-1

### Database Queries to Add
- `createChildAccount(name: string, age: number, familyId: string)` - in `lib/db/queries/users.ts`
- `suspendChildAccount(childId: string)` - in `lib/db/queries/users.ts`
- `activateChildAccount(childId: string)` - in `lib/db/queries/users.ts`
- `generateUniquePIN(familyId: string)` - in `lib/db/queries/users.ts`

## Code Dependencies

### Existing Code to Reuse
1. **Better-Auth Configuration** (`lib/auth/index.ts`)
   - Phone plugin for SMS notifications (not needed for child creation)
   - 36-hour session management (reuse for child login from Story 1-3)
   - HttpOnly Cookie configuration

2. **Session Management** (`lib/auth/session.ts`)
   - Session creation utilities (reuse for parent login session)
   - Session validation (reuse for child PIN login from Story 1-3)

3. **User Queries** (`lib/db/queries/users.ts`)
   - `getUserByPhone(phone: string)` - reuse for parent verification
   - `createUser(phone: string, role: string)` - modify to support child creation (no phone, PIN instead)
   - `getChildByPIN(pin: string)` - reuse from Story 1-3 for PIN uniqueness check

4. **Family Queries** (`lib/db/queries/families.ts`)
   - `createFamily(primaryParentId: string)` - exists but not needed (child joins existing family)
   - `getFamilyMembers(familyId: string)` - reuse from Story 1-4 for family/children listing

5. **Audit Log Queries** (`lib/db/queries/audit-logs.ts`)
   - `logUserAction(userId: string, action: string)` - reuse for child creation events

6. **Rate Limiting** (`lib/auth/rate-limit.ts`)
   - In-memory rate limiter from Story 1-2
   - Reuse for child creation rate limiting (optional)

7. **Auth Guards** (`lib/auth/guards.ts`)
   - Parent role guard from Story 1-2
   - Primary parent guard from Story 1-4
   - Add child management permission guard (any parent in family)

### New Code to Create
1. **Child Creation API** (`app/api/families/add-child/route.ts`)
   - Validate parent permission
   - Generate unique PIN code
   - Create child account with role='child'
   - Link to parent's family
   - Log child creation event

2. **Child Management UI** (`app/(parent)/settings/children/page.tsx`)
   - Child list display
   - Add child form
   - Suspend/activate child controls
   - PIN display for parent

3. **Child Management Functions** (in `lib/db/queries/users.ts`)
   - `createChildAccount()` - Generate PIN, create user with role='child'
   - `suspendChildAccount()` - Update child status to suspended
   - `activateChildAccount()` - Update child status to active
   - `generateUniquePIN()` - Generate 4-digit PIN, check uniqueness in family

## Architecture Dependencies

### ADR-3: Authentication Architecture (from architecture.md)
- Better-Auth 1.4.18+ with phone plugin for parents
- PIN login for children (from Story 1-3)
- 36-hour session rolling refresh (NFR13)
- HttpOnly Cookie for session token storage
- Session management via `lib/auth/session.ts`

### Family Management Architecture (from Story 1-4)
- Primary parent creates family (Story 1-1)
- Secondary parents join existing family (Story 1-4)
- Children can be added to existing family (this story)
- Role enum: parent (primary and secondary), child, admin
- Family linkage: users.family_id = families.id for all family members
- Primary parent identification: families.primary_parent_id = users.id

### Database Query Architecture (ADR-5)
- Function-based queries in `lib/db/queries/` directory
- Per-table files: users.ts, families.ts, audit-logs.ts
- Drizzle ORM query builder only (NO native SQL)
- Extend existing files instead of creating new ones

## Testing Dependencies

### Test Patterns (from Stories 1-1, 1-2, 1-3, 1-4)
- BDD format: Given-When-Then with business language
- Tests BEFORE implementation (TDD approach)
- Bun Test for unit/integration tests
- Playwright for E2E tests
- Test coverage ≥ 60%

### Test Data Dependencies
- Parent User: Zhang 1, Phone: 13800000100, Password: 1111 (from Story 1-1)
- Child User: Zhang 3, PIN: 1111 (from Story 1-3 test data)
- Family ID: From parent user's family_id

## External Dependencies

### Libraries and Frameworks
- **Better-Auth 1.4.18+** - Already configured in Story 1-1
- **Drizzle ORM 0.45.x+** - Already configured in Story 1-1
- **Bun 1.3.x+** - Already configured in project
- **Next.js 16.x + React 19.x** - Already configured in project
- **Shadcn UI 3.7.0+** - Already configured in project (for Toast, Dialog components)

### No New External Dependencies Needed
- All required libraries already installed and configured from Stories 1-1, 1-2, 1-3, 1-4

## Internal Dependencies

### Story Dependencies
- **Story 1-1: Parent Phone Registration** - Required (users, families, audit-logs tables, Better-Auth setup)
- **Story 1-2: Parent Phone Login** - Required (parent must be logged in to create child accounts)
- **Story 1-3: Child PIN Login** - Required (child accounts created here can login using Story 1-3's PIN login endpoint)
- **Story 1-4: Invite Other Parent** - Optional (family management patterns can be reused, but not required)

### Epic Dependencies
- **Epic 1: User Authentication & Family Management** - This story is part of Epic 1
- **Epic 2: Task Management** - Child accounts needed for task assignment and completion
- **Epic 3: Points System** - Child accounts needed for points tracking

### Cross-Story Integration Points
1. **Child Account Creation** → **Child PIN Login (Story 1-3)**
   - Child accounts created here can login using PIN
   - Reuse PIN encryption using `Bun.password.hash()`
   - Reuse child role verification (user.role === 'child')

2. **Child Account Creation** → **Task Management (Epic 2)**
   - Child accounts needed for task assignment
   - Family linkage required for task filtering

3. **Child Account Creation** → **Points System (Epic 3)**
   - Child accounts needed for points tracking
   - Family linkage required for points aggregation

## Security Dependencies

### Security Requirements (from PRD)
- **NFR8:** All data transmission over HTTPS/TLS 1.3
- **NFR9:** Sensitive data (PIN codes) encrypted storage
- **NFR10:** Password/PIN hash using bcrypt algorithm (use Bun.password.hash() per AGENTS.md)
- **NFR11:** Session tokens use HttpOnly Cookie
- **NFR12:** Role-based access control (RBAC)
- **NFR13:** Session management (36-hour expiration, rolling refresh)
- **NFR14:** Operation log audit (record all key operations)

### Security Implementation Dependencies
- `Bun.password.hash()` - For PIN encryption (reuse from Story 1-3)
- `Bun.password.verify()` - For PIN verification (from Story 1-3)
- Better-Auth HttpOnly Cookie - For session management (reuse from Story 1-1)
- Shadcn Toast - For error display (reuse from Stories 1-1, 1-2, 1-3, 1-4)

## Performance Dependencies

### Performance Requirements (from PRD)
- **NFR2:** Child-end page load time < 2 seconds
- **NFR3:** API response time < 500ms (P95)

### Performance Optimization Dependencies
- Drizzle ORM query builder (from Story 1-1)
- Database indexes on family_id and password_hash fields
- Caching family members list (optional)

## User Experience Dependencies

### UI Dependencies
- Shadcn Toast for error display (reuse from Stories 1-1, 1-2, 1-3, 1-4)
- Shadcn Dialog for confirmation dialogs (reuse from Story 1-4)
- Responsive design (mobile-first, < 450px for mini-program)
- Parent navigation layout (reuse from Story 1-4)

### User Flow Dependencies
- Parent login session (from Story 1-2) - Must be logged in to create child accounts
- Family selection (from Story 1-1) - Parent must have valid family
- Child PIN login (from Story 1-3) - Child can login after account creation

## Documentation Dependencies

### Technical Documentation
- **AGENTS.md** - RED LIST rules, BDD testing requirements
- **docs/TECH_SPEC_DATABASE.md** - Database schema and Drizzle ORM usage
- **docs/TECH_SPEC_BUN.md** - Bun runtime tools and password hashing
- **docs/TECH_SPEC_BDD.md** - BDD development methodology

### Previous Story Documentation
- **1-1-parent-phone-registration.md** - Database schema, Better-Auth setup, user creation patterns
- **1-2-parent-phone-login.md** - Login flow, session management, rate limiting
- **1-3-child-pin-login.md** - PIN authentication, child role verification, PIN encryption
- **1-4-invite-other-parent.md** - Family management patterns, parent permission checks

## Integration Dependencies

### Database Integration
- **SQLite Database** (bun:sqlite) - No migration needed (tables already exist)
- **Drizzle ORM** - Query builder for all database operations
- **Schema Files** (`database/schema/`) - No new schema files needed

### API Integration
- **Next.js API Routes** - Create child creation API endpoint
- **Better-Auth** - No changes needed (reuse existing configuration)
- **Session Management** - Reuse from Story 1-1, 1-2, 1-3

### UI Integration
- **Parent Layout** - Reuse from Story 1-4
- **Family Management UI** - Reference pattern from Story 1-4 for child management
- **Shadcn Components** - Reuse Toast, Dialog, Input, Button components

## Data Flow Dependencies

### Child Creation Data Flow
1. Parent enters child name and age in UI
2. Parent submits form to API (POST /api/families/add-child)
3. API validates parent permission (role='parent', family exists)
4. API generates unique 4-digit PIN (check against existing children in family)
5. API encrypts PIN using `Bun.password.hash()`
6. API creates user record: role='child', family_id=parent's family_id, password_hash=encrypted PIN
7. API logs child creation event to audit logs
8. API returns child data to parent UI
9. Parent UI displays child information including PIN

### Child Login Data Flow (with Story 1-3)
1. Child enters PIN in UI
2. Child submits form to API (POST /api/auth/pin-login)
3. API verifies PIN matches child's password_hash
4. API creates 36-hour HttpOnly Cookie session
5. Child redirected to child dashboard

## Dependency Graph

```
Story 1-1 (Parent Phone Registration)
├─ users table
├─ families table
├─ audit-logs table
├─ Better-Auth configuration
└─ Session management

Story 1-2 (Parent Phone Login)
├─ Session management (from 1-1)
└─ Rate limiting

Story 1-3 (Child PIN Login)
├─ users table (from 1-1)
├─ PIN encryption (Bun.password.hash())
└─ Child role verification

Story 1-4 (Invite Other Parent)
├─ Family management patterns
├─ Parent permission checks
└─ Family members listing

Story 1-5 (Add Child to Family) [THIS STORY]
├─ users table (from 1-1)
├─ families table (from 1-1)
├─ audit-logs table (from 1-1)
├─ Session management (from 1-1, 1-2)
├─ PIN encryption (from 1-3)
├─ Family management patterns (from 1-4)
└─ Parent permission checks (from 1-4)

Epic 2: Task Management (Future)
└─ Child accounts (from 1-5)

Epic 3: Points System (Future)
└─ Child accounts (from 1-5)
```

## Risk Dependencies

### Technical Risks
- **PIN Code Conflicts:** Random 4-digit PIN may conflict in same family → Mitigation: Check existing PINs in family before accepting generated PIN
- **PIN Code Security:** Parent viewing child's PIN may expose it to unauthorized users → Mitigation: Mask PIN in display or require parent confirmation to view
- **Account Suspension:** Suspended child accounts may still be able to login → Mitigation: Enforce status check in Story 1-3's PIN login endpoint

### Business Risks
- **Parent Permission Confusion:** Secondary parents may not know they can add children → Mitigation: Document in UI help text
- **Child Age Validation:** Children outside 6-12 age range may attempt to be added → Mitigation: Validate age input with clear error message

### Integration Risks
- **Story 1-3 Update Required:** Story 1-3's PIN login endpoint needs to check account status → Mitigation: Modify Story 1-3's PIN login to verify child status
- **Family Management UI Changes:** Story 1-4's family management UI needs to include children → Mitigation: Create separate children management page or extend existing family page

## Dependencies Summary

### Critical Dependencies (Must Have)
- ✅ Story 1-1: Parent Phone Registration (database schema, Better-Auth)
- ✅ Story 1-2: Parent Phone Login (session management, parent must be logged in)
- ✅ Story 1-3: Child PIN Login (PIN encryption, child role verification)
- ✅ Drizzle ORM (database queries)
- ✅ Bun.password.hash() (PIN encryption)

### Optional Dependencies (Nice to Have)
- ⭕ Story 1-4: Invite Other Parent (family management patterns, not required)
- ⭕ Rate limiting (for child creation, optional)
- ⭕ Family caching (for performance, optional)

### No External Dependencies Needed
- ✅ All required libraries already installed
- ✅ All required tables already created
- ✅ All required configurations already set up
