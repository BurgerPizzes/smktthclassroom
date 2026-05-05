import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filterClassId = searchParams.get('classId')

    // Get resources from classes the user is enrolled in
    let classIds: string[] = []

    if (user.role === 'admin') {
      // Admin sees all resources
      const allClasses = await db.class.findMany({ select: { id: true } })
      classIds = allClasses.map(c => c.id)
    } else {
      const userClasses = await db.classUser.findMany({
        where: { userId: user.id },
        select: { classId: true },
      })
      classIds = userClasses.map(uc => uc.classId)
    }

    // If classId filter provided, only use it if user has access
    if (filterClassId && classIds.includes(filterClassId)) {
      classIds = [filterClassId]
    }

    const resources = await db.resource.findMany({
      where: { classId: { in: classIds } },
      include: {
        class: { select: { id: true, name: true } },
        uploader: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(resources)
  } catch (error) {
    console.error('Resources GET error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'guru' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Hanya guru yang bisa mengunggah resource' }, { status: 403 })
    }

    const { title, fileUrl, fileType, classId } = await request.json()

    if (!title || !fileUrl) {
      return NextResponse.json({ error: 'Judul dan file wajib diisi' }, { status: 400 })
    }

    if (!classId) {
      return NextResponse.json({ error: 'Pilih kelas terlebih dahulu' }, { status: 400 })
    }

    const resource = await db.resource.create({
      data: {
        title,
        fileUrl,
        fileType: fileType || 'pdf',
        classId,
        uploadedBy: user.id,
      },
      include: {
        class: { select: { id: true, name: true } },
        uploader: { select: { name: true } },
      },
    })

    // Create notifications for students in the class
    const classUsers = await db.classUser.findMany({
      where: { classId, role: 'siswa' },
      select: { userId: true },
    })

    await db.notification.createMany({
      data: classUsers.map(cu => ({
        userId: cu.userId,
        title: 'Resource Baru',
        message: `"${title}" telah diunggah di kelas ${resource.class.name}`,
        type: 'info',
        link: `learning-resources`,
      })),
    })

    return NextResponse.json(resource)
  } catch (error) {
    console.error('Resources POST error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
