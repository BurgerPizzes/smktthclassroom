# SMKTTH Classroom LMS — QA Report (Round 4)

**Date:** 2026-05-04  
**Tester:** Automated QA (agent-browser)  
**Environment:** http://localhost:3000  
**Browsers Tested:** Chromium headless (1280x800 desktop, 375x812 mobile)  
**Total Screenshots:** 38  

---

## 1. BUGS FOUND

### BUG-001: Scientific Notation in Average Grade Display (CRITICAL)
- **Page:** My Submissions (both Teacher & Student views)
- **Description:** The "Rata-rata Nilai" (Average Grade) displays as `3.703703703703703e+21` (teacher) and `1.111111111111111e+22` (student) instead of a properly formatted percentage. The circular progress SVG also shows this broken value with a `%` suffix.
- **Root Cause:** A corrupted grade value of `1.111111111111111e+22` exists in the database for one submission. The `stats.avgGrade` calculation in `MySubmissionsPage.tsx` (line 98-102) computes the average including this extreme value, and `Math.round()` on a number this large still produces a scientific notation string when rendered.
- **Impact:** Complete visual breakage of the statistics section — unreadable average grade, broken progress circle.
- **Fix:** (1) Clamp/validate grade values before averaging (e.g., `Math.min(grade, assignment.points)`), (2) Format large numbers properly, (3) Fix the corrupted data in the database.

### BUG-002: Empty Student List in Attendance (for some classes)
- **Page:** Attendance (Teacher view)
- **Description:** When selecting "Test Kelas Baru" or "XII RPL 2" classes, the student list heading "Daftar Siswa" appears but no students are rendered. Only "XII RPL 1" shows students with attendance buttons.
- **Impact:** Teacher cannot mark attendance for classes with no enrolled students (data issue) or the list fails to render (rendering issue).
- **Note:** This may be a data issue (no students enrolled in those classes) rather than a code bug.

### BUG-003: Student Attendance Page Shows Empty History
- **Page:** Attendance (Student view — "Absensi Saya")
- **Description:** The student attendance page only shows the headings "Absensi Saya" and "Riwayat Kehadiran" but no attendance records, stats, or interactive elements.
- **Impact:** Students cannot view their own attendance history.
- **Severity:** Medium — possibly no attendance data exists for this student yet.

---

## 2. STYLING ISSUES

### STYLE-001: Mobile Bottom Nav Text Truncation
- **Page:** All pages (mobile view, 375px width)
- **Description:** The "Sumber Belajar" nav item is truncated to just "Sumber" in the bottom navigation bar.
- **Suggestion:** Use an icon + shorter label (e.g., "Belajar" or just the icon), or allow text to wrap.

### STYLE-002: Member Cards Not in Accessibility Tree
- **Page:** Class Detail → Members tab
- **Description:** Member cards (with names, emails, and role badges) are visible in the DOM and rendered on screen, but don't appear in the accessibility tree snapshot. This suggests missing ARIA attributes.
- **Impact:** Screen reader users may not be able to navigate the member list.
- **Suggestion:** Add `role="listitem"` or proper semantic elements to member cards.

### STYLE-003: Attendance Student Names Not in Accessibility Tree
- **Page:** Attendance (Teacher view)
- **Description:** Similar to STYLE-002, student names in the attendance list don't appear in the accessibility tree, though they are visually rendered.
- **Impact:** Screen reader accessibility concern.

### STYLE-004: Profile Page "Statistik" and "Aktivitas Terbaru" Sections Appear Empty
- **Page:** Profile
- **Description:** The "Statistik" and "Aktivitas Terbaru" section headings render but no stat cards or activity items are visible below them.
- **Impact:** The profile page looks incomplete with empty sections.
- **Suggestion:** Either populate with data or add empty state messages.

---

## 3. MISSING FEATURES / IMPROVEMENTS

### IMPROVE-001: No "Lupa Password" (Forgot Password) Functionality
- **Page:** Login
- **Description:** The "Lupa Password?" button exists but its target implementation is unclear. If it's just decorative, it should either be functional or removed.

### IMPROVE-002: No "Daftar Sekarang" (Register) Functionality
- **Page:** Login
- **Description:** The "Daftar sekarang" (Register now) button exists on the login page but registration may not be implemented for a school LMS where accounts are managed by admins.

### IMPROVE-003: Class Detail Stream Tab Empty for Some Classes
- **Page:** Class Detail → Stream tab
- **Description:** The XII RPL 2 class stream tab shows a "Buat pengumuman..." input but no existing announcements or posts. While this could be a data issue, there's no empty-state illustration or message.

### IMPROVE-004: Class Detail Tugas Tab Empty for Some Classes
- **Page:** Class Detail → Tugas tab
- **Description:** The XII RPL 2 class tugas tab shows a "Buat tugas baru..." input but no existing assignments. No empty state message.

### IMPROVE-005: User Management Stats Cards Not Visible in Snapshot
- **Page:** User Management (Admin)
- **Description:** The stats section after the heading appears to have 8 empty paragraph elements. While they may render visually with icons/numbers, the accessibility tree shows no content.
- **Suggestion:** Ensure stat cards have proper text content accessible to screen readers.

### IMPROVE-006: No Console Errors But Excessive Fast Refresh Rebuilds
- **Page:** All pages
- **Description:** The development server shows frequent `[Fast Refresh] rebuilding` and `[Fast Refresh] done in ~170-200ms` messages. While not errors, this indicates possible hot-reload instability during testing.
- **Severity:** Low — development-only concern.

