# Story1-4: Invite Other Parent - Dependencies

## File Dependencies

### Files to Create
1. **database/schema/pending-invitations.ts**
   - Purpose: Define pending_invitations table schema
   - Dependencies: None (new schema file)
   - Used by: Database migration, Drizzle queries

2. **lib/db/queries/invitations.ts**
   - Purpose: Database query functions for invitation management
   - Dependencies: database/schema/pending-invitations.ts, database/schema/users.ts, database/schema/families.ts
   - Functions: createInvitation(), getInvitationByToken(), updateInvitationStatus(), getFamilyInvitations()
   - Used by: API endpoints, cleanup job

3. **app/api/families/invite-parent/route.ts**
   - Purpose: API endpoint for creating family invitations
   - Dependencies: lib/db/queries/invitations.ts, lib/db/queries/users.ts, lib/db/queries/families.ts, lib/auth/session.ts, lib/auth/guards.ts
   - Used by: Parent UI invitation form
   - Dependencies on: Story 1-1 (session management), Story 1-2 (rate limiting pattern)

4. **app/api/auth/accept-invitation/route.ts**
   - Purpose: API endpoint for accepting invitation and registering invited parent
   - Dependencies: lib/db/queries/invitations.ts, lib/db/queries/users.ts, lib/auth/session.ts, lib/auth/index.ts
   - Used by: Invitation link clicks
   - Dependencies on: Story 1-1 (registration flow), Story 1-2 (session management)

5. **lib/services/invitation-cleanup.ts**
   - Purpose: Cleanup job to mark expired invitations
   - Dependencies: lib/db/queries/invitations.ts
   - Used by: Scheduled cron job
   - Frequency: Daily

