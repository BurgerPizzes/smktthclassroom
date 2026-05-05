import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: classId } = await params

    // Check if the class exists
    const cls = await db.class.findUnique({ where: { id: classId } })
    if (!cls) {
      return NextResponse.json({ error: 'Kelas tidak ditemukan' }, { status: 404 })
    }

    // Class creator cannot leave their own class
    if (cls.createdBy === user.id) {
      return NextResponse.json({ error: 'Pembuat kelas tidak bisa keluar dari kelasnya sendiri' }, { status: 400 })
    }

    // Check if user is a member
    const membership = await db.classUser.findFirst({
      where: { classId, userId: user.id },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Anda bukan anggota kelas ini' }, { status: 400 })
    }

    // Remove the user from the class
    await db.classUser.delete({
      where: { id: membership.id },
    })

    return NextResponse.json({ message: 'Berhasil keluar dari kelas' })
  } catch (error) {
    console.error('Leave class error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
