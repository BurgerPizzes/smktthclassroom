import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function PUT(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { name, avatar } = await request.json()

    if (!name && !avatar) {
      return NextResponse.json({ error: 'Tidak ada data yang diperbarui' }, { status: 400 })
    }

    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        ...(name && { name }),
        ...(avatar && { avatar }),
      },
      select: { id: true, name: true, email: true, role: true, avatar: true, createdAt: true },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
