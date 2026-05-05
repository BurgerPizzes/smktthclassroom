import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { readdirSync, statSync } from 'fs'
import { join } from 'path'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
    }

    if (session.role !== 'admin') {
      return NextResponse.json({ error: 'Hanya admin yang dapat mengakses' }, { status: 403 })
    }

    // User counts by role
    const usersByRole = await db.user.groupBy({
      by: ['role'],
      _count: { role: true },
    })

    const userCounts: Record<string, number> = {}
    usersByRole.forEach((item) => {
      userCounts[item.role] = item._count.role
    })

    const totalUsers = Object.values(userCounts).reduce((a, b) => a + b, 0)

    // Recent logins (users updated in last 7 days as proxy)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const recentActiveUsers = await db.user.count({
      where: { updatedAt: { gte: sevenDaysAgo } },
    })

    // Submission count
    const totalSubmissions = await db.submission.count()
    const recentSubmissions = await db.submission.count({
      where: { submittedAt: { gte: sevenDaysAgo } },
    })

    // Notification stats
    const notificationsByType = await db.notification.groupBy({
      by: ['type'],
      _count: { type: true },
    })

    const notifByType: Record<string, number> = {}
    notificationsByType.forEach((item) => {
      notifByType[item.type] = item._count.type
    })

    const totalNotifications = await db.notification.count()
    const unreadNotifications = await db.notification.count({
      where: { read: false },
    })

    const recentNotifications = await db.notification.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    })

    // File count in uploads directory
    let fileCount = 0
    let totalFileSize = 0
    try {
      const uploadsDir = join(process.cwd(), 'public', 'uploads')
      const files = readdirSync(uploadsDir)
      fileCount = files.length
      for (const file of files) {
        try {
          const stats = statSync(join(uploadsDir, file))
          totalFileSize += stats.size
        } catch {
          // skip files that can't be stat'd
        }
      }
    } catch {
      // uploads dir doesn't exist
    }

    // Recent actions (from notifications table, last 20)
    const recentActions = await db.notification.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, role: true },
        },
      },
    })

    // Database record counts
    const dbCounts = {
      users: await db.user.count(),
      classes: await db.class.count(),
      assignments: await db.assignment.count(),
      submissions: await db.submission.count(),
      announcements: await db.announcement.count(),
      notifications: await db.notification.count(),
      resources: await db.resource.count(),
      attendance: await db.attendance.count(),
      schedules: await db.schedule.count(),
      subjects: await db.subject.count(),
      comments: await db.comment.count(),
      settings: await db.setting.count(),
    }

    // Simulated daily activity for the last 7 days
    const dailyActivity = []
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date()
      dayStart.setDate(dayStart.getDate() - i)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(dayStart)
      dayEnd.setHours(23, 59, 59, 999)

      const dayLabel = dayStart.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })

      const logins = await db.user.count({
        where: { updatedAt: { gte: dayStart, lte: dayEnd } },
      })

      const submissions = await db.submission.count({
        where: { submittedAt: { gte: dayStart, lte: dayEnd } },
      })

      dailyActivity.push({
        date: dayLabel,
        logins,
        submissions,
      })
    }

    // Simulated performance metrics
    const performanceMetrics = {
      avgResponseTime: Math.floor(Math.random() * 80 + 40), // 40-120ms simulated
      errorRate: Math.floor(Math.random() * 3) / 100, // 0-3% simulated
      uptime: process.uptime(),
    }

    return NextResponse.json({
      userCounts,
      totalUsers,
      recentActiveUsers,
      totalSubmissions,
      recentSubmissions,
      notifByType,
      totalNotifications,
      unreadNotifications,
      recentNotifications,
      fileCount,
      totalFileSize,
      recentActions,
      dbCounts,
      dailyActivity,
      performanceMetrics,
    })
  } catch (error) {
    console.error('System health GET error:', error)
    return NextResponse.json({ error: 'Gagal mengambil data kesehatan sistem' }, { status: 500 })
  }
}
