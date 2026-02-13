# Issues - Story 1-2: Parent Phone Login

## Issues Encountered

### 1. Rate Limiting Storage
**Date:** 2026-02-13
**Issue:** In-memory rate limiting is not persistent across server restarts
**Impact:** Rate limit resets on server restart, allowing brute force attacks
**Workaround:** Accept for MVP (single server instance)
**Future Fix:** Implement Redis-backed rate limiting in production

### 2. Phone Number Masking in Logs
**Date:** 2026-02-13
**Issue:** Need consistent phone number masking for audit logs
**Current Approach:** Mask last 4 digits (e.g., 1380000****)
**Consideration:** Different masking strategies (middle 4 digits, first 3 digits)
**Decision:** Mask last 4 digits for now, document in tech spec

### 3. OTP Code Expiration
**Date:** 2026-02-13
**Issue:** Better-Auth phone plugin may have default OTP expiration
**Uncertainty:** What is the default OTP expiration time?
**Verification:** Check Better-Auth documentation for phone plugin configuration
**Note:** If default expiration is > 5 minutes, reduce for security

### 4. Session Refresh Strategy
**Date:** 2026-02-13
**Issue:** 36-hour rolling session refresh needs clarification
**Question:** Does session refresh happen automatically on API call, or needs explicit refresh endpoint?
**Decision:** Assume automatic refresh on API calls (Better-Auth default behavior)
**Testing:** Verify session expiration time in E2E tests

### 5. Error Message Localization
**Date:** 2026-02-13
**Issue:** All error messages should be in Chinese for parent users
**Challenge:** Ensure Shadcn Toast supports Chinese characters properly
**Verification:** Test error message display with various Chinese characters
**Note:** Consider using i18n library for future multi-language support

## Known Limitations

### 1. Single-Server Deployment
**Limitation:** In-memory rate limiting only works for single server
**Impact:** Distributed deployment would allow bypassing rate limits
**Mitigation:** Plan Redis-based rate limiting for production scaling

### 2. No CAPTCHA for Failed Attempts
**Limitation:** No CAPTCHA after multiple failed login attempts
**Risk:** Automated bots could still attempt brute force attacks
**Mitigation:** Rate limiting + account lockout provides basic protection
**Future:** Add reCAPTCHA v3 for suspicious IP addresses

### 3. No Session Management UI
**Limitation:** Users cannot view active sessions or logout remotely
**Risk:** Unauthorized session cannot be revoked without password change
**Future:** Implement session management page (show all devices, allow remote logout)

### 4. No Login Attempt Notifications
**Limitation:** Parents don't receive notifications for failed login attempts
**Risk:** Compromised account may go undetected
**Future:** Send email/SMS notification for failed login attempts from new devices

## Blockers

### None
No blockers encountered during Story 1-2 development.

## Dependencies

### Story 1-1: Parent Phone Registration (Completed)
- Better-Auth configuration ✅
- Database schema (users, families, audit-logs) ✅
- Query functions (getUserByPhone, logUserAction) ✅
- Auth layout and session management ✅

### External Dependencies
- Better-Auth 1.4.18+ ✅
- Drizzle ORM 0.45.x+ ✅
- Bun 1.3.x+ ✅
- Next.js 16.x ✅

## Testing Issues

### 1. Test Data Consistency
**Issue:** Login tests require registered user data from Story 1-1
**Workaround:** Use phone '13800000100' from Story 1-1 test fixtures
**Consideration:** Create shared test fixture file for all auth tests

### 2. E2E Test Flakiness
**Issue:** OTP verification tests may be flaky due to timing
**Mitigation:** Use longer wait times in E2E tests (increase from 3s to 5s)
**Consideration:** Mock OTP verification in integration tests

### 3. Rate Limiting Test Isolation
**Issue:** Rate limiting tests may interfere with each other
**Solution:** Use unique IP addresses in each test (mock or use different test data)
**Consideration:** Isolate rate limiting tests in separate test suite

## Performance Issues

### 1. Session Creation Latency
**Issue:** Initial session creation may take longer than 500ms on cold start
**Measurement:** Need to measure actual session creation time
**Optimization:** Consider session warmup or caching
**Target:** Keep < 500ms (P95) as per NFR3

