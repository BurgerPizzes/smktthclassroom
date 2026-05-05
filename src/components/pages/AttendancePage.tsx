'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  UserCheck, UserX, Clock, Calendar, CheckCircle2, XCircle,
  AlertCircle, Download, TrendingUp, BarChart3, Flame, Target,
  Users as UsersIcon, Filter
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval, parseISO, subMonths, startOfWeek, eachDayOfInterval, getDay, isSameDay } from 'date-fns'
import { id as localeId } from 'date-fns/locale/id'
import { toast } from 'sonner'

interface AttendanceRecord {
  id: string
  date: string
  status: string
  class: { id: string; name: string }
  user?: { id: string; name: string; email: string }
}

interface ClassInfo {
  id: string
  name: string
}

interface StudentInfo {
  id: string
  name: string
  email: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType; dot: string }> = {
  hadir: { label: 'Hadir', color: 'text-[var(--badge-green-text)] bg-[var(--badge-green-bg)]', icon: CheckCircle2, dot: 'status-dot-success' },
  tidak: { label: 'Tidak Hadir', color: 'text-[var(--badge-red-text)] bg-[var(--badge-red-bg)]', icon: XCircle, dot: 'status-dot-danger' },
  terlambat: { label: 'Terlambat', color: 'text-[var(--badge-amber-text)] bg-[var(--badge-amber-bg)]', icon: Clock, dot: 'status-dot-warning' },
}

