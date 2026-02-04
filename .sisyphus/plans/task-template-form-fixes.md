# Fix Task Template Form UI Issues

## TL;DR

> **Quick Summary**: Fix 3 issues in the task template form: (1) move target member tooltip to hover state, (2) remove all " (可选)" optional labels, and (3) fix API validation to handle template mode correctly.
>
> **Deliverables**:
>
> - Updated task-template-form.tsx with tooltip and cleaned labels
> - Updated /api/admin/task-templates/route.ts with conditional validation
> - Both changes tested via browser and curl
>
> **Estimated Effort**: Short (1-2 hours)
> **Parallel Execution**: NO - sequential (API change must be done before form fix to avoid validation errors)
> **Critical Path**: Fix API → Fix Form → Test Both

---

## Context

### Original Request

Fix 3 specific issues in the task template creation form (`http://localhost:3344/admin/task-templates/new`).

### Interview Summary

**Key Discussions**:

- Issue 1: Target member tooltip needs to be a hover tooltip, not inline text
- Issue 2: Remove all "(可选)" optional labels from form fields
- Issue 3: API validation doesn't check `isTemplate` field, causing 400 errors when dates are empty in template mode

**Technical Decisions**:

- Use HTML `title` attribute for tooltip (simple, no additional components)
- Remove "(可选)" from 3 label locations
- Add conditional validation in API: dates required only if `isTemplate=0`

### Metis Review

**Identified Gaps** (addressed):

- No side effects on form validation logic (already working correctly)
- API change respects existing `isTemplate` field from frontend
- All edge cases covered in test strategy

---

## Work Objectives

### Core Objective

Fix UI inconsistencies and API validation bug to allow creating task templates without required dates.

### Concrete Deliverables

- Updated `components/task-template-form.tsx` with tooltip and cleaned labels
- Updated `app/api/admin/task-templates/route.ts` with conditional validation
- Verification via browser and curl commands

### Definition of Done

- [x] Issue 1: Tooltip shows on hover, inline text removed
- [x] Issue 2: All "(可选)" labels removed, required fields still marked with "\*"
- [x] Issue 3: API accepts payload with isTemplate=1 and empty dates
- [x] Issue 3: API rejects payload with isTemplate=0 and empty dates
- [x] All changes tested and working correctly

### Must Have

- API validation must respect `isTemplate` field
- Form UI must be consistent (no inline tooltips)
- No breaking changes to existing functionality

### Must NOT Have (Guardrails)

