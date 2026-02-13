# Story 1-1: Parent Phone Registration - Decisions

## Architectural Decisions

### Decision 1: Use Better-Auth with Phone Plugin
**Context:** Need authentication system for parents using phone + OTP
**Alternatives:**
- Custom implementation
- NextAuth.js (now Auth.js)
- Better-Auth with phone plugin
**Rationale:** Better-Auth is explicitly required by architecture.md ADR-3, provides built-in security best practices
**Impact:** Standardized authentication for all user types (parent/child/admin)
**Source:** [Source: _bmad-output/planning-artifacts/architecture.md#L228-L247]

### Decision 2: Bun.password.hash() for Password Hashing
**Context:** Need to hash phone numbers and passwords for secure storage
**Alternatives:**
- bcrypt library
- argon2 library
- Bun.password.hash()
**Rationale:** AGENTS.md RED LIST requires using Bun built-in tools, no external dependencies
**Impact:** Faster performance, no extra dependency, consistent with project constraints
**Source:** [Source: AGENTS.md#L156-L165]

### Decision 3: Automatic Family Creation on Parent Registration
**Context:** New parent needs a family to manage
**Alternatives:**
- Require parent to create family after registration
- Invite parent to existing family
- Automatically create family on registration
**Rationale:** Simplifies onboarding flow, reduces friction for new users
**Impact:** Every parent registration creates a new family with parent as Primary Parent
**Source:** [Source: _bmad-output/planning-artifacts/epics.md#L260-L274]

### Decision 4: Per-Table Query Files (Not Repository Pattern)
**Context:** Need to organize database queries
**Alternatives:**
- Repository Pattern (one class per table)
- Function-based exports per table
- Single large query file
**Rationale:** ADR-5 explicitly requires function-based exports, RED LIST enforces per-table files
**Impact:** Simpler API, less boilerplate, follows project conventions
**Source:** [Source: _bmad-output/planning-artifacts/architecture.md#L280-L308]

### Decision 5: 36-Hour Rolling Session Refresh
**Context:** Need session management strategy
**Alternatives:**
- Fixed 24-hour session
- Fixed 36-hour session
- 36-hour rolling refresh
**Rationale:** NFR13 requires 36-hour rolling refresh for better UX
**Impact:** Users stay logged in as long as they're active, but security timeout if inactive
**Source:** [Source: _bmad-output/planning-artifacts/prd.md#L549]

## Technical Decisions

### Decision 6: Phone Number Encryption with Bun.password.hash()
**Context:** Need to store phone numbers securely
**Alternatives:**
- Plain text storage
- AES encryption
- Hashing with Bun.password.hash()
**Rationale:** NFR9 requires sensitive data encryption, hashing provides one-way security
**Impact:** Phone numbers cannot be directly queried (must hash input first), but secure storage achieved
**Source:** [Source: _bmad-output/planning-artifacts/prd.md#L544-L545]

### Decision 7: Audit Logging for Registration Events
**Context:** Need to track all registration activities
**Alternatives:**
- No logging
- Basic logging (timestamp only)
- Comprehensive audit logging
**Rationale:** NFR14 requires operation audit logging for all critical operations
**Impact:** Registration events are tracked with timestamp, phone (masked), IP, action_type
**Source:** [Source: _bmad-output/planning-artifacts/prd.md#L551]

### Decision 8: Shadcn Toast for Error Display
**Context:** Need to display errors to users
**Alternatives:**
- alert() dialogs
- Console.error only
- Shadcn Toast components
**Rationale:** RED LIST prohibits alert(), Shadcn provides consistent UI components
**Impact:** User-friendly error messages with consistent styling
**Source:** [Source: AGENTS.md#L171-L173]

## Testing Decisions

### Decision 9: BDD Given-When-Then Format
**Context:** Need to write tests for registration flow
**Alternatives:**
- Traditional unit tests
- Integration tests only
- BDD Given-When-Then format
**Rationale:** AGENTS.md requires BDD format, business language improves test readability
**Impact:** Tests use business language, easier to understand by non-developers
**Source:** [Source: AGENTS.md#L197-L207]

### Decision 10: Tests Before Implementation (TDD)
**Context:** Order of writing tests and code
**Alternatives:**
- Code first, tests later
- Tests and code simultaneously
- Tests before implementation
**Rationale:** AGENTS.md enforces BDD development with tests first
**Impact:** Better test coverage, clearer requirements, fewer bugs
**Source:** [Source: AGENTS.md#L197-L207]

## Database Schema Decisions

### Decision 11: Users Table with Role Enum
**Context:** Need to store user data with role differentiation
**Schema:**
```typescript
{
  id: string (primary key)
  phone: string (encrypted)
  role: enum('parent', 'child', 'admin')
  password_hash: string
  family_id: string (foreign key)
  created_at: timestamp
}
```
**Rationale:** Supports multi-role system (parent/child/admin), role enum for type safety
**Impact:** Single users table for all user types, role-based access control
**Source:** [Source: _bmad-output/planning-artifacts/architecture.md#L408-L426]

### Decision 12: Families Table with Primary Parent Reference
**Context:** Need to manage family structure
**Schema:**
```typescript
{
  id: string (primary key)
  primary_parent_id: string (foreign key → users.id)
  created_at: timestamp
}
```
**Rationale:** Supports primary parent role, enables future secondary parent addition
**Impact:** Family structure established, primary parent identified
**Source:** [Source: _bmad-output/planning-artifacts/architecture.md#L408-L426]

## UI/UX Decisions

### Decision 13: Mobile-First Responsive Design
**Context:** Need to support various device sizes
**Alternatives:**
- Desktop-first
- Tablet-first
- Mobile-first
**Rationale:** PRD specifies parent-end optimized for mini-program (< 450px)
**Impact:** Responsive design works on mobile, tablet, and desktop
**Source:** [Source: _bmad-output/planning-artifacts/prd.md#L168]

### Decision 14: Registration Flow: Phone → OTP → Register
**Context:** Order of registration steps
**Alternatives:**
- Phone + Password → Register
- Phone → OTP → Register
- Email → Register
**Rationale:** Phone + OTP is specified in FR1 and AC1, no password required
**Impact:** Simple 2-step flow, no password setup for parents
**Source:** [Source: _bmad-output/planning-artifacts/prd.md#L442, L605]

## Security Decisions

### Decision 15: HttpOnly Cookie for Session Tokens
**Context:** How to store session tokens
**Alternatives:**
- LocalStorage
- SessionStorage
- HttpOnly Cookie
**Rationale:** NFR11 requires HttpOnly Cookie, prevents XSS attacks
**Impact:** Secure session storage, browser-managed cookie
**Source:** [Source: _bmad-output/planning-artifacts/prd.md#L547]

### Decision 16: Phone Number Masking in Logs
**Context:** How to log phone numbers in audit logs
**Alternatives:**
- Log full phone numbers
- Log no phone numbers
- Log masked phone numbers
**Rationale:** Security best practice, protect user privacy
**Impact:** Audit logs show masked format (e.g., 138****0100)
**Source:** NFR9 + security best practices

## Performance Decisions

### Decision 17: Database Index on Phone Hash
**Context:** How to optimize phone lookup queries
**Alternatives:**
- No index
- Index on plain text phone
- Index on hashed phone
**Rationale:** Phone is encrypted, need fast lookup by hash
**Impact:** Faster user authentication, better query performance
**Source:** Database optimization best practices

### Decision 18: Response Time < 500ms (P95)
**Context:** Performance target for API responses
**Alternatives:**
- < 1 second
- < 500ms (P95)
- < 200ms (P95)
**Rationale:** NFR3 requires < 500ms (P95), reasonable target for MVP
**Impact:** Fast user experience, but achievable with SQLite
**Source:** [Source: _bmad-output/planning-artifacts/prd.md#L532]

## Compliance Decisions

### Decision 19: COPPA/GDPR Data Retention (3 Years)
**Context:** How long to keep user data
**Alternatives:**
- 1 year retention
- 3 years retention
- 7 years retention
**Rationale:** NFR18 requires 3-year retention for COPPA/GDPR compliance
**Impact:** Database must support data archival after 3 years
**Source:** [Source: _bmad-output/planning-artifacts/prd.md#L557]

### Decision 20: Soft Delete with 7-Day Recovery Window
**Context:** How to handle user deletion
**Alternatives:**
- Hard delete (immediate)
- Soft delete (permanent)
- Soft delete with 7-day recovery
**Rationale:** NFR19 requires soft delete with 7-day recovery for data protection
**Impact:** Users can recover deleted accounts within 7 days, data not immediately lost
**Source:** [Source: _bmad-output/planning-artifacts/prd.md#L558]

## Trade-offs Documented

### Trade-off 1: Security vs. Performance (Phone Encryption)
**Decision:** Encrypt phone numbers with hashing
**Trade-off:** Slower queries vs. better security
**Mitigation:** Index on phone hash for faster lookups

### Trade-off 2: UX vs. Security (Session Duration)
**Decision:** 36-hour rolling refresh
**Trade-off:** Longer sessions better for UX, shorter sessions better for security
**Mitigation:** Rolling refresh balances both needs

### Trade-off 3: Simplicity vs. Flexibility (Automatic Family Creation)
**Decision:** Auto-create family on parent registration
**Trade-off:** Simpler onboarding vs. less flexibility
**Mitigation:** Story 1-7 allows transferring primary parent role if needed

## Future Considerations

### Consideration 1: Multi-Device Login (Story 1-6)
- Session management may need adjustment
- Concurrent session limits may be required
- Device detection may be useful

### Consideration 2: SMS Provider Migration
- Development: Use local mock OTP
- Production: Configure real SMS provider
- Test with staging provider first

### Consideration 3: Database Migration (SQLite → PostgreSQL)
- Schema changes may be required
- Data migration strategy needed
- Performance testing on PostgreSQL

### Consideration 4: Email Registration (Future)
- Phone-only registration is MVP
- Email may be added as alternative
- Schema may need email field
