'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, CheckCircle2, Clock, AlertCircle, Star,
  Search, ArrowUpRight, Filter, ArrowUpDown, BookOpen,
  TrendingUp, Award, BarChart3, Download
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale/id'
import { toast } from 'sonner'

interface Submission {
  id: string
  status: string
  grade?: number | null
  feedback?: string | null
  submittedAt: string
  assignment: {
    id: string
    title: string
    type: string
    points: number
    dueDate: string
    class: { id: string; name: string }
  }
}

type SortOption = 'date-desc' | 'date-asc' | 'grade-desc' | 'grade-asc' | 'name-asc' | 'name-desc'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType; dot: string; bg: string }> = {
  submitted: { label: 'Terkumpul', color: 'text-[var(--badge-blue-text)] bg-[var(--badge-blue-bg)]', icon: Clock, dot: 'status-dot-info', bg: 'from-blue-500/20 to-cyan-500/20' },
  graded: { label: 'Dinilai', color: 'text-[var(--badge-green-text)] bg-[var(--badge-green-bg)]', icon: CheckCircle2, dot: 'status-dot-success', bg: 'from-emerald-500/20 to-green-500/20' },
  late: { label: 'Terlambat', color: 'text-[var(--badge-amber-text)] bg-[var(--badge-amber-bg)]', icon: AlertCircle, dot: 'status-dot-warning', bg: 'from-amber-500/20 to-orange-500/20' },
  draft: { label: 'Draft', color: 'text-[var(--glass-text-secondary)] bg-[var(--chip-bg)]', icon: FileText, dot: 'status-dot-purple', bg: 'from-purple-500/20 to-violet-500/20' },
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'date-desc', label: 'Terbaru' },
  { value: 'date-asc', label: 'Terlama' },
  { value: 'grade-desc', label: 'Nilai Tertinggi' },
  { value: 'grade-asc', label: 'Nilai Terendah' },
  { value: 'name-asc', label: 'Nama A-Z' },
  { value: 'name-desc', label: 'Nama Z-A' },
]

