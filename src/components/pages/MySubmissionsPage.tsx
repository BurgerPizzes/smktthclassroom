'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, CheckCircle2, Clock, AlertCircle, Star,
  Filter, Search, ArrowUpRight
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale/id'

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
    class: { name: string }
  }
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType; dot: string }> = {
  submitted: { label: 'Terkumpul', color: 'text-[var(--badge-blue-text)] bg-[var(--badge-blue-bg)]', icon: Clock, dot: 'status-dot-info' },
  graded: { label: 'Dinilai', color: 'text-[var(--badge-green-text)] bg-[var(--badge-green-bg)]', icon: CheckCircle2, dot: 'status-dot-success' },
  late: { label: 'Terlambat', color: 'text-[var(--badge-amber-text)] bg-[var(--badge-amber-bg)]', icon: AlertCircle, dot: 'status-dot-warning' },
  draft: { label: 'Draft', color: 'text-[var(--glass-text-secondary)] bg-[var(--chip-bg)]', icon: FileText, dot: 'status-dot-purple' },
}

export default function MySubmissionsPage() {
  const { user, setPage } = useAppStore()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

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

  const filtered = submissions.filter((s) => {
    const matchSearch = s.assignment.title.toLowerCase().includes(search.toLowerCase()) ||
      s.assignment.class.name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || s.status === statusFilter
    return matchSearch && matchStatus
  })

  const stats = {
    total: submissions.length,
    graded: submissions.filter((s) => s.status === 'graded').length,
    submitted: submissions.filter((s) => s.status === 'submitted').length,
    late: submissions.filter((s) => s.status === 'late').length,
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="skeleton h-10 w-48 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
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
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--glass-text)]">
          <span className="gradient-text">Submissions</span> Saya
        </h1>
        <p className="text-[var(--glass-text-secondary)] text-sm mt-1">Riwayat pengumpulan tugas</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'from-blue-500/20 to-cyan-500/20' },
          { label: 'Dinilai', value: stats.graded, color: 'from-emerald-500/20 to-green-500/20' },
          { label: 'Menunggu', value: stats.submitted, color: 'from-amber-500/20 to-orange-500/20' },
          { label: 'Terlambat', value: stats.late, color: 'from-red-500/20 to-rose-500/20' },
        ].map((stat) => (
          <div key={stat.label} className={`stat-card bg-gradient-to-br ${stat.color}`}>
            <p className="text-[var(--glass-text-secondary)] text-xs">{stat.label}</p>
            <p className="text-2xl font-bold text-[var(--glass-text)] mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--glass-text-muted)]" />
          <input
            type="text"
            placeholder="Cari tugas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="glass-input pl-10"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'submitted', 'graded', 'late'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                statusFilter === status
                  ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white'
                  : 'glass-btn text-[var(--glass-text-secondary)]'
              }`}
            >
              {status === 'all' ? 'Semua' : STATUS_CONFIG[status]?.label || status}
            </button>
          ))}
        </div>
      </div>

      {/* Submissions List */}
      <div className="space-y-3">
        <AnimatePresence>
          {filtered.map((sub, idx) => {
            const config = STATUS_CONFIG[sub.status] || STATUS_CONFIG.submitted
            return (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.03 }}
                className="interactive-card p-4"
                onClick={() => setPage('assignment-detail', { id: sub.assignment.id })}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={config.dot} />
                      <p className="text-sm font-medium text-[var(--glass-text)] truncate">{sub.assignment.title}</p>
                    </div>
                    <p className="text-xs text-[var(--glass-text-muted)] mt-1">{sub.assignment.class.name}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    <span className={`text-xs px-2 py-1 rounded-full ${config.color} font-medium`}>
                      {config.label}
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-[var(--glass-text-muted)]" />
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-[var(--glass-text-muted)]">
                  <span className="flex items-center gap-1">
                    <config.icon className="w-3 h-3" />
                    {format(new Date(sub.submittedAt), 'dd MMM yyyy', { locale: localeId })}
                  </span>
                  {sub.status === 'graded' && sub.grade !== null && (
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <Star className="w-3 h-3" /> {sub.grade}/{sub.assignment.points}
                    </span>
                  )}
                  <span className="uppercase">{sub.assignment.type}</span>
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
        <div className="empty-state py-16">
          <FileText className="w-16 h-16 mb-4" />
          <h3 className="text-lg font-medium text-[var(--glass-text-secondary)] mb-2">Tidak ada submission</h3>
          <p className="text-[var(--glass-text-muted)] text-sm">
            {search || statusFilter !== 'all' ? 'Coba filter lain' : 'Mulai kumpulkan tugas dari kelas Anda'}
          </p>
        </div>
      )}
    </div>
  )
}
