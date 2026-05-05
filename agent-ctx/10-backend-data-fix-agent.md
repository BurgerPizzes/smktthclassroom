# Task 10 — Backend & Data Fix Agent

## Work Summary
Completed all 5 tasks: fixed seed data, created sample files, added API endpoints, enhanced notification store, and added export APIs.

## Task 1: Fix Seed Data — Clean Corrupt Grades
- Reviewed `prisma/seed.ts` — grades were already realistic (88, 42) from prior fix
- Deleted existing database: `rm /home/z/my-project/db/custom.db`
- Ran `bun run db:push` to recreate schema
- Ran `bun prisma/seed.ts` to re-seed with clean data
- Verified seed completed successfully with all data (users, classes, assignments, submissions, etc.)

## Task 2: Add Sample Files for Demo
Created placeholder files in `/home/z/my-project/public/uploads/`:
- `modul-react.pdf` — minimal valid PDF
- `git-tutorial.pdf` — minimal valid PDF
- `subnetting-cheatsheet.pdf` — minimal valid PDF
- `poster-dewi.png` — 1x1 pixel PNG
- `template-poster.psd` — text placeholder
- `portfolio-ahmad.zip` — text placeholder
- `router-config.pkt` — text placeholder
- `slide-jaringan.pptx` — text placeholder (referenced in seed data)

## Task 3: Add Member Removal API + Notification DELETE API
- Created `src/app/api/classes/[id]/members/[userId]/route.ts` — DELETE endpoint
  - Only class creator or admin can remove members
  - Cannot remove the class creator
  - Uses `db.classUser.deleteMany` to remove the enrollment
- Created `src/app/api/notifications/[id]/route.ts` — DELETE endpoint
  - Only the notification owner or admin can delete
  - Uses `db.notification.delete`

## Task 4: Add Notification Polling in Frontend
- Updated `src/lib/store.ts`:
  - Added `notifications: any[]` and `notifCount: number` state
  - Added `setNotifications` and `setNotifCount` actions
  - Reset notifications and count on logout
- Updated `src/components/AppLayout.tsx`:
  - Imported `setNotifications` and `setNotifCount` from store
  - `fetchCount` now stores full notification list in store via `setNotifications(data)`
  - Also syncs `notifCount` to store via `setStoreNotifCount(unreadCount)`
  - Added dependencies to useEffect

## Task 5: Add Attendance and Submissions Export APIs
- Created `src/app/api/attendance/export/route.ts` — GET endpoint
  - Requires `classId` query param
  - Verifies user access (class member or admin)
  - Returns CSV with headers: Tanggal, Nama Siswa, Email, Kelas, Status
  - Content-Disposition header for download
- Created `src/app/api/submissions/export/route.ts` — GET endpoint
  - Optional `classId` query param
  - Students only export their own submissions
  - Guru/admin export all (optionally filtered by class)
  - Returns CSV with headers: Siswa, Email, Kelas, Tugas, Tipe, Poin Maks, Nilai, Status, Tanggal
  - Grade values use `Math.round()` and handle NaN/Infinity

## Verification
- `bun run lint` — zero errors
- Dev server running cleanly on port 3000
- All API routes returning 200 responses