export default function AttendancePage() {
  const { user } = useAppStore()
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [attendanceForm, setAttendanceForm] = useState<Record<string, string>>({})
  const [teacherClasses, setTeacherClasses] = useState<ClassInfo[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [students, setStudents] = useState<StudentInfo[]>([])
  const [dateRangeStart, setDateRangeStart] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'))
  const [dateRangeEnd, setDateRangeEnd] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [showWeeklySummary, setShowWeeklySummary] = useState(false)

  const isGuru = user?.role === 'guru' || user?.role === 'admin'

  // Fetch teacher's classes
  useEffect(() => {
    if (!isGuru || !user) return
    const fetchClasses = async () => {
      try {
        const res = await fetch('/api/classes')
        if (res.ok) {
          const allClasses = await res.json()
          const myClasses = allClasses.filter((c: any) =>
            c.classUsers?.some((cu: any) => cu.userId === user.id && cu.role === 'guru')
          )
          setTeacherClasses(myClasses.map((c: any) => ({ id: c.id, name: c.name })))
          if (myClasses.length > 0 && !selectedClassId) {
            setSelectedClassId(myClasses[0].id)
          }
        }
      } catch {
        // silently fail
      }
    }
    fetchClasses()
  }, [isGuru, user])

  // Fetch students for selected class
  useEffect(() => {
    if (!isGuru || !selectedClassId) return
    const fetchStudents = async () => {
      try {
        const res = await fetch(`/api/classes?id=${selectedClassId}`)
        if (res.ok) {
          const classData = await res.json()
          const siswaMembers = (classData.classUsers || [])
            .filter((cu: any) => cu.role === 'siswa')
            .map((cu: any) => ({
              id: cu.user.id,
              name: cu.user.name,
              email: cu.user.email,
            }))
          setStudents(siswaMembers)
        }
      } catch {
        // silently fail
      }
    }
    fetchStudents()
  }, [isGuru, selectedClassId])

  // Fetch attendance records
  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const url = isGuru && selectedClassId
          ? `/api/attendance?classId=${selectedClassId}`
          : '/api/attendance'
        const res = await fetch(url)
        if (res.ok) {
          const data = await res.json()
          setRecords(data)
          if (isGuru && students.length > 0) {
            const form: Record<string, string> = {}
            students.forEach((s) => {
              const existingRecord = data.find((r: AttendanceRecord) => r.user?.id === s.id)
              form[s.id] = existingRecord?.status || 'hadir'
            })
            setAttendanceForm(form)
          } else if (!isGuru) {
            const form: Record<string, string> = {}
            data.forEach((r: AttendanceRecord) => {
              form[r.user?.id || r.id] = r.status
            })
            setAttendanceForm(form)
          }
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchAttendance()
  }, [isGuru, selectedClassId, students.length])

  // Update form when students change
  useEffect(() => {
    if (!isGuru || students.length === 0) return
    const form: Record<string, string> = {}
    students.forEach((s) => {
      const existingRecord = records.find((r) => r.user?.id === s.id)
      form[s.id] = existingRecord?.status || 'hadir'
    })
    setAttendanceForm(form)
  }, [students])

  // Attendance summary for teacher view
  const attendanceSummary = useMemo(() => {
    if (!isGuru || records.length === 0) return null

    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)

    // Monthly records
    const monthlyRecords = records.filter((r) => {
      try {
        const d = typeof r.date === 'string' ? parseISO(r.date) : new Date(r.date)
        return isWithinInterval(d, { start: monthStart, end: monthEnd })
      } catch {
        return false
      }
    })

    const totalMonthly = monthlyRecords.length
    const hadirMonthly = monthlyRecords.filter((r) => r.status === 'hadir').length
    const tidakMonthly = monthlyRecords.filter((r) => r.status === 'tidak').length
    const terlambatMonthly = monthlyRecords.filter((r) => r.status === 'terlambat').length
    const attendanceRate = totalMonthly > 0 ? Math.round((hadirMonthly / totalMonthly) * 100) : 0

    // Last 7 days trend
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(now, 6 - i)
      const dateStr = format(date, 'yyyy-MM-dd')
      const dayRecords = records.filter((r) => {
        try {
          const d = typeof r.date === 'string' ? parseISO(r.date) : new Date(r.date)
          return format(d, 'yyyy-MM-dd') === dateStr
        } catch {
          return false
        }
      })
      return {
        date: dateStr,
        dayLabel: format(date, 'EEE', { locale: localeId }),
        hadir: dayRecords.filter((r) => r.status === 'hadir').length,
        tidak: dayRecords.filter((r) => r.status === 'tidak').length,
        terlambat: dayRecords.filter((r) => r.status === 'terlambat').length,
      }
    })

    return {
      attendanceRate,
      totalMonthly,
      hadirMonthly,
      tidakMonthly,
      terlambatMonthly,
      last7Days,
    }
  }, [records, isGuru])

  const handleMarkAttendance = useCallback(async () => {
    if (!selectedClassId) {
      toast.error('Pilih kelas terlebih dahulu')
      return
    }
    try {
      const entries = Object.entries(attendanceForm).map(([userId, status]) => ({
        userId,
        status,
        date: selectedDate,
      }))
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries, classId: selectedClassId }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Gagal menyimpan absensi')
        return
      }
      toast.success('Absensi berhasil disimpan!')
      const attRes = await fetch(`/api/attendance?classId=${selectedClassId}`)
      if (attRes.ok) setRecords(await attRes.json())
    } catch {
      toast.error('Terjadi kesalahan')
    }
  }, [attendanceForm, selectedDate, selectedClassId])

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="skeleton h-10 w-48 rounded-xl" />
        <div className="glass-card p-6"><div className="skeleton h-64 rounded" /></div>
      </div>
    )
  }

  // Siswa: personal history
  if (!isGuru) {
    const myRecords = records.filter((r) => r.user?.id === user?.id || !r.user)
    const stats = {
      hadir: myRecords.filter((r) => r.status === 'hadir').length,
      tidak: myRecords.filter((r) => r.status === 'tidak').length,
      terlambat: myRecords.filter((r) => r.status === 'terlambat').length,
    }
    const totalRecords = stats.hadir + stats.tidak + stats.terlambat
    const attendanceRate = totalRecords > 0 ? Math.round((stats.hadir / totalRecords) * 100) : 0
    const attendanceGoal = 95
    const goalProgress = Math.min((attendanceRate / attendanceGoal) * 100, 100)

    // Calculate streak: consecutive days of 'hadir' from most recent
    const streak = (() => {
      const sorted = [...myRecords]
        .filter((r) => r.status === 'hadir')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      if (sorted.length === 0) return 0
      let count = 1
      for (let i = 1; i < sorted.length; i++) {
        const prev = new Date(sorted[i - 1].date)
        const curr = new Date(sorted[i].date)
        const diffDays = Math.round((prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24))
        if (diffDays === 1) count++
        else break
      }
      return count
    })()

    // Calendar heatmap data (last 3 months)
    const heatmapData = (() => {
      const now = new Date()
      const threeMonthsAgo = subMonths(now, 3)
      const start = startOfWeek(threeMonthsAgo, { weekStartsOn: 1 })
      const end = now
      const days = eachDayOfInterval({ start, end })
      return days.map((day) => {
        const dateStr = format(day, 'yyyy-MM-dd')
        const dayRecord = myRecords.find((r) => {
          try {
            const d = typeof r.date === 'string' ? parseISO(r.date) : new Date(r.date)
            return format(d, 'yyyy-MM-dd') === dateStr
          } catch { return false }
        })
        return {
          date: day,
          dateStr,
          status: dayRecord?.status || null,
          isFuture: day > now,
        }
      })
    })()

    // Group heatmap data by week for rendering
    const heatmapWeeks = (() => {
      const weeks: typeof heatmapData[] = []
      let currentWeek: typeof heatmapData = []
      heatmapData.forEach((day) => {
        const dayOfWeek = getDay(day.date)
        if (dayOfWeek === 1 && currentWeek.length > 0) {
          weeks.push(currentWeek)
          currentWeek = []
        }
        currentWeek.push(day)
      })
      if (currentWeek.length > 0) weeks.push(currentWeek)
      return weeks
    })()

    // Month labels for heatmap
    const heatmapMonths = (() => {
      const months: { label: string; colIndex: number }[] = []
      let lastMonth = ''
      heatmapWeeks.forEach((week, weekIdx) => {
        const monthLabel = format(week[0].date, 'MMM', { locale: localeId })
        if (monthLabel !== lastMonth) {
          months.push({ label: monthLabel, colIndex: weekIdx })
          lastMonth = monthLabel
        }
      })
      return months
    })()

    const dayLabels = ['Sen', '', 'Rab', '', 'Jum', '', 'Min']

    return (
      <div className="p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--glass-text)]">
            <span className="gradient-text">Absensi</span> Saya
          </h1>
          <p className="text-[var(--glass-text-secondary)] text-sm mt-1">Riwayat kehadiran</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Hadir', value: stats.hadir, icon: CheckCircle2, color: 'from-emerald-500/20 to-green-500/20' },
            { label: 'Tidak', value: stats.tidak, icon: XCircle, color: 'from-red-500/20 to-rose-500/20' },
            { label: 'Terlambat', value: stats.terlambat, icon: Clock, color: 'from-amber-500/20 to-orange-500/20' },
          ].map((s) => (
            <div key={s.label} className={`stat-card bg-gradient-to-br ${s.color}`}>
              <s.icon className="w-5 h-5 text-[var(--glass-text-secondary)] mb-2" />
              <p className="text-2xl font-bold text-[var(--glass-text)]">{s.value}</p>
              <p className="text-xs text-[var(--glass-text-secondary)]">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Streak Counter & Attendance Goal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="glass-card p-5 flex items-center gap-4">
            <div className="streak-counter">
              <Flame className="w-5 h-5" />
              <span className="streak-number">{streak}</span>
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--glass-text)]">Streak Kehadiran</p>
              <p className="text-xs text-[var(--glass-text-muted)]">{streak > 0 ? `${streak} hari berturut-turut hadir` : 'Belum ada streak'}</p>
            </div>
          </div>
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[var(--badge-purple-text)]" />
                <span className="text-sm font-medium text-[var(--glass-text)]">Target Kehadiran</span>
              </div>
              <span className={`text-sm font-bold ${attendanceRate >= attendanceGoal ? 'text-[var(--badge-green-text)]' : 'text-[var(--badge-amber-text)]'}`}>
                {attendanceRate}% / {attendanceGoal}%
              </span>
            </div>
            <div className="progress-bar h-3 rounded-full">
              <motion.div
                className="progress-bar-fill rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${goalProgress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                style={{
                  background: attendanceRate >= attendanceGoal
                    ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                    : 'linear-gradient(90deg, #667eea, #764ba2)'
                }}
              />
            </div>
            <p className="text-xs text-[var(--glass-text-muted)] mt-1.5">
              {attendanceRate >= attendanceGoal ? '🎉 Target tercapai!' : `${attendanceGoal - attendanceRate}% lagi menuju target`}
            </p>
          </div>
        </div>

        {/* Calendar Heatmap */}
        <div className="glass-card p-5">
          <h2 className="font-semibold text-[var(--glass-text)] mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[var(--badge-purple-text)]" /> Peta Kehadiran (3 Bulan)
          </h2>
          <div className="overflow-x-auto custom-scrollbar pb-2">
            <div className="min-w-[600px]">
              {/* Month labels */}
              <div className="flex ml-8 mb-1">
                {heatmapMonths.map((m, i) => (
                  <span
                    key={i}
                    className="text-[10px] text-[var(--glass-text-muted)] font-medium"
                    style={{
                      position: 'relative',
                      left: `${m.colIndex * 14}px`,
                      width: 0,
                      overflow: 'visible',
                    }}
                  >
                    {m.label}
                  </span>
                ))}
              </div>
              <div className="flex gap-0.5">
                {/* Day labels */}
                <div className="flex flex-col gap-0.5 mr-1">
                  {dayLabels.map((label, i) => (
                    <div key={i} className="h-[12px] flex items-center">
                      <span className="text-[9px] text-[var(--glass-text-muted)] leading-none">{label}</span>
                    </div>
                  ))}
                </div>
                {/* Heatmap grid */}
                {heatmapWeeks.map((week, weekIdx) => (
                  <div key={weekIdx} className="flex flex-col gap-0.5">
                    {week.map((day) => {
                      const cellClass = day.isFuture
                        ? 'heatmap-cell heatmap-cell-empty'
                        : day.status === 'hadir'
                        ? 'heatmap-cell heatmap-cell-hadir'
                        : day.status === 'terlambat'
                        ? 'heatmap-cell heatmap-cell-terlambat'
                        : day.status === 'tidak'
                        ? 'heatmap-cell heatmap-cell-tidak'
                        : 'heatmap-cell heatmap-cell-empty'
                      return (
                        <div
                          key={day.dateStr}
                          className={cellClass}
                          title={day.isFuture ? '' : `${format(day.date, 'dd MMM yyyy', { locale: localeId })}: ${day.status || 'Tidak ada data'}`}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
              {/* Legend */}
              <div className="flex items-center gap-4 mt-3">
                <span className="text-[10px] text-[var(--glass-text-muted)]">Kurang</span>
                <div className="flex gap-0.5">
                  <div className="heatmap-cell heatmap-cell-empty" />
                  <div className="heatmap-cell heatmap-cell-hadir" />
                  <div className="heatmap-cell heatmap-cell-terlambat" />
                  <div className="heatmap-cell heatmap-cell-tidak" />
                </div>
                <span className="text-[10px] text-[var(--glass-text-muted)]">Lebih</span>
              </div>
              <div className="flex items-center gap-4 mt-1">
                <span className="flex items-center gap-1 text-[10px] text-[var(--glass-text-muted)]">
                  <span className="w-2 h-2 rounded-sm bg-emerald-500" /> Hadir
                </span>
                <span className="flex items-center gap-1 text-[10px] text-[var(--glass-text-muted)]">
                  <span className="w-2 h-2 rounded-sm bg-amber-500" /> Terlambat
                </span>
                <span className="flex items-center gap-1 text-[10px] text-[var(--glass-text-muted)]">
                  <span className="w-2 h-2 rounded-sm bg-red-500" /> Tidak
                </span>
                <span className="flex items-center gap-1 text-[10px] text-[var(--glass-text-muted)]">
                  <span className="w-2 h-2 rounded-sm bg-[var(--glass-input-bg)]" /> Tidak ada
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* History */}
        <div className="glass-card p-5">
          <h2 className="font-semibold text-[var(--glass-text)] mb-4">Riwayat Kehadiran</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
            {myRecords.length > 0 ? (
              myRecords.map((r) => {
                const config = STATUS_CONFIG[r.status] || STATUS_CONFIG.hadir
                return (
                  <div key={r.id} className="interactive-card p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={config.dot} />
                      <div>
                        <p className="text-sm text-[var(--glass-text)]">{r.class.name}</p>
                        <p className="text-xs text-[var(--glass-text-muted)]">{format(new Date(r.date), 'EEEE, dd MMMM yyyy', { locale: localeId })}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${config.color} font-medium`}>
                      {config.label}
                    </span>
                  </div>
                )
              })
            ) : (
              <div className="empty-state py-8">
                <Calendar className="w-10 h-10 mb-2" />
                <p className="text-sm">Belum ada data absensi</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Guru: mark attendance
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--glass-text)]">
          <span className="gradient-text">Absensi</span>
        </h1>
        <p className="text-[var(--glass-text-secondary)] text-sm mt-1">Kelola kehadiran siswa</p>
      </div>

      {/* Attendance Summary Visualization */}
      {attendanceSummary && selectedClassId && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* Attendance Rate - Circular Progress */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card-glow p-5 flex flex-col items-center"
          >
            <h3 className="text-sm font-medium text-[var(--glass-text-secondary)] mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Tingkat Kehadiran
            </h3>
            <div className="relative w-28 h-28">
              <svg width="112" height="112" className="transform -rotate-90">
                <circle cx="56" cy="56" r="48" stroke="var(--glass-input-bg)" strokeWidth="8" fill="none" />
                <circle
                  cx="56" cy="56" r="48"
                  stroke={attendanceSummary.attendanceRate >= 80 ? '#22c55e' : attendanceSummary.attendanceRate >= 60 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${(attendanceSummary.attendanceRate / 100) * 301.59} 301.59`}
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-[var(--glass-text)]">{attendanceSummary.attendanceRate}%</span>
                <span className="text-[10px] text-[var(--glass-text-muted)]">kehadiran</span>
              </div>
            </div>
            <p className="text-xs text-[var(--glass-text-muted)] mt-2">Bulan ini</p>
          </motion.div>

          {/* Last 7 Days Trend - Mini Bar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass-card-glow p-5"
          >
            <h3 className="text-sm font-medium text-[var(--glass-text-secondary)] mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Tren 7 Hari
            </h3>
            <div className="flex items-end gap-1.5 h-24">
              {attendanceSummary.last7Days.map((day) => {
                const maxVal = Math.max(day.hadir + day.terlambat + day.tidak, 1)
                const hadirH = Math.max((day.hadir / maxVal) * 100, day.hadir > 0 ? 8 : 0)
                const terlambatH = Math.max((day.terlambat / maxVal) * 100, day.terlambat > 0 ? 8 : 0)
                const tidakH = Math.max((day.tidak / maxVal) * 100, day.tidak > 0 ? 8 : 0)

                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-0.5">
                    <div className="flex flex-col-reverse w-full items-center gap-0.5" style={{ height: '80px' }}>
                      {day.hadir > 0 && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${hadirH}%` }}
                          transition={{ duration: 0.5 }}
                          className="w-full bg-emerald-500 rounded-t-sm min-h-[3px]"
                          title={`Hadir: ${day.hadir}`}
                        />
                      )}
                      {day.terlambat > 0 && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${terlambatH}%` }}
                          transition={{ duration: 0.5, delay: 0.05 }}
                          className="w-full bg-amber-500 min-h-[3px]"
                          title={`Terlambat: ${day.terlambat}`}
                        />
                      )}
                      {day.tidak > 0 && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${tidakH}%` }}
                          transition={{ duration: 0.5, delay: 0.1 }}
                          className="w-full bg-red-500 rounded-b-sm min-h-[3px]"
                          title={`Tidak Hadir: ${day.tidak}`}
                        />
                      )}
                    </div>
                    <span className="text-[9px] text-[var(--glass-text-muted)] mt-1">{day.dayLabel}</span>
                  </div>
                )
              })}
            </div>
            {/* Legend */}
            <div className="flex items-center justify-center gap-3 mt-3">
              <span className="flex items-center gap-1 text-[10px] text-[var(--glass-text-muted)]">
                <span className="w-2 h-2 rounded-sm bg-emerald-500" /> Hadir
              </span>
              <span className="flex items-center gap-1 text-[10px] text-[var(--glass-text-muted)]">
                <span className="w-2 h-2 rounded-sm bg-amber-500" /> Terlambat
              </span>
              <span className="flex items-center gap-1 text-[10px] text-[var(--glass-text-muted)]">
                <span className="w-2 h-2 rounded-sm bg-red-500" /> Tidak
              </span>
            </div>
          </motion.div>

          {/* Monthly Summary Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card-glow p-5"
          >
            <h3 className="text-sm font-medium text-[var(--glass-text-secondary)] mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Ringkasan Bulan Ini
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-[var(--glass-text)]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Hadir
                </span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{attendanceSummary.hadirMonthly}</span>
              </div>
              <div className="progress-bar h-2">
                <motion.div
                  className="h-2 rounded-full bg-emerald-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${attendanceSummary.totalMonthly > 0 ? (attendanceSummary.hadirMonthly / attendanceSummary.totalMonthly) * 100 : 0}%` }}
                  transition={{ duration: 0.7 }}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-[var(--glass-text)]">
                  <Clock className="w-4 h-4 text-amber-500" /> Terlambat
                </span>
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{attendanceSummary.terlambatMonthly}</span>
              </div>
              <div className="progress-bar h-2">
                <motion.div
                  className="h-2 rounded-full bg-amber-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${attendanceSummary.totalMonthly > 0 ? (attendanceSummary.terlambatMonthly / attendanceSummary.totalMonthly) * 100 : 0}%` }}
                  transition={{ duration: 0.7, delay: 0.1 }}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-[var(--glass-text)]">
                  <XCircle className="w-4 h-4 text-red-500" /> Tidak Hadir
                </span>
                <span className="text-sm font-bold text-red-600 dark:text-red-400">{attendanceSummary.tidakMonthly}</span>
              </div>
              <div className="progress-bar h-2">
                <motion.div
                  className="h-2 rounded-full bg-red-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${attendanceSummary.totalMonthly > 0 ? (attendanceSummary.tidakMonthly / attendanceSummary.totalMonthly) * 100 : 0}%` }}
                  transition={{ duration: 0.7, delay: 0.2 }}
                />
              </div>

              <div className="pt-2 border-t border-[var(--glass-border)]">
                <div className="flex items-center justify-between text-xs text-[var(--glass-text-muted)]">
                  <span>Total Record</span>
                  <span className="font-medium text-[var(--glass-text-secondary)]">{attendanceSummary.totalMonthly}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Class selector & Date picker row */}
      <div className="glass-card p-5 md:p-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="flex items-center gap-2 sm:flex-1">
          <Calendar className="w-5 h-5 text-[var(--glass-text-secondary)]" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="glass-input max-w-xs"
          />
        </div>
        <div className="flex items-center gap-2 sm:flex-1">
          <span className="text-sm text-[var(--glass-text-secondary)] whitespace-nowrap">Kelas:</span>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="glass-input styled-select flex-1"
          >
            <option value="">Pilih Kelas</option>
            {teacherClasses.map((cls) => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={async () => {
            if (!selectedClassId) { toast.error('Pilih kelas terlebih dahulu'); return }
            try {
              const res = await fetch(`/api/attendance/export?classId=${selectedClassId}`)
              if (res.ok) {
                const blob = await res.blob()
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `absensi-${selectedClassId}.csv`
                a.click()
                URL.revokeObjectURL(url)
                toast.success('Data absensi berhasil diekspor')
              } else {
                toast.error('Gagal mengekspor data')
              }
            } catch { toast.error('Terjadi kesalahan') }
          }}
          className="btn-glass flex items-center gap-2 text-sm shrink-0"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Weekly Summary View */}
      {isGuru && selectedClassId && (
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[var(--glass-text)] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-500" /> Ringkasan Mingguan
            </h3>
            <button
              onClick={() => setShowWeeklySummary(!showWeeklySummary)}
              className="category-chip text-xs"
            >
              {showWeeklySummary ? 'Tutup' : 'Lihat Detail'}
            </button>
          </div>

          {/* Compact weekly bar */}
          <div className="flex items-end gap-1.5 h-20">
            {(() => {
              const now = new Date()
              const weekStart = startOfWeek(now, { weekStartsOn: 1 })
              return Array.from({ length: 5 }, (_, i) => {
                const date = new Date(weekStart)
                date.setDate(date.getDate() + i)
                const dateStr = format(date, 'yyyy-MM-dd')
                const dayRecords = records.filter((r) => {
                  try {
                    const d = typeof r.date === 'string' ? parseISO(r.date) : new Date(r.date)
                    return format(d, 'yyyy-MM-dd') === dateStr
                  } catch { return false }
                })
                const hadir = dayRecords.filter((r) => r.status === 'hadir').length
                const terlambat = dayRecords.filter((r) => r.status === 'terlambat').length
                const tidak = dayRecords.filter((r) => r.status === 'tidak').length
                const total = hadir + terlambat + tidak
                const rate = total > 0 ? Math.round((hadir / total) * 100) : 0
                return (
                  <div key={dateStr} className="flex-1 flex flex-col items-center gap-0.5">
                    <span className="text-[9px] font-medium" style={{ color: rate >= 80 ? '#22c55e' : rate >= 50 ? '#f59e0b' : rate > 0 ? '#ef4444' : 'var(--glass-text-muted)' }}>
                      {rate > 0 ? `${rate}%` : '-'}
                    </span>
                    <div className="w-full h-12 flex flex-col-reverse gap-0.5" style={{ minHeight: '12px' }}>
                      {hadir > 0 && <div className="w-full bg-emerald-500 rounded-sm" style={{ height: `${Math.max((hadir / Math.max(total, 1)) * 100, 10)}%`, minHeight: '3px' }} />}
                      {terlambat > 0 && <div className="w-full bg-amber-500 rounded-sm" style={{ height: `${Math.max((terlambat / Math.max(total, 1)) * 100, 10)}%`, minHeight: '3px' }} />}
                      {tidak > 0 && <div className="w-full bg-red-500 rounded-sm" style={{ height: `${Math.max((tidak / Math.max(total, 1)) * 100, 10)}%`, minHeight: '3px' }} />}
                    </div>
                    <span className="text-[9px] text-[var(--glass-text-muted)]">{format(date, 'EEE', { locale: localeId })}</span>
                  </div>
                )
              })
            })()}
          </div>

          {/* Expanded weekly summary */}
          {showWeeklySummary && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 space-y-2"
            >
              {Array.from({ length: 5 }, (_, i) => {
                const now = new Date()
                const weekStart = startOfWeek(now, { weekStartsOn: 1 })
                const date = new Date(weekStart)
                date.setDate(date.getDate() + i)
                const dateStr = format(date, 'yyyy-MM-dd')
                const dayRecords = records.filter((r) => {
                  try {
                    const d = typeof r.date === 'string' ? parseISO(r.date) : new Date(r.date)
                    return format(d, 'yyyy-MM-dd') === dateStr
                  } catch { return false }
                })
                const hadir = dayRecords.filter((r) => r.status === 'hadir').length
                const terlambat = dayRecords.filter((r) => r.status === 'terlambat').length
                const tidak = dayRecords.filter((r) => r.status === 'tidak').length
                const total = hadir + terlambat + tidak
                return (
                  <div key={dateStr} className="interactive-card p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-[var(--glass-text)]">{format(date, 'EEEE, dd MMM', { locale: localeId })}</span>
                      <span className="text-xs text-[var(--glass-text-muted)]">{total} siswa</span>
                    </div>
                    <div className="flex gap-4 text-xs">
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" /> {hadir} hadir
                      </span>
                      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                        <Clock className="w-3 h-3" /> {terlambat} terlambat
                      </span>
                      <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                        <XCircle className="w-3 h-3" /> {tidak} tidak
                      </span>
                    </div>
                  </div>
                )
              })}
            </motion.div>
          )}
        </div>
      )}

      {/* Date Range History */}
      {isGuru && selectedClassId && (
        <div className="glass-card p-5">
          <h3 className="font-semibold text-[var(--glass-text)] mb-4 flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-500" /> Riwayat Rentang Tanggal
          </h3>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--glass-text-muted)]">Dari:</span>
              <input
                type="date"
                value={dateRangeStart}
                onChange={(e) => setDateRangeStart(e.target.value)}
                className="glass-input text-sm py-1.5"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--glass-text-muted)]">Sampai:</span>
              <input
                type="date"
                value={dateRangeEnd}
                onChange={(e) => setDateRangeEnd(e.target.value)}
                className="glass-input text-sm py-1.5"
              />
            </div>
          </div>
          {(() => {
            const rangeRecords = records.filter((r) => {
              try {
                const d = typeof r.date === 'string' ? parseISO(r.date) : new Date(r.date)
                const dateStr = format(d, 'yyyy-MM-dd')
                return dateStr >= dateRangeStart && dateStr <= dateRangeEnd
              } catch { return false }
            })
            const rHadir = rangeRecords.filter((r) => r.status === 'hadir').length
            const rTerlambat = rangeRecords.filter((r) => r.status === 'terlambat').length
            const rTidak = rangeRecords.filter((r) => r.status === 'tidak').length
            const rTotal = rangeRecords.length
            if (rTotal === 0) return <p className="text-xs text-[var(--glass-text-muted)] mt-3">Tidak ada data dalam rentang ini</p>
            return (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="text-center p-2 rounded-lg bg-emerald-500/5">
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{rHadir}</p>
                  <p className="text-[10px] text-[var(--glass-text-muted)]">Hadir</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-amber-500/5">
                  <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{rTerlambat}</p>
                  <p className="text-[10px] text-[var(--glass-text-muted)]">Terlambat</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-red-500/5">
                  <p className="text-lg font-bold text-red-600 dark:text-red-400">{rTidak}</p>
                  <p className="text-[10px] text-[var(--glass-text-muted)]">Tidak Hadir</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-purple-500/5">
                  <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{rTotal > 0 ? Math.round((rHadir / rTotal) * 100) : 0}%</p>
                  <p className="text-[10px] text-[var(--glass-text-muted)]">Tingkat Kehadiran</p>
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* Attendance List */}
      <div className="glass-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-[var(--glass-text)]">
            Daftar Siswa {selectedClassId ? `- ${teacherClasses.find(c => c.id === selectedClassId)?.name || ''}` : ''}
          </h2>
          {/* Bulk Actions */}
          {selectedClassId && students.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const newForm: Record<string, string> = {}
                  students.forEach((s) => { newForm[s.id] = 'hadir' })
                  setAttendanceForm(newForm)
                  toast.success('Semua siswa ditandai hadir')
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Hadir Semua
              </button>
              <button
                onClick={() => {
                  const newForm: Record<string, string> = {}
                  students.forEach((s) => { newForm[s.id] = 'tidak' })
                  setAttendanceForm(newForm)
                  toast.info('Semua siswa ditandai tidak hadir')
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" /> Tidak Hadir Semua
              </button>
            </div>
          )}
        </div>
        {selectedClassId && students.length > 0 ? (
          <>
            <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
              {students.map((s) => {
                const currentStatus = attendanceForm[s.id] || 'hadir'
                return (
                  <div key={s.id} className="interactive-card p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {s.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-[var(--glass-text)] font-medium truncate">{s.name}</p>
                        <p className="text-xs text-[var(--glass-text-muted)] truncate">{s.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      {(['hadir', 'terlambat', 'tidak'] as const).map((status) => {
                        const isActive = currentStatus === status
                        const activeStyles: Record<string, string> = {
                          hadir: 'bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-500/25',
                          terlambat: 'bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-500/25',
                          tidak: 'bg-red-500 text-white border-red-500 shadow-sm shadow-red-500/25',
                        }
                        const inactiveStyles = 'bg-transparent text-[var(--glass-text-muted)] border-[var(--glass-border)] hover:bg-[var(--icon-btn-hover-bg)]'
                        return (
                          <button
                            key={status}
                            onClick={() => setAttendanceForm({ ...attendanceForm, [s.id]: status })}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border min-w-[80px] text-center ${
                              isActive ? activeStyles[status] : inactiveStyles
                            }`}
                          >
                            {STATUS_CONFIG[status].label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="pt-4 flex justify-end">
              <button onClick={handleMarkAttendance} className="btn-gradient flex items-center gap-2 text-sm px-6 py-2.5">
                <UserCheck className="w-4 h-4" /> Simpan Absensi
              </button>
            </div>
          </>
        ) : !selectedClassId ? (
          <div className="empty-state py-8">
            <AlertCircle className="w-10 h-10 mb-2" />
            <p className="text-sm">Pilih kelas untuk melihat daftar siswa</p>
          </div>
        ) : (
          <div className="empty-state py-8">
            <AlertCircle className="w-10 h-10 mb-2" />
            <p className="text-sm">Tidak ada siswa di kelas ini</p>
          </div>
        )}
      </div>
    </div>
  )
}
