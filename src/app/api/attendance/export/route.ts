import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')

    if (!classId) return NextResponse.json({ error: 'Class ID wajib diisi' }, { status: 400 })

    // Verify user has access to this class
    const classUser = await db.classUser.findFirst({
      where: { classId, userId: user.id }
    })
    if (!classUser && user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const attendance = await db.attendance.findMany({
      where: { classId },
      include: {
        user: { select: { name: true, email: true } },
        class: { select: { name: true } }
      },
      orderBy: { date: 'asc' }
    })

    // Generate CSV
    const headers = ['Tanggal', 'Nama Siswa', 'Email', 'Kelas', 'Status']
    const rows = attendance.map(a => [
      new Date(a.date).toLocaleDateString('id-ID'),
      a.user.name,
      a.user.email,
      a.class.name,
      a.status
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=absensi-${classId}.csv`
      }
    })
  } catch (error) {
    console.error('Export attendance error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
