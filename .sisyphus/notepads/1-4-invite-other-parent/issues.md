# Story1-4: Invite Other Parent - Issues

## Problems Encountered

None - this is initial story creation, no implementation issues yet.

## Potential Issues to Watch For

### Issue: Better-Auth Phone Plugin SMS Content Configuration
**Description:** Invitation SMS content may need customization to include invitation link and instructions
**Severity:** Medium
**Mitigation:** Test SMS content in development, configure template variables for token and expiration

### Issue: Invitation Token Collision
**Description:** UUID + timestamp could theoretically collide (extremely low probability)
**Severity:** Low
**Mitigation:** Add database unique constraint on token field to prevent duplicates

### Issue: Invitation Email vs SMS
**Description:** Better-Auth phone plugin sends SMS, but some regions may prefer email invitations
**Severity:** Low
**Mitigation:** Use SMS for MVP, consider email plugin for international expansion

### Issue: Family Member Limit
**Description:** No explicit limit on number of parents per family in current schema
**Severity:** Medium
**Mitigation:** Add validation to prevent excessive parents (e.g., max 5 per family)

### Issue: Pending Invitations Cleanup
**Description:** Expired invitations may accumulate if cleanup job fails
**Severity:** Medium
**Mitigation:** Implement reliable cleanup job with retry logic and monitoring

### Issue: Invitation Acceptance Race Conditions
**Description:** Multiple users might click same invitation link simultaneously
**Severity:** Low
**Mitigation:** Use database transactions when updating invitation status and creating user

### Issue: Primary Parent Verification Race Conditions
**Description:** Primary parent might transfer role while invitation is being created
**Severity:** Medium
**Mitigation:** Verify primary parent status within database transaction

### Issue: Phone Number Encryption Collision
**Description:** Two different phone numbers could hash to same value (collision)
**Severity:** Very Low
**Mitigation:** Use strong hashing algorithm (bcrypt-equivalent), handle collision gracefully

## Blockers

None - story is ready for development.

## Gotchas

### Better-Auth Gotchas
1. Phone plugin SMS content customization may require environment variable configuration
2. Invitation link format must match Better-Auth expectations
3. Session creation for invited parent must use same configuration as Story 1-1

### Database Gotchas
1. Foreign key constraints must be set up correctly:
   - pending_invitations.inviter_user_id → users.id
   - pending_invitations.family_id → families.id
2. Phone number encryption must be consistent (use Bun.password.hash() everywhere)
3. Invitation tokens must be unique (add database unique constraint)
4. Status enum must be defined correctly (pending/accepted/expired)
5. Timestamps must use UTC for consistency

### Token Management Gotchas
1. Token expiration must be checked on every validation (created_at > 24 hours)
2. Token must be marked as 'accepted' immediately after successful registration
3. Expired tokens should be marked as 'expired' by cleanup job
4. Tokens should be single-use (prevent reuse after acceptance)

### Permission Gotchas
1. Only primary parent can send invitations (verify users.id === families.primary_parent_id)
2. Secondary parents have same role='parent' but cannot send invitations
3. Permission check must be done BEFORE creating invitation record
4. Permission check must be done within database transaction

