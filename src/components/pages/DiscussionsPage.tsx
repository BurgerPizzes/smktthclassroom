'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare, Send, ChevronDown, ChevronUp, Reply,
  Megaphone, Search, Plus, Heart, Flame,
  HelpCircle, Lightbulb, Filter, X, Trash2, Loader2
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale/id'
import { toast } from 'sonner'

interface DiscussionReply {
  id: string
  content: string
  createdAt: string
  creator: { id: string; name: string; avatar?: string | null }
}

interface Discussion {
  id: string
  title: string
  content: string
  category: string
  priority: string | null
  classId: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
  creator: { id: string; name: string; avatar?: string | null }
  class: { id: string; name: string } | null
  replies: DiscussionReply[]
  replyCount: number
  likeCount: number
  isLiked: boolean
}

type DiscussionCategory = 'all' | 'pengumuman' | 'tanya-jawab' | 'diskusi-umum' | 'tips-trik'

interface CategoryDef {
  id: DiscussionCategory
  label: string
  icon: React.ElementType
  color: string
  apiValue: string
}

const CATEGORIES: CategoryDef[] = [
  { id: 'all', label: 'Semua', icon: Filter, color: 'from-gray-500 to-slate-500', apiValue: 'all' },
  { id: 'pengumuman', label: 'Pengumuman', icon: Megaphone, color: 'from-red-500 to-rose-500', apiValue: 'pengumuman' },
  { id: 'tanya-jawab', label: 'Tanya Jawab', icon: HelpCircle, color: 'from-blue-500 to-cyan-500', apiValue: 'tanya-jawab' },
  { id: 'diskusi-umum', label: 'Diskusi Umum', icon: MessageSquare, color: 'from-purple-500 to-pink-500', apiValue: 'diskusi-umum' },
  { id: 'tips-trik', label: 'Tips & Trik', icon: Lightbulb, color: 'from-amber-500 to-orange-500', apiValue: 'tips-trik' },
]

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

function getCategoryDef(category: string): CategoryDef {
  return CATEGORIES.find(c => c.apiValue === category) || CATEGORIES[3]
}

