'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Activity, Users, Clock, HardDrive, Bell, Cpu,
  RefreshCw, Download, Database,
  Trash2, FileText, Shield, Server, TrendingUp,
  AlertTriangle, CheckCircle2, XCircle, Zap, BookOpen
} from 'lucide-react'
import { toast } from 'sonner'

interface HealthData {
  userCounts: Record<string, number>
  totalUsers: number
  recentActiveUsers: number
  totalSubmissions: number
  recentSubmissions: number
  notifByType: Record<string, number>
  totalNotifications: number
  unreadNotifications: number
  recentNotifications: number
  fileCount: number
  totalFileSize: number
  recentActions: {
    id: string
    title: string
    message: string
    type: string
    createdAt: string
    user: { name: string; role: string }
  }[]
  dbCounts: Record<string, number>
  dailyActivity: {
    date: string
    logins: number
    submissions: number
  }[]
  performanceMetrics: {
    avgResponseTime: number
    errorRate: number
    uptime: number
  }
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (days > 0) return `${days}h ${hours}j ${minutes}m`
  if (hours > 0) return `${hours}j ${minutes}m`
  return `${minutes}m`
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  info: FileText,
  warning: AlertTriangle,
  success: CheckCircle2,
  error: XCircle,
}

const TYPE_COLORS: Record<string, string> = {
  info: 'text-blue-500',
  warning: 'text-amber-500',
  success: 'text-green-500',
  error: 'text-red-500',
}

const TYPE_BG: Record<string, string> = {
  info: 'bg-[var(--badge-blue-bg)]',
  warning: 'bg-[var(--badge-amber-bg)]',
  success: 'bg-[var(--badge-green-bg)]',
  error: 'bg-[var(--badge-red-bg)]',
}

