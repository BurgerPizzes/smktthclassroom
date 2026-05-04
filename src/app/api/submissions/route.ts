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
    const assignmentId = searchParams.get('assignmentId')

    const where: any = {}
    if (assignmentId) where.assignmentId = assignmentId

    // Students can only see their own submissions
    if (user.role === 'siswa') {
      where.userId = user.id
    }

    const submissions = await db.submission.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        assignment: {
          select: { id: true, title: true, type: true, points: true, dueDate: true, class: { select: { name: true } } },
        },
      },
      orderBy: { submittedAt: 'desc' },
    })

    return NextResponse.json(submissions)
  } catch (error) {
    console.error('Submissions GET error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { assignmentId, content, fileUrl } = await request.json()

    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID wajib diisi' }, { status: 400 })
    }

    // Check if already submitted
    const existing = await db.submission.findUnique({
      where: { assignmentId_userId: { assignmentId, userId: user.id } },
    })

    if (existing) {
      // Update the existing submission
      const updated = await db.submission.update({
        where: { id: existing.id },
        data: {
          content,
          fileUrl,
          status: 'submitted',
          submittedAt: new Date(),
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          assignment: {
            select: { id: true, title: true, type: true, points: true, dueDate: true, class: { select: { name: true } } },
          },
        },
      })
      return NextResponse.json(updated)
    }

    const submission = await db.submission.create({
      data: {
        assignmentId,
        userId: user.id,
        content,
        fileUrl,
        status: 'submitted',
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        assignment: {
          select: { id: true, title: true, type: true, points: true, dueDate: true, class: { select: { name: true } } },
        },
      },
    })

    // Notify the teacher
    const assignment = await db.assignment.findUnique({
      where: { id: assignmentId },
      select: { createdBy: true, title: true, classId: true },
    })
    if (assignment) {
      await db.notification.create({
        data: {
          userId: assignment.createdBy,
          title: 'Submission Baru',
          message: `${user.name} telah mengumpulkan tugas "${assignment.title}"`,
          type: 'success',
          link: `assignment-detail:${assignmentId}`,
        },
      })
    }

    return NextResponse.json(submission)
  } catch (error) {
    console.error('Submissions POST error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only guru/admin can grade
    if (user.role !== 'guru' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Hanya guru yang bisa menilai' }, { status: 403 })
    }

    const { id, grade, feedback, status } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Submission ID wajib diisi' }, { status: 400 })
    }

    const submission = await db.submission.update({
      where: { id },
      data: {
        ...(grade !== undefined && { grade }),
        ...(feedback !== undefined && { feedback }),
        ...(status && { status }),
        gradedAt: new Date(),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        assignment: {
          select: { id: true, title: true, type: true, points: true, dueDate: true, class: { select: { name: true } } },
        },
      },
    })

    // Notify the student
    await db.notification.create({
      data: {
        userId: submission.userId,
        title: 'Nilai Diberikan',
        message: `Tugas "${submission.assignment.title}" telah dinilai: ${grade}/${submission.assignment.points}`,
        type: 'info',
        link: `assignment-detail:${submission.assignmentId}`,
      },
    })

    return NextResponse.json(submission)
  } catch (error) {
    console.error('Submissions PUT error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
