import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: classId, userId: targetUserId } = await params

    // Only class creator or admin can remove members
    const classData = await db.class.findUnique({ where: { id: classId } })
    if (!classData) return NextResponse.json({ error: 'Kelas tidak ditemukan' }, { status: 404 })

    if (classData.createdBy !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Hanya pembuat kelas atau admin yang bisa menghapus anggota' }, { status: 403 })
    }

    // Can't remove the class creator
    if (targetUserId === classData.createdBy) {
      return NextResponse.json({ error: 'Tidak bisa menghapus pembuat kelas' }, { status: 400 })
    }

    await db.classUser.deleteMany({
      where: { classId, userId: targetUserId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Remove member error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
