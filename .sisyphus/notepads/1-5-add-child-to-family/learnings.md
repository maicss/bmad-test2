# Story 1-5: Add Child to Family - Learnings

## Patterns and Conventions

### Child Account Creation Architecture
- **Direct Parent Creation:** Parent can directly create child accounts (unlike secondary parent invitation flow from Story 1-4)
- **Automatic PIN Generation:** System generates unique 4-digit PIN (0000-9999), ensures no conflicts in same family
- **PIN Uniqueness Constraint:** Must check existing children in family to avoid duplicate PINs
- **No Phone Number Required:** Children use PIN login only (no phone field in child accounts)

### Database Schema Reuse
- **No New Schema Needed:** All tables already created in Story 1-1 (users table with role enum, families table)
- **Role Enum Reuse:** Users table role enum already has 'child' option (from Story 1-1, 1-3)
- **Family Linkage Pattern:** Child accounts link to parent's family via users.family_id = families.id (same as Story 1-4 for secondary parents)
- **Password Hash Field Reuse:** PIN stored encrypted in users.password_hash field (same as Story 1-3 for child PIN login)

### Query Organization
- **Extend Existing Files:** Add child management functions to `lib/db/queries/users.ts` (createChildAccount, suspendChildAccount, activateChildAccount)
- **Reuse Query Patterns:** Use same Drizzle ORM query builder patterns from Stories 1-1, 1-2, 1-3, 1-4
- **No New Files Needed:** child queries added to existing users.ts file (per-table pattern)

### PIN Security Requirements
- **PIN Generation:** Random 4-digit code (0000-9999)
- **PIN Encryption:** Use `Bun.password.hash()` for PIN storage in password_hash field (from Story 1-3)
- **PIN Verification:** Child login uses `Bun.password.verify()` (from Story 1-3)
- **PIN Uniqueness:** System ensures unique PIN per child in family (no duplicates)

### Child Account Management
- **Account Status:** Parent can suspend/activate child accounts (status: active/suspended)
- **Account Suspension:** Suspended accounts cannot login via PIN (similar to Story 1-4 invitation expiration)
- **Permission Check:** Any parent (primary or secondary) can manage children in their family (not just primary parent like invitations in Story 1-4)

### UI Patterns
- **Child List Display:** Show name, PIN (viewable), created_at, status (from Story 1-4 family management pattern)
- **Add Child Form:** Name input, age input (6-12 years), PIN display (auto-generated)
- **Action Buttons:** "Suspend/Activate" toggle for each child
- **Responsive Design:** Mobile-first (< 450px) for mini-program optimization (same as parent-end from Story 1-4)

### Testing Standards
- **BDD format:** Given-When-Then with business language
- **Tests BEFORE implementation:** TDD approach from AGENTS.md
- **Bun Test for unit/integration tests**
- **Playwright for E2E tests**
- **Test coverage ≥ 60%**

## Successful Approaches

### Child Account Creation Flow
1. Parent enters child name and age (6-12 years)
2. System generates unique 4-digit PIN (checks for conflicts with existing children in family)
3. System encrypts PIN using `Bun.password.hash()` and stores in password_hash field
4. System creates user record with role='child' and family_id=parent's family_id
5. System logs child creation event to audit logs
6. System returns child data to parent (name, PIN, familyId, role)

### PIN Generation Pattern
```typescript
// Correct pattern for PIN generation
export async function generateUniquePIN(familyId: string): Promise<string> {
  const existingPINS = await getFamilyChildPINs(familyId);
  let pin: string;
  do {
    pin = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  } while (existingPINS.includes(pin));
  return pin;
}
```

### Error Handling Pattern
- Use Shadcn Toast for user-facing errors (REUSE from Stories 1-1, 1-2, 1-3, 1-4)
- Use proper error codes from `lib/constants/error-codes.ts`
- Mask sensitive data in error messages (PIN in logs, etc.)

## Common Issues Resolved

### Issue: PIN Code Conflicts in Same Family
**Solution:** Generate random PIN and check against existing children's PINs in the same family, regenerate if conflict exists

### Issue: Child Login After Account Suspension
**Solution:** Check account status during PIN login (from Story 1-3), return error message "账户已挂起" if suspended

### Issue: Parent Permission for Child Management
**Solution:** Verify user.role='parent' AND user.family_id matches child's family_id (any parent in family can manage children)

