import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, createSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password, rememberMe } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email dan password wajib diisi' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { email } })

    if (!user) {
      return NextResponse.json({ error: 'Email atau password salah' }, { status: 401 })
    }

    // Use bcrypt comparison only — no plain-text fallback
    const valid = await verifyPassword(password, user.password)

    if (!valid) {
      return NextResponse.json({ error: 'Email atau password salah' }, { status: 401 })
    }

    // Create session — 30 days if rememberMe, 1 day otherwise
    const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 1
    await createSession(user.id, maxAge)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
