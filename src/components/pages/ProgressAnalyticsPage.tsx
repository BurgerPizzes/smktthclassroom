'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp, TrendingDown, Minus, Target, Award, BookOpen,
  CheckCircle2, XCircle, Clock, BarChart3, PieChart, Calendar,
  ArrowUpRight, ArrowDownRight, MinusCircle, Flame, Star,
  FileText, Users, Activity, Loader2
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale/id'

interface AnalyticsData {
  user: { id: string; isTeacherView: boolean }
  overview: {
    completionRate: number
    totalSubmissions: number
    averageGrade: number
    classRankPercentile: number
    totalAssignments: number
    submittedAssignments: number
    gradedCount: number
  }
  gradeDistribution: Record<string, number>
  subjectPerformance: {
    id: string
    name: string
    averageGrade: number
    completion: number
    totalAssignments: number
    gradedCount: number
    trend: 'up' | 'down' | 'stable'
  }[]
  submissionTimeline: {
    id: string
    assignmentTitle: string
    className: string
    status: string
    grade: number | null
    points: number
    submittedAt: string
  }[]
  attendanceSummary: {
    hadir: number
    terlambat: number
    tidak: number
    total: number
    rate: number
  }
  goals: {
    id: string
    label: string
    current: number
    target: number
    unit: string
  }[]
  strengths: { name: string; grade: number }[]
  weaknesses: { name: string; grade: number }[]
  classWideAnalytics: {
    totalStudents: number
    classAverage: number
    students: {
      id: string
      name: string
      email: string
      averageGrade: number
      totalSubmissions: number
      gradedCount: number
    }[]
  } | null
}

const TREND_CONFIG = {
  up: { icon: TrendingUp, color: 'text-emerald-500', label: 'Meningkat', bg: 'bg-emerald-500/10' },
  down: { icon: TrendingDown, color: 'text-red-500', label: 'Menurun', bg: 'bg-red-500/10' },
  stable: { icon: Minus, color: 'text-amber-500', label: 'Stabil', bg: 'bg-amber-500/10' },
}

const GRADE_COLORS: Record<string, string> = {
  '0-20': '#ef4444',
  '21-40': '#f97316',
  '41-60': '#f59e0b',
  '61-80': '#22c55e',
  '81-100': '#10b981',
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  graded: { label: 'Dinilai', color: 'text-emerald-600 dark:text-emerald-400', icon: CheckCircle2 },
  submitted: { label: 'Terkumpul', color: 'text-blue-600 dark:text-blue-400', icon: Clock },
  late: { label: 'Terlambat', color: 'text-amber-600 dark:text-amber-400', icon: Clock },
}

function CircularProgress({ value, size = 120, strokeWidth = 10, color = '#667eea' }: {
  value: number
  size?: number
  strokeWidth?: number
  color?: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
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
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-2xl font-bold text-[var(--glass-text)]"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          {value}%
        </motion.span>
      </div>
    </div>
  )
}

