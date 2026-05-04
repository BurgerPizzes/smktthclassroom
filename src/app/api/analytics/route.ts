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
    const targetUserId = searchParams.get('userId')

    // Determine whose analytics to return
    let analyticsUserId = user.id
    let isTeacherView = false

    if (targetUserId && (user.role === 'guru' || user.role === 'admin')) {
      analyticsUserId = targetUserId
      isTeacherView = true
    }

    // Get the target user's class enrollments
    const classUsers = await db.classUser.findMany({
      where: { userId: analyticsUserId },
      include: {
        class: {
          include: {
            subject: true,
            assignments: {
              include: {
                submissions: {
                  where: { userId: analyticsUserId },
                },
              },
            },
          },
        },
      },
    })

    // Get all submissions for this user
    const submissions = await db.submission.findMany({
      where: { userId: analyticsUserId },
      include: {
        assignment: {
          include: {
            class: { select: { id: true, name: true } },
            subject: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    })

    // Get all assignments from user's classes
    const classIds = classUsers.map((cu) => cu.classId)
    const allAssignments = await db.assignment.findMany({
      where: { classId: { in: classIds } },
      include: {
        submissions: {
          where: { userId: analyticsUserId },
        },
        class: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true } },
      },
    })

    // Get attendance data
    const attendance = await db.attendance.findMany({
      where: { userId: analyticsUserId },
      orderBy: { date: 'desc' },
    })

    // ===== Compute Analytics =====

    // Overall completion rate
    const totalAssignments = allAssignments.length
    const submittedAssignments = allAssignments.filter(
      (a) => a.submissions.length > 0
    ).length
    const completionRate =
      totalAssignments > 0
        ? Math.round((submittedAssignments / totalAssignments) * 100)
        : 0

    // Total submissions count
    const totalSubmissions = submissions.length

    // Average grade (only graded submissions)
    const gradedSubmissions = submissions.filter(
      (s) => s.status === 'graded' && Number.isFinite(s.grade)
    )
    const avgGrade =
      gradedSubmissions.length > 0
        ? Math.round(
            gradedSubmissions.reduce((sum, s) => {
              const grade = Number.isFinite(s.grade) ? s.grade : 0
              const points = s.assignment?.points || 100
              return sum + (grade / points) * 100
            }, 0) / gradedSubmissions.length
          )
        : 0

    // Class rank percentile (how this student compares to classmates)
    // Simplified: based on average grade percentage
    const classRankPercentile = await computeClassRank(analyticsUserId, classIds)

    // Grade distribution
    const gradeDistribution = {
      '0-20': 0,
      '21-40': 0,
      '41-60': 0,
      '61-80': 0,
      '81-100': 0,
    }
    gradedSubmissions.forEach((s) => {
      const pct = Number.isFinite(s.grade)
        ? Math.round((s.grade / (s.assignment?.points || 100)) * 100)
        : 0
      if (pct <= 20) gradeDistribution['0-20']++
      else if (pct <= 40) gradeDistribution['21-40']++
      else if (pct <= 60) gradeDistribution['41-60']++
      else if (pct <= 80) gradeDistribution['61-80']++
      else gradeDistribution['81-100']++
    })

    // Subject performance
    const subjectMap = new Map<
      string,
      {
        name: string
        grades: number[]
        total: number
        submitted: number
      }
    >()

    allAssignments.forEach((a) => {
      const subjectName = a.subject?.name || a.class?.name || 'Umum'
      const key = a.subjectId || a.classId
      if (!subjectMap.has(key)) {
        subjectMap.set(key, {
          name: subjectName,
          grades: [],
          total: 0,
          submitted: 0,
        })
      }
      const entry = subjectMap.get(key)!
      entry.total++
      if (a.submissions.length > 0) {
        entry.submitted++
        const sub = a.submissions[0]
        if (sub.status === 'graded' && Number.isFinite(sub.grade)) {
          const pct = (sub.grade / (a.points || 100)) * 100
          entry.grades.push(Number.isFinite(pct) ? Math.round(pct) : 0)
        }
      }
    })

    const subjectPerformance = Array.from(subjectMap.entries()).map(
      ([key, val]) => {
        const avg =
          val.grades.length > 0
            ? Math.round(val.grades.reduce((a, b) => a + b, 0) / val.grades.length)
            : 0
        const completionPct =
          val.total > 0 ? Math.round((val.submitted / val.total) * 100) : 0
        return {
          id: key,
          name: val.name,
          averageGrade: avg,
          completion: completionPct,
          totalAssignments: val.total,
          gradedCount: val.grades.length,
          trend: avg >= 75 ? 'up' : avg >= 50 ? 'stable' : 'down',
        }
      }
    )

    // Submission timeline (recent 10)
    const submissionTimeline = submissions.slice(0, 10).map((s) => ({
      id: s.id,
      assignmentTitle: s.assignment?.title || 'Tugas',
      className: s.assignment?.class?.name || '',
      status: s.status,
      grade: Number.isFinite(s.grade) ? Math.round(s.grade) : null,
      points: s.assignment?.points || 100,
      submittedAt: s.submittedAt,
    }))

    // Attendance summary
    const attendanceSummary = {
      hadir: attendance.filter((a) => a.status === 'hadir').length,
      terlambat: attendance.filter((a) => a.status === 'terlambat').length,
      tidak: attendance.filter((a) => a.status === 'tidak').length,
      total: attendance.length,
      rate:
        attendance.length > 0
          ? Math.round(
              (attendance.filter((a) => a.status === 'hadir').length /
                attendance.length) *
                100
            )
          : 0,
    }

    // Goals & milestones
    const goals = [
      {
        id: 'completion',
        label: 'Target 80% Penyelesaian Tugas',
        current: completionRate,
        target: 80,
        unit: '%',
      },
      {
        id: 'grade',
        label: 'Target Rata-rata Nilai 75',
        current: avgGrade,
        target: 75,
        unit: '',
      },
      {
        id: 'attendance',
        label: 'Target 90% Kehadiran',
        current: attendanceSummary.rate,
        target: 90,
        unit: '%',
      },
    ]

    // Strengths & Weaknesses
    const sortedSubjects = [...subjectPerformance].sort(
      (a, b) => b.averageGrade - a.averageGrade
    )
    const strengths = sortedSubjects
      .filter((s) => s.averageGrade > 0)
      .slice(0, 3)
      .map((s) => ({ name: s.name, grade: s.averageGrade }))
    const weaknesses = sortedSubjects
      .filter((s) => s.averageGrade > 0)
      .reverse()
      .slice(0, 3)
      .map((s) => ({ name: s.name, grade: s.averageGrade }))

    // For teacher view: class-wide analytics
    let classWideAnalytics = null
    if (isTeacherView && classIds.length > 0) {
      const classStudents = await db.classUser.findMany({
        where: {
          classId: { in: classIds },
          role: 'siswa',
        },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      })

      const studentSummaries = await Promise.all(
        classStudents.map(async (cu) => {
          const studentSubs = await db.submission.findMany({
            where: { userId: cu.userId },
            include: { assignment: { select: { points: true } } },
          })
          const graded = studentSubs.filter(
            (s) => s.status === 'graded' && Number.isFinite(s.grade)
          )
          const avg =
            graded.length > 0
              ? Math.round(
                  graded.reduce((sum, s) => {
                    const pct =
                      ((Number.isFinite(s.grade) ? s.grade : 0) /
                        (s.assignment?.points || 100)) *
                      100
                    return sum + (Number.isFinite(pct) ? pct : 0)
                  }, 0) / graded.length
                )
              : 0
          return {
            id: cu.user.id,
            name: cu.user.name,
            email: cu.user.email,
            averageGrade: avg,
            totalSubmissions: studentSubs.length,
            gradedCount: graded.length,
          }
        })
      )

      classWideAnalytics = {
        totalStudents: classStudents.length,
        classAverage:
          studentSummaries.length > 0
            ? Math.round(
                studentSummaries.reduce((s, st) => s + st.averageGrade, 0) /
                  studentSummaries.length
              )
            : 0,
        students: studentSummaries,
      }
    }

    return NextResponse.json({
      user: {
        id: analyticsUserId,
        isTeacherView,
      },
      overview: {
        completionRate,
        totalSubmissions,
        averageGrade: avgGrade,
        classRankPercentile,
        totalAssignments,
        submittedAssignments,
        gradedCount: gradedSubmissions.length,
      },
      gradeDistribution,
      subjectPerformance,
      submissionTimeline,
      attendanceSummary,
      goals,
      strengths,
      weaknesses,
      classWideAnalytics,
    })
  } catch (error) {
    console.error('Analytics GET error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

async function computeClassRank(
  userId: string,
  classIds: string[]
): Promise<number> {
  if (classIds.length === 0) return 0

  try {
    // Get all students in the same classes
    const classmates = await db.classUser.findMany({
      where: { classId: { in: classIds }, role: 'siswa' },
      select: { userId: true },
      distinct: ['userId'],
    })

    if (classmates.length <= 1) return 100

    // Compute average grade percentage for each classmate
    const studentScores: { userId: string; avgPct: number }[] = []

    for (const cm of classmates) {
      const subs = await db.submission.findMany({
        where: { userId: cm.userId, status: 'graded' },
        include: { assignment: { select: { points: true } } },
      })
      const validSubs = subs.filter(
        (s) => Number.isFinite(s.grade) && s.assignment
      )
      const avg =
        validSubs.length > 0
          ? validSubs.reduce((sum, s) => {
              const pct = (s.grade / (s.assignment.points || 100)) * 100
              return sum + (Number.isFinite(pct) ? pct : 0)
            }, 0) / validSubs.length
          : 0
      studentScores.push({ userId: cm.userId, avgPct: avg })
    }

    // Sort descending
    studentScores.sort((a, b) => b.avgPct - a.avgPct)

    // Find this user's rank
    const rank = studentScores.findIndex((s) => s.userId === userId)
    if (rank === -1) return 0

    // Convert to percentile (higher is better)
    const percentile = Math.round(
      ((studentScores.length - rank) / studentScores.length) * 100
    )
    return Number.isFinite(percentile) ? percentile : 0
  } catch {
    return 0
  }
}
