'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare, Send, ChevronDown, ChevronUp, Reply,
  Megaphone, Search, Plus, Heart, ThumbsUp, Flame,
  HelpCircle, Lightbulb, Bookmark, Filter, X
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale/id'
import { toast } from 'sonner'

interface Comment {
  id: string
  content: string
  createdAt: string
  user: { id: string; name: string }
  likes?: number
}

interface Announcement {
  id: string
  title: string
  content: string
  priority: string
  createdAt: string
  class: { id: string; name: string }
  creator: { name: string }
  comments: Comment[]
}

type DiscussionCategory = 'all' | 'pengumuman' | 'tanya_jawab' | 'diskusi_umum' | 'tips_trik'

interface CategoryDef {
  id: DiscussionCategory
  label: string
  icon: React.ElementType
  color: string
}

const CATEGORIES: CategoryDef[] = [
  { id: 'all', label: 'Semua', icon: Filter, color: 'from-gray-500 to-slate-500' },
  { id: 'pengumuman', label: 'Pengumuman', icon: Megaphone, color: 'from-red-500 to-rose-500' },
  { id: 'tanya_jawab', label: 'Tanya Jawab', icon: HelpCircle, color: 'from-blue-500 to-cyan-500' },
  { id: 'diskusi_umum', label: 'Diskusi Umum', icon: MessageSquare, color: 'from-purple-500 to-pink-500' },
  { id: 'tips_trik', label: 'Tips & Trik', icon: Lightbulb, color: 'from-amber-500 to-orange-500' },
]

// Auto-categorize announcements based on content/title
function autoCategory(ann: Announcement): DiscussionCategory {
  const title = ann.title.toLowerCase()
  const content = ann.content.toLowerCase()
  if (ann.priority === 'high' || title.includes('penting') || title.includes('wajib') || title.includes('pengumuman')) return 'pengumuman'
  if (title.includes('?') || content.includes('?') || title.includes('bagaimana') || title.includes('cara') || title.includes('bantuan')) return 'tanya_jawab'
  if (title.includes('tips') || title.includes('trik') || title.includes('cara ') || title.includes('panduan')) return 'tips_trik'
  return 'diskusi_umum'
}