export default function ProgressAnalyticsPage() {
  const { user } = useAppStore()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedStudentId, setSelectedStudentId] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'overview' | 'subjects' | 'attendance' | 'goals'>('overview')

  const isGuru = user?.role === 'guru' || user?.role === 'admin'

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const url = isGuru && selectedStudentId
          ? `/api/analytics?userId=${selectedStudentId}`
          : '/api/analytics'
        const res = await fetch(url)
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
    fetchAnalytics()
  }, [isGuru, selectedStudentId])

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="skeleton h-10 w-64 rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-32 rounded-xl" />
          ))}
        </div>
        <div className="skeleton h-64 rounded-xl" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="empty-state py-16">
          <BarChart3 className="w-12 h-12 mb-3" />
          <p className="text-sm">Gagal memuat data analitik</p>
        </div>
      </div>
    )
  }

  const { overview, gradeDistribution, subjectPerformance, submissionTimeline, attendanceSummary, goals, strengths, weaknesses } = data

  const gradeColor = (pct: number) => {
    if (pct >= 80) return '#22c55e'
    if (pct >= 60) return '#f59e0b'
    if (pct >= 40) return '#f97316'
    return '#ef4444'
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--glass-text)]">
            <span className="gradient-text">{isGuru ? 'Analitik' : 'Progres Belajar'}</span>
          </h1>
          <p className="text-[var(--glass-text-secondary)] text-sm mt-1">
            {isGuru ? 'Pantau perkembangan dan performa siswa' : 'Pantau perkembangan belajarmu'}
          </p>
        </div>

        {/* Teacher: Student selector */}
        {isGuru && data.classWideAnalytics && (
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="glass-input max-w-xs"
          >
            <option value="">Ringkasan Kelas</option>
            {data.classWideAnalytics.students.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { key: 'overview' as const, label: 'Ringkasan', icon: PieChart },
          { key: 'subjects' as const, label: 'Mata Pelajaran', icon: BookOpen },
          { key: 'attendance' as const, label: 'Kehadiran', icon: Calendar },
          { key: 'goals' as const, label: 'Target', icon: Target },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`category-chip whitespace-nowrap ${activeTab === tab.key ? 'active' : ''}`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Teacher: Class Overview (when no student selected) */}
      {isGuru && !selectedStudentId && data.classWideAnalytics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card-glow p-5 flex flex-col items-center"
          >
            <Users className="w-5 h-5 text-purple-500 mb-2" />
            <p className="text-3xl font-bold text-[var(--glass-text)]">{data.classWideAnalytics.totalStudents}</p>
            <p className="text-xs text-[var(--glass-text-muted)]">Total Siswa</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass-card-glow p-5 flex flex-col items-center"
          >
            <BarChart3 className="w-5 h-5 text-emerald-500 mb-2" />
            <p className="text-3xl font-bold text-[var(--glass-text)]">{data.classWideAnalytics.classAverage}</p>
            <p className="text-xs text-[var(--glass-text-muted)]">Rata-rata Kelas</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card-glow p-5 flex flex-col items-center"
          >
            <Activity className="w-5 h-5 text-amber-500 mb-2" />
            <p className="text-3xl font-bold text-[var(--glass-text)]">{overview.completionRate}%</p>
            <p className="text-xs text-[var(--glass-text-muted)]">Tingkat Penyelesaian</p>
          </motion.div>

          {/* Student list */}
          <div className="md:col-span-3 glass-card p-5">
            <h3 className="font-semibold text-[var(--glass-text)] mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-500" /> Peringkat Siswa
            </h3>
            <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
              {[...data.classWideAnalytics.students]
                .sort((a, b) => b.averageGrade - a.averageGrade)
                .map((s, idx) => (
                  <div
                    key={s.id}
                    className="interactive-card p-3 flex items-center justify-between cursor-pointer"
                    onClick={() => setSelectedStudentId(s.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0 ? 'bg-amber-500/20 text-amber-600' :
                        idx === 1 ? 'bg-gray-400/20 text-gray-500' :
                        idx === 2 ? 'bg-orange-500/20 text-orange-600' :
                        'bg-[var(--glass-input-bg)] text-[var(--glass-text-muted)]'
                      }`}>
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-[var(--glass-text)]">{s.name}</p>
                        <p className="text-xs text-[var(--glass-text-muted)]">{s.totalSubmissions} submission · {s.gradedCount} dinilai</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold" style={{ color: gradeColor(s.averageGrade) }}>
                        {s.averageGrade}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Student analytics view (or teacher viewing specific student) */}
      {(!isGuru || selectedStudentId) && (
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Overview Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {
                    label: 'Penyelesaian',
                    value: `${overview.completionRate}%`,
                    icon: CheckCircle2,
                    color: 'from-emerald-500/20 to-green-500/20',
                    accent: 'text-emerald-600 dark:text-emerald-400',
                  },
                  {
                    label: 'Total Submission',
                    value: overview.totalSubmissions,
                    icon: FileText,
                    color: 'from-blue-500/20 to-cyan-500/20',
                    accent: 'text-blue-600 dark:text-blue-400',
                  },
                  {
                    label: 'Rata-rata Nilai',
                    value: overview.gradedCount > 0 ? overview.averageGrade : '—',
                    icon: Star,
                    color: 'from-amber-500/20 to-orange-500/20',
                    accent: 'text-amber-600 dark:text-amber-400',
                  },
                  {
                    label: 'Peringkat',
                    value: `Top ${overview.classRankPercentile}%`,
                    icon: Award,
                    color: 'from-purple-500/20 to-pink-500/20',
                    accent: 'text-purple-600 dark:text-purple-400',
                  },
                ].map((stat, idx) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`stat-card bg-gradient-to-br ${stat.color}`}
                  >
                    <stat.icon className={`w-5 h-5 ${stat.accent} mb-2`} />
                    <p className="text-2xl font-bold text-[var(--glass-text)]">{stat.value}</p>
                    <p className="text-xs text-[var(--glass-text-secondary)]">{stat.label}</p>
                  </motion.div>
                ))}
              </div>

              {/* Circular Progress + Grade Distribution */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Completion Rate Circular */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card-glow p-6 flex flex-col items-center"
                >
                  <h3 className="text-sm font-medium text-[var(--glass-text-secondary)] mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Tingkat Penyelesaian
                  </h3>
                  <CircularProgress
                    value={overview.completionRate}
                    color={gradeColor(overview.completionRate)}
                  />
                  <p className="text-sm text-[var(--glass-text-muted)] mt-3">
                    {overview.submittedAssignments} dari {overview.totalAssignments} tugas diselesaikan
                  </p>
                </motion.div>

                {/* Grade Distribution Bar Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="glass-card-glow p-6"
                >
                  <h3 className="text-sm font-medium text-[var(--glass-text-secondary)] mb-4 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" /> Distribusi Nilai
                  </h3>
                  <div className="flex items-end gap-3 h-40">
                    {overview.gradedCount > 0 ? Object.entries(gradeDistribution).map(([range, count]) => {
                      const maxCount = Math.max(...Object.values(gradeDistribution), 1)
                      const height = (count / maxCount) * 100
                      return (
                        <div key={range} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-xs font-bold text-[var(--glass-text)]">{count}</span>
                          <div className="w-full flex-1 flex items-end">
                            <motion.div
                              className="w-full rounded-t-md"
                              style={{ backgroundColor: GRADE_COLORS[range] }}
                              initial={{ height: 0 }}
                              animate={{ height: `${Math.max(height, count > 0 ? 8 : 0)}%` }}
                              transition={{ duration: 0.6, delay: 0.2 }}
                            />
                          </div>
                          <span className="text-[10px] text-[var(--glass-text-muted)] text-center">{range}</span>
                        </div>
                      )
                    }) : (
                      <div className="flex-1 flex items-center justify-center text-sm text-[var(--glass-text-muted)]">
                        Belum ada nilai yang tersedia
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Submission Timeline */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card p-5"
              >
                <h3 className="font-semibold text-[var(--glass-text)] mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" /> Riwayat Submission Terkini
                </h3>
                <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                  {submissionTimeline.length > 0 ? (
                    submissionTimeline.map((item, idx) => {
                      const statusConf = STATUS_CONFIG[item.status] || STATUS_CONFIG.submitted
                      const gradePct = item.grade !== null && Number.isFinite(item.grade)
                        ? Math.round((item.grade / item.points) * 100)
                        : null
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="interactive-card p-3 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="timeline-dot" />
                              {idx < submissionTimeline.length - 1 && (
                                <div className="absolute left-[5px] top-3 bottom-0 w-0.5 bg-gradient-to-b from-[#667eea]/30 to-transparent" style={{ height: '24px' }} />
                              )}
                            </div>
                            <div>
                              <p className="text-sm text-[var(--glass-text)] font-medium">{item.assignmentTitle}</p>
                              <p className="text-xs text-[var(--glass-text-muted)]">
                                {item.className} · {format(new Date(item.submittedAt), 'dd MMM yyyy', { locale: localeId })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {gradePct !== null && (
                              <span className="text-sm font-bold" style={{ color: gradeColor(gradePct) }}>
                                {gradePct}%
                              </span>
                            )}
                            <span className={`text-xs px-2 py-0.5 rounded-full ${statusConf.color} bg-[var(--chip-bg)]`}>
                              {statusConf.label}
                            </span>
                          </div>
                        </motion.div>
                      )
                    })
                  ) : (
                    <div className="empty-state py-6">
                      <FileText className="w-8 h-8 mb-2" />
                      <p className="text-sm">Belum ada submission</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}

          {activeTab === 'subjects' && (
            <motion.div
              key="subjects"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {subjectPerformance.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {subjectPerformance.map((subject, idx) => {
                    const trend = TREND_CONFIG[subject.trend]
                    return (
                      <motion.div
                        key={subject.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="glass-card-glow p-5"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-purple-500" />
                            <h4 className="text-sm font-semibold text-[var(--glass-text)]">{subject.name}</h4>
                          </div>
                          <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${trend.bg} ${trend.color}`}>
                            <trend.icon className="w-3 h-3" /> {trend.label}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div className="text-center p-2 rounded-lg bg-[var(--glass-input-bg)]">
                            <p className="text-xl font-bold" style={{ color: gradeColor(subject.averageGrade) }}>
                              {subject.averageGrade}
                            </p>
                            <p className="text-[10px] text-[var(--glass-text-muted)]">Rata-rata</p>
                          </div>
                          <div className="text-center p-2 rounded-lg bg-[var(--glass-input-bg)]">
                            <p className="text-xl font-bold text-[var(--glass-text)]">{subject.completion}%</p>
                            <p className="text-[10px] text-[var(--glass-text-muted)]">Penyelesaian</p>
                          </div>
                        </div>

                        {/* Grade Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-[var(--glass-text-muted)]">
                            <span>Nilai Rata-rata</span>
                            <span>{subject.averageGrade}%</span>
                          </div>
                          <div className="progress-bar h-2">
                            <motion.div
                              className="h-2 rounded-full"
                              style={{ backgroundColor: gradeColor(subject.averageGrade) }}
                              initial={{ width: 0 }}
                              animate={{ width: `${subject.averageGrade}%` }}
                              transition={{ duration: 0.7 }}
                            />
                          </div>

                          <div className="flex justify-between text-xs text-[var(--glass-text-muted)]">
                            <span>Penyelesaian Tugas</span>
                            <span>{subject.completion}%</span>
                          </div>
                          <div className="progress-bar h-2">
                            <motion.div
                              className="h-2 rounded-full bg-purple-500"
                              initial={{ width: 0 }}
                              animate={{ width: `${subject.completion}%` }}
                              transition={{ duration: 0.7, delay: 0.1 }}
                            />
                          </div>
                        </div>

                        <p className="text-[10px] text-[var(--glass-text-muted)] mt-3">
                          {subject.gradedCount} dari {subject.totalAssignments} tugas dinilai
                        </p>
                      </motion.div>
                    )
                  })}
                </div>
              ) : (
                <div className="empty-state py-12">
                  <BookOpen className="w-10 h-10 mb-2" />
                  <p className="text-sm">Belum ada data mata pelajaran</p>
                </div>
              )}

              {/* Strengths & Weaknesses */}
              {(strengths.length > 0 || weaknesses.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-5"
                  >
                    <h3 className="font-semibold text-[var(--glass-text)] mb-3 flex items-center gap-2">
                      <Flame className="w-5 h-5 text-emerald-500" /> Keunggulan
                    </h3>
                    <div className="space-y-2">
                      {strengths.map((s) => (
                        <div key={s.name} className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                          <div className="flex items-center gap-2">
                            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                            <span className="text-sm text-[var(--glass-text)]">{s.name}</span>
                          </div>
                          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{s.grade}%</span>
                        </div>
                      ))}
                      {strengths.length === 0 && (
                        <p className="text-xs text-[var(--glass-text-muted)]">Belum ada data cukup</p>
                      )}
                    </div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="glass-card p-5"
                  >
                    <h3 className="font-semibold text-[var(--glass-text)] mb-3 flex items-center gap-2">
                      <Target className="w-5 h-5 text-red-500" /> Perlu Ditingkatkan
                    </h3>
                    <div className="space-y-2">
                      {weaknesses.map((w) => (
                        <div key={w.name} className="flex items-center justify-between p-2 rounded-lg bg-red-500/5 border border-red-500/10">
                          <div className="flex items-center gap-2">
                            <ArrowDownRight className="w-4 h-4 text-red-500" />
                            <span className="text-sm text-[var(--glass-text)]">{w.name}</span>
                          </div>
                          <span className="text-sm font-bold text-red-600 dark:text-red-400">{w.grade}%</span>
                        </div>
                      ))}
                      {weaknesses.length === 0 && (
                        <p className="text-xs text-[var(--glass-text-muted)]">Belum ada data cukup</p>
                      )}
                    </div>
                  </motion.div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'attendance' && (
            <motion.div
              key="attendance"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Attendance Rate Circular */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card-glow p-6 flex flex-col items-center"
                >
                  <h3 className="text-sm font-medium text-[var(--glass-text-secondary)] mb-4 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Tingkat Kehadiran
                  </h3>
                  <CircularProgress
                    value={attendanceSummary.rate}
                    color={gradeColor(attendanceSummary.rate)}
                  />
                  <p className="text-sm text-[var(--glass-text-muted)] mt-3">
                    {attendanceSummary.hadir} dari {attendanceSummary.total} pertemuan
                  </p>
                </motion.div>

                {/* Attendance breakdown */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="glass-card-glow p-6"
                >
                  <h3 className="text-sm font-medium text-[var(--glass-text-secondary)] mb-4">Ringkasan Kehadiran</h3>
                  <div className="space-y-4">
                    {[
                      { label: 'Hadir', value: attendanceSummary.hadir, color: 'bg-emerald-500', icon: CheckCircle2, iconColor: 'text-emerald-500' },
                      { label: 'Terlambat', value: attendanceSummary.terlambat, color: 'bg-amber-500', icon: Clock, iconColor: 'text-amber-500' },
                      { label: 'Tidak Hadir', value: attendanceSummary.tidak, color: 'bg-red-500', icon: XCircle, iconColor: 'text-red-500' },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="flex items-center gap-2 text-sm text-[var(--glass-text)]">
                            <item.icon className={`w-4 h-4 ${item.iconColor}`} /> {item.label}
                          </span>
                          <span className="text-sm font-bold text-[var(--glass-text)]">
                            {item.value} ({attendanceSummary.total > 0 ? Math.round((item.value / attendanceSummary.total) * 100) : 0}%)
                          </span>
                        </div>
                        <div className="progress-bar h-2">
                          <motion.div
                            className={`h-2 rounded-full ${item.color}`}
                            initial={{ width: 0 }}
                            animate={{
                              width: `${attendanceSummary.total > 0 ? (item.value / attendanceSummary.total) * 100 : 0}%`,
                            }}
                            transition={{ duration: 0.7 }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {activeTab === 'goals' && (
            <motion.div
              key="goals"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {goals.map((goal, idx) => {
                const progress = goal.target > 0 ? Math.min((goal.current / goal.target) * 100, 100) : 0
                const isAchieved = goal.current >= goal.target
                return (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`glass-card-glow p-5 ${isAchieved ? 'border-emerald-500/30' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Target className={`w-5 h-5 ${isAchieved ? 'text-emerald-500' : 'text-purple-500'}`} />
                        <h4 className="text-sm font-semibold text-[var(--glass-text)]">{goal.label}</h4>
                      </div>
                      {isAchieved && (
                        <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" /> Tercapai!
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl font-bold" style={{ color: isAchieved ? '#22c55e' : gradeColor(progress) }}>
                        {goal.current}{goal.unit}
                      </span>
                      <span className="text-sm text-[var(--glass-text-muted)]">/ {goal.target}{goal.unit}</span>
                    </div>
                    <div className="progress-bar h-3">
                      <motion.div
                        className={`h-3 rounded-full ${isAchieved ? 'bg-emerald-500' : ''}`}
                        style={!isAchieved ? { backgroundColor: gradeColor(progress) } : undefined}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.8 }}
                      />
                    </div>
                    <p className="text-xs text-[var(--glass-text-muted)] mt-2">
                      {isAchieved
                        ? 'Selamat! Target telah tercapai 🎉'
                        : `Masih ${goal.target - goal.current}${goal.unit} lagi untuk mencapai target`}
                    </p>
                  </motion.div>
                )
              })}

              {/* Milestones */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-card p-5"
              >
                <h3 className="font-semibold text-[var(--glass-text)] mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" /> Pencapaian
                </h3>
                <div className="space-y-3">
                  {[
                    { label: 'Submission Pertama', achieved: overview.totalSubmissions >= 1, desc: 'Kumpulkan tugas pertama' },
                    { label: '10 Submission', achieved: overview.totalSubmissions >= 10, desc: 'Kumpulkan 10 tugas' },
                    { label: 'Nilai Sempurna', achieved: overview.averageGrade >= 100, desc: 'Dapatkan nilai 100' },
                    { label: 'Rata-rata 80+', achieved: overview.averageGrade >= 80, desc: 'Rata-rata nilai di atas 80' },
                    { label: '50% Penyelesaian', achieved: overview.completionRate >= 50, desc: 'Selesaikan setengah tugas' },
                    { label: '100% Penyelesaian', achieved: overview.completionRate >= 100, desc: 'Selesaikan semua tugas' },
                  ].map((milestone) => (
                    <div
                      key={milestone.label}
                      className={`flex items-center gap-3 p-2 rounded-lg ${
                        milestone.achieved ? 'bg-emerald-500/5' : 'bg-[var(--glass-input-bg)]'
                      }`}
                    >
                      {milestone.achieved ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      ) : (
                        <MinusCircle className="w-5 h-5 text-[var(--glass-text-muted)] shrink-0" />
                      )}
                      <div>
                        <p className={`text-sm font-medium ${milestone.achieved ? 'text-[var(--glass-text)]' : 'text-[var(--glass-text-muted)]'}`}>
                          {milestone.label}
                        </p>
                        <p className="text-xs text-[var(--glass-text-muted)]">{milestone.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}
