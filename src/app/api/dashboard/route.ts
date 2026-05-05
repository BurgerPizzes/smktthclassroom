import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let totalClasses = 0
    let totalAssignments = 0
    let totalSubmissions = 0
    let pendingGrading = 0
    let pendingSubmissions = 0
    let totalStudents = 0
    let gradedCount = 0
    let averageGrade = 0

    if (user.role === 'admin') {
      totalClasses = await db.class.count()
      totalAssignments = await db.assignment.count({ where: { status: 'active' } })
      totalSubmissions = await db.submission.count()
      pendingGrading = await db.submission.count({ where: { status: 'submitted' } })
      totalStudents = await db.user.count({ where: { role: 'siswa' } })
      gradedCount = await db.submission.count({ where: { status: 'graded' } })
      const gradedSubs = await db.submission.findMany({
        where: { status: 'graded', grade: { not: null } },
        select: { grade: true },
      })
      const validGrades = gradedSubs.map(s => s.grade).filter((g): g is number => g !== null && Number.isFinite(g))
      averageGrade = validGrades.length > 0 ? Math.round(validGrades.reduce((sum, g) => sum + g, 0) / validGrades.length) : 0
    } else if (user.role === 'guru') {
      // Get teacher's classes
      const teacherClasses = await db.classUser.findMany({
        where: { userId: user.id, role: 'guru' },
        select: { classId: true },
      })
      const classIds = teacherClasses.map(tc => tc.classId)
      totalClasses = classIds.length
      totalAssignments = await db.assignment.count({
        where: { status: 'active', classId: { in: classIds } },
      })
      const teacherAssignments = await db.assignment.findMany({
        where: { classId: { in: classIds } },
        select: { id: true },
      })
      const assignmentIds = teacherAssignments.map(a => a.id)
      totalSubmissions = await db.submission.count({
        where: { assignmentId: { in: assignmentIds } },
      })
      pendingGrading = await db.submission.count({
        where: { status: 'submitted', assignmentId: { in: assignmentIds } },
      })
      // Count students in teacher's classes
      totalStudents = await db.classUser.count({
        where: { classId: { in: classIds }, role: 'siswa' },
      })
      gradedCount = await db.submission.count({
        where: { status: 'graded', assignmentId: { in: assignmentIds } },
      })
      const gradedSubs = await db.submission.findMany({
        where: { status: 'graded', assignmentId: { in: assignmentIds }, grade: { not: null } },
        select: { grade: true },
      })
      const validGrades = gradedSubs.map(s => s.grade).filter((g): g is number => g !== null && Number.isFinite(g))
      averageGrade = validGrades.length > 0 ? Math.round(validGrades.reduce((sum, g) => sum + g, 0) / validGrades.length) : 0
    } else {
      // Student
      const studentClasses = await db.classUser.findMany({
        where: { userId: user.id, role: 'siswa' },
        select: { classId: true },
      })
      const classIds = studentClasses.map(sc => sc.classId)
      totalClasses = classIds.length
      totalAssignments = await db.assignment.count({
        where: { status: 'active', classId: { in: classIds } },
      })
      totalSubmissions = await db.submission.count({ where: { userId: user.id } })
      // Pending submissions = assignments not yet submitted
      const submittedAssignmentIds = (await db.submission.findMany({
        where: { userId: user.id },
        select: { assignmentId: true },
      })).map(s => s.assignmentId)
      pendingSubmissions = await db.assignment.count({
        where: {
          status: 'active',
          classId: { in: classIds },
          id: { notIn: submittedAssignmentIds },
        },
      })
      // Student's own graded count and average
      gradedCount = await db.submission.count({
        where: { userId: user.id, status: 'graded' },
      })
      const myGradedSubs = await db.submission.findMany({
        where: { userId: user.id, status: 'graded', grade: { not: null } },
        select: { grade: true },
      })
      const myValidGrades = myGradedSubs.map(s => s.grade).filter((g): g is number => g !== null && Number.isFinite(g))
      averageGrade = myValidGrades.length > 0 ? Math.round(myValidGrades.reduce((sum, g) => sum + g, 0) / myValidGrades.length) : 0
    }

    // Announcements from user's classes
    let announcementsWhere: any = {}
    if (user.role !== 'admin') {
      const userClasses = await db.classUser.findMany({
        where: { userId: user.id },
        select: { classId: true },
      })
      const classIds = userClasses.map(uc => uc.classId)
      announcementsWhere = { classId: { in: classIds } }
    }

    const announcements = await db.announcement.findMany({
      where: announcementsWhere,
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { name: true } },
        class: { select: { name: true } },
      },
    })

    // Assignments from user's classes
    let assignmentsWhere: any = { status: 'active' }
    if (user.role !== 'admin') {
      const userClasses = await db.classUser.findMany({
        where: { userId: user.id },
        select: { classId: true },
      })
      const classIds = userClasses.map(uc => uc.classId)
      assignmentsWhere.classId = { in: classIds }
    }

    const assignments = await db.assignment.findMany({
      where: assignmentsWhere,
      take: 10,
      orderBy: { dueDate: 'asc' },
      include: {
        class: { select: { name: true } },
      },
    })

    return NextResponse.json({
      stats: { totalClasses, totalAssignments, totalSubmissions, pendingGrading, pendingSubmissions, totalStudents, gradedCount, averageGrade },
      announcements,
      assignments,
      user: { id: user.id, name: user.name, role: user.role },
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
