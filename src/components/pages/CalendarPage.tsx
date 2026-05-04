'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon,
  FileText, Clock, X
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay, isToday } from 'date-fns'
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

const TYPE_COLORS: Record<string, string> = {
  tugas: 'bg-blue-500',
  ujian: 'bg-red-500',
  kuis: 'bg-amber-500',
  TUGAS: 'bg-blue-500',
  UJIAN: 'bg-red-500',
  KUIS: 'bg-amber-500',
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
            className="glass-btn p-2 rounded-lg"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[var(--glass-text)] font-medium min-w-[140px] text-center">
            {format(currentMonth, 'MMMM yyyy', { locale: localeId })}
          </span>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="glass-btn p-2 rounded-lg"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-[var(--glass-text-secondary)]">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Tugas</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Ujian</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Kuis</span>
      </div>

      {/* Calendar Grid */}
      <div className="glass-card p-4 md:p-6">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-[var(--glass-text-muted)] py-2">
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

            return (
              <motion.button
                key={key}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedDate(day)}
                className={`aspect-square rounded-lg p-1 flex flex-col items-center justify-center transition-all relative ${
                  isSelected
                    ? 'bg-gradient-to-br from-[#667eea] to-[#764ba2] shadow-lg shadow-purple-500/20'
                    : today
                    ? 'bg-[var(--glass-hover-bg)] border border-[var(--glass-border)]'
                    : 'hover:bg-[var(--glass-hover-bg)]'
                }`}
              >
                <span className={`text-xs font-medium ${
                  isSelected ? 'text-white' : today ? 'text-[var(--glass-text)]' : 'text-[var(--glass-text-secondary)]'
                }`}>
                  {format(day, 'd')}
                </span>
                {dayAssignments.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {dayAssignments.slice(0, 3).map((a, i) => (
                      <span
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full ${TYPE_COLORS[a.type] || 'bg-blue-500'}`}
                      />
                    ))}
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
            className="glass-card p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[var(--glass-text)] text-sm">
                {format(selectedDate, 'EEEE, dd MMMM yyyy', { locale: localeId })}
              </h3>
              <button onClick={() => setSelectedDate(null)} className="text-[var(--glass-text-muted)] hover:text-[var(--glass-text)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            {selectedDateAssignments.length > 0 ? (
              <div className="space-y-2">
                {selectedDateAssignments.map((a) => (
                  <div
                    key={a.id}
                    className="interactive-card p-3 flex items-center gap-3"
                    onClick={() => setPage('assignment-detail', { id: a.id })}
                  >
                    <div className={`w-1 h-8 rounded-full ${TYPE_COLORS[a.type] || 'bg-blue-500'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--glass-text)] font-medium truncate">{a.title}</p>
                      <p className="text-xs text-[var(--glass-text-muted)]">{a.class.name}</p>
                    </div>
                    <span className="text-xs text-[var(--glass-text-muted)]">{a.type.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[var(--glass-text-muted)] text-sm text-center py-4">Tidak ada tugas pada tanggal ini</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
