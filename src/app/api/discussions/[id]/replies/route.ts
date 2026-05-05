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

    const { content } = await request.json()

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Konten balasan wajib diisi' }, { status: 400 })
    }

    // Check discussion exists
    const discussion = await db.discussion.findUnique({
      where: { id },
      select: { id: true, title: true, createdBy: true, classId: true },
    })

    if (!discussion) {
      return NextResponse.json({ error: 'Diskusi tidak ditemukan' }, { status: 404 })
    }

    const reply = await db.discussionReply.create({
      data: {
        content: content.trim(),
        discussionId: id,
        createdBy: user.id,
      },
      include: {
        creator: { select: { id: true, name: true, avatar: true } },
      },
    })

    // Notify discussion creator if it's not the same user
    if (discussion.createdBy !== user.id) {
      await db.notification.create({
        data: {
          userId: discussion.createdBy,
          title: 'Balasan Diskusi',
          message: `${user.name} membalas diskusi: ${discussion.title}`,
          type: 'info',
          link: 'discussions',
        },
      })
    }

    return NextResponse.json(reply)
  } catch (error) {
    console.error('Discussion reply POST error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
