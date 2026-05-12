# Task 15: UI/UX Fix Agent

## Task Summary
Fix UI/UX issues in the SMKTTH Classroom project - grading section layout and select/dropdown styling.

## Changes Made

### Task A: Fix Assignment Submission/Assessment Page Layout
**File**: `src/components/pages/AssignmentDetailPage.tsx`

- **Grading section (sub.status !== 'graded')**: Changed from cramped single-row layout (`flex items-center gap-2`) to proper vertical layout (`space-y-3 pt-3 border-t`)
  - Grade input: Changed from `w-20` to `w-24`, added "Nilai:" label and `/{points}` suffix span
  - Feedback: Changed from `<input type="text">` to `<textarea rows={2}>` with "Feedback:" label and `resize-none` class
  - Button: Changed text from "Nilai" to "Simpan Nilai" with `ml-auto` positioning and `px-4` padding
  - Added proper `<label>` elements for both fields

- **Graded display (sub.status === 'graded')**: Changed from single cramped row to `space-y-1` layout
  - Grade display: Proper flex with Star icon and grade text
  - Feedback: Changed from inline `— {sub.feedback}` to block-level italic quote with `pl-6` indentation using `&ldquo;` and `&rdquo;` quotation marks

### Task B: Improve Select/Dropdown UI/UX

**File**: `src/app/globals.css`
- Added `.styled-select` CSS class with:
  - Custom dropdown chevron arrow via `background-image` SVG
  - `appearance: none` / `-webkit-appearance: none` to remove native styling
  - `padding-right: 36px` to accommodate the arrow
  - `cursor: pointer` and smooth transition
  - Hover state: border color change to `var(--glass-text-muted)`
  - Focus state: purple border (`#7c3aed`) with subtle box-shadow
  - Option styling: uses `var(--glass-bg)` and `var(--glass-text)` for theme consistency

**Applied `styled-select` class to all 7 `<select>` elements across 6 files:**

1. `LearningResourcesPage.tsx` line 462 - Sort selector: `glass-input styled-select text-sm w-auto sm:w-40`
2. `LearningResourcesPage.tsx` line 819 - Upload dialog class selector: `glass-input styled-select w-full`
3. `AttendancePage.tsx` line 705 - Class selector: `glass-input styled-select flex-1`
4. `ClassesPage.tsx` line 550 - Subject selector: `glass-input styled-select`
5. `MySubmissionsPage.tsx` line 320 - Sort selector: `glass-input styled-select pr-8 text-sm cursor-pointer` (removed duplicate `appearance-none` since styled-select handles it)
6. `ProgressAnalyticsPage.tsx` line 275 - Student selector: `glass-input styled-select max-w-xs`
7. `SchedulePage.tsx` line 659 - Class selector: `glass-input styled-select text-sm`

Note: AdminSettingsPage.tsx has no native `<select>` elements (uses pill-style select buttons instead).

## Verification
- `bun run lint` — zero errors
- Dev server running cleanly on port 3000
