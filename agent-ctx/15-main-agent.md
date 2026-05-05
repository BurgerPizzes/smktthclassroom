# Task: Subjects CRUD Page for SMKTTH Classroom

## Task ID: 15
## Agent: Main Agent

## Summary
Successfully created a complete Subjects CRUD page for the SMKTTH Classroom project.

## Work Log

### Step 1: Updated Prisma Schema
- **File**: `prisma/schema.prisma`
- Added `description String?` field to the Subject model
- Ran `bun run db:push` to sync database schema

### Step 2: Added POST/PUT/DELETE to Subjects API
- **File**: `src/app/api/subjects/route.ts`
- **POST**: Create subject (guru/admin only) - validates name uniqueness, returns created subject with counts
- **PUT**: Update subject (guru/admin only) - validates existence, name uniqueness on change, returns updated subject
- **DELETE**: Delete subject (admin only) - validates existence, prevents delete if subject has classes or assignments

### Step 3: Added 'subjects' to PageName type
- **File**: `src/lib/store.ts`
- Added `'subjects'` to the `PageName` type union

### Step 4: Created SubjectsPage Component
- **File**: `src/components/pages/SubjectsPage.tsx`
- Full-featured CRUD page with:
  - Stats cards (Total Mapel, Total Kelas, Total Tugas)
  - Search bar with clear button (searches name, code, description)
  - "Tambah Mapel" button (guru/admin only)
  - Subject cards in responsive grid (1/2/3 columns)
  - Each card: icon with gradient header, code badge, name, description, class/assignment counts, edit/delete buttons
  - Subject icon/color auto-detection (matches keywords like "matematika" → Calculator icon + blue)
  - Create/Edit dialog with name (required), code (optional, auto-uppercase), description (optional)
  - Delete confirmation overlay on each card
  - Role-based action visibility (edit for guru/admin, delete for admin only)
  - Empty state with CTA button
  - Loading skeleton state
  - Framer Motion animations throughout
  - Consistent styling using glass-card, glass-input, btn-gradient, interactive-card, etc.

### Step 5: Added to AppLayout Navigation
- **File**: `src/components/AppLayout.tsx`
- Imported `SubjectsPage` component
- Imported `Library` icon from lucide-react
- Added nav item: `{ page: 'subjects', label: 'Mata Pelajaran', icon: Library, roles: ['guru', 'admin'], section: 'Pembelajaran' }`
- Added page mapping: `subjects: SubjectsPage`

### Step 6: Verification
- Ran `bun run lint` — zero errors
- Dev server running cleanly on port 3000

## Files Modified
1. `prisma/schema.prisma` — Added `description` field to Subject
2. `src/app/api/subjects/route.ts` — Added POST, PUT, DELETE handlers
3. `src/lib/store.ts` — Added 'subjects' to PageName type
4. `src/components/pages/SubjectsPage.tsx` — NEW: Full CRUD page component
5. `src/components/AppLayout.tsx` — Added navigation, page mapping, Library icon import
