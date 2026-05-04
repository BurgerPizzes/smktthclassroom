'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, Check, CheckCheck, Info, AlertTriangle,
  CheckCircle2, XCircle, Clock
} from 'lucide-react'
import { useAppStore, type PageName } from '@/lib/store'
import { format } from 'date-fns'
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

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
  info: { icon: Info, color: 'text-[var(--badge-blue-text)] bg-[var(--badge-blue-bg)]' },
  warning: { icon: AlertTriangle, color: 'text-[var(--badge-amber-text)] bg-[var(--badge-amber-bg)]' },
  success: { icon: CheckCircle2, color: 'text-[var(--badge-green-text)] bg-[var(--badge-green-bg)]' },
  error: { icon: XCircle, color: 'text-[var(--badge-red-text)] bg-[var(--badge-red-bg)]' },
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

  // Format: "class-detail:CLASS_ID" or "assignment-detail:ASSIGNMENT_ID"
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

  // Default to dashboard if link is just a page name
  return { page: 'dashboard' }
}

export default function NotificationsPage() {
  const { setPage } = useAppStore()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

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

  const handleNotificationClick = useCallback((n: Notification) => {
    if (!n.read) markAsRead(n.id)
    const target = parseNotificationLink(n.link)
    if (target) {
      setPage(target.page, target.params)
    }
  }, [markAsRead, setPage])

  const unreadCount = notifications.filter((n) => !n.read).length

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

  const groups = groupByTime(notifications)

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--glass-text)]">
            <span className="gradient-text">Notifikasi</span>
          </h1>
          <p className="text-[var(--glass-text-secondary)] text-sm mt-1">
            {unreadCount > 0 ? `${unreadCount} notifikasi belum dibaca` : 'Semua sudah dibaca'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn-glass flex items-center gap-2 text-sm">
            <CheckCheck className="w-4 h-4" /> Tandai Semua Dibaca
          </button>
        )}
      </div>

      {/* Groups */}
      <div className="space-y-6">
        {groups.map((group) => (
          <div key={group.label}>
            <h3 className="text-sm font-medium text-[var(--glass-text-muted)] mb-3">{group.label}</h3>
            <div className="space-y-2">
              <AnimatePresence>
                {group.items.map((n) => {
                  const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.info
                  const Icon = config.icon
                  const hasLink = !!n.link
                  return (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className={`interactive-card p-4 flex items-start gap-3 ${
                        !n.read ? 'border-l-2 border-l-purple-500' : ''
                      } ${hasLink ? 'cursor-pointer hover:bg-[var(--glass-hover-bg)]' : ''}`}
                      onClick={() => handleNotificationClick(n)}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${config.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium truncate ${!n.read ? 'text-[var(--glass-text)]' : 'text-[var(--glass-text-secondary)]'}`}>
                            {n.title}
                          </p>
                          {!n.read && <span className="status-dot status-dot-purple shrink-0" />}
                        </div>
                        <p className="text-xs text-[var(--glass-text-muted)] mt-0.5 line-clamp-2">{n.message}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-[var(--glass-text-muted)] flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(n.createdAt), 'HH:mm', { locale: localeId })}
                          </p>
                          {hasLink && (
                            <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                              Lihat detail →
                            </span>
                          )}
                        </div>
                      </div>
                      {!n.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            markAsRead(n.id)
                          }}
                          className="text-[var(--glass-text-muted)] hover:text-[var(--glass-text-secondary)] transition-colors shrink-0"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
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
    </div>
  )
}
