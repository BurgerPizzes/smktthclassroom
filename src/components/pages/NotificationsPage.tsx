'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, Check, CheckCheck, Info, AlertTriangle,
  CheckCircle2, XCircle, Clock, Trash2, FileText,
  Megaphone, Settings, Filter, Volume2, X, ExternalLink,
  ArrowRight, BookOpen, Calendar, GraduationCap, ClipboardCheck,
  AlertCircle, Shield, UserPlus, MessageSquare, Sparkles
} from 'lucide-react'
import { useAppStore, type PageName } from '@/lib/store'
import { format, formatDistanceToNow } from 'date-fns'
import { id as localeId } from 'date-fns/locale/id'
import { toast } from 'sonner'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  link?: string
  createdAt: string
}

type FilterTab = 'all' | 'tugas' | 'pengumuman' | 'sistem'
type ReadFilter = 'all' | 'unread' | 'read'

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bgCircle: string; filterTab: FilterTab; tint: string; actionLabel?: string; actionPage?: PageName }> = {
  info: { icon: Info, color: 'text-[var(--badge-blue-text)]', bgCircle: 'bg-[var(--badge-blue-bg)]', filterTab: 'sistem', tint: 'notif-tint-info' },
  warning: { icon: AlertTriangle, color: 'text-[var(--badge-amber-text)]', bgCircle: 'bg-[var(--badge-amber-bg)]', filterTab: 'sistem', tint: 'notif-tint-warning' },
  success: { icon: CheckCircle2, color: 'text-[var(--badge-green-text)]', bgCircle: 'bg-[var(--badge-green-bg)]', filterTab: 'sistem', tint: 'notif-tint-success' },
  error: { icon: XCircle, color: 'text-[var(--badge-red-text)]', bgCircle: 'bg-[var(--badge-red-bg)]', filterTab: 'sistem', tint: 'notif-tint-error' },
  assignment: { icon: ClipboardCheck, color: 'text-[var(--badge-blue-text)]', bgCircle: 'bg-[var(--badge-blue-bg)]', filterTab: 'tugas', tint: 'notif-tint-assignment', actionLabel: 'Lihat Tugas', actionPage: 'my-submissions' },
  announcement: { icon: Megaphone, color: 'text-[var(--badge-purple-text)]', bgCircle: 'bg-[var(--badge-purple-bg)]', filterTab: 'pengumuman', tint: 'notif-tint-announcement', actionLabel: 'Lihat Kelas', actionPage: 'classes' },
  grade: { icon: GraduationCap, color: 'text-[var(--badge-amber-text)]', bgCircle: 'bg-[var(--badge-amber-bg)]', filterTab: 'tugas', tint: 'notif-tint-info', actionLabel: 'Lihat Nilai', actionPage: 'my-submissions' },
  attendance: { icon: Calendar, color: 'text-[var(--badge-green-text)]', bgCircle: 'bg-[var(--badge-green-bg)]', filterTab: 'sistem', tint: 'notif-tint-success' },
  class: { icon: BookOpen, color: 'text-[var(--badge-purple-text)]', bgCircle: 'bg-[var(--badge-purple-bg)]', filterTab: 'pengumuman', tint: 'notif-tint-announcement', actionLabel: 'Lihat Kelas', actionPage: 'classes' },
  submission: { icon: FileText, color: 'text-[var(--badge-blue-text)]', bgCircle: 'bg-[var(--badge-blue-bg)]', filterTab: 'tugas', tint: 'notif-tint-assignment', actionLabel: 'Lihat Submission', actionPage: 'my-submissions' },
  security: { icon: Shield, color: 'text-[var(--badge-red-text)]', bgCircle: 'bg-[var(--badge-red-bg)]', filterTab: 'sistem', tint: 'notif-tint-error' },
  social: { icon: UserPlus, color: 'text-[var(--badge-purple-text)]', bgCircle: 'bg-[var(--badge-purple-bg)]', filterTab: 'sistem', tint: 'notif-tint-announcement' },
  comment: { icon: MessageSquare, color: 'text-[var(--badge-blue-text)]', bgCircle: 'bg-[var(--badge-blue-bg)]', filterTab: 'pengumuman', tint: 'notif-tint-info' },
}

