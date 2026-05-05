import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check discussion exists
    const discussion = await db.discussion.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!discussion) {
      return NextResponse.json({ error: 'Diskusi tidak ditemukan' }, { status: 404 })
    }

    // Check if already liked
    const existingLike = await db.discussionLike.findUnique({
      where: {
        discussionId_userId: {
          discussionId: id,
          userId: user.id,
        },
      },
    })

    if (existingLike) {
      // Unlike
      await db.discussionLike.delete({
        where: { id: existingLike.id },
      })
    } else {
      // Like
      await db.discussionLike.create({
        data: {
          discussionId: id,
          userId: user.id,
        },
      })
    }

    // Get current like count
    const likeCount = await db.discussionLike.count({
      where: { discussionId: id },
    })

    return NextResponse.json({
      liked: !existingLike,
      likeCount,
    })
  } catch (error) {
    console.error('Discussion like POST error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
