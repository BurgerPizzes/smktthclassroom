import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const subjects = await db.subject.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { classes: true, assignments: true } },
      },
    })

    return NextResponse.json({ subjects })
  } catch (error) {
    console.error('Get subjects error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (user.role !== 'guru' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Hanya guru atau admin yang dapat membuat mata pelajaran' }, { status: 403 })
    }

    const body = await request.json()
    const { name, code, description } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Nama mata pelajaran wajib diisi' }, { status: 400 })
    }

    // Check unique name
    const existing = await db.subject.findUnique({ where: { name: name.trim() } })
    if (existing) {
      return NextResponse.json({ error: 'Nama mata pelajaran sudah digunakan' }, { status: 409 })
    }

    const subject = await db.subject.create({
      data: {
        name: name.trim(),
        code: code?.trim() || null,
        description: description?.trim() || null,
      },
      include: {
        _count: { select: { classes: true, assignments: true } },
      },
    })

    return NextResponse.json({ subject }, { status: 201 })
  } catch (error) {
    console.error('Create subject error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (user.role !== 'guru' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Hanya guru atau admin yang dapat mengubah mata pelajaran' }, { status: 403 })
    }

    const body = await request.json()
    const { id, name, code, description } = body

    if (!id) {
      return NextResponse.json({ error: 'ID mata pelajaran wajib diisi' }, { status: 400 })
    }
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Nama mata pelajaran wajib diisi' }, { status: 400 })
    }

    const existing = await db.subject.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Mata pelajaran tidak ditemukan' }, { status: 404 })
    }

    // Check name uniqueness if name is being changed
    if (name.trim() !== existing.name) {
      const nameConflict = await db.subject.findUnique({ where: { name: name.trim() } })
      if (nameConflict) {
        return NextResponse.json({ error: 'Nama mata pelajaran sudah digunakan' }, { status: 409 })
      }
    }

    const subject = await db.subject.update({
      where: { id },
      data: {
        name: name.trim(),
        code: code?.trim() || null,
        description: description?.trim() || null,
      },
      include: {
        _count: { select: { classes: true, assignments: true } },
      },
    })

    return NextResponse.json({ subject })
  } catch (error) {
    console.error('Update subject error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Hanya admin yang dapat menghapus mata pelajaran' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID mata pelajaran wajib diisi' }, { status: 400 })
    }

    const existing = await db.subject.findUnique({
      where: { id },
      include: {
        _count: { select: { classes: true, assignments: true } },
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Mata pelajaran tidak ditemukan' }, { status: 404 })
    }

    if (existing._count.classes > 0 || existing._count.assignments > 0) {
      return NextResponse.json(
        { error: `Tidak dapat menghapus mata pelajaran yang masih memiliki ${existing._count.classes} kelas dan ${existing._count.assignments} tugas terkait` },
        { status: 400 }
      )
    }

    await db.subject.delete({ where: { id } })

    return NextResponse.json({ message: 'Mata pelajaran berhasil dihapus' })
  } catch (error) {
    console.error('Delete subject error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
