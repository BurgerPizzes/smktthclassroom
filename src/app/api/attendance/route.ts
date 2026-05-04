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
    const classId = searchParams.get('classId')

    const where: any = {}
    if (classId) where.classId = classId

    // If guru, filter by their classes
    if (user.role === 'guru') {
      const teacherClasses = await db.classUser.findMany({
        where: { userId: user.id, role: 'guru' },
        select: { classId: true },
      })
      const teacherClassIds = teacherClasses.map(tc => tc.classId)
      where.classId = classId && teacherClassIds.includes(classId)
        ? classId
        : { in: teacherClassIds }
    }

    // If siswa, only show their own attendance
    if (user.role === 'siswa') {
      where.userId = user.id
    }

    const attendance = await db.attendance.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        class: { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(attendance)
  } catch (error) {
    console.error('Attendance GET error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { entries, classId } = await request.json()

    if (!entries || !Array.isArray(entries)) {
      return NextResponse.json({ error: 'Data absensi tidak valid' }, { status: 400 })
    }

    if (!classId) {
      return NextResponse.json({ error: 'Class ID wajib diisi' }, { status: 400 })
    }

    // Verify the user is a guru of this class
    if (user.role === 'guru' || user.role === 'admin') {
      if (user.role === 'guru') {
        const classUser = await db.classUser.findFirst({
          where: { classId, userId: user.id, role: 'guru' },
        })
        if (!classUser) {
          return NextResponse.json({ error: 'Anda bukan guru di kelas ini' }, { status: 403 })
        }
      }
    } else {
      return NextResponse.json({ error: 'Hanya guru yang bisa mengisi absensi' }, { status: 403 })
    }

    const results = await Promise.all(
      entries.map((entry: { userId: string; status: string; date: string }) =>
        db.attendance.upsert({
          where: {
            classId_userId_date: {
              classId: classId,
              userId: entry.userId,
              date: new Date(entry.date),
            },
          },
          create: {
            classId: classId,
            userId: entry.userId,
            status: entry.status,
            date: new Date(entry.date),
          },
          update: {
            status: entry.status,
          },
        })
      )
    )

    return NextResponse.json(results)
  } catch (error) {
    console.error('Attendance POST error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
