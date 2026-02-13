# Story1-4: Invite Other Parent - Learnings

## Patterns and Conventions

### Invitation Token Management
- Invitation tokens: UUID + timestamp for uniqueness and traceability
- Token expiration: 24 hours from creation
- Storage location: `pending_invitations` table with encrypted phone number
- Token validation: Check status='pending' AND created_at > 24 hours ago

### Invitation Flow Architecture
- Primary parent sends invitation → system generates token → sends SMS → stores in pending_invitations
- Invited parent clicks link → system validates token → redirects to registration → user joins existing family
- Critical difference from Story 1-1: Invited user JOINS existing family, does NOT create new family

### Database Schema for Invitations
- pending_invitations table: `id`, `token`, `inviter_user_id`, `family_id`, `invited_phone` (encrypted), `status` (pending/accepted/expired), `created_at`, `expires_at`
- Foreign keys: inviter_user_id → users.id, family_id → families.id
- Status enum: pending/accepted/expired

### Query Organization
- New query file: `lib/db/queries/invitations.ts`
- Function-based exports: `createInvitation()`, `getInvitationByToken()`, `updateInvitationStatus()`, `getFamilyInvitations()`
- Reuse pattern from Stories 1-1, 1-2, 1-3: per-table query files

### Family Management Patterns
- Primary parent identification: users.id === families.primary_parent_id
- Secondary parent addition: users.family_id = families.id (same as primary parent)
- Role assignment: Both primary and secondary parents use role='parent'
- Permission check: Only primary parent can send invitations

### Security Requirements
- Invitation phone encryption: Use `Bun.password.hash()` (same as Story 1-1)
- Invitation tokens: UUID + timestamp prevents brute force attacks
- Token expiration: 24 hours prevents stale invitation abuse
- Permission verification: Check users.id === families.primary_parent_id before allowing invitation

### SMS Notification Pattern
- Reuse Better-Auth phone plugin for invitation SMS (from Story 1-1)
- Invitation link format: `/api/auth/accept-invitation?token={token}`
- SMS includes invitation token and registration instructions
- Confirmation notifications: sent to both primary parent and invited parent

### Testing Standards
- BDD format: Given-When-Then with business language
- Tests BEFORE implementation (TDD approach)
- Bun Test for unit/integration tests
- Playwright for E2E tests
- Test coverage ≥ 60%

## Successful Approaches

### Creating Invitation Token
1. Generate UUID + timestamp for uniqueness
2. Store in pending_invitations table with status='pending'
3. Set expiration time (24 hours from creation)
4. Encrypt invited phone number using `Bun.password.hash()`

### Invitation Acceptance Flow
1. Validate token exists and is valid (pending, not expired)
2. Pre-fill registration form with invited phone number
3. Reuse Story 1-1 registration flow
4. Modify createUser to accept optional family_id parameter
5. Link new user to existing family (DON'T create new family)
6. Update invitation status to 'accepted'
7. Create session for invited parent (36-hour HttpOnly Cookie)

### Permission Verification Pattern
```typescript
// Check if current user is primary parent
const family = await getFamilyByUserId(currentUserId);
const isPrimaryParent = family.primary_parent_id === currentUserId;
if (!isPrimaryParent) {
  throw new Error('只有主要家长可以发送邀请');
}
```

### Invitation Cleanup Pattern
- Daily cleanup job marks expired invitations
- Mark as 'expired' if created_at > 24 hours
- Log cleanup operations for audit trail

## Common Issues Resolved

### Issue: Preventing Invitation Spam
**Solution:** Rate limiting for primary parent invitations (max 10 per day)

### Issue: Token Security
**Solution:** UUID + timestamp prevents brute force, 24-hour expiration limits token validity window

### Issue: Duplicate Invitations
**Solution:** Check if phone already invited (pending) to the same family before creating new invitation

### Issue: Primary Parent Verification
**Solution:** Query families table and compare users.id with families.primary_parent_id

### Issue: Family Linkage for Invited User
**Solution:** Reuse Story 1-1 createUser but add optional family_id parameter to join existing family

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
✅ Better-Auth 1.4.18+ with phone plugin for SMS notifications
✅ 36-hour session rolling refresh (same for invited parent)
✅ HttpOnly Cookie for session tokens

### Family Management Architecture
✅ Primary parent creates family (Story 1-1)
✅ Secondary parents join existing family (this story)
✅ Role enum: parent (both primary and secondary), child, admin
✅ Family linkage: users.family_id = families.id for all family members

### Project Structure Alignment
✅ Follows directory structure from architecture.md (lines 376-756)
✅ Naming conventions: kebab-case files, camelCase functions, PascalCase components
✅ Per-table query files in `lib/db/queries/`

## Performance Requirements

### Response Time Targets
- API response time < 500ms (P95) - NFR3
- Page load time < 3 seconds - NFR2
- SMS delivery time < 60 seconds (per AC3)

### Optimization Strategies
- Use Drizzle ORM query builder for efficient database queries
- Implement proper database indexing on token and phone fields
- Cache frequently accessed data (family members, invitations)

## Security Compliance

### Data Protection
- Phone number encryption required (NFR9) - use `Bun.password.hash()`
- Password hashing using `Bun.password.hash()` (NFR10)
- All data transmission over HTTPS/TLS 1.3 (NFR8)

### Access Control
- RBAC with roles: parent/child/admin
- Primary parent permission check before invitation creation
- Session-based authentication for invited parent

### Audit Logging
- Record all invitation events (create, accept, expire) - NFR14
- Include timestamp, inviter_id (masked), invited_phone (masked), family_id, status

## Notes for Next Stories

### Story 1-5: Add Child to Family
- Reuse family linking pattern: users.family_id = families.id
- Child registration with PIN code (similar to Story 1-3)
- Set role=child
- Parent permission check (any parent can add child to their family)

### Story 1-6: Multi-Device Login
- Session management already supports multiple devices (36-hour rolling refresh)
- No changes needed to authentication infrastructure
- May need to track active sessions for device management

### Story 1-7: Primary Parent Manage Members
- Reuse family members listing from this story (getFamilyInvitations)
- Add child management (suspend/activate)
- Transfer primary parent role (requires both parents' confirmation)

## Integration with Previous Stories

### Story 1-1: Parent Phone Registration
- Reuse Better-Auth phone plugin for SMS notifications
- Reuse createUser function (modify to accept optional family_id)
- Reuse session management (36-hour HttpOnly Cookie)

### Story 1-2: Parent Phone Login
- Reuse session creation for invited parent
- Reuse rate limiting pattern (for invitation rate limiting)

### Story 1-3: Child PIN Login
- Reuse role verification pattern (parent vs child)
- Reuse family association pattern (family_id validation)

## Key Innovations

### Invitation Flow Innovation
- Invitation token mechanism enables secure family member addition
- Reuses registration flow but links to existing family instead of creating new one
- Primary/secondary parent distinction via primary_parent_id field
- Invitation status tracking (pending/accepted/expired) for better UX

### Database Schema Innovation
- pending_invitations table: decouples invitation process from user registration
- Encrypted phone number protects privacy even in pending state
- Token-based approach prevents enumeration attacks
- Foreign key constraints maintain data integrity

### Permission Management Innovation
- Primary parent verification: users.id === families.primary_parent_id
- Secondary parents have same role='parent' but cannot send invitations
- Clean separation between creation authority (primary parent) and operational authority (all parents)
