import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const announcementId = searchParams.get('announcementId')
    const assignmentId = searchParams.get('assignmentId')

    const where: any = {}
    if (announcementId) where.announcementId = announcementId
    if (assignmentId) where.assignmentId = assignmentId

    const comments = await db.comment.findMany({
      where,
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error('Comments GET error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { content, announcementId, assignmentId } = await request.json()

    if (!content) {
      return NextResponse.json({ error: 'Konten wajib diisi' }, { status: 400 })
    }

    const comment = await db.comment.create({
      data: {
        content,
        userId: user.id,
        announcementId: announcementId || null,
        assignmentId: assignmentId || null,
      },
      include: { user: { select: { id: true, name: true } } },
    })

    return NextResponse.json(comment)
  } catch (error) {
    console.error('Comments POST error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
