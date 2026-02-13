# Story 1-1: Parent Phone Registration - Learnings

## Patterns and Conventions

### Authentication Setup
- Better-Auth 1.4.18+ with phone plugin is the chosen authentication solution
- Configuration location: `lib/auth/index.ts`
- Session management: 36-hour rolling refresh via HttpOnly Cookie (ADR-3)

### Database Schema for Authentication
- Users table: `id`, `phone` (encrypted), `role` (enum: parent/child/admin), `password_hash`, `family_id`, `created_at`
- Families table: `id`, `primary_parent_id`, `created_at`
- Audit logs table: `id`, `user_id`, `action_type`, `timestamp`, `ip_address`

### Query Organization
- Per-table query files: `lib/db/queries/users.ts`, `lib/db/queries/families.ts`
- Function-based exports: `getUserByPhone()`, `createUser()`, `createFamily()`
- NO Repository pattern - direct function exports

### Security Requirements
- Phone number encryption: Use `Bun.password.hash()` (NOT bcrypt library)
- Password hashing: Same `Bun.password.hash()` for consistency
- HttpOnly Cookie for session tokens
- Audit logging for all registration events

### Testing Standards
- BDD format: Given-When-Then with business language
- Tests BEFORE implementation (TDD approach)
- Bun Test for unit/integration tests
- Playwright for E2E tests
- Test coverage ≥ 60%

### File Organization
- Schema files: `database/schema/[table].ts`
- Query files: `lib/db/queries/[table].ts`
- API routes: `app/api/[feature]/[action]/route.ts`
- UI pages: `app/(route-group)/[page]/page.tsx`

## Successful Approaches

### Creating Better-Auth Configuration
1. Install Better-Auth with phone plugin
2. Configure session duration (36 hours)
3. Set up HttpOnly Cookie
4. Enable OTP verification via phone plugin

### Database Query Pattern
```typescript
// Correct pattern for user query
export async function getUserByPhone(phone: string) {
  const users = await db.select().from(usersTable).where(eq(usersTable.phone, phone));
  return users[0];
}
```

### Error Handling Pattern
- Use Shadcn Toast components for user-facing errors
- Use proper error codes from `lib/constants/error-codes.ts`
- Mask sensitive data in error messages

## Common Issues Resolved

### Issue: Phone Number Format Validation
**Solution:** Validate 11-digit Chinese phone numbers (starts with 1) before sending OTP

### Issue: Automatic Family Creation
**Solution:** When parent registers, automatically create:
1. User record with role=parent
2. Family record with primary_parent_id set to new user's ID
3. Link user to family via foreign key

### Issue: Session Management
**Solution:** Use Better-Auth built-in session management with 36-hour rolling refresh

## Technical Constraints Enforced

### RED LIST Rules (AGENTS.md)
1. ✅ Use Drizzle ORM ONLY - NO native SQL
2. ✅ Database queries in `lib/db/queries/` per-table files
3. ✅ Use `Bun.password.hash()` - NO bcrypt library
4. ✅ Use `Bun.env` - NO `process.env`
5. ✅ NO `any` type - use `unknown` + type guards
6. ✅ NO `alert()` - use Shadcn Dialog/Toast
7. ✅ BDD Given-When-Then format - tests before implementation

### File Length Constraint
- All files must be ≤ 800 lines
- Split large files into smaller modules if needed

## Architecture Compliance

### ADR-3: Authentication Architecture
✅ Better-Auth 1.4.18+ with phone plugin for OTP verification
✅ 36-hour session rolling refresh
✅ HttpOnly Cookie for session tokens

### Project Structure Alignment
✅ Follows directory structure from architecture.md (lines 376-756)
✅ Naming conventions: kebab-case files, camelCase functions, PascalCase components
✅ Per-table query files in `lib/db/queries/`

## Performance Requirements

### Response Time Targets
- API response time < 500ms (P95) - NFR3
- Page load time < 3 seconds - NFR2

### Optimization Strategies
- Use Drizzle ORM query builder for efficient database queries
- Implement proper database indexing on phone field
- Cache frequently accessed data (session, user info)

## Security Compliance

### Data Protection
- Phone number encryption required (NFR9)
- Password hashing using `Bun.password.hash()` (NFR10)
- All data transmission over HTTPS/TLS 1.3 (NFR8)

### Access Control
- RBAC with roles: parent/child/admin
- Session-based authentication
- HttpOnly Cookie prevents XSS attacks

### Audit Logging
- Record all registration events (NFR14)
- Include timestamp, phone (masked), IP, action_type

## Notes for Next Stories

### Story 1-2: Parent Phone Login
- Reuse Better-Auth configuration from 1-1
- User lookup via phone number (already created in 1-1)
- Session management already set up

### Story 1-3: Child PIN Login
- PIN code stored in users table (add field if needed)
- Different authentication flow (no OTP)
- Child role check during login

### Story 1-4: Invite Other Parent
- Use existing users table structure
- Add secondary parent to family
- Send invitation notification

### Story 1-5: Add Child to Family
- Child registration with PIN code
- Link child to existing family
- Set role=child
