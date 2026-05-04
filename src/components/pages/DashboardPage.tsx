'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  BookOpen, Users, FileText, Bell, Clock, TrendingUp,
  AlertTriangle, CheckCircle2, Calendar, ArrowRight, Plus
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale/id'

interface DashboardData {
  stats: {
    totalClasses: number
    totalAssignments: number
    totalSubmissions: number
    pendingGrading?: number
    pendingSubmissions?: number
  }
  announcements: Array<{
    id: string
    title: string
    content: string
    priority: string
    createdAt: string
    className: string
    creator: { name: string }
  }>
  assignments: Array<{
    id: string
    title: string
    dueDate: string
    type: string
    status: string
    points: number
    className: string
  }>
}

function AnimatedCounter({ target, duration = 1500 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let start = 0
    const increment = target / (duration / 16)
    const timer = setInterval(() => {
      start += increment
      if (start >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration])
  return <span>{count}</span>
}

export default function DashboardPage() {
  const { user, setPage, setSidebarOpen } = useAppStore()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/dashboard')
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const greeting = useCallback(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Selamat Pagi'
    if (hour < 15) return 'Selamat Siang'
    if (hour < 18) return 'Selamat Sore'
    return 'Selamat Malam'
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="skeleton h-12 w-64 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="stat-card">
              <div className="skeleton h-5 w-20 rounded mb-3" />
              <div className="skeleton h-8 w-16 rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6"><div className="skeleton h-64 rounded" /></div>
          <div className="glass-card p-6"><div className="skeleton h-64 rounded" /></div>
        </div>
      </div>
    )
  }

  const isGuru = user?.role === 'guru' || user?.role === 'admin'

  const statCards = [
    { icon: BookOpen, label: 'Total Kelas', value: data?.stats.totalClasses || 0, color: 'from-blue-500 to-cyan-500', shadowColor: 'shadow-blue-500/20' },
    { icon: FileText, label: 'Tugas Aktif', value: data?.stats.totalAssignments || 0, color: 'from-purple-500 to-pink-500', shadowColor: 'shadow-purple-500/20' },
    ...(isGuru
      ? [{ icon: Clock, label: 'Perlu Dinilai', value: data?.stats.pendingGrading || 0, color: 'from-amber-500 to-orange-500', shadowColor: 'shadow-amber-500/20' }]
      : [{ icon: TrendingUp, label: 'Tugas Terkumpul', value: data?.stats.totalSubmissions || 0, color: 'from-emerald-500 to-green-500', shadowColor: 'shadow-emerald-500/20' }]
    ),
    { icon: Users, label: 'Pengumuman', value: data?.announcements?.length || 0, color: 'from-rose-500 to-pink-500', shadowColor: 'shadow-rose-500/20' },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Greeting Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--glass-text)]">
            {greeting()}, <span className="gradient-text">{user?.name || 'Pengguna'}</span> 👋
          </h1>
          <p className="text-[var(--glass-text-secondary)] mt-1">
            {format(new Date(), 'EEEE, dd MMMM yyyy', { locale: localeId })}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setPage('classes')} className="btn-glass flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Kelas Baru
          </button>
        </div>
      </motion.div>

      {/* Alert Banners */}
      {isGuru && (data?.stats.pendingGrading || 0) > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-4 flex items-center gap-3 border-[var(--alert-amber-border)] bg-[var(--alert-amber-bg)]"
        >
          <AlertTriangle className="w-5 h-5 text-[var(--alert-amber-icon)] shrink-0" />
          <div className="flex-1">
            <p className="text-[var(--alert-amber-text)] font-medium text-sm">{data?.stats.pendingGrading} tugas menunggu penilaian</p>
            <p className="text-[var(--alert-amber-text-muted)] text-xs">Segera berikan nilai kepada siswa</p>
          </div>
          <button onClick={() => setPage('my-submissions')} className="text-[var(--alert-amber-icon)] hover:text-[var(--alert-amber-text)] text-sm font-medium">
            Lihat →
          </button>
        </motion.div>
      )}

      {!isGuru && (data?.stats.pendingSubmissions || 0) > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-4 flex items-center gap-3 border-[var(--alert-blue-border)] bg-[var(--alert-blue-bg)]"
        >
          <Clock className="w-5 h-5 text-[var(--alert-blue-icon)] shrink-0" />
          <div className="flex-1">
            <p className="text-[var(--alert-blue-text)] font-medium text-sm">{data?.stats.pendingSubmissions} tugas belum dikumpulkan</p>
            <p className="text-[var(--alert-blue-text-muted)] text-xs">Periksa deadline tugas Anda</p>
          </div>
          <button onClick={() => setPage('classes')} className="text-[var(--alert-blue-icon)] hover:text-[var(--alert-blue-text)] text-sm font-medium">
            Lihat →
          </button>
        </motion.div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="stat-card group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg ${stat.shadowColor}`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <CheckCircle2 className="w-4 h-4 text-[var(--glass-text-muted)] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
            </div>
            <p className="text-[var(--glass-text-secondary)] text-sm">{stat.label}</p>
            <p className="text-2xl font-bold text-[var(--glass-text)] mt-1">
              <AnimatedCounter target={stat.value} />
            </p>
          </motion.div>
        ))}
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Announcements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--glass-text)] flex items-center gap-2">
              <Bell className="w-5 h-5 text-purple-600 dark:text-purple-400" /> Pengumuman Terbaru
            </h2>
            <button onClick={() => setPage('discussions')} className="text-[var(--glass-text-muted)] hover:text-[var(--glass-text-secondary)] text-sm transition-colors">
              Lihat semua →
            </button>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
            {data?.announcements && data.announcements.length > 0 ? (
              data.announcements.slice(0, 5).map((ann) => (
                <div key={ann.id} className="interactive-card p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {ann.priority === 'high' && <span className="status-dot status-dot-danger" />}
                        <p className="text-sm font-medium text-[var(--glass-text)] truncate">{ann.title}</p>
                      </div>
                      <p className="text-xs text-[var(--glass-text-muted)] mt-1 truncate">{ann.className}</p>
                    </div>
                    <span className="text-xs text-[var(--glass-text-muted)] ml-2 shrink-0">
                      {format(new Date(ann.createdAt), 'dd MMM', { locale: localeId })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state py-8">
                <Bell className="w-10 h-10 mb-2" />
                <p className="text-sm">Belum ada pengumuman</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Upcoming Assignments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--glass-text)] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Tugas Mendatang
            </h2>
            <button onClick={() => setPage('my-submissions')} className="text-[var(--glass-text-muted)] hover:text-[var(--glass-text-secondary)] text-sm transition-colors">
              Lihat semua →
            </button>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
            {data?.assignments && data.assignments.length > 0 ? (
              data.assignments.slice(0, 5).map((assignment) => {
                const typeColor: Record<string, string> = {
                  tugas: 'bg-[var(--badge-blue-bg)] text-[var(--badge-blue-text)]',
                  ujian: 'bg-[var(--badge-red-bg)] text-[var(--badge-red-text)]',
                  kuis: 'bg-[var(--badge-amber-bg)] text-[var(--badge-amber-text)]',
                  TUGAS: 'bg-[var(--badge-blue-bg)] text-[var(--badge-blue-text)]',
                  UJIAN: 'bg-[var(--badge-red-bg)] text-[var(--badge-red-text)]',
                  KUIS: 'bg-[var(--badge-amber-bg)] text-[var(--badge-amber-text)]',
                }
                return (
                  <div
                    key={assignment.id}
                    className="interactive-card p-3"
                    onClick={() => {
                      setPage('assignment-detail', { id: assignment.id })
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--glass-text)] truncate">{assignment.title}</p>
                        <p className="text-xs text-[var(--glass-text-muted)] mt-1">{assignment.className}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-2 shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${(typeColor[assignment.type] || typeColor.tugas)}`}>
                          {assignment.type.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-[var(--glass-text-muted)] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(assignment.dueDate), 'dd MMM yyyy', { locale: localeId })}
                      </span>
                      <span className="text-xs text-[var(--glass-text-muted)]">{assignment.points} poin</span>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="empty-state py-8">
                <FileText className="w-10 h-10 mb-2" />
                <p className="text-sm">Tidak ada tugas mendatang</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card p-6"
      >
        <h2 className="text-lg font-semibold text-[var(--glass-text)] mb-4">Aksi Cepat</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: BookOpen, label: 'Kelas Saya', page: 'classes' as const, color: 'from-blue-500 to-cyan-500' },
            { icon: FileText, label: 'Tugas', page: 'my-submissions' as const, color: 'from-purple-500 to-pink-500' },
            { icon: Calendar, label: 'Kalender', page: 'calendar' as const, color: 'from-amber-500 to-orange-500' },
            { icon: Users, label: 'Diskusi', page: 'discussions' as const, color: 'from-emerald-500 to-green-500' },
          ].map((action) => (
            <button
              key={action.label}
              onClick={() => setPage(action.page)}
              className="interactive-card p-4 text-center group"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mx-auto mb-2 shadow-lg group-hover:scale-110 transition-transform`}>
                <action.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm text-[var(--glass-text-secondary)] group-hover:text-[var(--glass-text)] transition-colors">{action.label}</p>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
