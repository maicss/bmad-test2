# Story 1.6: Multi-device Login

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 家长或儿童 (Parent or Child),
I want 在不同设备上登录我的账号 (log in to my account on different devices),
so that 我可以在手机、平板和电脑上使用我的家庭管理系统 (I can use my family management system on mobile, tablet, and computer).

## Acceptance Criteria

1. 系统支持同一账号在多个设备上同时登录（FR8, FR9）
2. 系统为每个登录会话生成唯一的 session token，记录设备信息（device_id, device_type, user_agent）（NFR13: 36小时 rolling session refresh, NFR10: device fingerprinting）
3. 系统跟踪每个设备的最后活动时间，超过 36 小时无活动则自动登出（NFR6, NFR7）
4. 系统在用户手动登出时（点击"退出"按钮），使该设备的 session 失效（NFR11: Explicit logout）
5. 家长可以在账号设置中查看所有活跃的登录会话，包括设备类型、最后活动时间、当前 IP 地址（FR6: 家长功能）
6. 系统在用户更换设备时（如从手机换到电脑），要求输入密码或 PIN 码进行二次验证（NFR10: Security）
7. 系统 rate limit 防止暴力破解多个设备同时登录尝试（NFR10: Rate limiting）
8. 系统支持"记住我"功能，在用户同意的情况下，7 天内无需重新输入凭据（NFR13: Auto-login within 7 days）
9. 儿童 PIN 登录不支持多设备登录（为了安全，一个儿童账户只能在一个设备上登录）（NFR10: Security - PIN protection）
10. 系统记录所有登录/登出事件到审计日志，包括设备信息（NFR14: Audit logging）

## Tasks / Subtasks

