'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  BookOpen, Users, FileText, Bell, Clock, TrendingUp,
  AlertTriangle, CheckCircle2, Calendar, ArrowRight, Plus,
  Sparkles, Target, Award, ClipboardList
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

function CircularProgress({ value, max, size = 56, strokeWidth = 4 }: { value: number; max: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const percentage = max > 0 ? (value / max) * 100 : 0
  const offset = circumference - (percentage / 100) * circumference

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="var(--glass-input-bg)"
        strokeWidth={strokeWidth}
        fill="none"
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="url(#progressGradient)"
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.5 }}
      />
      <defs>
        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#667eea" />
          <stop offset="100%" stopColor="#764ba2" />
        </linearGradient>
      </defs>
    </svg>
  )
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

  const getGreetingEmoji = useCallback(() => {
    const hour = new Date().getHours()
    if (hour < 12) return '🌅'
    if (hour < 15) return '☀️'
    if (hour < 18) return '🌇'
    return '🌙'
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="skeleton h-32 w-full rounded-xl" />
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

  const completionRate = (() => {
    const total = data?.stats.totalAssignments || 0
    const submitted = data?.stats.totalSubmissions || 0
    if (total === 0) return 0
    if (isGuru) {
      // For guru: show grading progress
      const pending = data?.stats.pendingGrading || 0
      const graded = submitted - pending
      return submitted > 0 ? Math.round((graded / submitted) * 100) : 0
    }
    // For student: show submission progress
    return Math.round((submitted / total) * 100)
  })()

  const statCards = [
    { icon: BookOpen, label: 'Total Kelas', value: data?.stats.totalClasses || 0, color: 'from-blue-500 to-cyan-500', shadowColor: 'shadow-blue-500/20', bgColor: 'bg-[var(--badge-blue-bg)]', textColor: 'text-[var(--badge-blue-text)]' },
    { icon: FileText, label: 'Tugas Aktif', value: data?.stats.totalAssignments || 0, color: 'from-purple-500 to-pink-500', shadowColor: 'shadow-purple-500/20', bgColor: 'bg-[var(--badge-purple-bg)]', textColor: 'text-[var(--badge-purple-text)]' },
    ...(isGuru
      ? [{ icon: ClipboardList, label: 'Submissions Masuk', value: data?.stats.totalSubmissions || 0, color: 'from-amber-500 to-orange-500', shadowColor: 'shadow-amber-500/20', bgColor: 'bg-[var(--badge-amber-bg)]', textColor: 'text-[var(--badge-amber-text)]' }]
      : [{ icon: CheckCircle2, label: 'Tugas Selesai', value: data?.stats.totalSubmissions || 0, color: 'from-emerald-500 to-green-500', shadowColor: 'shadow-emerald-500/20', bgColor: 'bg-[var(--badge-green-bg)]', textColor: 'text-[var(--badge-green-text)]' }]
    ),
    { icon: Bell, label: 'Pengumuman', value: data?.announcements?.length || 0, color: 'from-rose-500 to-pink-500', shadowColor: 'shadow-rose-500/20', bgColor: 'bg-[var(--badge-red-bg)]', textColor: 'text-[var(--badge-red-text)]' },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="welcome-banner"
      >
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-white/80" />
              <span className="text-white/70 text-sm font-medium">{getGreetingEmoji()} {greeting()}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              {user?.name || 'Pengguna'} 👋
            </h1>
            <p className="text-white/70 text-sm mt-1">
              {format(new Date(), 'EEEE, dd MMMM yyyy', { locale: localeId })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Progress Circle */}
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
              <div className="relative">
                <CircularProgress
                  value={isGuru ? (data?.stats.totalSubmissions || 0) - (data?.stats.pendingGrading || 0) : data?.stats.totalSubmissions || 0}
                  max={isGuru ? (data?.stats.totalSubmissions || 1) : data?.stats.totalAssignments || 1}
                  size={48}
                  strokeWidth={4}
                />
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                  {completionRate}%
                </span>
              </div>
              <div>
                <p className="text-white/90 text-sm font-medium">
                  {isGuru ? 'Progres Penilaian' : 'Progres Tugas'}
                </p>
                <p className="text-white/60 text-xs">
                  {isGuru
                    ? `${(data?.stats.totalSubmissions || 0) - (data?.stats.pendingGrading || 0)} dinilai dari ${data?.stats.totalSubmissions || 0}`
                    : `${data?.stats.totalSubmissions || 0} selesai dari ${data?.stats.totalAssignments || 0}`
                  }
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {isGuru && (
                <button onClick={() => setPage('classes')} className="bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all hover:scale-105 active:scale-95">
                  <Plus className="w-4 h-4" /> Kelas Baru
                </button>
              )}
            </div>
          </div>
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
          <button onClick={() => setPage('my-submissions')} className="text-[var(--alert-amber-icon)] hover:text-[var(--alert-amber-text)] text-sm font-medium transition-colors">
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
          <button onClick={() => setPage('classes')} className="text-[var(--alert-blue-icon)] hover:text-[var(--alert-blue-text)] text-sm font-medium transition-colors">
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
            className="glass-card-glow p-5 group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg ${stat.shadowColor} group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <ArrowRight className="w-4 h-4 text-[var(--glass-text-muted)] group-hover:text-[var(--glass-text-secondary)] group-hover:translate-x-1 transition-all duration-300" />
            </div>
            <p className="text-[var(--glass-text-secondary)] text-sm">{stat.label}</p>
            <p className="text-2xl font-bold text-[var(--glass-text)] mt-1">
              <AnimatedCounter target={stat.value} />
            </p>
            <div className="mt-3">
              <div className="progress-bar">
                <motion.div
                  className="progress-bar-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((stat.value / Math.max(stat.value, 1)) * 100, 100)}%` }}
                  transition={{ duration: 0.8, delay: idx * 0.1 + 0.3 }}
                  style={{ background: `linear-gradient(90deg, var(--subject-color, #667eea), var(--subject-color, #764ba2))` }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Student Progress Bar (only for students) */}
      {!isGuru && (data?.stats.totalAssignments || 0) > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-[var(--badge-purple-text)]" />
              <h3 className="text-sm font-semibold text-[var(--glass-text)]">Progres Penyelesaian Tugas</h3>
            </div>
            <span className={`text-sm font-bold ${completionRate >= 75 ? 'text-[var(--badge-green-text)]' : completionRate >= 50 ? 'text-[var(--badge-amber-text)]' : 'text-[var(--badge-red-text)]'}`}>
              {completionRate}%
            </span>
          </div>
          <div className="progress-bar h-3 rounded-full">
            <motion.div
              className="progress-bar-fill rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${completionRate}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.6 }}
              style={{
                background: completionRate >= 75
                  ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                  : completionRate >= 50
                  ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                  : 'linear-gradient(90deg, #ef4444, #dc2626)'
              }}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-[var(--glass-text-muted)]">
              {data?.stats.totalSubmissions || 0} dari {data?.stats.totalAssignments || 0} tugas selesai
            </p>
            {completionRate < 50 && (
              <p className="text-xs text-[var(--badge-amber-text)] flex items-center gap-1">
                <Award className="w-3 h-3" /> Ayo tingkatkan!
              </p>
            )}
            {completionRate >= 75 && (
              <p className="text-xs text-[var(--badge-green-text)] flex items-center gap-1">
                <Award className="w-3 h-3" /> Hebat!
              </p>
            )}
          </div>
        </motion.div>
      )}

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
            <button onClick={() => setPage('discussions')} className="text-[var(--glass-text-muted)] hover:text-[var(--glass-text-secondary)] text-sm transition-colors flex items-center gap-1">
              Lihat semua <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
            {data?.announcements && data.announcements.length > 0 ? (
              data.announcements.slice(0, 5).map((ann, idx) => (
                <motion.div
                  key={ann.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="interactive-card p-3"
                >
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
                </motion.div>
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
            <button onClick={() => setPage('my-submissions')} className="text-[var(--glass-text-muted)] hover:text-[var(--glass-text-secondary)] text-sm transition-colors flex items-center gap-1">
              Lihat semua <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
            {data?.assignments && data.assignments.length > 0 ? (
              data.assignments.slice(0, 5).map((assignment, idx) => {
                const typeColor: Record<string, string> = {
                  tugas: 'bg-[var(--badge-blue-bg)] text-[var(--badge-blue-text)]',
                  ujian: 'bg-[var(--badge-red-bg)] text-[var(--badge-red-text)]',
                  kuis: 'bg-[var(--badge-amber-bg)] text-[var(--badge-amber-text)]',
                  TUGAS: 'bg-[var(--badge-blue-bg)] text-[var(--badge-blue-text)]',
                  UJIAN: 'bg-[var(--badge-red-bg)] text-[var(--badge-red-text)]',
                  KUIS: 'bg-[var(--badge-amber-bg)] text-[var(--badge-amber-text)]',
                }
                const dueDate = new Date(assignment.dueDate)
                const now = new Date()
                const diffMs = dueDate.getTime() - now.getTime()
                const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
                const isUrgent = diffDays >= 0 && diffDays <= 2
                const isOverdue = diffDays < 0

                return (
                  <motion.div
                    key={assignment.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
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
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-[var(--glass-text-muted)] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(dueDate, 'dd MMM yyyy', { locale: localeId })}
                      </span>
                      {isOverdue ? (
                        <span className="text-xs text-[var(--badge-red-text)] bg-[var(--badge-red-bg)] px-2 py-0.5 rounded-full font-medium">
                          Terlambat
                        </span>
                      ) : isUrgent ? (
                        <span className="text-xs text-[var(--badge-amber-text)] bg-[var(--badge-amber-bg)] px-2 py-0.5 rounded-full font-medium countdown-urgent">
                          {diffDays === 0 ? 'Hari ini!' : `${diffDays} hari lagi`}
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--glass-text-muted)]">{assignment.points} poin</span>
                      )}
                    </div>
                  </motion.div>
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
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mx-auto mb-2 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
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
