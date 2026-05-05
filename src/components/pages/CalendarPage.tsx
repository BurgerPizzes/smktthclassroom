'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon,
  FileText, Clock, X, AlertTriangle, Timer, BookOpen, Zap,
  BarChart3
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay, isToday, differenceInDays } from 'date-fns'
import { id as localeId } from 'date-fns/locale/id'

interface Assignment {
  id: string
  title: string
  dueDate: string
  type: string
  points: number
  status: string
  class: { name: string }
}

const TYPE_STYLES: Record<string, { bg: string; text: string; border: string; dot: string; icon: React.ElementType; badge: string; miniDot: string }> = {
  tugas: {
    bg: 'bg-[var(--badge-blue-bg)]',
    text: 'text-[var(--badge-blue-text)]',
    border: 'border-blue-500/30',
    dot: 'bg-blue-500',
    icon: FileText,
    badge: 'bg-blue-500 text-white',
    miniDot: 'bg-blue-400',
  },
  ujian: {
    bg: 'bg-[var(--badge-red-bg)]',
    text: 'text-[var(--badge-red-text)]',
    border: 'border-red-500/30',
    dot: 'bg-red-500',
    icon: AlertTriangle,
    badge: 'bg-red-500 text-white',
    miniDot: 'bg-red-400',
  },
  kuis: {
    bg: 'bg-[var(--badge-amber-bg)]',
    text: 'text-[var(--badge-amber-text)]',
    border: 'border-amber-500/30',
    dot: 'bg-amber-500',
    icon: Zap,
    badge: 'bg-amber-500 text-white',
    miniDot: 'bg-amber-400',
  },
  TUGAS: {
    bg: 'bg-[var(--badge-blue-bg)]',
    text: 'text-[var(--badge-blue-text)]',
    border: 'border-blue-500/30',
    dot: 'bg-blue-500',
    icon: FileText,
    badge: 'bg-blue-500 text-white',
    miniDot: 'bg-blue-400',
  },
  UJIAN: {
    bg: 'bg-[var(--badge-red-bg)]',
    text: 'text-[var(--badge-red-text)]',
    border: 'border-red-500/30',
    dot: 'bg-red-500',
    icon: AlertTriangle,
    badge: 'bg-red-500 text-white',
    miniDot: 'bg-red-400',
  },
  KUIS: {
    bg: 'bg-[var(--badge-amber-bg)]',
    text: 'text-[var(--badge-amber-text)]',
    border: 'border-amber-500/30',
    dot: 'bg-amber-500',
    icon: Zap,
    badge: 'bg-amber-500 text-white',
    miniDot: 'bg-amber-400',
  },
}

const DEFAULT_STYLE = TYPE_STYLES.tugas

function getCountdownInfo(dueDate: Date) {
  const now = new Date()
  const diffMs = dueDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return { text: 'Terlambat', color: 'text-[var(--badge-red-text)]', bg: 'bg-[var(--badge-red-bg)]', urgent: true, overdue: true }
  if (diffDays === 0) return { text: 'Hari ini!', color: 'text-[var(--badge-red-text)]', bg: 'bg-[var(--badge-red-bg)]', urgent: true, overdue: false }
  if (diffDays === 1) return { text: 'Besok', color: 'text-[var(--badge-amber-text)]', bg: 'bg-[var(--badge-amber-bg)]', urgent: true, overdue: false }
  if (diffDays <= 3) return { text: `${diffDays} hari lagi`, color: 'text-[var(--badge-amber-text)]', bg: 'bg-[var(--badge-amber-bg)]', urgent: true, overdue: false }
  if (diffDays <= 7) return { text: `${diffDays} hari lagi`, color: 'text-[var(--badge-blue-text)]', bg: 'bg-[var(--badge-blue-bg)]', urgent: false, overdue: false }
  return { text: format(dueDate, 'dd MMM', { locale: localeId }), color: 'text-[var(--glass-text-muted)]', bg: 'bg-[var(--chip-bg)]', urgent: false, overdue: false }
}

// Estimate event duration based on type and points
function getEventDuration(type: string, points: number): string {
  const lowerType = type?.toLowerCase() || 'tugas'
  if (lowerType === 'ujian') {
    if (points > 80) return '3 jam'
    if (points > 50) return '2 jam'
    return '1.5 jam'
  }
  if (lowerType === 'kuis') {
    if (points > 50) return '1 jam'
    return '30 menit'
  }
  // tugas
  if (points > 80) return '2 minggu'
  if (points > 50) return '1 minggu'
  return '3 hari'
}

