Task ID: 16
Agent: Feature Development Agent
Task: Add class schedule/timetable and admin health dashboard

Work Log:
- Updated Prisma schema to add Schedule model with classId, subject, dayOfWeek, startTime, endTime, room, createdBy fields and unique constraint on [classId, dayOfWeek, startTime]
- Added schedules Schedule[] relation to both User and Class models
- Ran db:push to apply schema changes successfully
- Created /api/schedule route with GET (returns schedules filtered by user role) and POST (guru/admin only, creates schedule entry with validation)
- Created /api/system/health route with GET (admin only) returning comprehensive health data: user counts by role, recent activity, notification stats, file storage info, recent actions, database record counts, daily activity chart data, and performance metrics
- Updated prisma/seed.ts with 16 sample schedule entries across 3 classes (5-6 per class, covering Senin-Jumat)
- Ran seed to populate schedule data
- Created SchedulePage.tsx with weekly timetable grid, mobile day-by-day view, current time indicator, week navigation, today highlight, add schedule dialog for guru/admin, empty slot "+" buttons, and class summary cards
- Created SystemHealthPage.tsx with system stats cards (uptime, users, sessions, db size), activity bar chart, recent actions log, storage usage, notification stats, performance metrics, database record counts, quick action buttons, and user role distribution
- Added 'schedule' and 'system-health' to PageName type in store.ts
- Added "Jadwal" nav item with CalendarDays icon in sidebar and mobile bottom nav
- Added "Kesehatan Sistem" nav item with Activity icon, roles: ['admin'] in sidebar
- Updated PageRenderer mapping to include both new pages
- Zero lint errors, dev server running cleanly

Stage Summary:
- Two new pages fully implemented: Schedule (Jadwal) and System Health (Kesehatan Sistem)
- Schedule API with role-based access and CRUD support
- System Health API with comprehensive admin monitoring data
- 16 sample schedule entries seeded across 3 classes
- Full responsive design with mobile-first approach
- Consistent with existing design language (glass cards, gradient text, Framer Motion animations, Lucide icons)
