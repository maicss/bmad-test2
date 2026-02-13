# Story 1-5: Add Child to Family - Issues

## Problems Encountered

None - this is the initial story creation, no implementation issues yet.

## Potential Issues to Watch For

### Issue: PIN Code Collision in Same Family
**Description:** Random 4-digit PIN generation may create duplicate PINs for children in the same family
**Severity:** Medium
**Mitigation:** Check existing children's PINs in the same family before accepting generated PIN, regenerate if conflict exists

### Issue: Child Login After Account Suspension
**Description:** Suspended child accounts may still be able to login if status check is not enforced in PIN login flow
**Severity:** High
**Mitigation:** Verify account status (is_active) during PIN login validation in Story 1-3's PIN login endpoint

### Issue: Parent Permission Check for Child Management
**Description:** Primary/secondary parent permission check may not correctly allow secondary parents to manage children
**Severity:** Medium
**Mitigation:** Verify user.role='parent' AND user.family_id matches child's family_id (any parent in family can manage children, not just primary parent like invitations in Story 1-4)

### Issue: PIN Code Security in Display
**Description:** Parent viewing child's PIN may expose it to unauthorized users if displayed in plain text
**Severity:** Medium
**Mitigation:** Mask PIN in display (e.g., "111*" or show only when requested), or use a "View PIN" button that requires parent confirmation

### Issue: Child Age Validation Range
**Description:** Children outside 6-12 age range may attempt to be added to family (system designed for 6-12 years per PRD)
**Severity:** Low
**Mitigation:** Validate age input (6-12 years) during child creation, show error message if outside range

## Blockers

None - story is ready for development.

## Gotchas

### PIN Generation Gotchas
1. Random PIN must be unique per child in the same family (not globally unique)
2. PIN range: 0000-9999 (4 digits, leading zeros allowed)
3. PIN must be encrypted using `Bun.password.hash()` before storage
4. PIN uniqueness check must include all children in the family, not just active ones

### Database Gotchas
1. No new schema migrations needed - all tables already exist from Story 1-1
2. Child accounts use same users table as parents (role='child' instead of 'parent')
3. password_hash field stores encrypted PIN for children (reusing field from Story 1-3)
4. family_id field links child to parent's existing family (same pattern as Story 1-4 for secondary parents)
5. Account status field may need to be added if not exists (or use is_active boolean)

### API Gotchas
1. Parent must be authenticated (login session) to create child accounts
2. Any parent (primary or secondary) can create children in their family
3. Parent permission check: user.role='parent' AND user.family_id matches child's family_id
4. PIN generation must be atomic (generate + check uniqueness in transaction)
5. Child creation should return child data including PIN for parent to view

### Testing Gotchas
1. BDD format requires business language, NOT technical terms
2. Tests must be written BEFORE implementation (TDD approach)
3. Test data must reference existing parent accounts from Stories 1-1, 1-2
4. PIN uniqueness tests must check for conflicts in same family
5. Account suspension tests must verify child cannot login when suspended

### Security Gotchas
1. Never log full PIN codes - always mask in logs (e.g., "111*" or "PIN: ****")
2. Never store PIN codes in plain text - always encrypt using `Bun.password.hash()`
3. Always validate parent permission before child management operations
4. Always validate child account status before allowing PIN login
5. Always audit log child creation and suspension events

## Environmental Issues

### Development Environment
- No issues expected with local setup
- Better-Auth works with Bun runtime (from Story 1-1)
- Drizzle ORM works with Bun and SQLite (from Story 1-1)

### Production Environment
- Database backup strategy needed (for child accounts)
- HTTPS/TLS 1.3 certificate required (NFR8)
- Rate limiting for child creation to prevent abuse (similar to Story 1-2 login rate limiting)

## Dependencies

### External Dependencies
- Better-Auth 1.4.18+ (already configured in Story 1-1)
- Bun 1.3.x+ (already configured in project)
- Drizzle ORM 0.45.x+ (already configured in Story 1-1)

### Internal Dependencies
- Database schema must be migrated before API can run (already migrated in Story 1-1)
- Auth configuration must be set up (already configured in Story 1-1)
- Audit logging must be available for child creation events (already available from Story 1-1)
- Parent login session must be available (already implemented in Story 1-2)
- Child PIN login must be available (already implemented in Story 1-3)
- Family management must be available (already implemented in Story 1-4)

## Integration Points

### With Story 1-1: Parent Phone Registration
- Shared database schema (users, families, audit-logs tables)
- Shared Better-Auth configuration (phone plugin, 36-hour session)
- Shared session management (36-hour HttpOnly Cookie)
- User creation pattern (modified for child accounts without phone)

### With Story 1-2: Parent Phone Login
- Shared session management (parent login session)
- Parent must be logged in to create child accounts
- Shared rate limiting pattern (for child creation rate limiting)
- Shared error handling (Shadcn Toast)

### With Story 1-3: Child PIN Login
- Shared PIN encryption using `Bun.password.hash()`
- Shared PIN verification using `Bun.password.verify()`
- Shared child role verification (user.role === 'child')
- Shared family association (family_id validation)
- Child accounts created here can login using Story 1-3's PIN login endpoint

### With Story 1-4: Invite Other Parent
- Shared family management patterns (family members listing)
- Shared family linkage pattern (users.family_id = families.id)
- Shared parent permission check pattern (modified - any parent can manage children)
- Shared UI patterns (family/children management interface)
- Shared audit logging pattern (invitation events → child creation events)

### With Epic 2: Task Management
- Child accounts needed for task assignment and completion
- Parent accounts needed for task creation and approval
- Family linkage required for task filtering by family

### With Epic 3: Points System
- Child accounts needed for points tracking and balance management
- Parent accounts needed for points adjustment and history viewing
- Family linkage required for points aggregation by family

## Performance Issues

### Expected Performance
- API response time: < 500ms (P95)
- Page load time: < 3 seconds
- PIN generation time: < 100ms (random 4-digit generation)

### Potential Bottlenecks
1. PIN uniqueness check (query existing children in family)
2. PIN encryption using `Bun.password.hash()` (but should be fast)
3. Child account creation rate (need rate limiting to prevent abuse)

### Optimization Strategies
1. Cache family children list for PIN uniqueness check
2. Use database indexes on family_id and password_hash fields
3. Implement rate limiting for child creation (max 5 children per day per parent)
4. Use database transactions for atomic PIN generation and child creation

## Scalability Issues

### Current Scale (MVP)
- 5000 DAU target
- SQLite database sufficient
- Single server deployment

### Future Scale (Post-MVP)
- May need to upgrade to PostgreSQL for larger families
- May need Redis for caching child lists
- May need load balancing for high traffic

### Migration Considerations
1. Database migration path (SQLite → PostgreSQL)
2. PIN encryption migration (if changing hash algorithm)
3. Account status migration (if adding new fields)