6. **app/(parent)/settings/family/page.tsx**
   - Purpose: UI page for family management and invitation
   - Dependencies: components/ui/* (Shadcn), components/features/* (family components), lib/hooks/use-family.ts
   - Used by: Parent navigation
   - Dependencies on: Story 1-1 (authentication), Story 1-2 (session management)

7. **types/invitation.ts**
   - Purpose: TypeScript type definitions for invitations
   - Dependencies: types/user.ts, types/family.ts
   - Used by: API endpoints, database queries, UI components

8. **app/(parent)/layout.tsx**
   - Purpose: Parent navigation layout (may need to create if not exists)
   - Dependencies: components/layouts/parent-nav.tsx
   - Used by: All parent pages
   - Dependencies on: Story 1-1 (authentication), Story 1-2 (session management)

### Files to Modify
1. **lib/auth/guards.ts**
   - Changes: Add primary parent guard function
   - Dependency on: database/schema/users.ts, database/schema/families.ts
   - New function: `isPrimaryParent(userId: string): boolean`
   - Used by: Invitation API endpoint

2. **lib/db/queries/users.ts**
   - Changes: Modify createUser to accept optional family_id parameter
   - Dependency on: database/schema/users.ts, database/schema/families.ts
   - Modified function: `createUser(phone: string, role: string, familyId?: string)`
   - Used by: Invitation acceptance API (this story), Story 1-1 (registration)

### Files to Reuse (from Stories 1-1, 1-2, 1-3)
1. **lib/auth/index.ts**
   - From: Story 1-1
   - Purpose: Better-Auth configuration with phone plugin
   - Used by: All auth-related APIs
   - No changes needed

2. **lib/auth/session.ts**
   - From: Story 1-1
   - Purpose: Session management utilities
   - Used by: Invitation acceptance API
   - No changes needed

3. **database/schema/users.ts**
   - From: Story 1-1
   - Purpose: Users table schema
   - Fields: id, phone (encrypted), role (enum: parent/child/admin), password_hash, family_id, created_at
   - Used by: User queries, invitation validation
   - No changes needed

4. **database/schema/families.ts**
   - From: Story 1-1
   - Purpose: Families table schema
   - Fields: id, primary_parent_id, created_at
   - Used by: Family queries, primary parent verification
   - No changes needed

5. **database/schema/audit-logs.ts**
   - From: Story 1-1
   - Purpose: Audit logs table schema
   - Used by: Audit logging for invitation events
   - No changes needed

6. **lib/db/queries/users.ts**
   - From: Story 1-1
   - Purpose: User database queries
   - Functions: getUserByPhone(), createUser() (to be modified)
   - Used by: Invitation validation, user creation
   - Modifications: Add optional familyId parameter to createUser()

7. **lib/db/queries/families.ts**
   - From: Story 1-1
   - Purpose: Family database queries
   - Functions: createFamily() (not needed for this story), getFamilyByUserId()
   - Used by: Primary parent verification
   - May need to add: getFamilyByUserId()

8. **lib/db/queries/audit-logs.ts**
   - From: Story 1-1
   - Purpose: Audit log queries
   - Functions: logUserAction()
   - Used by: All key operations (invitation create, accept, expire)
   - No changes needed

9. **lib/auth/rate-limit.ts**
   - From: Story 1-2
   - Purpose: Rate limiting utility
   - Used by: Invitation creation (rate limit: 10 invitations per day)
   - No changes needed

10. **types/user.ts**
    - From: Story 1-1
    - Purpose: User TypeScript types
    - Used by: API endpoints, database queries, UI components
    - No changes needed

11. **types/auth.ts**
    - From: Story 1-1
    - Purpose: Auth DTO types
    - Used by: API endpoints, UI components
    - No changes needed

12. **components/ui/*.tsx**
    - From: Shadcn UI (project setup)
    - Purpose: Reusable UI components
    - Components used: Button, Input, Card, Dialog, Toast, Table
    - No changes needed

## Database Schema Dependencies

### Tables Required from Previous Stories
1. **users table** (from Story 1-1)
   - Fields: id, phone (encrypted), role (enum: parent/child/admin), password_hash, family_id, created_at
   - Used by: User lookup, authentication, family linkage
   - Foreign key: family_id → families.id

2. **families table** (from Story 1-1)
   - Fields: id, primary_parent_id, created_at
   - Used by: Family management, primary parent verification
   - Foreign key: primary_parent_id → users.id

3. **audit-logs table** (from Story 1-1)
   - Fields: id, user_id, action_type, timestamp, ip_address
   - Used by: Audit logging for invitation events
   - Foreign key: user_id → users.id

### New Table Required
1. **pending_invitations table** (this story)
   - Fields: id, token (UUID + timestamp), inviter_user_id, family_id, invited_phone (encrypted), status (enum: pending/accepted/expired), created_at, expires_at
   - Foreign keys: inviter_user_id → users.id, family_id → families.id
   - Indexes: token (unique), invited_phone, status

### Database Migrations Required
1. **Migration for pending_invitations table**
   - Create table with all fields and foreign keys
   - Add unique constraint on token field
   - Add indexes on invited_phone, status, expires_at
   - Generated by: `bun drizzle-kit generate`

## API Endpoint Dependencies

### New API Endpoints (this story)
1. **POST /api/families/invite-parent**
   - Purpose: Create family invitation
   - Request: { invitedPhone: string }
   - Response: { success: true, invitationId: string }
   - Dependencies: lib/db/queries/invitations.ts, lib/auth/guards.ts
   - Authentication: Required (primary parent only)

2. **POST /api/auth/accept-invitation**
   - Purpose: Accept invitation and register invited parent
   - Request: { token: string, phone: string, otp: string }
   - Response: { success: true, user: {...} }
   - Dependencies: lib/db/queries/invitations.ts, lib/db/queries/users.ts, lib/auth/session.ts
   - Authentication: Not required (before registration)

3. **GET /api/families/members**
   - Purpose: Get family members list (may need to add)
   - Response: { members: [...], invitations: [...] }
   - Dependencies: lib/db/queries/families.ts, lib/db/queries/invitations.ts
   - Authentication: Required (parent only)

### Existing API Endpoints to Reuse
1. **POST /api/auth/register** (from Story 1-1)
   - Used by: Invitation acceptance flow (modified version)
   - Modifications needed: Accept optional family_id parameter

2. **POST /api/auth/login** (from Story 1-2)
   - Used by: Invited parent login (after registration)
   - No modifications needed

## Component Dependencies

### New Components (this story)
1. **InvitationForm**
   - Purpose: Form for inviting other parents
   - Props: { onSubmit: (phone: string) => void }
   - Dependencies: Shadcn Input, Button, Toast

2. **FamilyMembersList**
   - Purpose: Display family members (primary parent, secondary parents, children)
   - Props: { members: [...], invitations: [...] }
   - Dependencies: Shadcn Card, Table, Avatar

3. **InvitationStatusBadge**
   - Purpose: Display invitation status (pending/accepted/expired)
   - Props: { status: string }
   - Dependencies: Shadcn Badge

### Existing Components to Reuse
1. **Shadcn UI Components** (project setup)
   - Button, Input, Card, Dialog, Toast, Table, Avatar, Badge
   - No modifications needed

2. **Parent Navigation** (may need to create)
   - From: app/(parent)/layout.tsx
   - Purpose: Parent navigation bar
   - No modifications needed

## Service Dependencies

### New Services (this story)
1. **Invitation Cleanup Service**
   - File: lib/services/invitation-cleanup.ts
   - Purpose: Mark expired invitations
   - Frequency: Daily
   - Dependencies: lib/db/queries/invitations.ts

### Existing Services to Reuse
1. **Session Service** (from Story 1-1)
   - File: lib/auth/session.ts
   - Purpose: Session management utilities
   - Used by: Invitation acceptance (create session for invited parent)

2. **Rate Limiting Service** (from Story 1-2)
   - File: lib/auth/rate-limit.ts
   - Purpose: Rate limiting utility
   - Used by: Invitation creation (max 10 per day)

3. **Audit Logging Service** (from Story 1-1)
   - File: lib/db/queries/audit-logs.ts
   - Purpose: Log user actions
   - Used by: Invitation create, accept, expire events

## Hook Dependencies

### New Hooks (this story)
1. **useFamilyMembers**
   - Purpose: Fetch family members and invitations
   - Returns: { members: [...], invitations: [...], loading: boolean }
   - Dependencies: API endpoint GET /api/families/members

2. **useInvitation**
   - Purpose: Send invitation and handle errors
   - Returns: { sendInvitation: (phone: string) => Promise, loading: boolean }
   - Dependencies: API endpoint POST /api/families/invite-parent

### Existing Hooks to Reuse
1. **useAuth** (from Story 1-1)
   - Purpose: Authentication state management
   - Returns: { user, isAuthenticated, login, logout }
   - Used by: Permission checks, UI rendering

2. **useToast** (Shadcn UI)
   - Purpose: Toast notifications
   - Returns: { toast }
   - Used by: Error display, success messages

## External Dependencies

### Runtime Dependencies
1. **Bun 1.3.x+**
   - Used for: Runtime, password hashing (Bun.password.hash())
   - Version: Specified in AGENTS.md

2. **Next.js 16.x**
   - Used for: App Router, API routes, React components
   - Version: Specified in AGENTS.md

3. **React 19.x**
   - Used for: React components, hooks
   - Version: Specified in AGENTS.md

4. **Drizzle ORM 0.45.x+**
   - Used for: Database queries, schema definitions
   - Version: Specified in AGENTS.md

5. **Better-Auth 1.4.18+**
   - Used for: Authentication, phone plugin for SMS
   - Version: Specified in AGENTS.md

6. **TypeScript 5**
   - Used for: Type definitions, type safety
   - Version: Specified in AGENTS.md

### Development Dependencies
1. **Bun Test**
   - Used for: Unit and integration tests
   - Specified in: AGENTS.md

2. **Playwright**
   - Used for: E2E tests
   - Specified in: AGENTS.md

### External Services
1. **SMS Provider**
   - Used for: Sending invitation SMS
   - Configuration: Better-Auth phone plugin
   - Development: Mock or local provider
   - Production: Real SMS provider (e.g., Twilio, Aliyun)

## Story Dependencies

### Must Complete Before This Story
1. **Story 1-1: Parent Phone Registration**
   - Reason: Required for Better-Auth setup, users table, families table, session management
   - Dependencies: lib/auth/index.ts, database/schema/users.ts, database/schema/families.ts

2. **Story 1-2: Parent Phone Login**
   - Reason: Required for session management patterns, rate limiting
   - Dependencies: lib/auth/session.ts, lib/auth/rate-limit.ts

3. **Story 1-3: Child PIN Login**
   - Reason: Required for role verification patterns
   - Dependencies: lib/auth/guards.ts (role guards)

### Must Complete After This Story
1. **Story 1-5: Add Child to Family**
   - Reason: Builds on family management patterns from this story
   - Will reuse: Family linkage pattern, parent permission verification

2. **Story 1-6: Multi-Device Login**
   - Reason: Session management already supports multiple devices
   - No blocking dependencies

3. **Story 1-7: Primary Parent Manage Members**
   - Reason: Builds on family members listing from this story
   - Will reuse: Family members query, invitation status tracking

### Parallel Development Opportunities
- **Story 2-1: Create Task Plan Template** (Epic 2) - Can develop in parallel (no dependency on family management)
- **Story 6-1: Admin Creates Task Template** (Epic 6) - Can develop in parallel (admin features, independent of Epic 1)

## Database Migration Dependencies

### Migration Execution Order
1. Run Story 1-1 migration (users, families, audit-logs tables) ✅ (already completed)
2. Run Story 1-4 migration (pending_invitations table) ⬅️ (this story)
3. No other migrations needed for this story

### Migration Rollback Strategy
1. Rollback pending_invitations table if migration fails
2. Keep users, families, audit-logs tables (from Story 1-1)
3. Re-run migration with fixed schema

## Environment Configuration Dependencies

### Environment Variables Required
1. **Better-Auth Configuration** (from Story 1-1)
   - AUTH_SECRET (for session signing)
   - SMS_PROVIDER_API_KEY (for SMS delivery)
   - SMS_FROM_NUMBER (for SMS sender ID)

2. **Database Configuration** (from Story 1-1)
   - DATABASE_URL (bun:sqlite connection string)

3. **Application Configuration**
   - INVITATION_EXPIRATION_HOURS=24 (invitation token expiration)
   - INVITATION_RATE_LIMIT=10 (max invitations per day)
   - INVITATION_RATE_LIMIT_WINDOW=1day (rate limit window)

### Configuration Validation
1. Validate Better-Auth phone plugin configuration before starting
2. Validate database connection before running migration
3. Validate SMS provider credentials in development environment

## Testing Dependencies

### Test Data Dependencies
1. **Test Users** (from AGENTS.md)
   - Primary parent: Zhang 1, Phone: 13800000100
   - Secondary parent: Zhang 2, Phone: 13800000200 (to be invited)
   - Child: Zhang 3, PIN: 1111

2. **Test Families**
   - Family with primary_parent_id = Zhang 1.id
   - Family members: Zhang 1 (primary), Zhang 2 (secondary, after invitation)

3. **Test Invitations**
   - Valid invitation: token, status='pending', created_at < 24 hours
   - Expired invitation: token, status='pending', created_at > 24 hours
   - Accepted invitation: token, status='accepted'

### Test Fixtures Required
1. **users.test.ts fixtures** (from Story 1-1)
   - Reuse: test user data (primary parent, child)
   - Add: secondary parent user data

2. **families.test.ts fixtures** (from Story 1-1)
   - Reuse: test family data
   - No changes needed

3. **invitations.test.ts fixtures** (new)
   - Create: test invitation data (pending, accepted, expired)

## Documentation Dependencies

### Documentation to Reference
1. **AGENTS.md**
   - RED LIST rules (Drizzle ORM, Bun runtime, type safety)
   - BDD testing requirements
   - File organization patterns

2. **docs/TECH_SPEC_DATABASE.md**
   - Database schema conventions
   - Drizzle ORM usage patterns

3. **docs/TECH_SPEC_BUN.md**
   - Bun runtime tools (password hashing, environment variables)

4. **docs/TECH_SPEC_AUTH.md**
   - Better-Auth configuration
   - Session management patterns

5. **docs/TECH_SPEC_BDD.md**
   - Given-When-Then testing format
   - Test writing guidelines

6. **docs/TECH_SPEC_API.md**
   - API endpoint design patterns
   - Response format standards

### Documentation to Update
1. **API Documentation** (after implementation)
   - Add POST /api/families/invite-parent
   - Add POST /api/auth/accept-invitation
   - Add GET /api/families/members (if added)

2. **Database Schema Documentation** (after implementation)
   - Add pending_invitations table schema
   - Update ER diagram with new table

3. **User Guide** (after implementation)
   - Add "Invite Other Parent" section
   - Include screenshots and step-by-step instructions

## Security Dependencies

### Security Measures Required
1. **Phone Number Encryption** (NFR9)
   - Use Bun.password.hash() for invited_phone
   - Reuse pattern from Story 1-1

2. **Token Security**
   - UUID + timestamp prevents brute force
   - 24-hour expiration limits token validity
   - Single-use tokens (prevent reuse)

3. **Permission Verification**
   - Only primary parent can send invitations
   - Verify users.id === families.primary_parent_id

4. **Audit Logging** (NFR14)
   - Log all invitation events (create, accept, expire)
   - Include masked phone numbers for privacy

5. **Rate Limiting**
   - Max 10 invitations per day per primary parent
   - Prevent invitation spam

### Security Dependencies
1. **lib/auth/guards.ts** (from Story 1-1)
   - Add primary parent guard function
   - Used by: Invitation API endpoint

2. **lib/constants/error-codes.ts**
   - Define error codes for invitation failures
   - Used by: Error handling

3. **lib/constants/roles.ts** (may need to create)
   - Define role constants: PRIMARY_PARENT, SECONDARY_PARENT, CHILD, ADMIN
   - Used by: Permission checks

## Performance Dependencies

### Performance Targets
1. **API Response Time** < 500ms (P95) - NFR3
2. **Page Load Time** < 3 seconds - NFR2
3. **SMS Delivery Time** < 60 seconds - AC3
4. **Token Validation** < 100ms
5. **Invitation Creation** < 500ms

### Performance Dependencies
1. **Database Indexing**
   - Index on pending_invitations.token (unique)
   - Index on pending_invitations.invited_phone
   - Index on pending_invitations.status
   - Index on pending_invitations.expires_at

2. **Caching Strategy**
   - Cache family member lists (TTL: 5 minutes)
   - Cache user session data (Better-Auth built-in)

3. **Connection Pooling**
   - Database connection pooling (bun:sqlite built-in)
   - SMS provider connection pooling (provider-dependent)

## Monitoring Dependencies

### Metrics to Monitor
1. **Invitation Creation Rate** (invitations per day)
2. **Invitation Acceptance Rate** (% of invitations accepted)
3. **Invitation Expiration Rate** (% of invitations expired)
4. **SMS Delivery Failure Rate** (% of SMS failed)
5. **API Response Time** (P95, P99)
6. **Cleanup Job Execution Time**

### Monitoring Tools
1. **Application Logs** (Bun logging)
2. **Database Logs** (bun:sqlite logs)
3. **SMS Provider Logs** (provider dashboard)
4. **Error Tracking** (Better-Auth error logging)

### Alerting Dependencies
1. **SMS Delivery Failure Rate** > 5%
2. **API Response Time P95** > 500ms
3. **Invitation Acceptance Rate** < 50%
4. **Cleanup Job Execution Time** > 5 minutes