export default function DiscussionsPage() {
  const { user } = useAppStore()
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({})
  const [activeCategory, setActiveCategory] = useState<DiscussionCategory>('all')
  const [showNewThread, setShowNewThread] = useState(false)
  const [newThread, setNewThread] = useState({ title: '', content: '', category: 'diskusi-umum' as DiscussionCategory })
  const [submitting, setSubmitting] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [likingId, setLikingId] = useState<string | null>(null)
  const [totalReactions, setTotalReactions] = useState(0)
  const [totalReplies, setTotalReplies] = useState(0)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchDiscussions = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (activeCategory !== 'all') params.set('category', activeCategory)
      if (search) params.set('search', search)
      params.set('sort', 'newest')
      params.set('limit', '50')

      const res = await fetch(`/api/discussions?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setDiscussions(data.discussions || [])
        setTotalReactions(data.discussions.reduce((sum: number, d: Discussion) => sum + d.likeCount, 0))
        setTotalReplies(data.discussions.reduce((sum: number, d: Discussion) => sum + d.replyCount, 0))
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [activeCategory, search])

  useEffect(() => {
    fetchDiscussions()
  }, [fetchDiscussions])

  const handleReply = useCallback(async (discussionId: string) => {
    const text = replyTexts[discussionId]?.trim()
    if (!text) return
    setReplyingTo(discussionId)
    try {
      const res = await fetch(`/api/discussions/${discussionId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Gagal mengirim balasan')
        return
      }
      const reply = await res.json()
      setDiscussions((prev) =>
        prev.map((d) =>
          d.id === discussionId
            ? {
                ...d,
                replies: [...d.replies, reply],
                replyCount: d.replyCount + 1,
              }
            : d
        )
      )
      setReplyTexts((prev) => ({ ...prev, [discussionId]: '' }))
      setTotalReplies((prev) => prev + 1)
      toast.success('Balasan terkirim!')
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setReplyingTo(null)
    }
  }, [replyTexts])

  const handleLike = useCallback(async (discussionId: string) => {
    setLikingId(discussionId)
    try {
      const res = await fetch(`/api/discussions/${discussionId}/like`, {
        method: 'POST',
      })
      if (!res.ok) {
        toast.error('Gagal mengubah like')
        return
      }
      const data = await res.json()
      setDiscussions((prev) =>
        prev.map((d) =>
          d.id === discussionId
            ? {
                ...d,
                likeCount: data.likeCount,
                isLiked: data.liked,
              }
            : d
        )
      )
      setTotalReactions((prev) => prev + (data.liked ? 1 : -1))
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setLikingId(null)
    }
  }, [])

  const handleCreateThread = useCallback(async () => {
    if (!newThread.title.trim() || !newThread.content.trim()) {
      toast.error('Judul dan konten wajib diisi')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/discussions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newThread.title,
          content: newThread.content,
          category: newThread.category,
          priority: newThread.category === 'pengumuman' ? 'high' : 'normal',
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Gagal membuat diskusi')
        return
      }
      const created = await res.json()
      setDiscussions((prev) => [created, ...prev])
      setShowNewThread(false)
      setNewThread({ title: '', content: '', category: 'diskusi-umum' })
      toast.success('Diskusi berhasil dibuat!')
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }, [newThread])

  const handleDelete = useCallback(async (discussionId: string) => {
    setDeletingId(discussionId)
    try {
      const res = await fetch(`/api/discussions/${discussionId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Gagal menghapus diskusi')
        return
      }
      setDiscussions((prev) => prev.filter((d) => d.id !== discussionId))
      if (expandedId === discussionId) setExpandedId(null)
      toast.success('Diskusi berhasil dihapus')
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setDeletingId(null)
    }
  }, [expandedId])

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
            <span>{totalReplies} balasan</span>
          </div>
          <button
            onClick={() => setShowNewThread(true)}
            className="btn-gradient flex items-center gap-2 text-sm font-semibold"
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
                ({discussions.filter(d => d.category === cat.apiValue).length})
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
          {discussions.map((discussion, idx) => {
            const isExpanded = expandedId === discussion.id
            const categoryDef = getCategoryDef(discussion.category)
            const CategoryIcon = categoryDef.icon
            const isCreator = user?.id === discussion.createdBy
            const isAdmin = user?.role === 'admin'
            const canDelete = isCreator || isAdmin

            return (
              <motion.div
                key={discussion.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="glass-card overflow-hidden p-5 md:p-6"
              >
                {/* Thread Header */}
                <div
                  className="cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : discussion.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Category badge + priority */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gradient-to-r ${categoryDef.color} text-white`}>
                          <CategoryIcon className="w-2.5 h-2.5" />
                          {categoryDef.label}
                        </span>
                        {discussion.priority === 'high' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--badge-red-bg)] text-[var(--badge-red-text)]">
                            <Flame className="w-2.5 h-2.5" /> Penting
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-[var(--glass-text)] line-clamp-2">{discussion.title}</h3>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${getAvatarColor(discussion.creator.name)} flex items-center justify-center text-white text-[9px] font-bold`}>
                          {discussion.creator.name.charAt(0)}
                        </div>
                        <span className="text-xs text-[var(--glass-text-muted)]">{discussion.creator.name}</span>
                        {discussion.class && (
                          <>
                            <span className="text-xs text-[var(--glass-text-muted)]">•</span>
                            <span className="text-xs text-[var(--glass-text-muted)]">{discussion.class.name}</span>
                          </>
                        )}
                        <span className="text-xs text-[var(--glass-text-muted)]">•</span>
                        <span className="text-xs text-[var(--glass-text-muted)]">
                          {format(new Date(discussion.createdAt), 'dd MMM HH:mm', { locale: localeId })}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--glass-text-secondary)] mt-2 line-clamp-2">{discussion.content}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-3 shrink-0">
                      <span className="text-xs text-[var(--glass-text-muted)] flex items-center gap-1 bg-[var(--chip-bg)] px-2 py-1 rounded-full">
                        <MessageSquare className="w-3 h-3" /> {discussion.replyCount}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleLike(discussion.id)
                        }}
                        disabled={likingId === discussion.id}
                        className={`text-xs flex items-center gap-1 px-2 py-1 rounded-full transition-colors ${
                          discussion.isLiked
                            ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                            : 'bg-[var(--chip-bg)] text-[var(--glass-text-muted)]'
                        } ${likingId === discussion.id ? 'opacity-50' : 'hover:bg-rose-50 dark:hover:bg-rose-900/20'}`}
                      >
                        {likingId === discussion.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Heart className={`w-3 h-3 ${discussion.isLiked ? 'fill-current' : ''}`} />
                        )}
                        {discussion.likeCount}
                      </button>
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
                        {/* Delete button for creator/admin */}
                        {canDelete && (
                          <div className="flex justify-end">
                            <button
                              onClick={() => handleDelete(discussion.id)}
                              disabled={deletingId === discussion.id}
                              className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded-lg transition-colors"
                            >
                              {deletingId === discussion.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Trash2 className="w-3 h-3" />
                              )}
                              Hapus
                            </button>
                          </div>
                        )}

                        {/* Comments */}
                        <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                          {discussion.replies.length > 0 ? (
                            discussion.replies.map((reply) => (
                              <div key={reply.id} className="flex items-start gap-3 group">
                                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarColor(reply.creator.name)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                                  {reply.creator.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-[var(--glass-text)]">{reply.creator.name}</span>
                                    <span className="text-xs text-[var(--glass-text-muted)]">
                                      {format(new Date(reply.createdAt), 'dd MMM HH:mm', { locale: localeId })}
                                    </span>
                                  </div>
                                  <p className="text-sm text-[var(--glass-text-secondary)] mt-0.5">{reply.content}</p>
                                  <div className="flex items-center gap-2 mt-1.5">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setReplyTexts((prev) => ({ ...prev, [discussion.id]: `@${reply.creator.name} ` }))
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
                              value={replyTexts[discussion.id] || ''}
                              onChange={(e) => setReplyTexts({ ...replyTexts, [discussion.id]: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !replyingTo) handleReply(discussion.id)
                              }}
                              disabled={replyingTo === discussion.id}
                              className="glass-input flex-1 text-sm py-2"
                            />
                            <button
                              onClick={() => handleReply(discussion.id)}
                              disabled={replyingTo === discussion.id || !replyTexts[discussion.id]?.trim()}
                              className="btn-gradient p-2 rounded-lg shrink-0 disabled:opacity-50"
                            >
                              {replyingTo === discussion.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Send className="w-4 h-4" />
                              )}
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
      {discussions.length === 0 && !loading && (
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
            onClick={() => !submitting && setShowNewThread(false)}
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
                        disabled={submitting}
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
                  disabled={submitting}
                  className="glass-input"
                />
                <textarea
                  placeholder="Tulis konten diskusi..."
                  value={newThread.content}
                  onChange={(e) => setNewThread({ ...newThread, content: e.target.value })}
                  disabled={submitting}
                  className="glass-input min-h-[120px] resize-none"
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowNewThread(false)} disabled={submitting} className="btn-glass text-sm">Batal</button>
                  <button
                    onClick={handleCreateThread}
                    disabled={submitting || !newThread.title.trim() || !newThread.content.trim()}
                    className="btn-gradient text-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Posting
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
