# Task Template Form Update - Completion Summary

## Completed Tasks

### 1. ✅ Page Text Updates

- Modified `app/admin/task-templates/new/page.tsx`
- Changed "新建计划任务模板" → "新建计划任务"
- Changed "创建新的任务模板" → "创建新的计划任务"
- Changed "模板信息" → "计划任务信息"

### 2. ✅ Drizzle ORM Queries Added

Added to `lib/db/queries.ts`:

- `getFamilyMembersByFamilyId(familyId)` - Get family members with user info, sorted by role
- `getFamilyUserIds(familyId)` - Get list of user IDs in family
- `getFamilyDateStrategies(userIds)` - Get non-public date strategies created by family members

### 3. ✅ API Endpoints Created

- `app/api/family/members/route.ts` - GET endpoint returning family members
- `app/api/family/date-strategies/route.ts` - GET endpoint returning family date strategies

### 4. ✅ Task Template Form Modified

Modified `components/task-template-form.tsx` with:

- **Date Range Input**: Combined start/end date inputs with "至" separator
- **Enable Combo Checkbox**: Toggle to show/hide combo strategy section
- **Target Member Select**: Dropdown to select task target (disabled in template mode)
- **Conditional Date Strategy**: Shows public strategies in template mode, family strategies otherwise
- **Date Overlap Validation**: Checks if date range overlaps with selected date strategy
- **AlertDialog**: Confirmation dialog when no date overlap detected
- **Conditional Validation**:
  - Dates optional when template mode
  - Combo strategy required only when enabled

## Key Implementation Details

### Date Overlap Check Logic

```typescript
const checkDateOverlap = (
  dateRangeStart: string,
  dateRangeEnd: string,
  dateStrategyDates: string,
): boolean => {
  const rangeStart = new Date(dateRangeStart);
  const rangeEnd = new Date(dateRangeEnd);
  const strategyDates = dateStrategyDates.split(",");

  for (const dateStr of strategyDates) {
    const strategyDate = new Date(dateStr.trim());
    if (strategyDate >= rangeStart && strategyDate <= rangeEnd) {
      return true; // Has overlap
    }
  }
  return false; // No overlap
};
```

### State Management

- Added `enableCombo` state to toggle combo strategy visibility
- Added `targetMemberId` state for task target selection
- Added `familyMembers` state populated from API
- Added `showDateOverlapDialog` state for confirmation dialog

### Form Validation Updates

- Dates required only when not in template mode
- Combo strategy fields required only when `enableCombo` is true
- Date overlap check performed before submission for non-template mode

## Files Modified

1. `app/admin/task-templates/new/page.tsx`
2. `lib/db/queries.ts`
3. `components/task-template-form.tsx`

## Files Created

1. `app/api/family/members/route.ts`
2. `app/api/family/date-strategies/route.ts`

## Testing Checklist

- [ ] Page title shows "新建计划任务"
- [ ] Form title shows "计划任务信息"
- [ ] Date range input displays correctly
- [ ] Template checkbox toggles date requirement
- [ ] Template checkbox clears target member selection
- [ ] Enable combo checkbox shows/hides combo strategy section
- [ ] Target member dropdown populated from API
- [ ] Date strategies filtered by template mode
- [ ] Date overlap validation works
- [ ] AlertDialog displays when no overlap
- [ ] Form submission works correctly

## Notes

- Used Drizzle ORM for data queries as per project constraints
- Used raw SQL only for simple family_id lookups in API endpoints
- AlertDialog component imported from `@/components/ui/alert-dialog`
- All changes follow existing code patterns in the project
