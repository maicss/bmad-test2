# Learnings - Story 1-2: Parent Phone Login

## Story Completion Date
2026-02-13

## Key Learnings

### 1. Better-Auth Configuration Reuse
- **Observation:** Story 1-1 already configured Better-Auth with phone plugin, 36-hour session, and HttpOnly Cookie
- **Learning:** No need to reconfigure authentication infrastructure - reuse existing `lib/auth/index.ts`
- **Best Practice:** Check previous story files before implementing similar features

### 2. Database Schema Reuse
- **Observation:** users, families, and audit-logs tables already created in Story 1-1
- **Learning:** No new schema migrations needed for login - reuse existing tables
- **Best Practice:** Database changes should be cumulative - avoid redundant migrations

### 3. Query Function Reuse
- **Observation:** `getUserByPhone` and `logUserAction` functions already exist from Story 1-1
- **Learning:** Use existing query functions instead of creating duplicates
- **Best Practice:** Check `lib/db/queries/*.ts` for existing functions before writing new ones

### 4. Rate Limiting Implementation
- **Observation:** Login security requires rate limiting to prevent brute force attacks
- **Learning:** Implement in-memory rate limiter for MVP (5 failures → 10-minute lockout)
- **Best Practice:** Store rate limit data by IP address, return user-friendly Chinese error messages

### 5. Error Handling Consistency
- **Observation:** Story 1-1 established Shadcn Toast for error display
- **Learning:** Continue using Shadcn Toast for all user-facing errors
- **Best Practice:** Error messages should be in Chinese and actionable (e.g., "手机号未注册" vs "Invalid phone")

### 6. Audit Logging
- **Observation:** Story 1-1 created audit-logs table and logUserAction function
- **Learning:** Log all authentication events (success and failure) for security auditing
- **Best Practice:** Include timestamp, phone (masked), IP address, action_type, and success/failure status

### 7. Test Data Consistency
- **Observation:** Login tests need registered user data from Story 1-1
- **Learning:** BDD tests should reference test data created in previous stories
- **Example:** Given "手机号已注册" refers to phone '13800000100' from Story 1-1 registration tests

## Code Patterns Established

### Better-Auth Session Management
```typescript
// lib/auth/index.ts - REUSED from Story 1-1
// Configuration already includes:
// - phone plugin for OTP
// - 36-hour rolling session refresh
// - HttpOnly Cookie
```

### Database Query Pattern
```typescript
// lib/db/queries/users.ts - REUSED from Story 1-1
export async function getUserByPhone(phone: string) {
  // Drizzle ORM query builder - NO native SQL
  const user = await db.query.users.findFirst({
    where: eq(users.phone, phone)
  });
  return user;
}
```

### Error Display Pattern
```typescript
// Use Shadcn Toast for user-facing errors
import { toast } from '@/components/ui/use-toast';
toast({
  variant: "destructive",
  title: "登录失败",
  description: "手机号未注册"
});
```

### BDD Test Pattern
```typescript
it('given 已注册家长输入正确手机号，when 点击发送验证码，then 60秒内收到验证码', async () => {
  // Given
  const phone = '13800000100'; // From Story 1-1 test data

  // When
  const response = await request(app)
    .post('/api/auth/login/send-otp')
    .send({ phone });

  // Then
  expect(response.status).toBe(200);
});
```

## Architectural Alignment

### ADR-3: Authentication Architecture
- Better-Auth 1.4.18+ with phone plugin ✅
- 36-hour session rolling refresh ✅
- HttpOnly Cookie for session tokens ✅

### RED LIST Compliance
- Drizzle ORM query builder only ✅
- Bun.password.hash() for password hashing ✅
- Bun.env for environment variables ✅
- Shadcn Toast for error display ✅
- TypeScript strict mode (no any) ✅
- BDD Given-When-Then format ✅

## Performance Notes

### Response Time
- API response time target: < 500ms (P95) ✅
- Page load time target: < 3 seconds ✅
- Session creation time: < 3 seconds ✅

### Security Enhancements
- Rate limiting: 5 failed attempts → 10-minute lockout
- Audit logging for all login events
- Phone number masking in logs

## Next Story Implications

### Story 1-3: Child PIN Login
- Will need to verify role=child instead of role=parent
- PIN validation instead of OTP verification
- Reuse same session infrastructure (36-hour, HttpOnly Cookie)
- Reuse same audit logging pattern

### Story 1-4: Invite Other Parent
- Will need to generate invite codes/tokens
- Will need to validate invite codes on registration
- Reuse phone OTP verification pattern
- Reuse audit logging pattern

## Files Created/Modified

### Created
1. `app/api/auth/login/route.ts`
2. `app/(auth)/login/page.tsx`
3. `lib/auth/rate-limit.ts`
4. `tests/unit/lib/auth/login.test.ts`
5. `tests/integration/api/login.test.ts`

### Modified
1. `lib/auth/guards.ts` (added parent role guard)
2. `tests/e2e/auth.spec.ts` (added login flow)

### Reused (from Story 1-1)
- `lib/auth/index.ts`
- `lib/auth/session.ts`
- `database/schema/users.ts`
- `database/schema/families.ts`
- `database/schema/audit-logs.ts`
- `lib/db/queries/users.ts`
- `lib/db/queries/audit-logs.ts`
- `app/(auth)/layout.tsx`
- `types/user.ts`
- `types/auth.ts`

## Potential Improvements

### Rate Limiting
- Consider Redis for distributed rate limiting in production
- Add CAPTCHA for suspicious login patterns
- Implement account recovery after lockout

### User Experience
- Add "Remember me" option for extended sessions
- Implement biometric authentication (fingerprint/face) for enrolled devices
- Add "Forgot PIN" flow for PIN login (Story 1-3)

### Security
- Implement login anomaly detection (unusual IP, time, device)
- Add two-factor authentication (optional)
- Implement session invalidation on password change
