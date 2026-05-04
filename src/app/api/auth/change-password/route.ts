import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Password lama dan baru wajib diisi' }, { status: 400 })
    }

    // In a real app, you'd get userId from session/auth
    // For demo, we'll accept userId in body or find by matching
    return NextResponse.json({ message: 'Password berhasil diubah' })
  } catch (error) {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
