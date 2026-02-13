# Story 1-1: Parent Phone Registration - Issues

## Problems Encountered

None - this is the initial story creation, no implementation issues yet.

## Potential Issues to Watch For

### Issue: Better-Auth Phone Plugin Configuration
**Description:** Better-Auth phone plugin may require specific SMS provider configuration
**Severity:** Medium
**Mitigation:** Use local mock OTP for development, configure real SMS provider for production

### Issue: Phone Number Encryption Storage
**Description:** Encrypting phone numbers makes database queries slower
**Severity:** Low
**Mitigation:** Index on phone hash for faster lookups

### Issue: Session Cookie Security
**Description:** HttpOnly Cookie must be properly configured to prevent XSS attacks
**Severity:** High
**Mitigation:** Use Better-Auth built-in security features, test with security audit tools

### Issue: Family Creation Race Conditions
**Description:** Multiple parents might register simultaneously causing duplicate families
**Severity:** Medium
**Mitigation:** Use database transactions when creating user + family

## Blockers

None - story is ready for development.

## Gotchas

### Better-Auth Gotchas
1. Phone plugin requires specific environment variables (e.g., SMS provider API keys)
2. Session cookies must be set with correct SameSite attribute
3. Rolling refresh requires proper token validation

### Database Gotchas
1. Foreign key constraints must be set up correctly (users.family_id → families.id)
2. Phone number encryption must be consistent between registration and login
3. Audit log timestamps must use UTC for consistency

### Testing Gotchas
1. BDD format requires business language, NOT technical terms
2. Tests must be written BEFORE implementation (TDD approach)
3. Test data must be properly cleaned up between tests

### Security Gotchas
1. Never log full phone numbers - always mask in logs (e.g., 138****0100)
2. Never store passwords in plain text or weak hashes
3. Always validate input on both client and server sides

## Environmental Issues

### Development Environment
- No issues expected with local setup
- Better-Auth works with Bun runtime

### Production Environment
- SMS provider configuration required
- Database backup strategy needed
- HTTPS/TLS 1.3 certificate required

## Dependencies

### External Dependencies
- Better-Auth 1.4.18+
- Bun 1.3.x+
- Drizzle ORM 0.45.x+
- SMS provider (for production OTP delivery)

### Internal Dependencies
- Database schema must be migrated before API can run
- Auth configuration must be set up before UI can authenticate
- Audit logging must be available for registration events

## Integration Points

### With Story 1-2: Parent Phone Login
- Shared user database schema
- Shared Better-Auth configuration
- Shared session management

### With Story 1-5: Add Child to Family
- Family creation logic from 1-1 can be reused
- Family schema is established

### With Epic 2: Task Management
- User authentication required for task operations
- Role-based access control (parent vs child)

## Performance Issues

### Expected Performance
- API response time: < 500ms (P95)
- Page load time: < 3 seconds
- OTP delivery: < 60 seconds (per AC1)

### Potential Bottlenecks
1. SMS provider delivery time
2. Database query performance (phone hash lookups)
3. Session token validation overhead

### Optimization Strategies
1. Cache user sessions for faster authentication
2. Use database indexes on frequently queried fields
3. Implement connection pooling for database queries

## Scalability Issues

### Current Scale (MVP)
- 5000 DAU target
- SQLite database sufficient
- Single server deployment

### Future Scale (Post-MVP)
- May need to upgrade to PostgreSQL
- May need Redis for session caching
- May need load balancing for high traffic

### Migration Considerations
1. Database migration path (SQLite → PostgreSQL)
2. Session storage migration (if switching to Redis)
3. SMS provider migration (if switching providers)
