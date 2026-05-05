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
    const id = searchParams.get('id')
    const classId = searchParams.get('classId')

    if (id) {
      const assignment = await db.assignment.findUnique({
        where: { id },
        include: {
          class: { select: { name: true, grade: true, direction: true } },
          subject: true,
          creator: { select: { name: true } },
        },
      })
      if (!assignment) return NextResponse.json({ error: 'Tugas tidak ditemukan' }, { status: 404 })
      return NextResponse.json(assignment)
    }

    const where: any = {}
    if (classId) where.classId = classId

    // For students, only show assignments from their classes
    if (user.role === 'siswa') {
      const userClasses = await db.classUser.findMany({
        where: { userId: user.id },
        select: { classId: true },
      })
      const classIds = userClasses.map(uc => uc.classId)
      where.classId = classId && classIds.includes(classId) ? classId : { in: classIds }
    }

    const assignments = await db.assignment.findMany({
      where,
      include: {
        class: { select: { name: true, grade: true, direction: true } },
        subject: true,
        creator: { select: { name: true } },
      },
      orderBy: { dueDate: 'asc' },
    })

    return NextResponse.json(assignments)
  } catch (error) {
    console.error('Assignments GET error:', error)
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
      return NextResponse.json({ error: 'Hanya guru yang bisa membuat tugas' }, { status: 403 })
    }

    const { title, description, classId, subjectId, dueDate, points, type, status } = await request.json()

    if (!title || !classId || !dueDate) {
      return NextResponse.json({ error: 'Judul, kelas, dan deadline wajib diisi' }, { status: 400 })
    }

    const assignment = await db.assignment.create({
      data: {
        title,
        description: description || null,
        classId,
        subjectId: subjectId || null,
        dueDate: new Date(dueDate),
        points: points || 100,
        type: type || 'tugas',
        status: status || 'active',
        createdBy: user.id,
      },
      include: {
        class: { select: { name: true, grade: true, direction: true } },
        subject: true,
        creator: { select: { name: true } },
      },
    })

    // Notify students in the class
    const classUsers = await db.classUser.findMany({
      where: { classId, role: 'siswa' },
      select: { userId: true },
    })

    await db.notification.createMany({
      data: classUsers.map(cu => ({
        userId: cu.userId,
        title: 'Tugas Baru',
        message: `"${title}" telah ditambahkan`,
        type: 'info',
        link: `assignment-detail:${assignment.id}`,
      })),
    })

    return NextResponse.json(assignment)
  } catch (error) {
    console.error('Assignments POST error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