### 2. Database Query Performance
**Issue:** getUserByPhone query may become slow with many users
**Mitigation:** Ensure phone column has index in database schema
**Optimization:** Consider caching frequent phone lookups

## Security Considerations

### 1. OTP Code Strength
**Question:** Is OTP code 4 or 6 digits? What's the expiration time?
**Requirement:** Verify Better-Auth phone plugin defaults
**Adjustment:** If default is weak, configure stronger OTP (6 digits, 5 min expiration)

### 2. Session Hijacking Risk
**Risk:** HttpOnly Cookie prevents XSS, but session tokens still vulnerable to MITM
**Mitigation:** Enforce HTTPS/TLS 1.3 (NFR8) - already in requirements
**Future:** Consider CSRF tokens for additional protection

### 3. Account Enumeration
**Risk:** Attacker can enumerate registered phone numbers via error messages
**Mitigation:** Use generic error messages (e.g., "验证码已发送" vs "手机号未注册")
**Trade-off:** User experience vs. security

## Future Improvements

### Security Enhancements
- [ ] Implement Redis-backed rate limiting
- [ ] Add reCAPTCHA v3 for suspicious IP addresses
- [ ] Add login attempt notifications (email/SMS)
- [ ] Implement session management UI (view active sessions, remote logout)
- [ ] Add device fingerprinting for anomaly detection

### User Experience
- [ ] Add "Remember me" option for extended sessions (30 days)
- [ ] Implement biometric authentication (fingerprint/face ID) for enrolled devices
- [ ] Add "Forgot PIN" flow for PIN login (Story 1-3)
- [ ] Implement single sign-on (SSO) for families with multiple devices

### Performance
- [ ] Add session warmup or caching
- [ ] Optimize getUserByPhone query with proper indexing
- [ ] Implement database connection pooling
- [ ] Add CDN for static assets

### Testing
- [ ] Create shared test fixture file for auth tests
- [ ] Mock OTP verification in integration tests
- [ ] Isolate rate limiting tests in separate suite
- [ ] Add performance tests for session creation

## Resolutions

### 1. Rate Limiting Storage
**Resolved:** Accepted in-memory rate limiting for MVP
**Rationale:** Single server deployment, acceptable risk level
**Next Step:** Plan Redis migration for production scaling

### 2. Phone Number Masking
**Resolved:** Use last 4 digits masking (e.g., 1380000****)
**Rationale:** Balance readability and privacy
**Documentation:** Added to learnings.md and tech spec

### 3. Session Refresh Strategy
**Resolved:** Confirmed Better-Auth provides automatic session refresh
**Verification:** Will test in E2E tests (session expiration behavior)
**Note:** No explicit refresh endpoint needed

## Open Questions

1. What is the default OTP code expiration time in Better-Auth phone plugin?
2. Should we use CAPTCHA for repeated failed login attempts?
3. Should we implement session management UI for users to view/revoked active sessions?
4. Should we send notifications for failed login attempts from new devices?

## Action Items

### For Future Stories
1. Document session management UI requirements for Epic 1 retrospective
2. Plan Redis integration for rate limiting (Story 6 or later)
3. Research CAPTCHA providers for suspicious login patterns
4. Define notification strategy for failed login attempts

### For Production Deployment
1. Set up Redis instance for rate limiting
2. Configure HTTPS/TLS 1.3 (NFR8)
3. Set up monitoring for failed login attempts
4. Implement backup and recovery for audit logs

## Related Stories

### Epic 1: User Authentication & Family Management
- Story 1-3: Child PIN Login (will reuse session infrastructure)
- Story 1-4: Invite Other Parent (will reuse OTP pattern)
- Story 1-5: Add Child to Family (will reuse auth guards)
- Story 1-6: Multi-Device Login (session management focus)
- Story 1-7: Primary Parent Manage Members (session validation)

### Epic 6: Admin & System Management
- Story 6-5: Admin Views Global Statistics (audit log aggregation)
- Story 6-6: Admin Sends System Announcement (notification system)
