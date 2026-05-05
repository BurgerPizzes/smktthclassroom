import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const notifications = await db.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(notifications)
  } catch (error) {
    console.error('Notifications GET error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, read, markAll } = await request.json()

    if (markAll) {
      await db.notification.updateMany({
        where: { userId: user.id },
        data: { read: true },
      })
      return NextResponse.json({ message: 'Semua notifikasi ditandai sudah dibaca' })
    }

    if (id) {
      // Verify the notification belongs to the authenticated user
      const existing = await db.notification.findUnique({ where: { id } })
      if (!existing) {
        return NextResponse.json({ error: 'Notifikasi tidak ditemukan' }, { status: 404 })
      }
      if (existing.userId !== user.id) {
        return NextResponse.json({ error: 'Tidak memiliki akses' }, { status: 403 })
      }
      const notification = await db.notification.update({
        where: { id },
        data: { read: read ?? true },
      })
      return NextResponse.json(notification)
    }

    return NextResponse.json({ error: 'ID notifikasi wajib diisi' }, { status: 400 })
  } catch (error) {
    console.error('Notifications PUT error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
