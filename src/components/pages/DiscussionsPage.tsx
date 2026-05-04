'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare, Send, ChevronDown, ChevronUp, Reply,
  Megaphone, Search
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale/id'

interface Comment {
  id: string
  content: string
  createdAt: string
  user: { id: string; name: string }
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

export default function DiscussionsPage() {
  const { user } = useAppStore()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await fetch('/api/announcements')
        if (res.ok) setAnnouncements(await res.json())
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
            ? { ...ann, comments: [...(ann.comments || []), data] }
            : ann
        )
      )
      setReplyTexts((prev) => ({ ...prev, [announcementId]: '' }))
    } catch {
      // silently fail
    }
  }, [replyTexts])

  const filtered = announcements.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.content.toLowerCase().includes(search.toLowerCase())
  )

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
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--glass-text)]">
          <span className="gradient-text">Diskusi</span>
        </h1>
        <p className="text-[var(--glass-text-secondary)] text-sm mt-1">Pengumuman dan diskusi kelas</p>
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
      </div>

      {/* Thread List */}
      <div className="space-y-3">
        <AnimatePresence>
          {filtered.map((ann, idx) => {
            const isExpanded = expandedId === ann.id
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
                      <div className="flex items-center gap-2">
                        {ann.priority === 'high' && <span className="status-dot status-dot-danger" />}
                        <h3 className="text-sm font-semibold text-[var(--glass-text)] truncate">{ann.title}</h3>
                      </div>
                      <p className="text-xs text-[var(--glass-text-muted)] mt-1">{ann.class.name} • {ann.creator.name}</p>
                      <p className="text-sm text-[var(--glass-text-secondary)] mt-2 line-clamp-2">{ann.content}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-3 shrink-0">
                      <span className="text-xs text-[var(--glass-text-muted)] flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" /> {ann.comments?.length || 0}
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
                        <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                          {ann.comments?.length > 0 ? (
                            ann.comments.map((c) => (
                              <div key={c.id} className="flex items-start gap-3">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
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
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-[var(--glass-text-muted)] text-center py-2">Belum ada komentar</p>
                          )}
                        </div>

                        {/* Reply Form */}
                        <div className="flex gap-2 pt-2">
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
                            className="btn-glass p-2 rounded-lg"
                          >
                            <Send className="w-4 h-4" />
                          </button>
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
          <h3 className="text-lg font-medium text-[var(--glass-text-secondary)] mb-2">Tidak ada diskusi</h3>
          <p className="text-[var(--glass-text-muted)] text-sm">
            {search ? 'Coba kata kunci lain' : 'Belum ada pengumuman atau diskusi'}
          </p>
        </div>
      )}
    </div>
  )
}
