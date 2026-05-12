# Task 2f — Bug Fix Agent Work Log

## Bugs Fixed

### Bug #7: Duplicate Class Code Can Still Collide
- **File**: `src/app/api/classes/route.ts`
- **Root Cause**: When auto-generating a class code, collision check only retried once
- **Fix**: Replaced single retry with a `while` loop (max 10 attempts). If all attempts fail, returns 500 error

### Bug #8: Discussions GET Endpoint Has No Authentication
- **File**: `src/app/api/discussions/route.ts`
- **Root Cause**: GET handler did not check `getSession()` — anyone could read discussions
- **Fix**: Added auth check at the start of GET handler; also simplified `isLiked` logic since `user` is now guaranteed non-null

### Bug #9: CSV Export Doesn't Escape Special Characters
- **Files**: `src/app/api/submissions/export/route.ts`, `src/app/api/attendance/export/route.ts`
- **Root Cause**: `row.join(',')` without quoting — fields containing commas, quotes, or newlines would break CSV
- **Fix**: Added `escapeCsvField()` helper that wraps each field in double quotes and escapes internal double quotes by doubling them

### Bug #10: Dashboard API Makes Redundant Database Queries
- **File**: `src/app/api/dashboard/route.ts`
- **Root Cause**: For non-admin users, `classUser` was queried 3 separate times (once for guru role, once for announcements, once for assignments) with the same `userId`
- **Fix**: Fetch user's class IDs once at the top for all non-admin users, then reuse `classIds` for announcements and assignments filtering. Guru-specific filtering uses a separate `guruClassIds` derived from the same pattern.

### Bug #12: rememberMe Checkbox Does Nothing
- **Files**: `src/components/pages/LoginPage.tsx`, `src/app/api/auth/login/route.ts`, `src/lib/auth.ts`
- **Root Cause**: `rememberMe` state was toggled but never sent to the login API or used for cookie duration
- **Fix**:
  - `LoginPage.tsx`: Sends `rememberMe` in login request body; added to useCallback deps
  - `login/route.ts`: Accepts `rememberMe` from request body; sets `maxAge` to 30 days (if rememberMe) or 1 day (if not)
  - `auth.ts`: `createSession()` now accepts optional `maxAge` parameter

### Bug #13-14: subjects API uses Request instead of NextRequest
- **File**: `src/app/api/subjects/route.ts`
- **Root Cause**: DELETE and PUT handlers used `Request` type and `new URL(request.url)` instead of `NextRequest` and `request.nextUrl.searchParams`
- **Fix**: Changed import to include `NextRequest`, updated PUT and DELETE signatures to use `NextRequest`, changed DELETE to use `request.nextUrl.searchParams.get('id')`

## Verification
- Zero lint errors after all fixes
