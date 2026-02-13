# Sprint Change Proposal - Parent Password Login Support

**Date:** 2026-02-13
**Project:** bmad-test2 - Family Reward
**Trigger:** Story Review - Missing password registration/login requirement
**Status:** Pending Approval

---

## Section 1: Issue Summary

### Problem Statement

Story 1.1（家长注册）和 Story 1.2（家长登录）当前只实现了 OTP 验证码方式，但 **BMAD_IMPLEMENTATION_GUIDE.md L1559-1564** 明确要求家长必须支持**手机号 + 密码**和**手机号 + OTP**两种认证方式。

### Discovery Context

**When:** 2026-02-13 - 开发前审查阶段（Stories 状态：ready-for-dev）
**How:** 对照 BMAD_IMPLEMENTATION_GUIDE 进行需求覆盖度检查时发现

### Evidence

| Evidence Source | Content | Gap |
|----------------|---------|-----|
| BMAD_IMPLEMENTATION_GUIDE.md L1559 | "支持家长账户（手机号 + 密码）" | Stories 只实现 OTP |
| BMAD_IMPLEMENTATION_GUIDE.md L1564 | "AC-1: 家长可以通过手机号和密码登录" | Stories 只实现 OTP 登录 |
| Story 1.1: Parent Phone Registration | Acceptance Criteria 只涵盖 OTP | 缺少密码注册选项 |
| Story 1.2: Parent Phone Login | Acceptance Criteria 只涵盖 OTP | 缺少密码登录选项 |

### Severity Assessment

**Impact Level:** **High** - 功能缺失
**Timing:** **Critical** - Stories 尚未开始实施（ready-for-dev），修复成本最低
**Risk:** **Low** - Better-Auth 原生支持双认证方式，技术风险低

---

## Section 2: Impact Analysis

### Epic Impact

**Affected Epic:** Epic 1 - User Authentication & Family Management

| Epic Component | Current Status | Required Change |
|----------------|-----------------|-----------------|
| Epic 1 Description | 提及 FR1-FR7，但未明确双认证方式 | 更新 Epic 描述 |
| Story 1.1 - Parent Phone Registration | 只实现 OTP 注册 | 添加密码注册选项 |
| Story 1.2 - Parent Phone Login | 只实现 OTP 登录 | 添加密码登录选项 |
| Story 1.3 - Child PIN Login | 不受影响 | 无需修改 |
| Story 1.4-1.7 | 不受影响 | 无需修改 |

**Other Epics:** No impact - Epic 2-7 are independent of parent authentication method

### Story Impact

**Current Stories Requiring Changes:**
- **Story 1.1: Parent Phone Registration**
  - Status: ready-for-dev
  - Change: Extend to support OTP + password registration
  - Effort: +1-2 days (UI + tests)

- **Story 1.2: Parent Phone Login**
  - Status: ready-for-dev
  - Change: Extend to support OTP + password login
  - Effort: +1-2 days (UI + tests)

**Future Stories:**
- Stories 1.3-1.7: No impact
- All other Epics: No impact

### Artifact Conflicts

| Artifact | Conflict Type | Resolution |
|----------|---------------|-------------|
| **PRD (prd.md)** | Missing detail | Add clarification comment (optional) |
| **Architecture.md (ADR-3)** | Incomplete - only mentions OTP | Update ADR-3 to specify dual auth methods |
| **UX Design Specification** | Already supports password | Stories need alignment (ACs and Tasks) |
| **Stories 1.1 & 1.2** | Missing requirements | Update ACs and Tasks to include password support |
| **BMAD_IMPLEMENTATION_GUIDE.md** | Authority reference | No changes needed (this is the correct requirement) |

### Technical Impact

**Configuration:**
- `lib/auth/index.ts` - Enable both phone AND password plugins
- No database schema changes needed (password_hash field already exists)

**API Changes:**
- `app/api/auth/register/route.ts` - Support two registration flows (OTP / password)
- `app/api/auth/login/route.ts` - Support two login flows (OTP / password)

**UI Changes:**
- `app/(auth)/register/page.tsx` - Add authentication method selector + password fields
- `app/(auth)/login/page.tsx` - Add authentication method selector + password input

**Security:**
- Password validation: 8-20 chars, strength indicator
- Bun.password.hash() for password hashing (reuse from AGENTS.md)
- Rate limiting applies to both flows

---

## Section 3: Recommended Approach

