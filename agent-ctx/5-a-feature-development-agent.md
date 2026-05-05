# Task 5-a: Discussion Thread Persistence & Enhancements

## Summary
Successfully implemented backend persistence for discussion threads with full CRUD API endpoints and updated the frontend to use API calls instead of client-side state.

## Changes Made

### Database Schema (prisma/schema.prisma)
- Added `Discussion` model with title, content, category, priority, classId, createdBy
- Added `DiscussionReply` model with content, discussionId, createdBy
- Added `DiscussionLike` model with discussionId, userId and unique constraint on [discussionId, userId]
- Added relations to User model: discussions, discussionReplies, discussionLikes
- Added relation to Class model: discussions

### API Endpoints
1. `GET /api/discussions` — List with pagination, category/search filter, sort
2. `POST /api/discussions` — Create discussion (auth required)
3. `GET /api/discussions/[id]` — Get single discussion with replies/likes
4. `DELETE /api/discussions/[id]` — Delete (creator/admin only)
5. `POST /api/discussions/[id]/replies` — Add reply (auth required)
6. `POST /api/discussions/[id]/like` — Toggle like (auth required)

### Frontend (DiscussionsPage.tsx)
- Replaced frontend-only state with API calls
- Category filtering uses server-side category parameter
- Like toggle via API with loading state
- Reply submission via API
- Create discussion via API
- Delete discussion for creator/admin
- Loading spinners, error handling, toast notifications

## Files Changed
- `prisma/schema.prisma` — Added 3 new models + relations
- `src/app/api/discussions/route.ts` — NEW
- `src/app/api/discussions/[id]/route.ts` — NEW
- `src/app/api/discussions/[id]/replies/route.ts` — NEW
- `src/app/api/discussions/[id]/like/route.ts` — NEW
- `src/components/pages/DiscussionsPage.tsx` — REWRITTEN

## Status
✅ All tasks completed, zero lint errors, dev server running