### IMPROVE-007: Dark Mode Toggle Works but Sidebar Collapsed
- **Page:** All pages (dark mode)
- **Description:** When switching to dark mode, the sidebar collapses to an icon-only state and doesn't auto-expand. The user must manually open the sidebar each time.
- **Suggestion:** Preserve sidebar state across theme changes.

---

## 4. PAGE-BY-PAGE RESULTS

| # | Page | Status | Bugs | Notes |
|---|------|--------|------|-------|
| 1 | Login | ✅ PASS | None | Animated gradient, decorative panel, glass card all render. Demo account dropdown works. |
| 2 | Login (Teacher) | ✅ PASS | None | Login works correctly, redirects to dashboard. |
| 3 | Dashboard (Teacher) | ✅ PASS | None | Welcome banner, stat cards, upcoming assignments, quick actions all visible. |
| 4 | Dashboard (Student) | ✅ PASS | None | No "Kelas Baru" button (correct). Shows task progress (75%). |
| 5 | Classes | ✅ PASS | None | Class cards, search, Join/Create buttons render properly. |
| 6 | Calendar | ✅ PASS | None | Calendar grid, color-coded events, "Mendatang" section, "Ringkasan Bulan Ini" all present. |
| 7 | Class Detail → Stream | ⚠️ MINOR | IMPROVE-003 | Shows announcements for some classes, empty for others. |
| 8 | Class Detail → Members | ⚠️ MINOR | STYLE-002 | Members render visually but missing ARIA attributes. |
| 9 | Class Detail → Tugas | ⚠️ MINOR | IMPROVE-004 | Shows assignments for some classes, empty for others. |
| 10 | Attendance (Teacher) | ⚠️ MINOR | BUG-002, STYLE-003 | Works for XII RPL 1, empty for other classes. Attendance buttons with color states present. |
| 11 | Attendance (Student) | ❌ FAIL | BUG-003 | Empty — no attendance history displayed. |
| 12 | Resources | ✅ PASS | None | Resource cards, type filter chips, Upload button all render. |
| 13 | Discussions | ✅ PASS | None | Category chips, search, "Diskusi Baru" button, thread list all functional. |
| 14 | Notifications | ✅ PASS | None | Filter tabs with count badges, delete/mark-as-read buttons work. |
| 15 | Profile | ⚠️ MINOR | STYLE-004 | Avatar, Edit Profile button, but empty Statistik/Aktivitas sections. |
| 16 | My Submissions | ❌ FAIL | BUG-001 | Scientific notation in average grade breaks stats display. |
| 17 | Admin Settings | ✅ PASS | None | 4 tabs (Umum/Tampilan/Notifikasi/Keamanan) all render with toggles, selects, text inputs. |
| 18 | User Management | ✅ PASS | STYLE-005 | User list with search, role filter, bulk select, Edit/Delete actions. |
| 19 | Mobile View | ⚠️ MINOR | STYLE-001 | Bottom nav works but "Sumber" is truncated. Login page adapts to mobile. |
| 20 | Dark Mode | ⚠️ MINOR | IMPROVE-007 | Theme toggle works, sidebar collapses unexpectedly. |

---

## 5. ROLE-BASED ACCESS VERIFICATION

| Feature | Admin | Guru (Teacher) | Siswa (Student) | Status |
|---------|-------|----------------|-----------------|--------|
| Dashboard | ✅ "Kelas Baru" button | ✅ "Kelas Baru" button | ❌ No "Kelas Baru" | ✅ CORRECT |
| Sidebar: Pengaturan | ✅ Visible | ❌ Hidden | ❌ Hidden | ✅ CORRECT |
| Sidebar: Manajemen User | ✅ Visible | ❌ Hidden | ❌ Hidden | ✅ CORRECT |
| Classes: "Buat Kelas" | ✅ Available | ✅ Available | ❌ Not available | ✅ CORRECT |
| Classes: "Gabung" | ✅ Available | ✅ Available | ✅ Available | ✅ CORRECT |
| Attendance | ✅ Teacher view | ✅ Teacher view | ⚠️ Empty student view | ✅ ROLE CORRECT |
| Mobile Bottom Nav | N/A | N/A | ✅ Visible | ✅ CORRECT |

---

## 6. OVERALL ASSESSMENT

**Overall Quality: 7.5/10**

### Strengths:
1. **Consistent UI/UX** — The glass-card design system is applied consistently across all pages.
2. **Role-based access control works correctly** — Admin, Teacher, and Student see appropriate navigation and features.
3. **Responsive design** — Mobile bottom nav adapts well, login page restructures for small screens.
4. **Dark mode support** — Theme toggle works across all pages.
5. **No JavaScript console errors** — Clean console output throughout testing.
6. **Demo account feature** — Convenient dropdown for quick testing with different roles.
7. **Rich interactive features** — Attendance buttons, notification filters, calendar navigation all functional.

### Critical Issues to Fix:
1. **BUG-001** (Scientific notation in average grade) — This is a data corruption + missing validation issue that makes the Submissions page stats section completely unreadable.
2. **BUG-003** (Student attendance empty) — Students cannot view their attendance history.

### Recommended Priority:
1. 🔴 **P0:** Fix BUG-001 — Validate/clamp grade values, fix corrupted data, format numbers properly
2. 🟡 **P1:** Fix BUG-003 — Implement student attendance history view
3. 🟡 **P1:** Fix STYLE-004 — Add content or empty states to Profile page sections
4. 🟢 **P2:** Fix STYLE-001 — Adjust mobile nav labels
5. 🟢 **P2:** Fix STYLE-002/003 — Add ARIA attributes to member/attendance lists
6. 🟢 **P3:** IMPROVE-007 — Preserve sidebar state on theme toggle

---

*38 screenshots saved to `/home/z/my-project/download/qa-round-4/`*
