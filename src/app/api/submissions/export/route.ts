import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')

    const where: any = {}
    if (classId) {
      where.assignment = { classId }
    }

    // Only guru/admin can export all, students export their own
    if (user.role === 'siswa') {
      where.userId = user.id
    }

    const submissions = await db.submission.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        assignment: {
          select: { title: true, type: true, points: true, class: { select: { name: true } } }
        }
      },
      orderBy: { submittedAt: 'desc' }
    })

    const headers = ['Siswa', 'Email', 'Kelas', 'Tugas', 'Tipe', 'Poin Maks', 'Nilai', 'Status', 'Tanggal']
    const rows = submissions.map(s => [
      s.user.name,
      s.user.email,
      s.assignment.class.name,
      s.assignment.title,
      s.assignment.type,
      s.assignment.points,
      s.grade !== null && Number.isFinite(s.grade) ? Math.round(s.grade) : '-',
      s.status,
      new Date(s.submittedAt).toLocaleDateString('id-ID')
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename=nilai-submissions.csv'
      }
    })
  } catch (error) {
    console.error('Export submissions error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
