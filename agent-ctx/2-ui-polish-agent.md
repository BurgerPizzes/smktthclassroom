# Task ID: 2 — UI Polish Agent: AppLayout & Global CSS

## Summary
Polished the AppLayout component and global CSS to address 7 QA issues for a consistent, professional look.

## Files Modified
1. **`/home/z/my-project/src/components/AppLayout.tsx`** — Sidebar (active states, section dividers, icon backgrounds), top navbar (bigger badges/avatars, consistent gaps), footer (3-column, more contrast, sticky), mobile nav (active pill, bigger icons)
2. **`/home/z/my-project/src/app/globals.css`** — Added `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.heading-1`–`.heading-4`, `.section-title`, `.content-card`, `.badge-sm`, `.badge-md`, `.sidebar-section-label`, `.sidebar-section-divider`, `.mobile-nav-item`, `.app-footer*` classes
3. **`/home/z/my-project/src/components/pages/DashboardPage.tsx`** — Fixed pre-existing JSX syntax error (line 453)
4. **`/home/z/my-project/src/components/pages/ClassesPage.tsx`** — Fixed pre-existing JSX syntax error (line 410)

## Key Changes
- Sidebar: Thicker active indicator (w-1.5), icon background circles, section dividers (Utama/Pembelajaran/Admin)
- Navbar: Bigger notification badge with gradient, w-8 avatar, user info in dropdown, consistent gap-3
- Footer: 3-column with links, more contrast text, glass background
- Mobile nav: Active pill with gradient top bar, w-6 h-6 icons
- CSS: Complete button system (primary/secondary/ghost), typography hierarchy, card design system, badge sizing

## Status
✅ Complete — Zero lint errors, dev server running cleanly
