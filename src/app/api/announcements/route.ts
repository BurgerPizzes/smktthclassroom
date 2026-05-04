import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')

    const where: any = {}
    if (classId) where.classId = classId

    const announcements = await db.announcement.findMany({
      where,
      include: {
        creator: { select: { name: true } },
        class: { select: { id: true, name: true } },
        comments: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(announcements)
  } catch (error) {
    console.error('Announcements GET error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, content, classId, priority, isDiscussion } = await request.json()

    // Only guru/admin can create announcements; students can create discussions
    if (!isDiscussion && user.role !== 'guru' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Hanya guru yang bisa membuat pengumuman' }, { status: 403 })
    }

    if (!title || !content) {
      return NextResponse.json({ error: 'Judul dan konten wajib diisi' }, { status: 400 })
    }

    // For discussions without a classId, find the user's first class
    let effectiveClassId = classId
    if (!effectiveClassId) {
      const userClass = await db.classUser.findFirst({
        where: { userId: user.id },
        select: { classId: true },
      })
      effectiveClassId = userClass?.classId
      if (!effectiveClassId) {
        return NextResponse.json({ error: 'Anda harus tergabung dalam kelas' }, { status: 400 })
      }
    }

    const announcement = await db.announcement.create({
      data: {
        title,
        content,
        classId: effectiveClassId,
        priority: priority || 'normal',
        createdBy: user.id,
      },
      include: {
        creator: { select: { name: true } },
        class: { select: { id: true, name: true } },
        comments: true,
      },
    })

    // Create notifications for all students in the class
    const classUsers = await db.classUser.findMany({
      where: { classId, role: 'siswa' },
      select: { userId: true },
    })

    await db.notification.createMany({
      data: classUsers.map(cu => ({
        userId: cu.userId,
        title: 'Pengumuman Baru',
        message: `${title} di ${announcement.class.name}`,
        type: priority === 'high' ? 'warning' : 'info',
        link: `class-detail:${classId}`,
      })),
    })

    return NextResponse.json(announcement)
  } catch (error) {
    console.error('Announcements POST error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