- [ ] Task 1: Extend session schema to include device information (AC: #2, #3)
  - [ ] Add device_id (UUID) column to sessions table
  - [ ] Add device_type (enum: mobile/tablet/desktop) column to sessions table
  - [ ] Add user_agent (string) column to sessions table
  - [ ] Add last_activity_at (timestamp) column to sessions table
  - [ ] Add ip_address (string) column to sessions table
  - [ ] Add is_active (boolean) column to sessions table
  - [ ] Generate Drizzle migration: `bun drizzle-kit generate`
  - [ ] Apply migration: `bunx drizzle-kit push`

- [ ] Task 2: Update login API to create multi-device sessions (AC: #1, #2, #7)
  - [ ] Update `lib/auth/index.ts` to extract device information from request headers
  - [ ] Generate device fingerprint (device_id) using user-agent + IP + timestamp
  - [ ] Update session creation logic to store device information
  - [ ] Update rate limiting to use device_id instead of IP address (more accurate device tracking)
  - [ ] Implement 36-hour rolling session refresh with device information
  - [ ] **MUST use Better-Auth session management**
  - [ ] **MUST use Bun.password.hash() for device_id encryption** (NFR10)

- [ ] Task 3: Implement session management APIs (AC: #2, #3, #4)
  - [ ] Create `app/api/auth/sessions/route.ts` with GET endpoint (list all sessions)
  - [ ] Create `app/api/auth/sessions/[sessionId]/route.ts` with DELETE endpoint (logout specific session)
  - [ ] Create `app/api/auth/sessions/[sessionId]/route.ts` with POST endpoint (extend session)
  - [ ] Verify session owner before allowing management
  - [ ] **MUST use Drizzle ORM query builder - NO native SQL**

- [ ] Task 4: Implement automatic logout for inactive sessions (AC: #3)
  - [ ] Create `lib/services/session-cleanup.ts` with cleanup job
  - [ ] Run cleanup job every 30 minutes to check for inactive sessions
  - [ ] Mark sessions as inactive if last_activity_at > 36 hours ago
  - [ ] Log session expiry events to audit logs
  - [ ] Remove session cookies (invalidate via Better-Auth)

- [ ] Task 5: Add "Remember Me" functionality (AC: #8)
  - [ ] Update `lib/auth/index.ts` to support extended session expiration
  - [ ] Add checkbox in login form: "记住我（7天）"
  - [ ] Extend session expiration from 36 hours to 7 days (168 hours) when "Remember Me" is checked
  - [ ] Store session preference in database (users table: remember_me boolean)
  - [ ] **MUST use Better-Auth session management**

- [ ] Task 6: Create device verification on login from new device (AC: #6)
  - [ ] Update login API to detect device change based on device_id history
  - [ ] If user logs in from new device (new device_id not in recent devices), require password/PIN re-entry
  - [ ] Store recent device_ids in user session history (new table: user_session_devices)
  - [ ] Allow 5 trusted devices without re-verification
  - [ ] Display device verification UI in login form when required

- [ ] Task 7: Block multi-device login for children (AC: #9)
  - [ ] Update child PIN login API to check for existing active session
  - [ ] If child has active session on another device, reject new login with error: "儿童账户只能在一个设备上登录"
  - [ ] Log security event to audit logs
  - [ ] Return 403 Forbidden status

- [ ] Task 8: Create active sessions management UI (AC: #5)
  - [ ] Create `app/(parent)/settings/sessions/page.tsx` with session management interface
  - [ ] Display list of active sessions with device type, device name, last activity, current IP
  - [ ] Add "退出此设备" button for each session
  - [ ] Add "退出所有设备" button for bulk logout
  - [ ] Display device name/fingerprint (e.g., "iPhone 13", "Chrome on Windows PC", "iPad Air" for easier identification
  - [ ] Add security warning for devices from different IP addresses
  - [ ] Responsive design (mobile-first, < 450px for mini-program optimization)
  - [ ] Reuse `app/(parent)/layout.tsx` from Epic 1

- [ ] Task 9: Enhance rate limiting for multi-device protection (AC: #7)
  - [ ] Update `lib/auth/rate-limit.ts` to track login attempts per device_id
  - [ ] Implement progressive rate limiting: 5 attempts → 10 min lock, 10 attempts → 30 min lock, 20 attempts → 1 hour lock
  - [ ] Store device lock status in database (new table: device_locks)
  - [ ] Reset device lock on successful login
  - [ ] **MUST use Drizzle ORM query builder - NO native SQL**

- [ ] Task 10: Write BDD tests (AC: #1, #2, #3, #4, #5, #6, #7, #8, #9, #10)
  - [ ] **Given** 家长在设备 A 登录 **When** 在设备 B 登录 **Then** 允许多设备同时在线
  - [ ] **Given** 家长在设备 A 登录 **When** 等待 36 小时无活动 **Then** 自动登出
  - [ ] **Given** 家长在设备 A 登录 **When** 点击"退出"按钮 **Then** 该设备的 session 失效
  - [ ] **Given** 家长在设备 A 登录 **When** 查看活跃会话 **Then** 显示所有设备及其最后活动时间
  - [ ] **Given** 家长在设备 A 登录 **When** 7 天后登录 **Then** 不需要重新输入凭据（如果选择了"记住我"）
  - [ ] **Given** 家长在设备 A 登录 **When** 换到设备 B 登录 **Then** 要求密码/PIN 重新验证
  - [ ] **Given** 家长在设备 A 登录 **When** 尝试在设备 B 使用儿童 PIN 登录 **Then** 显示"儿童账户只能在一个设备上登录"
  - [ ] **Given** 家长在设备 A 登录 **When** 在新设备登录 **Then** 要求密码/PIN 重新验证
  - [ ] **Given** 系统检测到 5 次登录失败 **When** 尝试第 6 次登录 **Then** 显示锁定提示（10 分钟）
  - [ ] **Given** 系统检测到 10 次登录失败 **When** 尝试第 11 次登录 **Then** 显示锁定提示（30 分钟）
  - [ ] Use Bun Test for unit tests, Playwright for E2E tests

- [ ] Task 11: Performance and compliance verification (AC: #2, #3, #4, #6, #9, #10)
  - [ ] Verify session creation time < 500ms (NFR3: P95)
  - [ ] Verify session query time < 500ms (NFR3: P95)
  - [ ] Verify page load time < 3 seconds (NFR2)
  - [ ] Verify device_id encryption using Bun.password.hash() (NFR10)
  - [ ] Verify audit logs recording device information (NFR14)
  - [ ] Verify automatic session cleanup (36-hour inactivity timeout)
  - [ ] Verify "Remember Me" 7-day session expiration (NFR13)

## Dev Notes

### Previous Story Intelligence (Stories 1-1, 1-2, 1-3, 1-4, 1-5)

**From Story 1.1: Parent Phone Registration**
- Better-Auth 1.4.18+ configured with phone plugin in `lib/auth/index.ts`
- 36-hour rolling session refresh enabled (NFR13)
- HttpOnly Cookie for session token storage
- Users table already created: `id`, `phone`, `phone_hash`, `password_hash`, `role`, `family_id`, `created_at`, `updated_at`
- **No new schema needed for basic multi-device login** (only sessions table needs device columns)

**From Story 1.2: Parent Phone Login**
- Login API: `POST /api/auth/login` already implements OTP and password flows
- Session management already integrated with Better-Auth
- Rate limiting implemented in `lib/auth/rate-limit.ts` using IP-based tracking
- **Can enhance rate limiting for device-based tracking (more accurate)**

**From Story 1.3: Child PIN Login**
- Child PIN login API: `POST /api/auth/pin-login` already implemented
- **Child session logic:** Simple session creation, no device tracking
- **Need to add:** Check for existing child session before allowing new PIN login

**From Story 1.4: Invite Other Parent**
- Better-Auth phone plugin already configured
- Session cookies: HttpOnly, secure, 36-hour expiration
- **Can reuse:** Same Better-Auth session management for multi-device

**From Story 1.5: Add Child to Family**
- Users table already has `remember_me` boolean column (Task 5)
- **Can extend:** Use `remember_me` column to store "Remember Me" preference

### Database Schema Updates Needed

**Sessions Table Enhancement:**
```sql
-- Add device tracking columns
ALTER TABLE sessions ADD COLUMN device_id TEXT;
ALTER TABLE sessions ADD COLUMN device_type TEXT CHECK(device_type IN ('mobile', 'tablet', 'desktop'));
ALTER TABLE sessions ADD COLUMN user_agent TEXT;
ALTER TABLE sessions ADD COLUMN last_activity_at INTEGER; -- timestamp
ALTER TABLE sessions ADD COLUMN ip_address TEXT;
ALTER TABLE sessions ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
```

**Users Table Extension:**
```sql
-- Add remember_me preference column
ALTER TABLE users ADD COLUMN remember_me BOOLEAN DEFAULT FALSE;
```

**New Tables Needed:**
```sql
-- user_session_devices table for device verification
CREATE TABLE user_session_devices (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  device_id TEXT NOT NULL UNIQUE,
  device_type TEXT NOT NULL CHECK(device_type IN ('mobile', 'tablet', 'desktop')),
  first_login_at INTEGER NOT NULL,
  last_login_at INTEGER NOT NULL,
  is_trusted BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (device_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- device_locks table for rate limiting
CREATE TABLE device_locks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  lock_reason TEXT NOT NULL CHECK(lock_reason IN ('rate_limit', 'security', 'suspicious')),
  lock_start_at INTEGER NOT NULL,
  lock_end_at INTEGER,
  failed_attempts INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Security Considerations

**Device Fingerprinting (NFR10):**
- Use user-agent + IP + timestamp to generate unique device_id
- Store device_id in session cookie (HttpOnly) for device verification
- Hash device_id using Bun.password.hash() before storage (session cookie or database)

**Session Security (NFR10):**
- Each session must be bound to specific device
- Session tokens must be invalidated on explicit logout
- Sessions must expire after 36 hours of inactivity (NFR6, NFR7)
- Device verification required on new device (AC: #6)

**Multi-device Protection (NFR10):**
- Rate limiting per device_id (not just IP address)
- Progressive locking: 5 attempts → 10 min, 10 → 30 min, 20 → 1 hour
- Device lock status stored in database
- Lock reset on successful login

**Child Account Security (NFR10 - AC: #9):**
- Child accounts are single-device for security
- Check for existing child session before allowing new PIN login
- Reject concurrent child PIN login with 403 Forbidden
- Log security event

**"Remember Me" Security (NFR13):**
- Only available for parents (not children)
- Requires explicit user consent (checkbox)
- 7-day session expiration (168 hours vs 36 hours)
- Must store user preference in database
- Must be GDPR compliant (clear opt-out available)

### API Endpoints to Create

**Session Management:**
- `GET /api/auth/sessions` - List all active sessions
- `POST /api/auth/sessions/[sessionId]` - Extend session (add 30 minutes)
- `DELETE /api/auth/sessions/[sessionId]` - Logout specific session
- `DELETE /api/auth/sessions` - Logout all sessions

**Login Enhancements:**
- Update `POST /api/auth/login` to extract device info
- Update `POST /api/auth/pin-login` to check existing child session
- Update `POST /api/auth/pin-login` to reject concurrent child login

**Cleanup:**
- `GET /api/auth/cleanup-sessions` - Trigger session cleanup job (admin/automation)

### UI Pages to Create

**Device Management:**
- `app/(parent)/settings/sessions/page.tsx` - Active sessions list

**Login Enhancements:**
- `app/(auth)/login/page.tsx` - Add "Remember Me" checkbox
- `app/(auth)/pin/page.tsx` - Add device verification UI (if required)

### Testing Strategy

**BDD Tests (Given-When-Then):**
1. Multi-device login success (parent account, multiple devices)
2. Automatic session expiry (36-hour inactivity)
3. Manual session logout (explicit logout button)
4. Session list view (showing all devices)
5. Session extension (30-minute increment)
6. Device verification on new device
7. Child single-device restriction (PIN login)
8. Rate limiting with device-based locking
9. "Remember Me" 7-day session
10. Audit logging for all session events

**Integration Tests:**
- Session CRUD operations (create, read, update, delete)
- Session cleanup job execution
- Device verification flow
- Audit log verification

**E2E Tests:**
- Multi-device login flow (different device types)
- Session management UI interactions
- Automatic logout after inactivity
- "Remember Me" flow
- Device verification UI
- Child PIN login rejection on concurrent device

### Performance Requirements

- Session creation: < 500ms (P95) - AC #2
- Session query: < 500ms (P95) - AC #2
- Page load: < 3 seconds - AC #3
- Session cleanup: < 10 seconds per job

### Security Requirements

- Device_id encryption: Bun.password.hash() - NFR10
- 36-hour inactivity timeout: NFR6, NFR7
- Device-based rate limiting: NFR10
- Child single-device restriction: NFR10 - AC #9
- Device verification on new device: NFR10 - AC #6

### Compliance Requirements

- Audit logging: NFR14 - AC #10
- GDPR compliance for "Remember Me" (opt-in/opt-out)
- Explicit logout: NFR11 - AC #4
- Session invalidation: NFR11 - AC #4

### Open Questions / Decisions Needed

1. **Session Storage Strategy:**
   - Option A: Store full session in Better-Auth database (default, recommended)
   - Option B: Store session token in HttpOnly cookie, full session in database
   - **Decision:** Use Better-Auth session management (recommended), store device_id in cookie

2. **Device Fingerprinting Method:**
   - Option A: Simple UUID (random on each login)
   - Option B: Hash user-agent + IP + timestamp (more secure, NFR10)
   - **Decision:** Use hashed fingerprint (Option B) for security

3. **"Remember Me" Expiration:**
   - Option A: 7 days (168 hours) - NFR13
   - Option B: 30 days (720 hours)
   - **Decision:** Use 7 days as per NFR13

4. **Child Single-Device Restriction:**
   - Option A: Reject login if active session exists
   - Option B: Logout existing session, allow new login
   - **Decision:** Reject login (Option A) - AC #9 requires this

5. **Device Trust Duration:**
   - Option A: 7 days
   - Option B: 30 days
   - Option C: Never, always require verification
   - **Decision:** Use 5 devices for 30 days, reset on logout (common practice)

### Success Criteria

1. [ ] All tasks completed
2. [ ] All BDD tests passing
3. [ ] All E2E tests passing
4. [ ] Performance requirements met (<500ms API, <3s page load)
5. [ ] Security requirements met (device_id encryption, rate limiting, child restriction)
6. [ ] Compliance requirements met (audit logging, GDPR, explicit logout)
7. [ ] Code review passed
8. [ ] Sprint status updated

### Tasks Blocked By

None identified at story creation time.