// Smart notification type detection
function detectNotificationType(n: Notification): string {
  if (n.type && TYPE_CONFIG[n.type] && n.type !== 'info') return n.type
  const title = n.title.toLowerCase()
  const msg = n.message.toLowerCase()
  if (title.includes('nilai') || msg.includes('nilai') || title.includes('grade') || title.includes('dinilai')) return 'grade'
  if (title.includes('absensi') || msg.includes('absensi') || title.includes('kehadiran') || title.includes('attendance')) return 'attendance'
  if (title.includes('kelas') || msg.includes('kelas baru') || title.includes('bergabung') || title.includes('class')) return 'class'
  if (title.includes('submission') || msg.includes('kumpul') || title.includes('tugas baru') || title.includes('dikumpulkan')) return 'submission'
  if (title.includes('komentar') || msg.includes('komentar') || title.includes('balasan') || title.includes('comment')) return 'comment'
  if (title.includes('tugas') || msg.includes('tugas') || title.includes('assignment') || title.includes('deadline') || title.includes('tenggat')) return 'assignment'
  if (title.includes('pengumuman') || msg.includes('pengumuman') || title.includes('announcement')) return 'announcement'
  if (title.includes('keamanan') || title.includes('security') || title.includes('password') || title.includes('login')) return 'security'
  if (n.type === 'success') return 'success'
  if (n.type === 'warning') return 'warning'
  if (n.type === 'error') return 'error'
  return 'info'
}

const FILTER_TABS: { key: FilterTab; label: string; icon: React.ElementType }[] = [
  { key: 'all', label: 'Semua', icon: Bell },
  { key: 'tugas', label: 'Tugas', icon: ClipboardCheck },
  { key: 'pengumuman', label: 'Pengumuman', icon: Megaphone },
  { key: 'sistem', label: 'Sistem', icon: Settings },
]

const READ_FILTER_OPTIONS: { key: ReadFilter; label: string; icon: React.ElementType }[] = [
  { key: 'all', label: 'Semua', icon: Filter },
  { key: 'unread', label: 'Belum Dibaca', icon: Sparkles },
  { key: 'read', label: 'Dibaca', icon: CheckCheck },
]

function getNotificationFilterTab(n: Notification): FilterTab {
  const titleLower = n.title.toLowerCase()
  const msgLower = n.message.toLowerCase()
  if (titleLower.includes('tugas') || msgLower.includes('tugas') || titleLower.includes('assignment') || n.type === 'assignment' || n.type === 'grade' || n.type === 'submission') return 'tugas'
  if (titleLower.includes('pengumuman') || msgLower.includes('pengumuman') || titleLower.includes('announcement') || n.type === 'announcement' || n.type === 'class' || n.type === 'comment') return 'pengumuman'
  const config = TYPE_CONFIG[n.type]
  return config?.filterTab || 'sistem'
}

function groupByTime(notifications: Notification[]) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const weekAgo = new Date(today.getTime() - 7 * 86400000)

  const groups: { label: string; items: Notification[] }[] = [
    { label: 'Hari Ini', items: [] },
    { label: 'Kemarin', items: [] },
    { label: 'Minggu Ini', items: [] },
    { label: 'Lebih Lama', items: [] },
  ]

  notifications.forEach((n) => {
    const date = new Date(n.createdAt)
    if (date >= today) groups[0].items.push(n)
    else if (date >= yesterday) groups[1].items.push(n)
    else if (date >= weekAgo) groups[2].items.push(n)
    else groups[3].items.push(n)
  })

  return groups.filter((g) => g.items.length > 0)
}

function parseNotificationLink(link?: string): { page: PageName; params?: Record<string, string> } | null {
  if (!link) return null

  const parts = link.split(':')
  const pageName = parts[0] as PageName
  const id = parts[1]

  const validPages: PageName[] = [
    'dashboard', 'classes', 'class-detail', 'assignment-detail',
    'my-submissions', 'calendar', 'discussions', 'attendance',
    'learning-resources', 'profile', 'notifications', 'progress-analytics'
  ]

  if (validPages.includes(pageName)) {
    if (id) {
      return { page: pageName, params: { id } }
    }
    return { page: pageName }
  }

  return { page: 'dashboard' }
}

