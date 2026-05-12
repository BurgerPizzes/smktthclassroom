import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: classId } = await params

    const cls = await db.class.findUnique({ where: { id: classId } })
    if (!cls) return NextResponse.json({ error: 'Kelas tidak ditemukan' }, { status: 404 })

    // Only class creator or admin can delete the class
    if (cls.createdBy !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Hanya pembuat kelas atau admin yang bisa menghapus kelas' }, { status: 403 })
    }

    // Delete all related data (cascading will handle classUsers, assignments, etc.)
    await db.class.delete({ where: { id: classId } })

    return NextResponse.json({ success: true, message: 'Kelas berhasil dihapus' })
  } catch (error) {
    console.error('Delete class error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