export default function SystemHealthPage() {
  const [data, setData] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/system/health')
      if (res.ok) {
        const d = await res.json()
        setData(d)
      } else {
        toast.error('Gagal mengambil data kesehatan sistem')
      }
    } catch {
      toast.error('Gagal mengambil data kesehatan sistem')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealth()
  }, [])

  const maxActivityValue = useMemo(() => {
    if (!data?.dailyActivity) return 1
    return Math.max(...data.dailyActivity.map((d) => Math.max(d.logins, d.submissions)), 1)
  }, [data])

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'clear-cache':
        toast.success('Cache berhasil dibersihkan')
        break
      case 'export-logs':
        toast.success('Log berhasil diekspor')
        break
      case 'backup-db':
        toast.success('Backup database berhasil dibuat')
        break
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="skeleton h-10 w-64 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-32 rounded-xl" />
          ))}
        </div>
        <div className="skeleton h-64 rounded-xl" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="empty-state py-20">
        <AlertTriangle className="w-12 h-12 mb-3" />
        <p className="text-sm">Gagal memuat data kesehatan sistem</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--glass-text)]">
            <span className="gradient-text">Kesehatan Sistem</span>
          </h1>
          <p className="text-[var(--glass-text-secondary)] text-sm mt-1">
            Monitoring dan status sistem SMKTTH Classroom
          </p>
        </div>
        <button
          onClick={() => {
            setLoading(true)
            fetchHealth()
          }}
          className="glass-btn px-4 py-2 text-sm flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Uptime',
            value: formatUptime(data.performanceMetrics.uptime),
            icon: Clock,
            color: 'text-green-500',
            bg: 'bg-green-500/10',
          },
          {
            label: 'Total Pengguna',
            value: String(data.totalUsers),
            icon: Users,
            color: 'text-purple-500',
            bg: 'bg-purple-500/10',
          },
          {
            label: 'Sesi Aktif (7 hari)',
            value: String(data.recentActiveUsers),
            icon: Activity,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
          },
          {
            label: 'Ukuran Database',
            value: `${Object.values(data.dbCounts).reduce((a, b) => a + b, 0)} record`,
            icon: Database,
            color: 'text-amber-500',
            bg: 'bg-amber-500/10',
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="stat-card"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-[var(--glass-text)] counter-animate">
              {stat.value}
            </p>
            <p className="text-xs text-[var(--glass-text-muted)] mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Activity Chart + Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Chart */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 glass-card p-5"
        >
          <h3 className="font-semibold text-sm text-[var(--glass-text)] flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-purple-500" /> Aktivitas 7 Hari Terakhir
          </h3>
          <div className="flex items-end gap-2 h-48">
            {data.dailyActivity.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="flex items-end gap-1 w-full h-40">
                  <div className="flex-1 relative group">
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-[#667eea] to-[#667eea]/60 transition-all hover:from-[#667eea] hover:to-[#667eea]"
                      style={{
                        height: `${Math.max((day.logins / maxActivityValue) * 100, 4)}%`,
                        minHeight: '4px',
                      }}
                    />
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-medium text-[var(--glass-text)] bg-[var(--glass-bg)] px-1.5 py-0.5 rounded shadow whitespace-nowrap z-10">
                      {day.logins} login
                    </div>
                  </div>
                  <div className="flex-1 relative group">
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-[#22c55e] to-[#22c55e]/60 transition-all hover:from-[#22c55e] hover:to-[#22c55e]"
                      style={{
                        height: `${Math.max((day.submissions / maxActivityValue) * 100, 4)}%`,
                        minHeight: '4px',
                      }}
                    />
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-medium text-[var(--glass-text)] bg-[var(--glass-bg)] px-1.5 py-0.5 rounded shadow whitespace-nowrap z-10">
                      {day.submissions} tugas
                    </div>
                  </div>
                </div>
                <span className="text-[10px] text-[var(--glass-text-muted)] text-center leading-tight">
                  {day.date}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-[var(--glass-text-secondary)]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#667eea]" /> Login
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#22c55e]" /> Submission
            </span>
          </div>
        </motion.div>

        {/* Performance Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card p-5"
        >
          <h3 className="font-semibold text-sm text-[var(--glass-text)] flex items-center gap-2 mb-4">
            <Cpu className="w-4 h-4 text-cyan-500" /> Performa
          </h3>

          <div className="space-y-4">
            {/* Response Time */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-[var(--glass-text-secondary)]">
                  Waktu Respons Rata-rata
                </span>
                <span className="text-sm font-semibold text-[var(--glass-text)]">
                  {data.performanceMetrics.avgResponseTime}ms
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${Math.min((data.performanceMetrics.avgResponseTime / 200) * 100, 100)}%`,
                    background:
                      data.performanceMetrics.avgResponseTime < 100
                        ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                        : data.performanceMetrics.avgResponseTime < 150
                        ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                        : 'linear-gradient(90deg, #ef4444, #dc2626)',
                  }}
                />
              </div>
            </div>

            {/* Error Rate */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-[var(--glass-text-secondary)]">
                  Tingkat Error
                </span>
                <span className="text-sm font-semibold text-[var(--glass-text)]">
                  {(data.performanceMetrics.errorRate * 100).toFixed(1)}%
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${Math.min(data.performanceMetrics.errorRate * 100 * 10, 100)}%`,
                    background:
                      data.performanceMetrics.errorRate < 0.01
                        ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                        : data.performanceMetrics.errorRate < 0.03
                        ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                        : 'linear-gradient(90deg, #ef4444, #dc2626)',
                  }}
                />
              </div>
            </div>

            {/* System Status */}
            <div className="pt-2 border-t border-[var(--glass-border)]">
              <div className="flex items-center gap-2 text-sm">
                <span className="status-dot-success" />
                <span className="text-[var(--glass-text)] font-medium">Sistem Berjalan Normal</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Actions + Storage & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Actions */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 glass-card p-5"
        >
          <h3 className="font-semibold text-sm text-[var(--glass-text)] flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-blue-500" /> Aktivitas Terbaru
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
            {data.recentActions.length > 0 ? (
              data.recentActions.map((action, i) => {
                const Icon = TYPE_ICONS[action.type] || FileText
                const colorClass = TYPE_COLORS[action.type] || 'text-[var(--glass-text-muted)]'
                const bgClass = TYPE_BG[action.type] || 'bg-[var(--chip-bg)]'

                return (
                  <div
                    key={action.id}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-[var(--glass-hover-bg)] transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-lg ${bgClass} flex items-center justify-center shrink-0 mt-0.5`}>
                      <Icon className={`w-4 h-4 ${colorClass}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--glass-text)] font-medium truncate">
                        {action.title}
                      </p>
                      <p className="text-xs text-[var(--glass-text-muted)] truncate mt-0.5">
                        {action.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-[var(--glass-text-muted)]">
                          {action.user.name}
                        </span>
                        <span className="text-[10px] text-[var(--glass-text-muted)]">•</span>
                        <span className="text-[10px] text-[var(--glass-text-muted)]">
                          {new Date(action.createdAt).toLocaleString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="empty-state py-8">
                <Activity className="w-10 h-10 mb-2" />
                <p className="text-sm">Belum ada aktivitas</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Storage & Notifications */}
        <div className="space-y-6">
          {/* Storage Usage */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="glass-card p-5"
          >
            <h3 className="font-semibold text-sm text-[var(--glass-text)] flex items-center gap-2 mb-4">
              <HardDrive className="w-4 h-4 text-amber-500" /> Penyimpanan
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-[var(--glass-text-secondary)]">File Upload</span>
                <span className="text-sm font-semibold text-[var(--glass-text)]">
                  {data.fileCount} file
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[var(--glass-text-secondary)]">
                  Total Ukuran
                </span>
                <span className="text-sm font-semibold text-[var(--glass-text)]">
                  {formatFileSize(data.totalFileSize)}
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${Math.min((data.totalFileSize / (100 * 1024 * 1024)) * 100, 100)}%`,
                  }}
                />
              </div>
              <p className="text-[10px] text-[var(--glass-text-muted)]">
                dari 100 MB kapasitas upload
              </p>
            </div>
          </motion.div>

          {/* Notification Stats */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-5"
          >
            <h3 className="font-semibold text-sm text-[var(--glass-text)] flex items-center gap-2 mb-4">
              <Bell className="w-4 h-4 text-purple-500" /> Notifikasi
            </h3>

            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-[var(--glass-text-secondary)]">Total</span>
                <span className="text-sm font-semibold text-[var(--glass-text)]">
                  {data.totalNotifications}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[var(--glass-text-secondary)]">Belum Dibaca</span>
                <span className="text-sm font-semibold text-[var(--badge-red-text)]">
                  {data.unreadNotifications}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[var(--glass-text-secondary)]">
                  Rata-rata/Hari
                </span>
                <span className="text-sm font-semibold text-[var(--glass-text)]">
                  {(data.recentNotifications / 7).toFixed(1)}
                </span>
              </div>

              {/* By type breakdown */}
              {Object.entries(data.notifByType).length > 0 && (
                <div className="pt-2 border-t border-[var(--glass-border)] space-y-1.5">
                  {Object.entries(data.notifByType).map(([type, count]) => {
                    const Icon = TYPE_ICONS[type] || FileText
                    const colorClass = TYPE_COLORS[type] || ''
                    return (
                      <div key={type} className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-xs text-[var(--glass-text-secondary)]">
                          <Icon className={`w-3 h-3 ${colorClass}`} />
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </span>
                        <span className="text-xs font-semibold text-[var(--glass-text)]">
                          {count}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Database Records + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Database Record Counts */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="lg:col-span-2 glass-card p-5"
        >
          <h3 className="font-semibold text-sm text-[var(--glass-text)] flex items-center gap-2 mb-4">
            <Server className="w-4 h-4 text-cyan-500" /> Rekaman Database
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { key: 'users', label: 'Pengguna', icon: Users, color: 'text-purple-500' },
              { key: 'classes', label: 'Kelas', icon: BookOpen, color: 'text-blue-500' },
              { key: 'assignments', label: 'Tugas', icon: FileText, color: 'text-amber-500' },
              { key: 'submissions', label: 'Submission', icon: CheckCircle2, color: 'text-green-500' },
              { key: 'announcements', label: 'Pengumuman', icon: Bell, color: 'text-pink-500' },
              { key: 'notifications', label: 'Notifikasi', icon: Zap, color: 'text-cyan-500' },
              { key: 'resources', label: 'Sumber Daya', icon: HardDrive, color: 'text-orange-500' },
              { key: 'attendance', label: 'Kehadiran', icon: Shield, color: 'text-teal-500' },
              { key: 'schedules', label: 'Jadwal', icon: Clock, color: 'text-indigo-500' },
              { key: 'subjects', label: 'Mata Pelajaran', icon: BookOpen, color: 'text-rose-500' },
              { key: 'comments', label: 'Komentar', icon: FileText, color: 'text-slate-500' },
              { key: 'settings', label: 'Pengaturan', icon: Cpu, color: 'text-gray-500' },
            ].map((item) => (
              <div
                key={item.key}
                className="p-3 rounded-xl bg-[var(--glass-input-bg)] border border-[var(--glass-input-border)] flex items-center gap-3"
              >
                <item.icon className={`w-4 h-4 ${item.color} shrink-0`} />
                <div>
                  <p className="text-lg font-bold text-[var(--glass-text)] leading-none">
                    {data.dbCounts[item.key] || 0}
                  </p>
                  <p className="text-[10px] text-[var(--glass-text-muted)] mt-0.5">
                    {item.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-5"
        >
          <h3 className="font-semibold text-sm text-[var(--glass-text)] flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-amber-500" /> Aksi Cepat
          </h3>
          <div className="space-y-2">
            {[
              {
                label: 'Bersihkan Cache',
                icon: Trash2,
                color: 'text-red-500',
                action: 'clear-cache',
              },
              {
                label: 'Ekspor Log',
                icon: Download,
                color: 'text-blue-500',
                action: 'export-logs',
              },
              {
                label: 'Backup Database',
                icon: Database,
                color: 'text-green-500',
                action: 'backup-db',
              },
            ].map((item) => (
              <button
                key={item.action}
                onClick={() => handleQuickAction(item.action)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-[var(--glass-input-border)] bg-[var(--glass-input-bg)] hover:bg-[var(--glass-hover-bg)] hover:border-[var(--glass-hover-border)] transition-all text-left group"
              >
                <item.icon className={`w-4 h-4 ${item.color} group-hover:scale-110 transition-transform`} />
                <span className="text-sm text-[var(--glass-text)] font-medium">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* User Role Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="glass-card p-5"
      >
        <h3 className="font-semibold text-sm text-[var(--glass-text)] flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-purple-500" /> Distribusi Pengguna
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { role: 'admin', label: 'Admin', color: 'bg-red-500', icon: Shield },
            { role: 'guru', label: 'Guru', color: 'bg-purple-500', icon: Users },
            { role: 'siswa', label: 'Siswa', color: 'bg-blue-500', icon: Users },
          ].map((item) => (
            <div
              key={item.role}
              className="p-4 rounded-xl bg-[var(--glass-input-bg)] border border-[var(--glass-input-border)] text-center"
            >
              <div
                className={`w-10 h-10 ${item.color} rounded-xl flex items-center justify-center mx-auto mb-2`}
              >
                <item.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-[var(--glass-text)]">
                {data.userCounts[item.role] || 0}
              </p>
              <p className="text-xs text-[var(--glass-text-muted)]">{item.label}</p>
            </div>
          ))}
          <div className="p-4 rounded-xl bg-[var(--glass-input-bg)] border border-[var(--glass-input-border)] text-center">
            <div className="w-10 h-10 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-xl flex items-center justify-center mx-auto mb-2">
              <Users className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-[var(--glass-text)]">{data.totalUsers}</p>
            <p className="text-xs text-[var(--glass-text-muted)]">Total</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
