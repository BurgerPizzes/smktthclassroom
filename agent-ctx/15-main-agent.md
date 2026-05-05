# Task 15 - Main Agent (Bug Fix)

## Task: Fix 4 user-requested issues

## Summary
All 4 issues have been successfully fixed, linted, committed, and pushed to GitHub.

## Changes Made

### Issue 1: Remove Google/Microsoft Login Buttons
- **File**: `src/components/pages/LoginPage.tsx`
- Removed social login section (lines 240-265)
- Removed `Globe` and `MonitorSmartphone` from imports

### Issue 2A: Fix handleRemoveMember
- **File**: `src/components/pages/ClassDetailPage.tsx`
- Fixed API endpoint from `DELETE /api/classes/members` to `DELETE /api/classes/${classId}/members/${userId}`
- Added `userId` as third argument
- Changed visibility from `isClassOwner` to `isGuru`
- **File**: `src/app/api/classes/[id]/members/[userId]/route.ts`
- Updated to allow any guru in class to remove members

### Issue 2B: Add class deletion
- **File**: `src/app/api/classes/[id]/route.ts` (NEW)
- DELETE endpoint for class deletion (creator/admin only)
- **File**: `src/components/pages/ClassDetailPage.tsx`
- Added delete button with confirmation

### Issue 3: Student exit class from ClassesPage
- **File**: `src/components/pages/ClassesPage.tsx`
- Added "Keluar" button for siswa with two-click confirmation
- **File**: `src/app/api/classes/route.ts`
- Added `id: true` to creator select for all queries

### Issue 4: Recent assignments first
- **File**: `src/app/api/assignments/route.ts`
- Changed `orderBy: { dueDate: 'asc' }` to `orderBy: { createdAt: 'desc' }`

## Verification
- `bun run lint` passed with zero errors
- Dev server running cleanly on port 3000
- Git commit: `4954227` pushed to `BurgerPizzas/smktthclassroom.git` on branch `main`
