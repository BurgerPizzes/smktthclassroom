'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, Check, CheckCheck, Info, AlertTriangle,
  CheckCircle2, XCircle, Clock, Trash2, FileText,
  Megaphone, Settings, Filter, Volume2, X
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

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bgCircle: string; filterTab: FilterTab }> = {
  info: { icon: Info, color: 'text-[var(--badge-blue-text)]', bgCircle: 'bg-[var(--badge-blue-bg)]', filterTab: 'sistem' },
  warning: { icon: AlertTriangle, color: 'text-[var(--badge-amber-text)]', bgCircle: 'bg-[var(--badge-amber-bg)]', filterTab: 'sistem' },
  success: { icon: CheckCircle2, color: 'text-[var(--badge-green-text)]', bgCircle: 'bg-[var(--badge-green-bg)]', filterTab: 'sistem' },
  error: { icon: XCircle, color: 'text-[var(--badge-red-text)]', bgCircle: 'bg-[var(--badge-red-bg)]', filterTab: 'sistem' },
  assignment: { icon: FileText, color: 'text-[var(--badge-blue-text)]', bgCircle: 'bg-[var(--badge-blue-bg)]', filterTab: 'tugas' },
  announcement: { icon: Megaphone, color: 'text-[var(--badge-purple-text)]', bgCircle: 'bg-[var(--badge-purple-bg)]', filterTab: 'pengumuman' },
}

const FILTER_TABS: { key: FilterTab; label: string; icon: React.ElementType }[] = [
  { key: 'all', label: 'Semua', icon: Bell },
  { key: 'tugas', label: 'Tugas', icon: FileText },
  { key: 'pengumuman', label: 'Pengumuman', icon: Megaphone },
  { key: 'sistem', label: 'Sistem', icon: Settings },
]

function getNotificationFilterTab(n: Notification): FilterTab {
  const titleLower = n.title.toLowerCase()
  const msgLower = n.message.toLowerCase()
  if (titleLower.includes('tugas') || msgLower.includes('tugas') || titleLower.includes('assignment') || n.type === 'assignment') return 'tugas'
  if (titleLower.includes('pengumuman') || msgLower.includes('pengumuman') || titleLower.includes('announcement') || n.type === 'announcement') return 'pengumuman'
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
    'learning-resources', 'profile', 'notifications'
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
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  const [soundEnabled, setSoundEnabled] = useState(true)

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
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      })
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      toast.success('Semua notifikasi ditandai sudah dibaca')
    } catch {
      // silently fail
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

  // Filter notifications
  const filteredNotifications = activeFilter === 'all'
    ? notifications
    : notifications.filter((n) => getNotificationFilterTab(n) === activeFilter)

  // Count by filter
  const filterCounts = useCallback(() => {
    const counts: Record<FilterTab, number> = { all: notifications.length, tugas: 0, pengumuman: 0, sistem: 0 }
    notifications.forEach((n) => {
      const tab = getNotificationFilterTab(n)
      counts[tab]++
    })
    return counts
  }, [notifications])()

  const unreadFilterCounts = useCallback(() => {
    const counts: Record<FilterTab, number> = { all: unreadCount, tugas: 0, pengumuman: 0, sistem: 0 }
    notifications.filter((n) => !n.read).forEach((n) => {
      const tab = getNotificationFilterTab(n)
      counts[tab]++
    })
    return counts
  }, [notifications, unreadCount])()

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
        <div className="flex items-center gap-2">
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
            <button onClick={markAllRead} className="btn-glass flex items-center gap-2 text-sm">
              <CheckCheck className="w-4 h-4" /> Tandai Dibaca
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

      {/* Groups */}
      <div className="space-y-6">
        {groups.map((group) => (
          <div key={group.label}>
            <h3 className="text-sm font-medium text-[var(--glass-text-muted)] mb-3">{group.label}</h3>
            <div className="space-y-2 stagger-in">
              <AnimatePresence>
                {group.items.map((n) => {
                  const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.info
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
                      }`}
                      onClick={() => handleNotificationClick(n)}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${config.bgCircle}`}>
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
                        <div className="flex items-center gap-2 mt-1.5">
                          <p className="text-xs text-[var(--glass-text-muted)] flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {timeAgo}
                          </p>
                          {hasLink && (
                            <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                              Lihat detail →
                            </span>
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
          <p className="text-sm text-[var(--glass-text-muted)]">Tidak ada notifikasi untuk filter ini</p>
        </div>
      )}
    </div>
  )
}
