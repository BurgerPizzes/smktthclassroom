import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { code } = await request.json()

    if (!code) {
      return NextResponse.json({ error: 'Kode kelas wajib diisi' }, { status: 400 })
    }

    const cls = await db.class.findUnique({ where: { code } })
    if (!cls) {
      return NextResponse.json({ error: 'Kelas tidak ditemukan' }, { status: 404 })
    }

    // Check if user is already a member
    const existingMember = await db.classUser.findFirst({
      where: { classId: cls.id, userId: user.id },
    })

    if (existingMember) {
      return NextResponse.json({ error: 'Anda sudah bergabung di kelas ini' }, { status: 400 })
    }

    // Determine role - guru joins as guru, siswa joins as siswa
    const roleInClass = user.role === 'guru' || user.role === 'admin' ? 'guru' : 'siswa'

    await db.classUser.create({
      data: { classId: cls.id, userId: user.id, role: roleInClass },
    })

    // Create notification for the teacher
    const classCreator = await db.class.findUnique({
      where: { id: cls.id },
      select: { createdBy: true },
    })
    if (classCreator && classCreator.createdBy !== user.id) {
      await db.notification.create({
        data: {
          userId: classCreator.createdBy,
          title: 'Anggota Baru',
          message: `${user.name} bergabung di kelas "${cls.name}"`,
          type: 'info',
          link: `class-detail:${cls.id}`,
        },
      })
    }

    const result = await db.class.findUnique({
      where: { id: cls.id },
      include: {
        subject: true,
        creator: { select: { name: true } },
        classUsers: {
          include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
        },
        _count: { select: { classUsers: true, assignments: true } },
      },
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Class join error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