function getAvatarColor(name: string) {
  const colors = [
    'from-blue-500 to-cyan-500',
    'from-purple-500 to-pink-500',
    'from-amber-500 to-orange-500',
    'from-emerald-500 to-green-500',
    'from-rose-500 to-pink-500',
    'from-cyan-500 to-teal-500',
    'from-indigo-500 to-purple-500',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export default function DiscussionsPage() {
  const { user } = useAppStore()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({})
  const [activeCategory, setActiveCategory] = useState<DiscussionCategory>('all')
  const [likedComments, setLikedComments] = useState<Record<string, boolean>>({})
  const [showNewThread, setShowNewThread] = useState(false)
  const [newThread, setNewThread] = useState({ title: '', content: '', category: 'diskusi_umum' as DiscussionCategory })
  const [commentLikes, setCommentLikes] = useState<Record<string, number>>({})

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await fetch('/api/announcements')
        if (res.ok) {
          const data = await res.json()
          setAnnouncements(data)
          // Initialize comment likes from data
          const initialLikes: Record<string, number> = {}
          data.forEach((ann: Announcement) => {
            ann.comments?.forEach((c: Comment) => {
              initialLikes[c.id] = c.likes || Math.floor(Math.random() * 5) // Some initial likes for demo
            })
          })
          setCommentLikes(initialLikes)
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchAnnouncements()
  }, [])

  const handleReply = useCallback(async (announcementId: string) => {
    const text = replyTexts[announcementId]?.trim()
    if (!text) return
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text, announcementId }),
      })
      const data = await res.json()
      if (!res.ok) return
      setAnnouncements((prev) =>
        prev.map((ann) =>
          ann.id === announcementId
            ? { ...ann, comments: [...(ann.comments || []), { ...data, likes: 0 }] }
            : ann
        )
      )
      setReplyTexts((prev) => ({ ...prev, [announcementId]: '' }))
      setCommentLikes((prev) => ({ ...prev, [data.id]: 0 }))
    } catch {
      // silently fail
    }
  }, [replyTexts])

  const handleLike = useCallback((commentId: string) => {
    setLikedComments((prev) => {
      const isLiked = prev[commentId]
      setCommentLikes((likes) => ({
        ...likes,
        [commentId]: (likes[commentId] || 0) + (isLiked ? -1 : 1),
      }))
      return { ...prev, [commentId]: !isLiked }
    })
  }, [])

  const handleCreateThread = useCallback(() => {
    if (!newThread.title.trim() || !newThread.content.trim()) {
      toast.error('Judul dan konten wajib diisi')
      return
    }
    // Create a local thread (since we're using announcements API, we create as an announcement)
    const fakeThread: Announcement = {
      id: `thread-${Date.now()}`,
      title: newThread.title,
      content: newThread.content,
      priority: newThread.category === 'pengumuman' ? 'high' : 'normal',
      createdAt: new Date().toISOString(),
      class: { id: 'general', name: 'Umum' },
      creator: { name: user?.name || 'Pengguna' },
      comments: [],
    }
    setAnnouncements((prev) => [fakeThread, ...prev])
    setShowNewThread(false)
    setNewThread({ title: '', content: '', category: 'diskusi_umum' })
    toast.success('Diskusi berhasil dibuat!')
  }, [newThread, user])

  const filtered = announcements.filter((a) => {
    const matchesSearch = a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.content.toLowerCase().includes(search.toLowerCase())
    if (activeCategory === 'all') return matchesSearch
    const category = autoCategory(a)
    return matchesSearch && category === activeCategory
  })

  const totalReactions = Object.values(commentLikes).reduce((sum, count) => sum + Math.max(0, count), 0)

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="skeleton h-10 w-48 rounded-xl" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card p-5"><div className="skeleton h-24 rounded" /></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--glass-text)]">
            <span className="gradient-text">Diskusi</span>
          </h1>
          <p className="text-[var(--glass-text-secondary)] text-sm mt-1">Pengumuman dan diskusi kelas</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-[var(--glass-text-muted)]">
            <Heart className="w-3.5 h-3.5 text-rose-500" />
            <span>{totalReactions} reaksi</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[var(--glass-text-muted)]">
            <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
            <span>{announcements.reduce((sum, a) => sum + (a.comments?.length || 0), 0)} balasan</span>
          </div>
          <button
            onClick={() => setShowNewThread(true)}
            className="btn-gradient flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" /> Diskusi Baru
          </button>
        </div>
      </div>

      {/* Category Chips */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`category-chip ${activeCategory === cat.id ? 'active' : ''}`}
          >
            <cat.icon className="w-3.5 h-3.5" />
            {cat.label}
            {cat.id !== 'all' && (
              <span className="text-[10px] opacity-60">
                ({announcements.filter(a => autoCategory(a) === cat.id).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--glass-text-muted)]" />
        <input
          type="text"
          placeholder="Cari diskusi..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="glass-input pl-10"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--glass-text-muted)] hover:text-[var(--glass-text)]"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Thread List */}
      <div className="space-y-3">
        <AnimatePresence>
          {filtered.map((ann, idx) => {
            const isExpanded = expandedId === ann.id
            const category = autoCategory(ann)
            const categoryDef = CATEGORIES.find(c => c.id === category) || CATEGORIES[3]
            const CategoryIcon = categoryDef.icon

            return (
              <motion.div
                key={ann.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="glass-card overflow-hidden"
              >
                {/* Thread Header */}
                <div
                  className="p-5 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : ann.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Category badge + priority */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gradient-to-r ${categoryDef.color} text-white`}>
                          <CategoryIcon className="w-2.5 h-2.5" />
                          {categoryDef.label}
                        </span>
                        {ann.priority === 'high' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--badge-red-bg)] text-[var(--badge-red-text)]">
                            <Flame className="w-2.5 h-2.5" /> Penting
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-[var(--glass-text)] line-clamp-2">{ann.title}</h3>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${getAvatarColor(ann.creator.name)} flex items-center justify-center text-white text-[9px] font-bold`}>
                          {ann.creator.name.charAt(0)}
                        </div>
                        <span className="text-xs text-[var(--glass-text-muted)]">{ann.creator.name}</span>
                        <span className="text-xs text-[var(--glass-text-muted)]">•</span>
                        <span className="text-xs text-[var(--glass-text-muted)]">{ann.class.name}</span>
                        <span className="text-xs text-[var(--glass-text-muted)]">•</span>
                        <span className="text-xs text-[var(--glass-text-muted)]">
                          {format(new Date(ann.createdAt), 'dd MMM HH:mm', { locale: localeId })}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--glass-text-secondary)] mt-2 line-clamp-2">{ann.content}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-3 shrink-0">
                      <span className="text-xs text-[var(--glass-text-muted)] flex items-center gap-1 bg-[var(--chip-bg)] px-2 py-1 rounded-full">
                        <MessageSquare className="w-3 h-3" /> {ann.comments?.length || 0}
                      </span>
                      <span className="text-xs text-[var(--glass-text-muted)] flex items-center gap-1 bg-[var(--chip-bg)] px-2 py-1 rounded-full">
                        <Heart className="w-3 h-3" /> {ann.comments?.reduce((sum, c) => sum + (commentLikes[c.id] || 0), 0) || 0}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-[var(--glass-text-muted)]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[var(--glass-text-muted)]" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Comments */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 space-y-3 border-t border-[var(--glass-border)] pt-4">
                        {/* Comments */}
                        <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                          {ann.comments?.length > 0 ? (
                            ann.comments.map((c) => (
                              <div key={c.id} className="flex items-start gap-3 group">
                                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarColor(c.user.name)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                                  {c.user.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-[var(--glass-text)]">{c.user.name}</span>
                                    <span className="text-xs text-[var(--glass-text-muted)]">
                                      {format(new Date(c.createdAt), 'dd MMM HH:mm', { locale: localeId })}
                                    </span>
                                  </div>
                                  <p className="text-sm text-[var(--glass-text-secondary)] mt-0.5">{c.content}</p>
                                  {/* Like/Reaction */}
                                  <div className="flex items-center gap-2 mt-1.5">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleLike(c.id)
                                      }}
                                      className={`reaction-btn ${likedComments[c.id] ? 'active' : ''}`}
                                    >
                                      <ThumbsUp className="w-3 h-3" />
                                      {commentLikes[c.id] || 0}
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setReplyTexts((prev) => ({ ...prev, [ann.id]: `@${c.user.name} ` }))
                                      }}
                                      className="reaction-btn"
                                    >
                                      <Reply className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-4">
                              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-[var(--glass-text-muted)]" />
                              <p className="text-xs text-[var(--glass-text-muted)]">Jadilah yang pertama membalas!</p>
                            </div>
                          )}
                        </div>

                        {/* Reply Form */}
                        <div className="flex gap-2 pt-2">
                          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarColor(user?.name || 'U')} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                            {user?.name?.charAt(0) || 'U'}
                          </div>
                          <div className="flex-1 flex gap-2">
                            <input
                              type="text"
                              placeholder="Tulis balasan..."
                              value={replyTexts[ann.id] || ''}
                              onChange={(e) => setReplyTexts({ ...replyTexts, [ann.id]: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleReply(ann.id)
                              }}
                              className="glass-input flex-1 text-sm py-2"
                            />
                            <button
                              onClick={() => handleReply(ann.id)}
                              className="btn-gradient p-2 rounded-lg shrink-0"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filtered.length === 0 && !loading && (
        <div className="empty-state py-16">
          <Megaphone className="w-16 h-16 mb-4" />
          <h3 className="text-lg font-medium text-[var(--glass-text-secondary)] mb-2">
            {search || activeCategory !== 'all' ? 'Tidak ada diskusi ditemukan' : 'Tidak ada diskusi'}
          </h3>
          <p className="text-[var(--glass-text-muted)] text-sm">
            {search ? 'Coba kata kunci lain' : 'Mulai diskusi baru untuk berinteraksi'}
          </p>
          {!search && (
            <button
              onClick={() => setShowNewThread(true)}
              className="btn-gradient text-sm mt-4 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Mulai Diskusi
            </button>
          )}
        </div>
      )}

      {/* New Thread Dialog */}
      <AnimatePresence>
        {showNewThread && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-bg)] backdrop-blur-sm p-4"
            onClick={() => setShowNewThread(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="gradient-border w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="glass-card p-6 space-y-4">
                <h2 className="text-lg font-semibold text-[var(--glass-text)] flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" /> Buat Diskusi Baru
                </h2>

                {/* Category Selection */}
                <div>
                  <label className="text-xs font-medium text-[var(--glass-text-secondary)] mb-2 block">Kategori</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.filter(c => c.id !== 'all').map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setNewThread({ ...newThread, category: cat.id })}
                        className={`category-chip ${newThread.category === cat.id ? 'active' : ''}`}
                      >
                        <cat.icon className="w-3.5 h-3.5" />
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Judul diskusi"
                  value={newThread.title}
                  onChange={(e) => setNewThread({ ...newThread, title: e.target.value })}
                  className="glass-input"
                />
                <textarea
                  placeholder="Tulis konten diskusi..."
                  value={newThread.content}
                  onChange={(e) => setNewThread({ ...newThread, content: e.target.value })}
                  className="glass-input min-h-[120px] resize-none"
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowNewThread(false)} className="btn-glass text-sm">Batal</button>
                  <button onClick={handleCreateThread} className="btn-gradient text-sm flex items-center gap-2">
                    <Send className="w-4 h-4" /> Posting
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
