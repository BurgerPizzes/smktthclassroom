import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'

const SESSION_COOKIE = 'smktth_session'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days
const SESSION_SECRET = process.env.SESSION_SECRET || 'smktth-classroom-secret-key-change-in-production'

function signToken(userId: string): string {
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(userId).digest('hex')
  return `${userId}.${signature}`
}

function verifyToken(token: string): string | null {
  const [userId, signature] = token.split('.')
  if (!userId || !signature) return null
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(userId).digest('hex')
  if (signature !== expected) return null
  return userId
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createSession(userId: string, maxAge?: number): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, signToken(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: maxAge ?? COOKIE_MAX_AGE,
    path: '/',
  })
}

export async function getSession(): Promise<{
  id: string
  email: string
  name: string
  role: string
  avatar: string | null
} | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value

  if (!token) return null

  const userId = verifyToken(token)
  if (!userId) return null

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatar: true,
    },
  })

  return user
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}