export default function CalendarPage() {
  const { setPage } = useAppStore()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const res = await fetch('/api/assignments')
        if (res.ok) setAssignments(await res.json())
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchAssignments()
  }, [])

  const assignmentsByDate = useMemo(() => {
    const map: Record<string, Assignment[]> = {}
    assignments.forEach((a) => {
      const key = format(new Date(a.dueDate), 'yyyy-MM-dd')
      if (!map[key]) map[key] = []
      map[key].push(a)
    })
    return map
  }, [assignments])

  const selectedDateAssignments = useMemo(() => {
    if (!selectedDate) return []
    const key = format(selectedDate, 'yyyy-MM-dd')
    return assignmentsByDate[key] || []
  }, [selectedDate, assignmentsByDate])

  // Get upcoming assignments (next 7 days) for the sidebar list
  const upcomingAssignments = useMemo(() => {
    const now = new Date()
    return assignments
      .filter((a) => new Date(a.dueDate) >= now)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 8)
  }, [assignments])

  // Monthly stats
  const monthlyStats = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const monthAssignments = assignments.filter((a) => {
      const d = new Date(a.dueDate)
      return d >= monthStart && d <= monthEnd
    })
    return {
      tugas: monthAssignments.filter(a => a.type.toLowerCase() === 'tugas').length,
      ujian: monthAssignments.filter(a => a.type.toLowerCase() === 'ujian').length,
      kuis: monthAssignments.filter(a => a.type.toLowerCase() === 'kuis').length,
      total: monthAssignments.length,
    }
  }, [assignments, currentMonth])

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startDay = getDay(monthStart)

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="skeleton h-10 w-48 rounded-xl" />
        <div className="glass-card p-6"><div className="skeleton h-96 rounded" /></div>
      </div>
    )
  }

  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--glass-text)]">
            <span className="gradient-text">Kalender</span>
          </h1>
          <p className="text-[var(--glass-text-secondary)] text-sm mt-1">Jadwal tugas dan ujian</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="btn-glass p-2 rounded-lg"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[var(--glass-text)] font-semibold min-w-[140px] text-center">
            {format(currentMonth, 'MMMM yyyy', { locale: localeId })}
          </span>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="btn-glass p-2 rounded-lg"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mini Stats Bar */}
      <div className="mini-stats-bar flex-wrap">
        <div className="mini-stats-item">
          <FileText className="w-4 h-4 text-blue-500" />
          <span className="text-[var(--badge-blue-text)]">{monthlyStats.tugas}</span>
          <span className="text-[var(--glass-text-muted)] font-normal">Tugas</span>
        </div>
        <div className="mini-stats-divider" />
        <div className="mini-stats-item">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <span className="text-[var(--badge-red-text)]">{monthlyStats.ujian}</span>
          <span className="text-[var(--glass-text-muted)] font-normal">Ujian</span>
        </div>
        <div className="mini-stats-divider" />
        <div className="mini-stats-item">
          <Zap className="w-4 h-4 text-amber-500" />
          <span className="text-[var(--badge-amber-text)]">{monthlyStats.kuis}</span>
          <span className="text-[var(--glass-text-muted)] font-normal">Kuis</span>
        </div>
        <div className="mini-stats-divider" />
        <div className="mini-stats-item">
          <BarChart3 className="w-4 h-4 text-purple-500" />
          <span className="text-[var(--badge-purple-text)]">{monthlyStats.total}</span>
          <span className="text-[var(--glass-text-muted)] font-normal">Total</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-[var(--glass-text-secondary)]">
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--badge-blue-bg)] text-[var(--badge-blue-text)] font-medium">
          <FileText className="w-3 h-3" /> Tugas
        </span>
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--badge-red-bg)] text-[var(--badge-red-text)] font-medium">
          <AlertTriangle className="w-3 h-3" /> Ujian
        </span>
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--badge-amber-bg)] text-[var(--badge-amber-text)] font-medium">
          <Zap className="w-3 h-3" /> Kuis
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid - Takes 2 columns on large screens */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-4 md:p-6">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map((d) => (
                <div key={d} className="text-center text-xs font-semibold text-[var(--glass-text-secondary)] py-2">
                  {d}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for offset */}
              {Array.from({ length: startDay }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}

              {days.map((day) => {
                const key = format(day, 'yyyy-MM-dd')
                const dayAssignments = assignmentsByDate[key] || []
                const isSelected = selectedDate && isSameDay(day, selectedDate)
                const today = isToday(day)

                // Determine if any assignment is urgent
                const hasUrgent = dayAssignments.some((a) => {
                  const diff = differenceInDays(new Date(a.dueDate), new Date())
                  return diff >= 0 && diff <= 2
                })

                return (
                  <motion.button
                    key={key}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedDate(day)}
                    className={`aspect-square rounded-xl p-1 flex flex-col items-center justify-center transition-all relative ${
                      isSelected
                        ? 'bg-gradient-to-br from-[#667eea] to-[#764ba2] shadow-lg shadow-purple-500/20 ring-2 ring-purple-400/30'
                        : today
                        ? 'bg-[var(--glass-hover-bg)] border-2 border-purple-500/30 ring-1 ring-purple-500/15'
                        : 'hover:bg-[var(--glass-hover-bg)] hover:border hover:border-[var(--glass-hover-border)]'
                    }`}
                  >
                    <span className={`text-xs font-semibold ${
                      isSelected ? 'text-white' : today ? 'text-[var(--glass-text)]' : 'text-[var(--glass-text-secondary)]'
                    }`}>
                      {format(day, 'd')}
                    </span>
                    {dayAssignments.length > 0 && (
                      <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center items-center">
                        {dayAssignments.slice(0, 3).map((a, i) => {
                          const style = TYPE_STYLES[a.type] || DEFAULT_STYLE
                          return (
                            <span
                              key={i}
                              className={`w-2 h-2 rounded-full ${style.dot} ${hasUrgent && !isSelected ? 'countdown-urgent' : ''}`}
                            />
                          )
                        })}
                        {/* Small colored type indicator dots alongside event dots */}
                        {dayAssignments.length > 3 && (
                          <span className={`text-[7px] font-bold ${isSelected ? 'text-white/80' : 'text-[var(--glass-text-muted)]'}`}>
                            +{dayAssignments.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Selected Date Details */}
          <AnimatePresence>
            {selectedDate && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="glass-card p-5 md:p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-[var(--glass-text)] text-sm flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    {format(selectedDate, 'EEEE, dd MMMM yyyy', { locale: localeId })}
                  </h3>
                  <button onClick={() => setSelectedDate(null)} className="text-[var(--glass-text-muted)] hover:text-[var(--glass-text)] transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {selectedDateAssignments.length > 0 ? (
                  <div className="space-y-2">
                    {selectedDateAssignments.map((a) => {
                      const style = TYPE_STYLES[a.type] || DEFAULT_STYLE
                      const TypeIcon = style.icon
                      const countdown = getCountdownInfo(new Date(a.dueDate))
                      const duration = getEventDuration(a.type, a.points)

                      return (
                        <div
                          key={a.id}
                          className={`interactive-card p-3 flex items-center gap-3 border-l-3 ${style.border}`}
                          onClick={() => setPage('assignment-detail', { id: a.id })}
                        >
                          <div className={`w-9 h-9 rounded-lg ${style.bg} flex items-center justify-center shrink-0`}>
                            <TypeIcon className={`w-4 h-4 ${style.text}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-[var(--glass-text)] font-medium truncate">{a.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-xs text-[var(--glass-text-muted)]">{a.class.name} • {a.points} poin</p>
                              <span className="event-duration">
                                <Clock className="event-duration-icon" />
                                {duration}
                              </span>
                            </div>
                          </div>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${countdown.bg} ${countdown.color} ${countdown.urgent ? 'countdown-urgent' : ''}`}>
                            {countdown.text}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-[var(--glass-text-muted)] text-sm text-center py-4">Tidak ada tugas pada tanggal ini</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar - Upcoming Events */}
        <div className="space-y-4 md:space-y-6">
          <div className="glass-card p-5 md:p-6">
            <h3 className="font-semibold text-[var(--glass-text)] text-sm flex items-center gap-2 mb-4">
              <Timer className="w-4 h-4 text-amber-600 dark:text-amber-400" /> Mendatang
            </h3>
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto custom-scrollbar">
              {upcomingAssignments.length > 0 ? (
                upcomingAssignments.map((a) => {
                  const style = TYPE_STYLES[a.type] || DEFAULT_STYLE
                  const TypeIcon = style.icon
                  const countdown = getCountdownInfo(new Date(a.dueDate))
                  const duration = getEventDuration(a.type, a.points)

                  return (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`interactive-card p-3 border-l-3 ${style.border}`}
                      onClick={() => setPage('assignment-detail', { id: a.id })}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className={`w-8 h-8 rounded-lg ${style.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                          <TypeIcon className={`w-3.5 h-3.5 ${style.text}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[var(--glass-text)] font-medium truncate">{a.title}</p>
                          <p className="text-xs text-[var(--glass-text-muted)]">{a.class.name}</p>
                          <div className="flex items-center justify-between mt-1.5">
                            <span className="text-xs text-[var(--glass-text-muted)] flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(a.dueDate), 'dd MMM', { locale: localeId })}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="event-duration">
                                <Clock className="event-duration-icon" />
                                {duration}
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${countdown.bg} ${countdown.color} ${countdown.urgent ? 'countdown-urgent' : ''}`}>
                                {countdown.text}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })
              ) : (
                <div className="empty-state py-8">
                  <CalendarIcon className="w-10 h-10 mb-2" />
                  <p className="text-sm">Tidak ada tugas mendatang</p>
                </div>
              )}
            </div>
          </div>

          {/* Stats mini card */}
          <div className="glass-card p-5 md:p-6">
            <h3 className="font-semibold text-[var(--glass-text)] text-sm mb-3">Ringkasan Bulan Ini</h3>
            <div className="space-y-2.5">
              {[
                { label: 'Tugas', count: monthlyStats.tugas, color: 'bg-blue-500', bg: 'bg-[var(--badge-blue-bg)]', text: 'text-[var(--badge-blue-text)]' },
                { label: 'Ujian', count: monthlyStats.ujian, color: 'bg-red-500', bg: 'bg-[var(--badge-red-bg)]', text: 'text-[var(--badge-red-text)]' },
                { label: 'Kuis', count: monthlyStats.kuis, color: 'bg-amber-500', bg: 'bg-[var(--badge-amber-bg)]', text: 'text-[var(--badge-amber-text)]' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                    <span className="text-xs text-[var(--glass-text-secondary)]">{item.label}</span>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${item.bg} ${item.text}`}>
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
