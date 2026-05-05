import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (id) {
      const cls = await db.class.findUnique({
        where: { id },
        include: {
          subject: true,
          creator: { select: { name: true } },
          classUsers: {
            include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
          },
          _count: { select: { classUsers: true, assignments: true } },
        },
      })
      if (!cls) return NextResponse.json({ error: 'Kelas tidak ditemukan' }, { status: 404 })
      return NextResponse.json(cls)
    }

    // For students: only show classes they are enrolled in
    // For teachers: show classes they teach
    // For admins: show all classes
    let classes
    if (user.role === 'admin') {
      classes = await db.class.findMany({
        include: {
          subject: true,
          creator: { select: { name: true } },
          classUsers: {
            include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
          },
          _count: { select: { classUsers: true, assignments: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
    } else {
      // Get user's class IDs
      const userClasses = await db.classUser.findMany({
        where: { userId: user.id },
        select: { classId: true },
      })
      const classIds = userClasses.map(uc => uc.classId)

      classes = await db.class.findMany({
        where: { id: { in: classIds } },
        include: {
          subject: true,
          creator: { select: { name: true } },
          classUsers: {
            include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
          },
          _count: { select: { classUsers: true, assignments: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
    }

    return NextResponse.json(classes)
  } catch (error) {
    console.error('Classes GET error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only guru or admin can create classes
    if (user.role !== 'guru' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Hanya guru yang bisa membuat kelas' }, { status: 403 })
    }

    const { name, description, subjectId, code: customCode, grade, direction } = await request.json()

    if (!name) {
      return NextResponse.json({ error: 'Nama kelas wajib diisi' }, { status: 400 })
    }

    // Use custom code if provided, otherwise generate random code
    let code = customCode?.trim()?.toUpperCase() || Math.random().toString(36).substring(2, 8).toUpperCase()
    
    // Ensure code is unique
    const existingCode = await db.class.findUnique({ where: { code } })
    if (existingCode) {
      if (customCode) {
        return NextResponse.json({ error: 'Kode kelas sudah digunakan, gunakan kode lain' }, { status: 400 })
      }
      code = Math.random().toString(36).substring(2, 8).toUpperCase()
    }

    const cls = await db.class.create({
      data: {
        name,
        description: description || null,
        code,
        grade: grade || 10,
        direction: direction || 'RPL',
        subjectId: subjectId || null,
        createdBy: user.id,
      },
      include: {
        subject: true,
        creator: { select: { name: true } },
        classUsers: {
          include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
        },
        _count: { select: { classUsers: true, assignments: true } },
      },
    })

    // Auto-add the creator as guru in the class
    await db.classUser.create({
      data: {
        classId: cls.id,
        userId: user.id,
        role: 'guru',
      },
    })

    // Re-fetch to include the new class user
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
    console.error('Classes POST error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