### Issue: PIN Code Security
**Solution:** PIN encrypted using `Bun.password.hash()` in password_hash field, same as Story 1-3 for child PIN login

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
✅ Better-Auth 1.4.18+ with phone plugin for parents
✅ PIN login for children (from Story 1-3)
✅ 36-hour session rolling refresh (same as parents)
✅ HttpOnly Cookie for session tokens

### Family Management Architecture
✅ Primary parent creates family (Story 1-1)
✅ Secondary parents join existing family (Story 1-4)
✅ Children can be added to existing family (this story)
✅ Role enum: parent (primary and secondary), child, admin
✅ Family linkage: users.family_id = families.id for all family members
✅ Child accounts use role='child' and PIN login

### Project Structure Alignment
✅ Follows directory structure from architecture.md (lines 376-756)
✅ Naming conventions: kebab-case files, camelCase functions, PascalCase components
✅ Per-table query files in `lib/db/queries/` (extend users.ts for child management)

## Performance Requirements

### Response Time Targets
- API response time < 500ms (P95) - NFR3
- Page load time < 3 seconds - NFR2

### Optimization Strategies
- Use Drizzle ORM query builder for efficient database queries
- Implement proper database indexing on family_id and password_hash fields
- Cache frequently accessed data (family members, children list)

## Security Compliance

### Data Protection
- PIN code encryption required (NFR9) - use `Bun.password.hash()`
- Password hashing using `Bun.password.hash()` (NFR10)
- All data transmission over HTTPS/TLS 1.3 (NFR8)

### Access Control
- RBAC with roles: parent/child/admin
- Parent permission check before child management (any parent in family)
- Child role check during PIN login (from Story 1-3)
- Session-based authentication (36-hour HttpOnly Cookie)

### Audit Logging
- Record all child creation events (NFR14)
- Record all child suspension/activation events
- Include timestamp, parent_id (masked), child_id, family_id, PIN (masked)

## Notes for Next Stories

### Story 1-6: Multi-Device Login
- Reuse session management from Story 1-1, 1-2, 1-3
- Session management already supports multiple devices (36-hour rolling refresh)
- May need to track active sessions for device management

### Story 1-7: Primary Parent Manage Members
- Reuse family members listing from Story 1-4 (getFamilyInvitations)
- Add child management (suspend/activate) from this story
- Transfer primary parent role (requires both parents' confirmation)
- Parent role management (primary ↔ secondary parent)

## Integration with Previous Stories

### Story 1-1: Parent Phone Registration
- Reuse Better-Auth phone plugin for SMS notifications (not needed for child creation)
- Reuse database schema (users, families, audit-logs tables)
- Reuse user creation patterns (modified for child accounts without phone)
- Reuse session management (36-hour HttpOnly Cookie)

### Story 1-2: Parent Phone Login
- Reuse session creation for parent (used for child creation by parent)
- Reuse rate limiting pattern (for child creation rate limiting)
- Parent must be logged in to create child accounts

### Story 1-3: Child PIN Login
- Reuse PIN login authentication flow (child uses PIN to login)
- Reuse PIN encryption using `Bun.password.hash()`
- Reuse PIN verification using `Bun.password.verify()`
- Reuse child role verification (user.role === 'child')
- Reuse family association pattern (family_id validation)

### Story 1-4: Invite Other Parent
- Reuse family management patterns (family members listing)
- Reuse family linkage pattern (users.family_id = families.id)
- Reuse parent permission check pattern (modified for child management - any parent can manage children)
- Reuse UI patterns (family/children management interface)
- Reuse audit logging pattern (invitation events → child creation events)

## Key Innovations

### Child Account Creation Innovation
- Direct parent creation flow (no invitation needed, unlike Story 1-4 for secondary parents)
- Automatic PIN generation with uniqueness constraint (system ensures unique PINs in family)
- No phone number required for children (simplified registration)
- Child accounts automatically link to parent's existing family (no new family creation)

### Child Account Management Innovation
- Parent can suspend/activate child accounts (parental control)
- Account status affects child login ability (suspended accounts cannot login)
- Any parent (primary or secondary) can manage children (flexible permission model)

### PIN Security Innovation
- Unique PIN generation per child in family (prevents confusion)
- PIN encrypted and stored in password_hash field (same as child PIN login)
- Parent can view child's PIN (for initial setup or reset)
- PIN uniqueness check ensures no duplicate PINs in same family

### Database Schema Reuse Innovation
- No new schema needed for child creation (users table already has role enum and family_id)
- Password hash field reused for PIN storage (flexible design)
- Family linkage pattern reused for children (same as secondary parents from Story 1-4)