- Do NOT modify form validation logic (it's already correct)
- Do NOT add new dependencies or components
- Do NOT change database schema
- Do NOT affect date overlap validation

---

## Verification Strategy (MANDATORY)

### Test Decision

- **Infrastructure exists**: YES (bun test)
- **User wants tests**: NO (manual verification only - UI changes and API validation)
- **Framework**: bun test (for API endpoint if needed)

### Automated Verification

Each task includes EXECUTABLE verification procedures:

**For Form UI Changes** (using browser manual verification):

```bash
# Agent (Sisyphus) would:
1. Navigate to http://localhost:3344/admin/task-templates/new
2. Check Label for "任务对象" - hover to see tooltip
3. Check all labels - verify "(可选)" is removed
4. Verify required fields still marked with "*"
5. Take screenshot for evidence
```

**For API Changes** (using Bash curl):

```bash
# Test 1: Template mode with empty dates (should succeed)
curl -s -X POST http://localhost:3344/api/admin/task-templates \
  -H "Content-Type: application/json" \
  -H "Cookie: session=..." \
  -d '{
    "templateName": "Test Template",
    "taskName": "Test Task",
    "basePoints": "10",
    "startDate": "",
    "endDate": "",
    "dateStrategyId": "dst_test_123",
    "isTemplate": 1
  }'

# Test 2: Non-template mode with empty dates (should fail)
curl -s -X POST http://localhost:3344/api/admin/task-templates \
  -H "Content-Type: application/json" \
  -H "Cookie: session=..." \
  -d '{
    "templateName": "Test Task",
    "taskName": "Test Task",
    "basePoints": "10",
    "startDate": "",
    "endDate": "",
    "dateStrategyId": "dst_test_123",
    "isTemplate": 0
  }'

# Expected: Test 1 returns 201, Test 2 returns 400
```

**Evidence Requirements**:

- Browser screenshots showing tooltip and cleaned labels
- curl command outputs for both API scenarios

---

## Execution Strategy

### Parallel Execution Waves

NO - Sequential execution required:

```
Wave 1 (Start Immediately):
└── Task 1: Fix API endpoint validation (route.ts)

Wave 2 (After Wave 1):
└── Task 2: Fix form UI (task-template-form.tsx)

Wave 3 (After Wave 2):
└── Task 3: Manual verification via browser and curl
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
| ---- | ---------- | ------ | -------------------- |
| 1    | None       | 2      | None                 |
| 2    | 1          | 3      | None                 |
| 3    | 2          | None   | None                 |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents                                                                                                                                     |
| ---- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1    | 1     | delegate_task(subagent_type="general", load_skills=[], description="Fix API validation", prompt="Fix the API endpoint to respect isTemplate field...") |
| 2    | 2     | delegate_task(subagent_type="quick", load_skills=["frontend-ui-ux"], description="Fix form UI", prompt="Fix 3 UI issues in task template form...")     |
| 3    | 3     | delegate_task(subagent_type="general", load_skills=[], description="Test and verify", prompt="Test the changes and verify all issues are fixed...")    |

---

## TODOs

- [x] 1. Fix API endpoint validation

  **What to do**:
  - Modify `app/api/admin/task-templates/route.ts` POST handler
  - Add conditional validation: check `isTemplate` field before requiring `startDate` and `endDate`
  - Lines to modify: 42-47 (current validation block)
  - New logic:

    ```typescript
    const isTemplateFromBody =
      body.isTemplate === 1 || body.isTemplate === true;

    // Only require dates if not in template mode
    if (!isTemplateFromBody && (!startDate || !endDate)) {
      return Response.json(
        createErrorResponse(
          ErrorCodes.VALIDATION_ERROR,
          "Missing required fields",
        ),
        { status: 400 },
      );
    }
    ```

  **Test cases**:
  - Test 1: POST with isTemplate=1 and empty dates → should succeed (201)
  - Test 2: POST with isTemplate=0 and empty dates → should fail (400)
  - Test 3: POST with isTemplate=1 and dates → should succeed (201)
  - Test 4: POST with isTemplate=0 and dates → should succeed (201)

  **Must NOT do**:
  - Don't change any other validation logic
  - Don't modify form validation in task-template-form.tsx
  - Don't touch database queries or other endpoints

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high` (backend validation logic)
  - **Skills**: [] (simple TypeScript fix, no special skills needed)

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (must be done before form fix)
  - **Blocks**: Task 2 (form UI fix)
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References** (existing code to follow):
  - `app/api/admin/task-templates/route.ts:42-47` - Current validation logic
  - `app/api/admin/task-templates/route.ts:18-23` - Admin check pattern
  - `lib/constant.ts:ErrorCodes` - Error code definitions

  **API/Type References** (contracts to implement against):
  - None (changing existing validation)

  **Test References** (testing patterns to follow):
  - None (manual verification via curl)

  **Documentation References** (specs and requirements):
  - None (user requirements clear)

  **External References** (libraries and frameworks):
  - None (TypeScript logic)

  **WHY Each Reference Matters**:
  - `route.ts:42-47`: Current validation we need to modify
  - `route.ts:18-23`: Pattern for admin authorization checks
  - `constant.ts:ErrorCodes`: Error code definitions for validation errors

  **Acceptance Criteria**:

  **If bun test (tests enabled)**:
  - [ ] Test file created: app/api/admin/task-templates/route.test.ts
  - [ ] Test covers: template mode validation
  - [ ] bun test app/api/admin/task-templates/route.test.ts → PASS

  **Automated Verification (ALWAYS include, choose by deliverable type)**:

  **For API/Backend changes** (using Bash curl):

  ```bash
  # Agent runs:
  curl -s -X POST http://localhost:3344/api/admin/task-templates \
    -H "Content-Type: application/json" \
    -H "Cookie: session=test" \
    -d '{"templateName":"Test","taskName":"Test","basePoints":"10","startDate":"","endDate":"","dateStrategyId":"dst_123","isTemplate":1}' | jq '.success'

  # Assert: Returns true (success)
  # Assert: HTTP status 201

  curl -s -X POST http://localhost:3344/api/admin/task-templates \
    -H "Content-Type: application/json" \
    -H "Cookie: session=test" \
    -d '{"templateName":"Test","taskName":"Test","basePoints":"10","startDate":"","endDate":"","dateStrategyId":"dst_123","isTemplate":0}' | jq '.success'

  # Assert: Returns false (failure)
  # Assert: HTTP status 400
  ```

  **Evidence to Capture**:
  - [ ] Terminal output from verification commands (actual output, not expected)
  - [ ] JSON response bodies for API changes

  **Commit**: YES
  - Message: `fix(api): respect isTemplate field in task template validation`
  - Files: `app/api/admin/task-templates/route.ts`
  - Pre-commit: Test with curl

- [x] 2. Fix form UI

  **What to do**:
  - Issue 1: Add `title` attribute to "任务对象" label
    - Line 79: Change `<Label htmlFor="targetMember">任务对象 (可选)</Label>` to `<Label htmlFor="targetMember" title="模板模式下不能指定任务对象">任务对象</Label>`
    - Remove lines 394-396: Delete the inline `<p>` element
  - Issue 2: Remove "(可选)" from all labels
    - Line 79: Remove "(可选)" from "任务对象" label
    - Line 84: Change `<Label htmlFor="badge">徽章 (可选)</Label>` to `<Label htmlFor="badge">徽章</Label>`
    - Line 102: Change `<Label>适合年龄段 (可选)</Label>` to `<Label>适合年龄段</Label>`

  **Test cases**:
  - Hover over "任务对象" label → tooltip shows "模板模式下不能指定任务对象"
  - Check all labels → verify "(可选)" is removed
  - Verify required fields still have "\*"

  **Must NOT do**:
  - Don't change any form validation logic
  - Don't modify disabled state logic
  - Don't change any other label text

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Ensures clean, consistent UI pattern for tooltip and labels
  - **Skills Evaluated but Omitted**:
    - `playwright`: Not needed for simple label changes

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (must be done after API fix)
  - **Blocks**: Task 3 (verification)
  - **Blocked By**: Task 1 (API fix)

  **References**:

  **Pattern References** (existing code to follow):
  - `components/task-template-form.tsx:79-96` - Target member dropdown (current state)
  - `components/task-template-form.tsx:394-396` - Inline text to remove
  - `components/task-template-form.tsx:84-98` - Badge dropdown (similar pattern)
  - `components/task-template-form.tsx:102-18` - Age range (similar pattern)

  **API/Type References** (contracts to implement against):
  - None

  **Test References** (testing patterns to follow):
  - None (manual verification)

  **Documentation References** (specs and requirements):
  - None (user requirements clear)

  **External References** (libraries and frameworks):
  - Lucide React - no icons needed
  - Shadcn UI - Label component supports `title` attribute

  **WHY Each Reference Matters**:
  - `task-template-form.tsx:79-96`: Current implementation to fix
  - `task-template-form.tsx:394-396`: Code to delete
  - Other label examples show consistent pattern

  **Acceptance Criteria**:

  **If bun test (tests enabled)**:
  - [ ] Test file created: components/task-template-form.test.tsx
  - [ ] Test covers: label text and tooltip presence
  - [ ] bun test components/task-template-form.test.tsx → PASS

  **Automated Verification (ALWAYS include, choose by deliverable type)**:

  **For Frontend/UI changes** (using manual browser verification):

  ```bash
  # Agent would:
  1. Navigate to http://localhost:3344/admin/task-templates/new
  2. Hover over "任务对象" label → Verify tooltip shows "模板模式下不能指定任务对象"
  3. Check all labels: "模板名称 * (2-20字符)", "任务名称 * (2-20字符)", "基础奖励 *", "任务对象", "徽章", "适合年龄段", "日期范围", "日期策略 *", "开启连击"
  4. Verify all "(可选)" text is removed
  5. Verify required fields still have "*"
  6. Take screenshot: .sisyphus/evidence/task-2-form-ui-fixed.png
  ```

  **Evidence to Capture**:
  - [ ] Screenshot files in .sisyphus/evidence/ for UI changes
  - [ ] Manual verification notes

  **Commit**: YES
  - Message: `fix(ui): clean up task template form labels and add tooltip`
  - Files: `components/task-template-form.tsx`
  - Pre-commit: Manual browser verification

- [x] 3. Test and verify all changes

  **What to do**:
  - Test Issue 1 fix: Verify tooltip appears on hover
  - Test Issue 2 fix: Verify all "(可选)" labels removed
  - Test Issue 3 fix: Test both API scenarios via curl
  - Verify form works correctly with both template and non-template modes
  - Take screenshots and capture terminal output

  **Test cases**:
  1. Open form, hover over "任务对象" → tooltip visible
  2. Check all labels → no "(可选)" text
  3. Create task template (isTemplate=1, no dates) → success
  4. Create task (isTemplate=0, no dates) → failure (400)
  5. Create task (isTemplate=0, with dates) → success

  **Must NOT do**:
  - Don't change any code
  - Don't run tests that weren't planned

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (final step)
  - **Blocks**: None
  - **Blocked By**: Task 2 (form UI fix)

  **References**:

  **Pattern References**:
  - All previous tasks and their code locations

  **Test References**:
  - None (manual verification)

  **Acceptance Criteria**:

  **Automated Verification**:

  **For Frontend/UI changes**:

  ```bash
  # Verify Issue 1: Tooltip present
  browser.find_label("任务对象") → title attribute contains "模板模式下不能指定任务对象"

  # Verify Issue 2: No optional labels
  browser.check_label("模板名称") → no "(可选)"
  browser.check_label("任务名称") → no "(可选)"
  browser.check_label("基础奖励") → no "(可选)"
  browser.check_label("徽章") → no "(可选)"
  browser.check_label("适合年龄段") → no "(可选)"

  # Verify Issue 3: API validation
  curl POST (isTemplate=1, empty dates) → 201 Created
  curl POST (isTemplate=0, empty dates) → 400 Bad Request
  ```

  **Evidence to Capture**:
  - [ ] Browser screenshots for all checks
  - [ ] curl command outputs
  - [ ] Final checklist completion

  **Commit**: YES
  - Message: `chore: test and verify task template form fixes`
  - Files: No new files
  - Pre-commit: All tests pass

---

## Commit Strategy

| After Task | Message                                                          | Files                                 | Verification         |
| ---------- | ---------------------------------------------------------------- | ------------------------------------- | -------------------- |
| 1          | `fix(api): respect isTemplate field in task template validation` | app/api/admin/task-templates/route.ts | curl tests           |
| 2          | `fix(ui): clean up task template form labels and add tooltip`    | components/task-template-form.tsx     | Browser verification |
| 3          | `chore: test and verify task template form fixes`                | evidence/                             | All tests pass       |

---

## Success Criteria

### Verification Commands

```bash
# API test 1: Template mode (should succeed)
curl -X POST http://localhost:3344/api/admin/task-templates \
  -H "Content-Type: application/json" \
  -d '{"templateName":"Test","taskName":"Test","basePoints":"10","startDate":"","endDate":"","dateStrategyId":"dst_123","isTemplate":1}' | jq '.success' # Expected: true, HTTP: 201

# API test 2: Non-template mode with no dates (should fail)
curl -X POST http://localhost:3344/api/admin/task-templates \
  -H "Content-Type: application/json" \
  -d '{"templateName":"Test","taskName":"Test","basePoints":"10","startDate":"","endDate":"","dateStrategyId":"dst_123","isTemplate":0}' | jq '.success' # Expected: false, HTTP: 400

# Browser: Check UI
# 1. Tooltip shows on hover over "任务对象"
# 2. All "(可选)" labels removed
# 3. Required fields still marked with "*"
```

### Final Checklist

- [x] All "Must Have" present (API validation respects isTemplate, UI consistent)
- [x] All "Must NOT Have" absent (no code changes beyond scope)
- [x] All manual tests pass
- [x] Screenshots captured
- [x] curl tests confirm API behavior