### Path Selection: Option 1 - Direct Adjustment

**Chosen Path:** **Direct Adjustment**

**Decision Process:**
1. ✅ **Option 1 (Direct Adjustment)** - Modify existing Stories within current Epic structure
2. ❌ **Option 2 (Rollback)** - Not applicable - Stories not yet implemented
3. ❌ **Option 3 (MVP Review)** - Not needed - MVP scope expansion, not reduction

### Rationale

**1. Implementation Efficiency (High):**
- Stories status: ready-for-dev (not started)
- Changes required: Document updates only (no code rework)
- Timeline impact: +2-3 days total for both Stories

**2. Technical Risk (Low):**
- Better-Auth natively supports multiple authentication plugins simultaneously
- Database schema already includes password_hash field
- Only adding functionality, not changing existing OTP logic

**3. Team Morale (Protection):**
- Avoids rollback of completed work (none exists)
- Clear requirement changes enhance team confidence
- Demonstrates value of review process

**4. Long-term Sustainability (Optimal):**
- Dual authentication methods align with real user scenarios (password when OTP unavailable)
- No restriction on user choice, improved UX
- Architecture space for future expansion (biometric authentication)

**5. Compliance with Specifications (Strict):**
- BMAD_IMPLEMENTATION_GUIDE is the authoritative specification
- PRD and UX Design already imply dual methods (now explicit)
- Follows "requirement clarification" best practice

**6. MVP Impact (Maintained):**
- Expanded functionality, not reduced scope
- Timeline essentially unchanged (+2-3 days)
- More complete acceptance criteria

### Trade-offs and Alternatives

**Not Chosen - Option 2 (Rollback):**
- No completed work to rollback, wasted resources

**Not Chosen - Option 3 (MVP Review):**
- No need to reduce scope; need to clarify requirements instead

---

## Section 4: Detailed Change Proposals

### Proposal 1: Story 1.1 - Story + Acceptance Criteria

**File:** `1-1-parent-phone-registration.md` (Lines 7-21)

**OLD:** Story describes only OTP registration

**NEW:** Story describes OTP OR password registration

**Key Changes:**
- Story title: "register account using phone number with either OTP or password"
- AC #1: Add authentication method selector (OTP / password)
- AC #2: Handle both verification flows (OTP success / password set)
- AC #4: Clarify phone AND password encryption
- AC #7: Log auth_method (otp/password) to audit logs

**Rationale:** Aligns with BMAD_IMPLEMENTATION_GUIDE L1559-1564 requirement

---

### Proposal 2: Story 1.1 - Tasks / Subtasks

**File:** `1-1-parent-phone-registration.md` (Lines 23-72)

**OLD:** Tasks only cover OTP registration flow

**NEW:** Tasks cover OTP AND password registration flows

**Key Changes:**
- **Task 1:** Configure Better-Auth with phone AND password plugins
- **Task 3:** createUser() function signature includes optional password parameter
- **Task 4:** Implement dual registration API flows (OTP / password)
- **Task 5:** Add authentication method selector + password fields (strength indicator, confirm)
- **Task 6:** Log auth_method (otp/password) to audit logs
- **Task 7:** Add BDD tests for password registration scenario
- **Task 8:** Verify password encryption using Bun.password.hash()

**Rationale:** Complete implementation guidance for dual registration methods

---

### Proposal 3: Story 1.2 - Story + Acceptance Criteria

**File:** `1-2-parent-phone-login.md` (Lines 7-21)

**OLD:** Story describes only OTP login

**NEW:** Story describes OTP OR password login

**Key Changes:**
- Story title: "login to account using phone number with either OTP or password"
- AC #1: Add authentication method selector (OTP / password)
- AC #2: Handle both verification flows (OTP success / password verification)
- AC #7: Log auth_method (otp/password) to audit logs

**Rationale:** Aligns with BMAD_IMPLEMENTATION_GUIDE L1559-1564 requirement

---

### Proposal 4: Story 1.2 - Tasks / Subtasks

**File:** `1-2-parent-phone-login.md` (Lines 23-69)

**OLD:** Tasks only cover OTP login flow

**NEW:** Tasks cover OTP AND password login flows

**Key Changes:**
- **Task 1:** Verify Better-Auth has phone AND password plugins configured
- **Task 2:** Implement dual login API flows (OTP verification / password verification)
- **Task 3:** Add authentication method selector + password input to login UI
- **Task 4:** Log auth_method (otp/password) to audit logs
- **Task 6:** Add BDD tests for password login scenario
- **Task 7:** Verify audit logs record auth_method for both flows

