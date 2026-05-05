import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { hashPassword } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Hanya admin yang dapat mengakses' }, { status: 403 })
    }

    const users = await db.user.findMany({
      select: { id: true, name: true, email: true, role: true, avatar: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(users)
  } catch (error) {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const currentUser = await getSession()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Hanya admin yang dapat mengubah data user' }, { status: 403 })
    }

    const { id, name, email, role, password } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'User ID wajib diisi' }, { status: 400 })
    }

    const data: any = {}
    if (name) data.name = name
    if (email) data.email = email
    if (role) data.role = role
    if (password) data.password = await hashPassword(password)

    const user = await db.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, avatar: true, createdAt: true },
    })

    return NextResponse.json(user)
  } catch (error) {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getSession()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Hanya admin yang dapat menghapus user' }, { status: 403 })
    }

    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'User ID wajib diisi' }, { status: 400 })
    }

    // Prevent deleting yourself
    if (id === currentUser.id) {
      return NextResponse.json({ error: 'Tidak dapat menghapus akun sendiri' }, { status: 400 })
    }

    await db.user.delete({ where: { id } })

    return NextResponse.json({ message: 'User berhasil dihapus' })
  } catch (error) {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