### Testing Gotchas
1. BDD format requires business language, NOT technical terms
2. Tests must be written BEFORE implementation (TDD approach)
3. Test data must include primary parent, secondary parent, and family records
4. Test SMS mocking (don't send real SMS in tests)
5. Test token expiration scenarios (24 hours)

### SMS Notification Gotchas
1. Invitation link must be accessible and properly formatted
2. SMS content must include clear instructions
3. SMS delivery time may vary (< 60 seconds per AC3)
4. SMS delivery failures must be logged and handled gracefully

### Family Management Gotchas
1. Invited parent must JOIN existing family, not create new one
2. Family ID must be correctly set in users.family_id field
3. Primary parent ID must NOT be changed (families.primary_parent_id remains same)
4. Role must be set to 'parent' (not 'admin' or 'child')

### Security Gotchas
1. Never log full invitation tokens in plaintext
2. Never log full phone numbers - always mask in logs (e.g., 138****0200)
3. Always validate token on every use (existence, status, expiration)
4. Always encrypt invited phone numbers using Bun.password.hash()
5. Always verify primary parent permission before invitation creation

## Environmental Issues

### Development Environment
- SMS provider may require mock configuration for development
- Token expiration testing requires time manipulation or long wait times
- Invitation link testing requires proper domain configuration

### Production Environment
- SMS provider configuration required (API keys, templates)
- Cleanup job scheduling (cron job or task queue)
- Monitoring for invitation acceptance rates and failures
- Rate limiting for invitation spam prevention

### Database Environment
- SQLite (development) vs PostgreSQL (production) migration considerations
- Indexing strategy for token and phone fields
- Backup strategy for pending_invitations table
- Transaction isolation for race condition prevention

## Dependencies

### External Dependencies
- Better-Auth 1.4.18+ (phone plugin for SMS)
- Bun 1.3.x+ (for password hashing and runtime)
- Drizzle ORM 0.45.x+ (for database queries)
- UUID generation library (crypto.randomUUID() or similar)
- SMS provider (for production invitation delivery)

### Internal Dependencies
- Better-Auth configuration (from Story 1-1)
- Users table schema (from Story 1-1)
- Families table schema (from Story 1-1)
- Audit logging system (from Story 1-1)
- Session management (from Story 1-1)
- createUser function (from Story 1-1, modified for family_id)

### Story Dependencies
- **Story 1-1 (Parent Phone Registration):** Required for Better-Auth setup, users table, families table
- **Story 1-2 (Parent Phone Login):** Required for session management patterns
- **Story 1-3 (Child PIN Login):** Required for role verification patterns

### Database Schema Dependencies
1. Users table must exist (created in Story 1-1)
2. Families table must exist (created in Story 1-1)
3. Audit logs table must exist (created in Story 1-1)
4. Pending_invitations table must be created (this story)
5. Migration for pending_invitations must be run before API can work

## Integration Points

### With Story 1-1: Parent Phone Registration
- Shared Better-Auth configuration (phone plugin)
- Shared users and families table schema
- Shared session management (36-hour HttpOnly Cookie)
- Shared audit logging system
- **Integration:** Modify createUser to accept optional family_id parameter

### With Story 1-2: Parent Phone Login
- Shared session management for invited parent
- Shared rate limiting pattern (can reuse for invitation rate limiting)
- **Integration:** Reuse session creation after invitation acceptance

### With Story 1-3: Child PIN Login
- Shared role verification patterns
- Shared family association patterns
- **Integration:** Verify role='parent' for invited user

### With Story 1-5: Add Child to Family
- Shared family linkage pattern (users.family_id = families.id)
- Shared parent permission verification
- **Integration:** Reuse family members listing functionality

### With Epic 2: Task Management
- Family member roles required for task permissions
- Parent/child role distinction for task operations
- **Integration:** Family members can be assigned tasks based on role

### With Epic 4: Wishlist Management
- Family members have access to shared wishes
- Parent permissions for wish approval
- **Integration:** Secondary parents can approve wishes (same as primary parent)

## Performance Issues

### Expected Performance
- API response time: < 500ms (P95) - NFR3
- Page load time: < 3 seconds - NFR2
- SMS delivery time: < 60 seconds (per AC3)
- Token validation: < 100ms
- Invitation creation: < 500ms

### Potential Bottlenecks
1. SMS provider delivery time and rate limits
2. Database query performance (token lookups, phone encryption)
3. Invitation cleanup job execution time (if many expired invitations)
4. Race condition handling (transaction overhead)

### Optimization Strategies
1. Cache family member lists for frequent access
2. Use database indexes on token and phone fields
3. Implement connection pooling for database queries
4. Batch cleanup job operations (delete multiple expired invitations at once)
5. Implement rate limiting for invitation creation (max 10 per day)

## Scalability Issues

### Current Scale (MVP)
- 5000 DAU target
- SQLite database sufficient
- Single server deployment
- Invitation tokens stored in SQLite
- Cleanup job runs on single server

### Future Scale (Post-MVP)
- May need to upgrade to PostgreSQL
- May need Redis for token caching
- May need distributed cleanup job coordination
- May need sharding for large pending_invitations table

### Migration Considerations
1. Database migration path (SQLite → PostgreSQL)
2. Token storage migration (if moving to Redis)
3. SMS provider migration (if switching providers)
4. Cleanup job migration (if moving to distributed task queue)

## Compliance Issues

### Data Privacy (COPPA/GDPR/China)
- Phone number encryption required (NFR9) ✅ (using Bun.password.hash())
- Invitation tokens must expire (24 hours) ✅
- Audit logging required (NFR14) ✅
- User consent for SMS notifications may be required

### Accessibility (WCAG AA)
- Family management UI must be accessible to all users
- Error messages must be clear and understandable
- Invitation forms must support screen readers

### Internationalization
- SMS content may need localization for different regions
- Phone number validation may vary by country
- Time zones for expiration times (use UTC)

## Monitoring and Alerting

### Key Metrics to Monitor
1. Invitation creation rate (invitations per day)
2. Invitation acceptance rate (% of invitations accepted)
3. Invitation expiration rate (% of invitations expired)
4. SMS delivery failure rate
5. API response time (P95, P99)
6. Cleanup job execution time

### Alert Thresholds
1. SMS delivery failure rate > 5%
2. API response time P95 > 500ms
3. Invitation acceptance rate < 50% (may indicate UX issues)
4. Cleanup job execution time > 5 minutes
5. Database connection failures
6. Better-Auth session creation failures

## Testing Strategy

### Unit Tests (Bun Test)
- Token generation and validation
- Phone number encryption and hashing
- Invitation record creation and update
- Permission verification logic
- Status transitions (pending → accepted/expired)

### Integration Tests (Bun Test)
- Invitation creation API endpoint
- Invitation acceptance API endpoint
- Family members listing API endpoint
- Database transaction rollback scenarios
- SMS notification triggering

### E2E Tests (Playwright)
- Complete invitation flow (send → click → register → join)
- Permission checks (non-primary parent attempting invitation)
- Token expiration scenarios
- SMS delivery and link access
- Family members display and management

### Performance Tests
- Load testing for invitation creation (simulating multiple parents)
- SMS delivery time monitoring
- Database query performance under load
- Token validation response time

### Security Tests
- Token brute force attempts
- SQL injection attempts (should be blocked by Drizzle ORM)
- XSS attempts on invitation links
- CSRF protection on invitation forms
- Phone number enumeration attacks
