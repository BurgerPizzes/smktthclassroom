import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role === 'siswa') {
      return NextResponse.json(
        { error: 'Siswa tidak dapat memberikan nilai' },
        { status: 403 }
      )
    }

    const { id } = await params
    const { grade, feedback } = await req.json()

    if (grade === undefined || grade === null) {
      return NextResponse.json(
        { error: 'Nilai wajib diisi' },
        { status: 400 }
      )
    }

    const submission = await db.submission.findUnique({
      where: { id },
      include: {
        assignment: {
          select: { id: true, title: true, points: true, classId: true },
        },
      },
    })

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission tidak ditemukan' },
        { status: 404 }
      )
    }

    // Verify guru has access to this class
    if (user.role === 'guru') {
      const guruClasses = await db.classUser.findMany({
        where: { userId: user.id, role: 'guru' },
        select: { classId: true },
      })
      const classIds = guruClasses.map((c) => c.classId)
      if (!classIds.includes(submission.assignment.classId)) {
        return NextResponse.json(
          { error: 'Anda tidak memiliki akses' },
          { status: 403 }
        )
      }
    }

    const updated = await db.submission.update({
      where: { id },
      data: {
        grade,
        feedback,
        status: 'graded',
        gradedAt: new Date(),
      },
      include: {
        assignment: {
          select: { id: true, title: true, points: true },
        },
        user: { select: { id: true, name: true, email: true, avatar: true } },
      },
    })

    // Create notification for the student
    await db.notification.create({
      data: {
        userId: updated.userId,
        title: 'Nilai Tugas Diumumkan',
        message: `Nilai tugas "${updated.assignment.title}": ${grade}`,
        type: 'success',
        link: '/my-submissions',
      },
    })

    return NextResponse.json({ submission: updated })
  } catch (error) {
    console.error('Grade submission error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