**Rationale:** Complete implementation guidance for dual login methods

---

### Proposal 5: Architecture.md - ADR-3 Update

**File:** `architecture.md` (Lines 228-247)

**OLD:** ADR-3 only mentions phone plugin + PIN login

**NEW:** ADR-3 explicitly states phone plugin AND password plugin + dual authentication methods

**Key Changes:**
- Decision: "Better-Auth 1.4.18+ with phone plugin AND password plugin + PIN码登录"
- Reason #3: Clarify "家长支持双认证方式：手机号 + OTP（短信验证）和手机号 + 密码"
- Update date: 2026-02-13 (added password support)
- Consequences: Add "家长端需要配置双认证插件，增加配置复杂度但提升灵活性"

**Rationale:** Provides clear architecture guidance for dual authentication methods

---

### Proposal 6 (Optional): PRD Clarification

**File:** `prd.md` (Lines 442-443 - FR1/FR2)

**OLD:** Vague FR descriptions

**NEW:** Add clarification comments

**Key Changes:**
- FR1: Add comment "支持两种认证方式：OTP验证码 和 密码"
- FR2: Add comment "支持两种认证方式：OTP验证码 和 密码"

**Rationale:** Makes PRD explicit about dual authentication (optional, but recommended)

---

## Section 5: Implementation Handoff

### Change Scope Classification

**Scope:** **Minor** - Can be implemented directly by development team

**Classification Rationale:**
- No new Epics needed
- No fundamental replan required
- Changes limited to Epic 1 Stories and Architecture documentation
- Technical complexity low (Better-Auth native support)

### Handoff Plan

**Route to:** Development Team

**Roles and Responsibilities:**

| Role | Responsibility | Specific Tasks |
|-------|---------------|-----------------|
| **Product Manager** | Update Stories | Modify Story 1.1 and 1.2 ACs and Tasks |
| **Architect** | Update Architecture | Update ADR-3 in architecture.md |
| **Scrum Master** | Status Tracking | Update Sprint Status after changes (optional) |
| **Development Team** | Implementation | Implement dual authentication per updated Stories |

### Success Criteria

1. ✅ Story 1.1 Acceptance Criteria clearly specify OTP OR password registration
2. ✅ Story 1.2 Acceptance Criteria clearly specify OTP OR password login
3. ✅ Story 1.1 Tasks include password registration implementation steps
4. ✅ Story 1.2 Tasks include password login implementation steps
5. ✅ Architecture ADR-3 explicitly states dual authentication configuration
6. ✅ Development team understands requirements and can proceed with implementation
7. ✅ Sprint Status reflects current progress (after changes)

### Timeline Estimate

| Phase | Duration | Start | End |
|--------|-----------|-------|-----|
| **Document Updates** | 1 day | 2026-02-13 | 2026-02-13 |
| **Story 1.1 Implementation** | 2-3 days | 2026-02-14 | 2026-02-16 |
| **Story 1.2 Implementation** | 2-3 days | 2026-02-14 | 2026-02-16 |
| **Total Epic 1 Completion** | 3-5 days | 2026-02-13 | 2026-02-18 |

**Note:** Stories 1.1 and 1.2 can be developed in parallel after document updates.

---

## Appendix: Check References

**Source Documents:**
- BMAD_IMPLEMENTATION_GUIDE.md L1559-1564 (password login requirement)
- Story 1.1: Parent Phone Registration (current implementation plan)
- Story 1.2: Parent Phone Login (current implementation plan)
- Architecture.md ADR-3 (authentication architecture)
- PRD.md FR1/FR2 (functional requirements)

**Configuration Files:**
- lib/auth/index.ts (Better-Auth configuration - requires both plugins)
- database/schema/users.ts (already has password_hash field - no changes)

**UI/UX Files:**
- app/(auth)/register/page.tsx (requires password fields)
- app/(auth)/login/page.tsx (requires password input)

---

## Approval Record

**Approver:** boss
**Date:** 2026-02-13
**Status:** Pending Approval

**Decision:** [ ] APPROVE | [ ] REVISE | [ ] REJECT

**Comments:** ____________________________

---

**Document Version:** 1.0
**Last Updated:** 2026-02-13
**Generated by:** BMAD Correct Course Workflow
