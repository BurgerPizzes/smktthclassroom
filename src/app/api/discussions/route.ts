import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const classId = searchParams.get('classId')
    const search = searchParams.get('search')
    const sort = searchParams.get('sort') || 'newest'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: any = {}
    if (category && category !== 'all') where.category = category
    if (classId) where.classId = classId
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
      ]
    }

    // Get current user to check liked status
    const user = await getSession()

    let orderBy: any = { createdAt: 'desc' }
    if (sort === 'oldest') orderBy = { createdAt: 'asc' }

    const [discussions, total] = await Promise.all([
      db.discussion.findMany({
        where,
        include: {
          creator: { select: { id: true, name: true, avatar: true } },
          class: { select: { id: true, name: true } },
          replies: {
            include: {
              creator: { select: { id: true, name: true, avatar: true } },
            },
            orderBy: { createdAt: 'asc' },
          },
          likes: {
            select: { userId: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      db.discussion.count({ where }),
    ])

    // Transform data to include computed fields
    const result = discussions.map((d) => {
      const replyCount = d.replies.length
      const likeCount = d.likes.length
      const isLiked = user ? d.likes.some((l) => l.userId === user.id) : false

      return {
        id: d.id,
        title: d.title,
        content: d.content,
        category: d.category,
        priority: d.priority,
        classId: d.classId,
        createdBy: d.createdBy,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
        creator: d.creator,
        class: d.class,
        replies: d.replies,
        replyCount,
        likeCount,
        isLiked,
      }
    })

    // Sort by most-liked or most-replied in memory (since Prisma can't sort by relation count in SQLite)
    if (sort === 'most-liked') {
      result.sort((a, b) => b.likeCount - a.likeCount)
    } else if (sort === 'most-replied') {
      result.sort((a, b) => b.replyCount - a.replyCount)
    }

    return NextResponse.json({
      discussions: result,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Discussions GET error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, content, category, priority, classId } = await request.json()

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Judul wajib diisi' }, { status: 400 })
    }
    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Konten wajib diisi' }, { status: 400 })
    }

    const validCategories = ['pengumuman', 'tanya-jawab', 'diskusi-umum', 'tips-trik']
    const effectiveCategory = validCategories.includes(category) ? category : 'diskusi-umum'

    // If no classId, find user's first class
    let effectiveClassId = classId || null
    if (!effectiveClassId) {
      const userClass = await db.classUser.findFirst({
        where: { userId: user.id },
        select: { classId: true },
      })
      effectiveClassId = userClass?.classId || null
    }

    const discussion = await db.discussion.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        category: effectiveCategory,
        priority: priority || 'normal',
        classId: effectiveClassId,
        createdBy: user.id,
      },
      include: {
        creator: { select: { id: true, name: true, avatar: true } },
        class: { select: { id: true, name: true } },
        replies: {
          include: {
            creator: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        likes: { select: { userId: true } },
      },
    })

    const result = {
      id: discussion.id,
      title: discussion.title,
      content: discussion.content,
      category: discussion.category,
      priority: discussion.priority,
      classId: discussion.classId,
      createdBy: discussion.createdBy,
      createdAt: discussion.createdAt,
      updatedAt: discussion.updatedAt,
      creator: discussion.creator,
      class: discussion.class,
      replies: discussion.replies,
      replyCount: discussion.replies.length,
      likeCount: discussion.likes.length,
      isLiked: false,
    }

    // Create notifications for class members
    if (effectiveClassId) {
      const classUsers = await db.classUser.findMany({
        where: {
          classId: effectiveClassId,
          userId: { not: user.id },
        },
        select: { userId: true },
      })

      if (classUsers.length > 0) {
        await db.notification.createMany({
          data: classUsers.map((cu) => ({
            userId: cu.userId,
            title: 'Diskusi Baru',
            message: `${user.name} membuat diskusi: ${title.trim()}`,
            type: effectiveCategory === 'pengumuman' ? 'warning' : 'info',
            link: 'discussions',
          })),
        })
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Discussions POST error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