export default function NotificationsPage() {
  const { setPage } = useAppStore()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')
  const [readFilter, setReadFilter] = useState<ReadFilter>('all')
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [markingAllRead, setMarkingAllRead] = useState(false)

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications')
        if (res.ok) setNotifications(await res.json())
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchNotifications()
  }, [])

  const markAsRead = useCallback(async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, read: true }),
      })
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      )
    } catch {
      // silently fail
    }
  }, [])

  const markAllRead = useCallback(async () => {
    setMarkingAllRead(true)
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      })
      // Add a small delay for the sweep animation
      await new Promise((r) => setTimeout(r, 600))
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      toast.success('Semua notifikasi ditandai sudah dibaca')
    } catch {
      // silently fail
    } finally {
      setMarkingAllRead(false)
    }
  }, [])

  const deleteNotification = useCallback(async (id: string) => {
    setDeletingIds((prev) => new Set(prev).add(id))
    // Wait for animation
    setTimeout(async () => {
      try {
        await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' })
        setNotifications((prev) => prev.filter((n) => n.id !== id))
      } catch {
        toast.error('Gagal menghapus notifikasi')
      } finally {
        setDeletingIds((prev) => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
      }
    }, 300)
  }, [])

  const deleteAllRead = useCallback(async () => {
    const readIds = notifications.filter((n) => n.read).map((n) => n.id)
    if (readIds.length === 0) {
      toast.info('Tidak ada notifikasi yang sudah dibaca')
      return
    }
    try {
      await fetch('/api/notifications', { method: 'DELETE' })
      setNotifications((prev) => prev.filter((n) => !n.read))
      toast.success(`${readIds.length} notifikasi dibaca dihapus`)
    } catch {
      toast.error('Gagal menghapus notifikasi')
    }
  }, [notifications])

  const handleNotificationClick = useCallback((n: Notification) => {
    if (!n.read) markAsRead(n.id)
    const target = parseNotificationLink(n.link)
    if (target) {
      setPage(target.page, target.params)
    }
  }, [markAsRead, setPage])

  const unreadCount = notifications.filter((n) => !n.read).length

  // Filter notifications by category and read status
  const filteredNotifications = useMemo(() => {
    let result = activeFilter === 'all'
      ? notifications
      : notifications.filter((n) => getNotificationFilterTab(n) === activeFilter)

    if (readFilter === 'unread') {
      result = result.filter((n) => !n.read)
    } else if (readFilter === 'read') {
      result = result.filter((n) => n.read)
    }

    return result
  }, [notifications, activeFilter, readFilter])

  // Count by filter
  const filterCounts = useMemo(() => {
    const counts: Record<FilterTab, number> = { all: notifications.length, tugas: 0, pengumuman: 0, sistem: 0 }
    notifications.forEach((n) => {
      const tab = getNotificationFilterTab(n)
      counts[tab]++
    })
    return counts
  }, [notifications])

  const unreadFilterCounts = useMemo(() => {
    const counts: Record<FilterTab, number> = { all: unreadCount, tugas: 0, pengumuman: 0, sistem: 0 }
    notifications.filter((n) => !n.read).forEach((n) => {
      const tab = getNotificationFilterTab(n)
      counts[tab]++
    })
    return counts
  }, [notifications, unreadCount])

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="skeleton h-10 w-48 rounded-xl" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="glass-card p-4"><div className="skeleton h-14 rounded" /></div>
          ))}
        </div>
      </div>
    )
  }

  const groups = groupByTime(filteredNotifications)

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--glass-text)]">
            <span className="gradient-text">Notifikasi</span>
          </h1>
          <p className="text-[var(--glass-text-secondary)] text-sm mt-1">
            {unreadCount > 0 ? `${unreadCount} notifikasi belum dibaca` : 'Semua sudah dibaca'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Sound toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`btn-glass text-xs flex items-center gap-1.5 ${soundEnabled ? '' : 'opacity-50'}`}
            title={soundEnabled ? 'Suara notifikasi aktif' : 'Suara notifikasi mati'}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{soundEnabled ? 'Suara On' : 'Suara Off'}</span>
          </button>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="btn-glass flex items-center gap-2 text-sm" disabled={markingAllRead}>
              <CheckCheck className={`w-4 h-4 ${markingAllRead ? 'mark-read-sweep' : ''}`} />
              {markingAllRead ? 'Menandai...' : 'Tandai Semua Dibaca'}
            </button>
          )}
          {notifications.some((n) => n.read) && (
            <button onClick={deleteAllRead} className="btn-glass flex items-center gap-2 text-sm text-[var(--badge-red-text)]">
              <Trash2 className="w-3.5 h-3.5" /> Hapus Dibaca
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
          <Filter className="w-4 h-4 text-[var(--glass-text-muted)] shrink-0" />
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`category-chip ${activeFilter === tab.key ? 'active' : ''}`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
              {unreadFilterCounts[tab.key] > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white min-w-[18px] text-center">
                  {unreadFilterCounts[tab.key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Read/Unread Filter */}
        <div className="flex items-center gap-2">
          {READ_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setReadFilter(opt.key)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-all font-medium ${
                readFilter === opt.key
                  ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-sm'
                  : 'bg-[var(--glass-input-bg)] text-[var(--glass-text-secondary)] hover:bg-[var(--glass-hover-bg)]'
              }`}
            >
              <opt.icon className="w-3 h-3 inline mr-1" />
              {opt.label}
              {opt.key === 'unread' && unreadCount > 0 && (
                <span className="ml-1 font-bold">({unreadCount})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Groups */}
      <div className="space-y-6">
        {groups.map((group) => (
          <div key={group.label}>
            <div className="notification-group-header">
              <h3 className="text-sm font-medium text-[var(--glass-text-secondary)]">{group.label}</h3>
            </div>
            <div className="space-y-2 stagger-in">
              <AnimatePresence>
                {group.items.map((n) => {
                  const detectedType = detectNotificationType(n)
                  const config = TYPE_CONFIG[detectedType] || TYPE_CONFIG.info
                  const Icon = config.icon
                  const hasLink = !!n.link
                  const isDeleting = deletingIds.has(n.id)
                  const timeAgo = formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: localeId })

                  return (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 100 }}
                      className={`interactive-card p-4 flex items-start gap-4 ${
                        !n.read ? 'notification-unread-border' : ''
                      } ${hasLink ? 'cursor-pointer hover:bg-[var(--glass-hover-bg)]' : ''} ${
                        isDeleting ? 'notification-exit' : ''
                      } ${config.tint || ''}`}
                      onClick={() => handleNotificationClick(n)}
                    >
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${config.bgCircle}`}>
                        <Icon className={`w-5 h-5 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium truncate ${!n.read ? 'text-[var(--glass-text)]' : 'text-[var(--glass-text-secondary)]'}`}>
                            {n.title}
                          </p>
                          {!n.read && <span className="status-dot status-dot-purple shrink-0" />}
                        </div>
                        <p className="text-xs text-[var(--glass-text-muted)] mt-0.5 line-clamp-2">{n.message}</p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <p className="text-xs text-[var(--glass-text-muted)] flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {timeAgo}
                          </p>
                          {hasLink && (
                            <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                              Lihat detail →
                            </span>
                          )}
                          {/* Action button based on notification type */}
                          {config.actionLabel && config.actionPage && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setPage(config.actionPage!)
                              }}
                              className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-[#667eea]/10 to-[#764ba2]/10 text-[var(--badge-purple-text)] font-medium flex items-center gap-1 hover:from-[#667eea]/20 hover:to-[#764ba2]/20 transition-all"
                            >
                              <ExternalLink className="w-2.5 h-2.5" />
                              {config.actionLabel}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {!n.read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              markAsRead(n.id)
                            }}
                            className="p-1.5 rounded-lg text-[var(--glass-text-muted)] hover:text-[var(--glass-text-secondary)] hover:bg-[var(--chip-bg)] transition-all"
                            title="Tandai dibaca"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteNotification(n.id)
                          }}
                          className="p-1.5 rounded-lg text-[var(--glass-text-muted)] hover:text-[var(--badge-red-text)] hover:bg-[var(--badge-red-bg)] transition-all"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {notifications.length === 0 && (
        <div className="empty-state py-16">
          <Bell className="w-16 h-16 mb-4" />
          <h3 className="text-lg font-medium text-[var(--glass-text-secondary)] mb-2">Tidak ada notifikasi</h3>
          <p className="text-[var(--glass-text-muted)] text-sm">Notifikasi akan muncul di sini</p>
        </div>
      )}

      {/* Filter empty state */}
      {notifications.length > 0 && filteredNotifications.length === 0 && (
        <div className="empty-state py-12">
          <Filter className="w-12 h-12 mb-3" />
          <p className="text-sm text-[var(--glass-text-muted)]">
            {readFilter === 'unread' ? 'Semua notifikasi sudah dibaca' :
             readFilter === 'read' ? 'Belum ada notifikasi yang dibaca' :
             'Tidak ada notifikasi untuk filter ini'}
          </p>
        </div>
      )}
    </div>
  )
}
