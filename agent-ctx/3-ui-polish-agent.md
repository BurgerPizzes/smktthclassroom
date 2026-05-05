# Task ID: 3 — UI Polish Agent: Dashboard & Classes Pages

## Summary
Polished the Dashboard and Classes pages to fix QA-reported UI/UX issues. All changes maintain the glass/aurora design language and dark mode compatibility.

## Changes Made

### DashboardPage.tsx
1. **Stat Card Progress Bars**: Fixed the always-100% progress bar by adding `max` values to each stat card. Total Kelas max=10, Tugas Aktif max=20, Submissions Masuk max=totalAssignments*5, Tugas Selesai max=totalAssignments, Pengumuman max=10. Progress now shows meaningful relative fill.
2. **Welcome Banner Decorative Circles**: Replaced non-standard `bg-white/5`, `bg-white/8`, `bg-white/10` classes with inline `style={{ background: 'rgba(255,255,255,0.05)' }}` etc.
3. **Quick Actions Spacing**: Changed grid gap from `gap-3` to `gap-4` and increased CSS padding from `1rem` to `1.125rem 0.75rem` with gap from `8px` to `10px`.
4. **Announcement/Assignment Items**: Changed `interactive-card p-3` to `p-4` for more breathing room.
5. **Activity Feed Avatars**: Increased avatar size from `w-8 h-8` to `w-9 h-9` and padding from `p-3` to `p-4`.
6. **Motivational Quote Card**: Added `border-left: 4px solid` with `border-image: linear-gradient(180deg, #667eea, #764ba2, #f093fb) 1` gradient accent in CSS.

### ClassesPage.tsx
1. **Class Card Padding**: Increased from `p-4` to `p-5`, with `mt-3` → `mt-4` for footer spacing and `mt-1` → `mt-1.5` for description.
2. **Member Avatars**: Increased from `w-6 h-6` to `w-7 h-7` with `text-[10px]` → `text-[11px]`. Extra count chip also `w-7 h-7`. Avatar stack overlap increased from `-8px` to `-10px` with hover scale `1.1` → `1.15`. Icons increased from `w-3 h-3` to `w-3.5 h-3.5`.
3. **Quick Join Section**: Redesigned layout with `flex-col sm:flex-row`, larger icon `w-11 h-11`, `font-semibold` label, input `py-2.5`, button `px-5 py-2.5` with `btn-gradient` and `whitespace-nowrap`. Padding increased to `p-5`.
4. **Search Bar**: Added descriptive placeholder text, `py-2.5` for consistent height, clear button (X) when search has content, adjusted icon padding to `left-3.5`.
5. **Empty State**: Enhanced with `motion.div` animation, illustration-like icon in gradient rounded box (`w-20 h-20 rounded-2xl`), `text-xl font-semibold` heading, `max-w-sm mx-auto` description, stacked responsive CTA buttons with `px-5 py-2.5`.
6. **Card Spacing**: Grid gap changed from `gap-4` to `gap-5`.
7. **Subject Colors**: Ensured distinct colors — fisika now red/orange (was purple/indigo), biologi now teal/cyan (was emerald/teal), komputer now indigo/violet (was cyan/blue), seni now pink/fuchsia (was pink/purple), tik now cyan/sky (was teal/cyan). Added musik entry with purple/fuchsia.

### globals.css
1. **motivational-card**: Added `border-left: 4px solid` with gradient `border-image`. Adjusted `::before` quote `left` from `10px` to `16px` to account for border.
2. **quick-action-btn**: Increased gap from `8px` to `10px`, padding from `1rem` to `1.125rem 0.75rem`.
3. **avatar-stack**: Increased overlap from `-8px` to `-10px`, hover transform from `translateY(-2px) scale(1.1)` to `translateY(-3px) scale(1.15)`.

## Verification
- `bun run lint` passes with zero errors
- Dev server running cleanly
- All changes maintain glass/aurora design language
- Dark mode still works (all changes use CSS variables)
