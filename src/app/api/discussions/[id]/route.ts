import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getSession()

    const discussion = await db.discussion.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true, avatar: true } },
        class: { select: { id: true, name: true } },
        replies: {
          include: {
            creator: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        likes: { select: { userId: true } },
      },
    })

    if (!discussion) {
      return NextResponse.json({ error: 'Diskusi tidak ditemukan' }, { status: 404 })
    }

    const result = {
      id: discussion.id,
      title: discussion.title,
      content: discussion.content,
      category: discussion.category,
      priority: discussion.priority,
      classId: discussion.classId,
      createdBy: discussion.createdBy,
      createdAt: discussion.createdAt,
      updatedAt: discussion.updatedAt,
      creator: discussion.creator,
      class: discussion.class,
      replies: discussion.replies,
      replyCount: discussion.replies.length,
      likeCount: discussion.likes.length,
      isLiked: user ? discussion.likes.some((l) => l.userId === user.id) : false,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Discussion GET error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const discussion = await db.discussion.findUnique({
      where: { id },
      select: { createdBy: true },
    })

    if (!discussion) {
      return NextResponse.json({ error: 'Diskusi tidak ditemukan' }, { status: 404 })
    }

    // Only creator or admin can delete
    if (discussion.createdBy !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Anda tidak memiliki izin' }, { status: 403 })
    }

    await db.discussion.delete({ where: { id } })

    return NextResponse.json({ message: 'Diskusi berhasil dihapus' })
  } catch (error) {
    console.error('Discussion DELETE error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
