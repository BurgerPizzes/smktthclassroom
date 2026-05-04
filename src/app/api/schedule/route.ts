import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
    }

    const url = new URL(req.url)
    const weekStart = url.searchParams.get('weekStart')

    let classIds: string[] = []

    if (session.role === 'admin') {
      // Admin sees all schedules
      const allClasses = await db.class.findMany({ select: { id: true } })
      classIds = allClasses.map((c) => c.id)
    } else {
      // Guru and siswa see only their class schedules
      const userClasses = await db.classUser.findMany({
        where: { userId: session.id },
        select: { classId: true },
      })
      classIds = userClasses.map((c) => c.classId)
    }

    const schedules = await db.schedule.findMany({
      where: {
        classId: { in: classIds },
      },
      include: {
        class: {
          select: { id: true, name: true },
        },
        user: {
          select: { id: true, name: true },
        },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    })

    return NextResponse.json(schedules)
  } catch (error) {
    console.error('Schedule GET error:', error)
    return NextResponse.json({ error: 'Gagal mengambil jadwal' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
    }

    if (session.role !== 'guru' && session.role !== 'admin') {
      return NextResponse.json({ error: 'Hanya guru atau admin yang dapat menambah jadwal' }, { status: 403 })
    }

    const body = await req.json()
    const { classId, subject, dayOfWeek, startTime, endTime, room } = body

    if (!classId || !subject || !dayOfWeek || !startTime || !endTime) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
    }

    if (dayOfWeek < 1 || dayOfWeek > 7) {
      return NextResponse.json({ error: 'Hari tidak valid (1-7)' }, { status: 400 })
    }

    // Verify user is guru of this class or admin
    if (session.role === 'guru') {
      const classUser = await db.classUser.findFirst({
        where: { classId, userId: session.id, role: 'guru' },
      })
      if (!classUser) {
        return NextResponse.json({ error: 'Anda bukan guru di kelas ini' }, { status: 403 })
      }
    }

    // Check for unique constraint (classId + dayOfWeek + startTime)
    const existing = await db.schedule.findFirst({
      where: { classId, dayOfWeek, startTime },
    })
    if (existing) {
      return NextResponse.json({ error: 'Jadwal pada waktu tersebut sudah ada' }, { status: 409 })
    }

    const schedule = await db.schedule.create({
      data: {
        classId,
        subject,
        dayOfWeek,
        startTime,
        endTime,
        room: room || null,
        createdBy: session.id,
      },
      include: {
        class: {
          select: { id: true, name: true },
        },
        user: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json(schedule, { status: 201 })
  } catch (error) {
    console.error('Schedule POST error:', error)
    return NextResponse.json({ error: 'Gagal menambah jadwal' }, { status: 500 })
  }
}