export default function MySubmissionsPage() {
  const { user, setPage } = useAppStore()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [classFilter, setClassFilter] = useState('all')
  const [sortBy, setSortBy] = useState<SortOption>('date-desc')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const res = await fetch('/api/submissions')
        if (res.ok) {
          setSubmissions(await res.json())
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchSubmissions()
  }, [])

  // Extract unique classes from submissions
  const classOptions = useMemo(() => {
    const classes = new Map<string, string>()
    submissions.forEach((s) => {
      if (s.assignment?.class?.id && s.assignment?.class?.name) {
        classes.set(s.assignment.class.id, s.assignment.class.name)
      }
    })
    return Array.from(classes.entries()).sort((a, b) => a[1].localeCompare(b[1]))
  }, [submissions])

  // Compute stats
  const stats = useMemo(() => {
    const total = submissions.length
    const graded = submissions.filter((s) => s.status === 'graded')
    const gradedCount = graded.length
    const pendingCount = submissions.filter((s) => s.status === 'submitted').length
    const lateCount = submissions.filter((s) => s.status === 'late').length

    // Calculate average grade (only for graded submissions with valid grades)
    const validGrades = graded
      .map((s) => s.grade)
      .filter((g): g is number => g !== null && g !== undefined && Number.isFinite(g))
    const avgGrade = validGrades.length > 0
      ? validGrades.reduce((sum, g) => sum + g, 0) / validGrades.length
      : 0
    const avgPercentage = validGrades.length > 0
      ? Math.round(avgGrade)
      : 0

    return { total, gradedCount, pendingCount, lateCount, avgGrade: avgPercentage }
  }, [submissions])

  // Filter and sort submissions
  const filtered = useMemo(() => {
    let result = submissions.filter((s) => {
      const matchSearch = s.assignment.title.toLowerCase().includes(search.toLowerCase()) ||
        s.assignment.class.name.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || s.status === statusFilter
      const matchClass = classFilter === 'all' || s.assignment.class.id === classFilter
      return matchSearch && matchStatus && matchClass
    })

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
        case 'date-asc':
          return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
        case 'grade-desc':
          return (b.grade ?? -1) - (a.grade ?? -1)
        case 'grade-asc':
          return (a.grade ?? Infinity) - (b.grade ?? Infinity)
        case 'name-asc':
          return a.assignment.title.localeCompare(b.assignment.title)
        case 'name-desc':
          return b.assignment.title.localeCompare(a.assignment.title)
        default:
          return 0
      }
    })

    return result
  }, [submissions, search, statusFilter, classFilter, sortBy])

  const gradeColor = (grade: number, points: number) => {
    const safeGrade = Number.isFinite(grade) ? grade : 0
    const safePoints = Number.isFinite(points) ? points : 100
    const pct = (safeGrade / safePoints) * 100
    if (pct >= 80) return 'text-emerald-600 dark:text-emerald-400'
    if (pct >= 60) return 'text-amber-600 dark:text-amber-400'
    return 'text-red-600 dark:text-red-400'
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="skeleton h-10 w-48 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="stat-card"><div className="skeleton h-20 rounded" /></div>
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="glass-card p-4"><div className="skeleton h-16 rounded" /></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--glass-text)]">
            <span className="gradient-text">Submissions</span> Saya
          </h1>
          <p className="text-[var(--glass-text-secondary)] text-sm mt-1">Riwayat pengumpulan tugas</p>
        </div>
        <button
          onClick={async () => {
            try {
              const res = await fetch('/api/submissions/export' + (classFilter !== 'all' ? `?classId=${classFilter}` : ''))
              if (res.ok) {
                const blob = await res.blob()
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = 'nilai-submissions.csv'
                a.click()
                URL.revokeObjectURL(url)
                toast.success('Data nilai berhasil diekspor')
              } else { toast.error('Gagal mengekspor') }
            } catch { toast.error('Terjadi kesalahan') }
          }}
          className="btn-glass flex items-center gap-2 text-sm shrink-0 font-semibold"
        >
          <Download className="w-4 h-4" /> Export
        </button>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="stat-card p-4 md:p-5"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[var(--glass-text-secondary)] text-xs">Total</p>
              <p className="text-2xl font-bold text-[var(--glass-text)] mt-1">{stats.total}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[var(--badge-blue-bg)] flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-[var(--badge-blue-text)]" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="stat-card p-4 md:p-5"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[var(--glass-text-secondary)] text-xs">Dinilai</p>
              <p className="text-2xl font-bold text-[var(--badge-green-text)] mt-1">{stats.gradedCount}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[var(--badge-green-bg)] flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-[var(--badge-green-text)]" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="stat-card p-4 md:p-5"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[var(--glass-text-secondary)] text-xs">Rata-rata Nilai</p>
              <p className="text-2xl font-bold text-[var(--glass-text)] mt-1">{stats.avgGrade}</p>
            </div>
            <div className="relative w-10 h-10">
              <svg width="40" height="40" className="transform -rotate-90">
                <circle cx="20" cy="20" r="16" stroke="var(--glass-input-bg)" strokeWidth="3" fill="none" />
                <circle
                  cx="20" cy="20" r="16"
                  stroke={stats.avgGrade >= 80 ? '#22c55e' : stats.avgGrade >= 60 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${(stats.avgGrade / 100) * 100.53} 100.53`}
                  className="transition-all duration-700"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-[var(--glass-text)]">
                {stats.avgGrade}%
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="stat-card p-4 md:p-5"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[var(--glass-text-secondary)] text-xs">Menunggu</p>
              <p className="text-2xl font-bold text-[var(--badge-amber-text)] mt-1">{stats.pendingCount}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[var(--badge-amber-bg)] flex items-center justify-center">
              <Clock className="w-5 h-5 text-[var(--badge-amber-text)]" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--glass-text-muted)]" />
            <input
              type="text"
              placeholder="Cari tugas atau kelas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="glass-input pl-10"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--glass-text-muted)] hover:text-[var(--glass-text)]"
              >
                ✕
              </button>
            )}
          </div>

          {/* Toggle filters */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`glass-btn flex items-center gap-2 text-sm ${showFilters ? 'bg-[var(--badge-purple-bg)] text-[var(--badge-purple-text)] border-[var(--badge-purple-bg)]' : ''}`}
          >
            <Filter className="w-4 h-4" /> Filter
          </button>

          {/* Sort */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="glass-input styled-select pr-8 text-sm cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--glass-text-muted)] pointer-events-none" />
          </div>
        </div>

        {/* Expanded filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-3 border-t border-[var(--glass-border)] space-y-3">
                {/* Status filter */}
                <div>
                  <p className="text-xs text-[var(--glass-text-muted)] mb-2 font-medium">Status</p>
                  <div className="flex flex-wrap gap-2">
                    {['all', 'submitted', 'graded', 'late'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          statusFilter === status
                            ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-sm'
                            : 'glass-btn text-[var(--glass-text-secondary)]'
                        }`}
                      >
                        {status === 'all' ? 'Semua' : STATUS_CONFIG[status]?.label || status}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Class filter */}
                {classOptions.length > 0 && (
                  <div>
                    <p className="text-xs text-[var(--glass-text-muted)] mb-2 font-medium">Kelas</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setClassFilter('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          classFilter === 'all'
                            ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-sm'
                            : 'glass-btn text-[var(--glass-text-secondary)]'
                        }`}
                      >
                        Semua Kelas
                      </button>
                      {classOptions.map(([id, name]) => (
                        <button
                          key={id}
                          onClick={() => setClassFilter(id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            classFilter === id
                              ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-sm'
                              : 'glass-btn text-[var(--glass-text-secondary)]'
                          }`}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active filters summary */}
        {(statusFilter !== 'all' || classFilter !== 'all' || search) && (
          <div className="flex items-center gap-2 pt-2 border-t border-[var(--glass-border)]">
            <span className="text-xs text-[var(--glass-text-muted)]">Filter aktif:</span>
            {statusFilter !== 'all' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--badge-purple-bg)] text-[var(--badge-purple-text)]">
                {STATUS_CONFIG[statusFilter]?.label}
              </span>
            )}
            {classFilter !== 'all' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--badge-blue-bg)] text-[var(--badge-blue-text)]">
                {classOptions.find(([id]) => id === classFilter)?.[1]}
              </span>
            )}
            {search && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--badge-amber-bg)] text-[var(--badge-amber-text)]">
                &ldquo;{search}&rdquo;
              </span>
            )}
            <button
              onClick={() => { setStatusFilter('all'); setClassFilter('all'); setSearch('') }}
              className="text-xs text-[var(--badge-red-text)] hover:underline ml-1"
            >
              Hapus semua
            </button>
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--glass-text-muted)]">
          Menampilkan {filtered.length} dari {submissions.length} submission
        </p>
      </div>

      {/* Submissions List */}
      <div className="space-y-3">
        <AnimatePresence>
          {filtered.map((sub, idx) => {
            const config = STATUS_CONFIG[sub.status] || STATUS_CONFIG.submitted
            const gradePct = sub.grade !== null && sub.grade !== undefined && Number.isFinite(sub.grade)
              ? Math.round((sub.grade / sub.assignment.points) * 100)
              : null

            return (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.03 }}
                className="interactive-card p-5 md:p-6"
                onClick={() => setPage('assignment-detail', { id: sub.assignment.id })}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={config.dot} />
                      <p className="text-sm font-medium text-[var(--glass-text)] truncate">{sub.assignment.title}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <BookOpen className="w-3 h-3 text-[var(--glass-text-muted)]" />
                      <p className="text-xs text-[var(--glass-text-muted)]">{sub.assignment.class.name}</p>
                      <span className="text-[var(--glass-text-muted)] text-xs">•</span>
                      <span className="text-xs text-[var(--glass-text-muted)] uppercase">{sub.assignment.type}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Grade badge */}
                    {sub.status === 'graded' && sub.grade !== null && sub.grade !== undefined && Number.isFinite(sub.grade) && (
                      <div className={`text-sm font-bold ${gradeColor(sub.grade, sub.assignment.points)}`}>
                        {Math.round(sub.grade)}/{sub.assignment.points}
                      </div>
                    )}
                    <span className={`text-xs px-2 py-1 rounded-full ${config.color} font-medium`}>
                      {config.label}
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-[var(--glass-text-muted)]" />
                  </div>
                </div>

                {/* Progress bar for graded submissions */}
                {sub.status === 'graded' && gradePct !== null && (
                  <div className="mt-3">
                    <div className="progress-bar h-1.5">
                      <motion.div
                        className="progress-bar-fill h-1.5 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${gradePct}%` }}
                        transition={{ duration: 0.6, delay: idx * 0.03 }}
                        style={{
                          background: gradePct >= 80
                            ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                            : gradePct >= 60
                            ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                            : 'linear-gradient(90deg, #ef4444, #dc2626)',
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 mt-2 text-xs text-[var(--glass-text-muted)]">
                  <span className="flex items-center gap-1">
                    <config.icon className="w-3 h-3" />
                    {format(new Date(sub.submittedAt), 'dd MMM yyyy', { locale: localeId })}
                  </span>
                </div>

                {sub.feedback && (
                  <p className="text-xs text-[var(--glass-text-muted)] mt-2 border-t border-[var(--glass-border)] pt-2">
                    💬 {sub.feedback}
                  </p>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filtered.length === 0 && !loading && (
        <div className="glass-card p-8 md:p-12">
          <div className="empty-state py-8">
            <FileText className="w-16 h-16 mb-4 text-[var(--glass-text-muted)]" />
            <h3 className="text-lg font-semibold text-[var(--glass-text)] mb-2">Tidak ada submission</h3>
            <p className="text-[var(--glass-text-muted)] text-sm mb-4">
              {search || statusFilter !== 'all' || classFilter !== 'all' ? 'Coba filter lain' : 'Mulai kumpulkan tugas dari kelas Anda'}
            </p>
            {(search || statusFilter !== 'all' || classFilter !== 'all') && (
              <button
                onClick={() => { setStatusFilter('all'); setClassFilter('all'); setSearch('') }}
                className="btn-glass text-sm"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
