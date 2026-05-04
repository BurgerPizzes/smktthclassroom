'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus,
  Clock, MapPin, BookOpen, User as UserIcon, X, Trash2
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

interface ScheduleItem {
  id: string
  classId: string
  subject: string
  dayOfWeek: number
  startTime: string
  endTime: string
  room: string | null
  createdBy: string
  class: { id: string; name: string }
  user: { id: string; name: string }
}

const DAY_NAMES = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']
const TIME_SLOTS = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'
]

const SUBJECT_COLORS = [
  { bg: 'rgba(102, 126, 234, 0.15)', border: '#667eea', text: '#667eea' },
  { bg: 'rgba(168, 85, 247, 0.15)', border: '#a855f7', text: '#a855f7' },
  { bg: 'rgba(34, 197, 94, 0.15)', border: '#22c55e', text: '#16a34a' },
  { bg: 'rgba(245, 158, 11, 0.15)', border: '#f59e0b', text: '#d97706' },
  { bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444', text: '#dc2626' },
  { bg: 'rgba(6, 182, 212, 0.15)', border: '#06b6d4', text: '#0891b2' },
  { bg: 'rgba(249, 115, 22, 0.15)', border: '#f97316', text: '#ea580c' },
  { bg: 'rgba(236, 72, 153, 0.15)', border: '#ec4899', text: '#db2777' },
]

function getSubjectColor(subject: string) {
  let hash = 0
  for (let i = 0; i < subject.length; i++) {
    hash = subject.charCodeAt(i) + ((hash << 5) - hash)
  }
  return SUBJECT_COLORS[Math.abs(hash) % SUBJECT_COLORS.length]
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function minutesToSlotIndex(minutes: number): number {
  return Math.floor((minutes - 420) / 60) // 420 = 07:00
}

export default function SchedulePage() {
  const { user } = useAppStore()
  const [schedules, setSchedules] = useState<ScheduleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [weekOffset, setWeekOffset] = useState(0)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [addSlot, setAddSlot] = useState<{ day: number; time: string } | null>(null)
  const [mobileDay, setMobileDay] = useState(() => {
    const d = new Date().getDay()
    return d === 0 ? 6 : d - 1 // Convert Sunday=0 to index 6, Monday=0 to index 0
  })
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([])

  // Form state
  const [formSubject, setFormSubject] = useState('')
  const [formClassId, setFormClassId] = useState('')
  const [formDay, setFormDay] = useState(1)
  const [formStartTime, setFormStartTime] = useState('07:00')
  const [formEndTime, setFormEndTime] = useState('08:30')
  const [formRoom, setFormRoom] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const canAddSchedule = user?.role === 'guru' || user?.role === 'admin'

  const fetchSchedules = useCallback(async () => {
    try {
      const res = await fetch('/api/schedule')
      if (res.ok) {
        const data = await res.json()
        setSchedules(data)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchClasses = useCallback(async () => {
    if (!canAddSchedule) return
    try {
      const res = await fetch('/api/classes')
      if (res.ok) {
        const data = await res.json()
        setClasses(data.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })))
      }
    } catch {
      // silently fail
    }
  }, [canAddSchedule])

  useEffect(() => {
    fetchSchedules()
    fetchClasses()
  }, [fetchSchedules, fetchClasses])

  // Current time indicator
  const [currentTime, setCurrentTime] = useState(new Date())
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  // Get the current day of week (1=Senin, 7=Minggu)
  const todayDayOfWeek = useMemo(() => {
    const d = currentTime.getDay()
    return d === 0 ? 7 : d
  }, [currentTime])

  // Week label
  const weekLabel = useMemo(() => {
    const baseDate = new Date()
    baseDate.setDate(baseDate.getDate() + weekOffset * 7)
    const startOfWeek = new Date(baseDate)
    const day = startOfWeek.getDay()
    const diff = day === 0 ? -6 : 1 - day
    startOfWeek.setDate(startOfWeek.getDate() + diff)

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(endOfWeek.getDate() + 4) // Monday to Friday

    const fmt = (d: Date) =>
      d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })

    if (weekOffset === 0) return `Minggu Ini (${fmt(startOfWeek)} - ${fmt(endOfWeek)})`
    if (weekOffset === 1) return `Minggu Depan (${fmt(startOfWeek)} - ${fmt(endOfWeek)})`
    if (weekOffset === -1) return `Minggu Lalu (${fmt(startOfWeek)} - ${fmt(endOfWeek)})`
    return `${fmt(startOfWeek)} - ${fmt(endOfWeek)}`
  }, [weekOffset])

  // Current time position in the grid
  const currentTimePosition = useMemo(() => {
    const now = currentTime
    const minutes = now.getHours() * 60 + now.getMinutes()
    if (minutes < 420 || minutes > 900) return null // Outside 07:00-15:00
    return ((minutes - 420) / 60) * 100 // percentage within time range
  }, [currentTime])

  // Organize schedules by day and time
  const scheduleMap = useMemo(() => {
    const map: Record<string, ScheduleItem[]> = {}
    schedules.forEach((s) => {
      const key = `${s.dayOfWeek}`
      if (!map[key]) map[key] = []
      map[key].push(s)
    })
    return map
  }, [schedules])

  // Find overlapping schedules for a day
  const getScheduleBlocks = useCallback(
    (dayOfWeek: number) => {
      const daySchedules = scheduleMap[dayOfWeek] || []
      return daySchedules.map((s) => {
        const startMin = timeToMinutes(s.startTime)
        const endMin = timeToMinutes(s.endTime)
        const startSlot = minutesToSlotIndex(startMin)
        const durationSlots = Math.max(1, Math.ceil((endMin - startMin) / 60))
        const color = getSubjectColor(s.subject)
        return { ...s, startSlot, durationSlots, color }
      })
    },
    [scheduleMap]
  )

  const handleAddSchedule = async () => {
    if (!formSubject || !formClassId || !formStartTime || !formEndTime) {
      toast.error('Harap isi semua field yang wajib')
      return
    }

    if (timeToMinutes(formEndTime) <= timeToMinutes(formStartTime)) {
      toast.error('Waktu selesai harus setelah waktu mulai')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: formClassId,
          subject: formSubject,
          dayOfWeek: formDay,
          startTime: formStartTime,
          endTime: formEndTime,
          room: formRoom || null,
        }),
      })

      if (res.ok) {
        toast.success('Jadwal berhasil ditambahkan')
        setShowAddDialog(false)
        setAddSlot(null)
        setFormSubject('')
        setFormRoom('')
        fetchSchedules()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal menambah jadwal')
      }
    } catch {
      toast.error('Gagal menambah jadwal')
    } finally {
      setSubmitting(false)
    }
  }

  const openAddDialog = (day: number, time: string) => {
    setFormDay(day)
    setFormStartTime(time)
    setFormEndTime(
      (() => {
        const [h, m] = time.split(':').map(Number)
        const newH = h + 1
        return `${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      })()
    )
    setAddSlot({ day, time })
    setShowAddDialog(true)
  }

  const isSlotOccupied = (dayOfWeek: number, slotIndex: number) => {
    const daySchedules = scheduleMap[dayOfWeek] || []
    return daySchedules.some((s) => {
      const startMin = timeToMinutes(s.startTime)
      const endMin = timeToMinutes(s.endTime)
      const slotStart = 420 + slotIndex * 60
      const slotEnd = slotStart + 60
      return startMin < slotEnd && endMin > slotStart
    })
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="skeleton h-10 w-48 rounded-xl" />
        <div className="glass-card p-6">
          <div className="skeleton h-96 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--glass-text)]">
            <span className="gradient-text">Jadwal Pelajaran</span>
          </h1>
          <p className="text-[var(--glass-text-secondary)] text-sm mt-1">
            Jadwal kelas mingguan
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setWeekOffset((prev) => prev - 1)}
            className="glass-btn p-2 rounded-lg"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[var(--glass-text)] font-medium text-sm min-w-[200px] text-center">
            {weekLabel}
          </span>
          <button
            onClick={() => setWeekOffset((prev) => prev + 1)}
            className="glass-btn p-2 rounded-lg"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="btn-glass px-3 py-1.5 text-xs"
            >
              Hari Ini
            </button>
          )}
          {canAddSchedule && (
            <button
              onClick={() => {
                setAddSlot(null)
                setFormDay(todayDayOfWeek)
                setFormStartTime('07:00')
                setFormEndTime('08:30')
                setShowAddDialog(true)
              }}
              className="btn-gradient px-4 py-2 text-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Tambah Jadwal
            </button>
          )}
        </div>
      </div>

      {/* Mobile Day Tabs */}
      <div className="flex gap-1 overflow-x-auto lg:hidden pb-1">
        {DAY_NAMES.slice(0, 6).map((name, i) => {
          const dayNum = i + 1
          const isToday = weekOffset === 0 && dayNum === todayDayOfWeek
          const isActive = mobileDay === i
          return (
            <button
              key={name}
              onClick={() => setMobileDay(i)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-lg shadow-purple-500/20'
                  : isToday
                  ? 'bg-[var(--glass-hover-bg)] text-[var(--glass-text)] border border-[var(--glass-hover-border)]'
                  : 'glass-btn text-[var(--glass-text-secondary)]'
              }`}
            >
              {name}
              {isToday && (
                <span className="ml-1 w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />
              )}
            </button>
          )
        })}
      </div>

      {/* Desktop Weekly Grid */}
      <div className="hidden lg:block glass-card p-4 overflow-x-auto custom-scrollbar">
        <div className="min-w-[900px]">
          {/* Header Row */}
          <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-1 mb-2">
            <div className="text-xs font-medium text-[var(--glass-text-muted)] text-center py-2">
              Waktu
            </div>
            {DAY_NAMES.map((name, i) => {
              const dayNum = i + 1
              const isToday = weekOffset === 0 && dayNum === todayDayOfWeek
              return (
                <div
                  key={name}
                  className={`text-xs font-medium text-center py-2 rounded-t-lg ${
                    isToday
                      ? 'bg-gradient-to-r from-[#667eea]/10 to-[#764ba2]/10 text-[#667eea]'
                      : 'text-[var(--glass-text-muted)]'
                  }`}
                >
                  {name}
                  {isToday && (
                    <span className="block text-[10px] text-green-500 mt-0.5">Hari Ini</span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Time Rows */}
          <div className="relative">
            {TIME_SLOTS.slice(0, -1).map((time, slotIndex) => {
              const nextTime = TIME_SLOTS[slotIndex + 1]
              return (
                <div
                  key={time}
                  className="grid grid-cols-[80px_repeat(7,1fr)] gap-1 border-b border-[var(--glass-border)]/30 last:border-b-0"
                >
                  {/* Time Label */}
                  <div className="text-xs text-[var(--glass-text-muted)] text-center py-3 flex flex-col items-center justify-start">
                    <span className="font-medium">{time}</span>
                  </div>

                  {/* Day Cells */}
                  {DAY_NAMES.map((_, dayIndex) => {
                    const dayNum = dayIndex + 1
                    const isToday = weekOffset === 0 && dayNum === todayDayOfWeek
                    const blocks = getScheduleBlocks(dayNum)
                    const block = blocks.find((b) => {
                      const slotStart = slotIndex
                      return b.startSlot === slotIndex
                    })
                    const occupied = isSlotOccupied(dayNum, slotIndex)
                    const isContinuation = blocks.some((b) => {
                      return b.startSlot < slotIndex && b.startSlot + b.durationSlots > slotIndex
                    })

                    // Current time indicator
                    const showTimeLine =
                      isToday &&
                      currentTimePosition !== null &&
                      slotIndex === Math.floor(currentTimePosition / 100)

                    return (
                      <div
                        key={dayIndex}
                        className={`relative min-h-[64px] p-1 transition-colors ${
                          isToday
                            ? 'bg-gradient-to-b from-[#667eea]/5 to-[#764ba2]/5'
                            : ''
                        } ${isContinuation ? 'overflow-visible' : ''}`}
                      >
                        {block && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute inset-x-1 top-1 rounded-lg p-2 z-10 overflow-hidden"
                            style={{
                              top: '4px',
                              height: `calc(${block.durationSlots * 64 - 8}px)`,
                              background: block.color.bg,
                              borderLeft: `3px solid ${block.color.border}`,
                            }}
                          >
                            <p
                              className="text-xs font-semibold truncate"
                              style={{ color: block.color.text }}
                            >
                              {block.subject}
                            </p>
                            <p className="text-[10px] text-[var(--glass-text-secondary)] truncate mt-0.5">
                              {block.class.name}
                            </p>
                            {block.room && (
                              <p className="text-[10px] text-[var(--glass-text-muted)] truncate flex items-center gap-1 mt-0.5">
                                <MapPin className="w-2.5 h-2.5" /> {block.room}
                              </p>
                            )}
                            <p className="text-[10px] text-[var(--glass-text-muted)] truncate flex items-center gap-1">
                              <UserIcon className="w-2.5 h-2.5" /> {block.user.name}
                            </p>
                          </motion.div>
                        )}

                        {/* "+" button for empty slots */}
                        {canAddSchedule && !block && !isContinuation && !occupied && (
                          <button
                            onClick={() => openAddDialog(dayNum, time)}
                            className="absolute inset-1 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-lg hover:bg-[var(--glass-hover-bg)] group"
                          >
                            <Plus className="w-4 h-4 text-[var(--glass-text-muted)] group-hover:text-[#667eea]" />
                          </button>
                        )}

                        {/* Current time line */}
                        {showTimeLine && (
                          <div
                            className="absolute left-0 right-0 h-0.5 bg-red-500 z-20"
                            style={{
                              top: `${currentTimePosition % 100}%`,
                            }}
                          >
                            <div className="absolute -left-1 -top-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Mobile Day View */}
      <div className="lg:hidden space-y-3">
        {(() => {
          const dayNum = mobileDay + 1
          const blocks = getScheduleBlocks(dayNum)
          const isToday = weekOffset === 0 && dayNum === todayDayOfWeek

          return (
            <div>
              {isToday && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="status-dot-success" />
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                    Hari Ini
                  </span>
                </div>
              )}

              {TIME_SLOTS.slice(0, -1).map((time, slotIndex) => {
                const block = blocks.find((b) => b.startSlot === slotIndex)
                const isContinuation = blocks.some(
                  (b) => b.startSlot < slotIndex && b.startSlot + b.durationSlots > slotIndex
                )

                if (isContinuation) return null

                return (
                  <div key={time} className="flex gap-3 mb-2">
                    {/* Time */}
                    <div className="w-14 flex-shrink-0 text-xs text-[var(--glass-text-muted)] pt-2 font-medium">
                      {time}
                    </div>

                    {/* Content */}
                    {block ? (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex-1 rounded-xl p-3 mb-1"
                        style={{
                          background: block.color.bg,
                          borderLeft: `4px solid ${block.color.border}`,
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p
                              className="text-sm font-semibold"
                              style={{ color: block.color.text }}
                            >
                              {block.subject}
                            </p>
                            <p className="text-xs text-[var(--glass-text-secondary)] mt-1 flex items-center gap-1">
                              <BookOpen className="w-3 h-3" /> {block.class.name}
                            </p>
                            <div className="flex flex-wrap gap-3 mt-1.5">
                              <p className="text-xs text-[var(--glass-text-muted)] flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {block.startTime} - {block.endTime}
                              </p>
                              {block.room && (
                                <p className="text-xs text-[var(--glass-text-muted)] flex items-center gap-1">
                                  <MapPin className="w-3 h-3" /> {block.room}
                                </p>
                              )}
                              <p className="text-xs text-[var(--glass-text-muted)] flex items-center gap-1">
                                <UserIcon className="w-3 h-3" /> {block.user.name}
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="flex-1 rounded-xl p-3 mb-1 border border-dashed border-[var(--glass-border)] flex items-center justify-center min-h-[48px]">
                        {canAddSchedule ? (
                          <button
                            onClick={() => openAddDialog(dayNum, time)}
                            className="text-[var(--glass-text-muted)] hover:text-[#667eea] transition-colors flex items-center gap-1 text-xs"
                          >
                            <Plus className="w-3 h-3" /> Tambah
                          </button>
                        ) : (
                          <span className="text-xs text-[var(--glass-text-muted)]">Kosong</span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}

              {blocks.length === 0 && (
                <div className="empty-state py-12">
                  <CalendarIcon className="w-12 h-12 mb-3 text-[var(--glass-text-muted)]" />
                  <p className="text-[var(--glass-text-muted)] text-sm">
                    Tidak ada jadwal untuk hari {DAY_NAMES[mobileDay]}
                  </p>
                </div>
              )}
            </div>
          )
        })()}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {schedules.length > 0 &&
          [...new Set(schedules.map((s) => s.class.name))].map((className) => {
            const classSchedules = schedules.filter((s) => s.class.name === className)
            const subjects = [...new Set(classSchedules.map((s) => s.subject))]
            const color = getSubjectColor(className)

            return (
              <motion.div
                key={className}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card-glow p-4"
                style={{ borderLeft: `3px solid ${color.border}` }}
              >
                <h3 className="font-semibold text-sm text-[var(--glass-text)]">{className}</h3>
                <p className="text-xs text-[var(--glass-text-muted)] mt-1">
                  {classSchedules.length} jadwal • {subjects.length} mata pelajaran
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {subjects.map((sub) => (
                    <span
                      key={sub}
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{
                        background: getSubjectColor(sub).bg,
                        color: getSubjectColor(sub).text,
                      }}
                    >
                      {sub}
                    </span>
                  ))}
                </div>
              </motion.div>
            )
          })}
      </div>

      {/* Add Schedule Dialog */}
      <AnimatePresence>
        {showAddDialog && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => {
                setShowAddDialog(false)
                setAddSlot(null)
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-[10%] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md z-50 glass-card p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold gradient-text">Tambah Jadwal</h3>
                <button
                  onClick={() => {
                    setShowAddDialog(false)
                    setAddSlot(null)
                  }}
                  className="text-[var(--glass-text-muted)] hover:text-[var(--glass-text)] p-1 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Class */}
                <div>
                  <label className="text-xs font-medium text-[var(--glass-text-secondary)] mb-1 block">
                    Kelas *
                  </label>
                  <select
                    value={formClassId}
                    onChange={(e) => setFormClassId(e.target.value)}
                    className="glass-input text-sm"
                  >
                    <option value="">Pilih kelas</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subject */}
                <div>
                  <label className="text-xs font-medium text-[var(--glass-text-secondary)] mb-1 block">
                    Mata Pelajaran *
                  </label>
                  <input
                    type="text"
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    placeholder="Contoh: Pemrograman Web"
                    className="glass-input text-sm"
                  />
                </div>

                {/* Day */}
                <div>
                  <label className="text-xs font-medium text-[var(--glass-text-secondary)] mb-1 block">
                    Hari *
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {DAY_NAMES.slice(0, 6).map((name, i) => (
                      <button
                        key={name}
                        onClick={() => setFormDay(i + 1)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          formDay === i + 1
                            ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white'
                            : 'glass-btn text-[var(--glass-text-secondary)]'
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-[var(--glass-text-secondary)] mb-1 block">
                      Mulai *
                    </label>
                    <input
                      type="time"
                      value={formStartTime}
                      onChange={(e) => setFormStartTime(e.target.value)}
                      className="glass-input text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--glass-text-secondary)] mb-1 block">
                      Selesai *
                    </label>
                    <input
                      type="time"
                      value={formEndTime}
                      onChange={(e) => setFormEndTime(e.target.value)}
                      className="glass-input text-sm"
                    />
                  </div>
                </div>

                {/* Room */}
                <div>
                  <label className="text-xs font-medium text-[var(--glass-text-secondary)] mb-1 block">
                    Ruangan
                  </label>
                  <input
                    type="text"
                    value={formRoom}
                    onChange={(e) => setFormRoom(e.target.value)}
                    placeholder="Contoh: Lab RPL 1"
                    className="glass-input text-sm"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowAddDialog(false)
                      setAddSlot(null)
                    }}
                    className="flex-1 glass-btn py-2.5 text-sm"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleAddSchedule}
                    disabled={submitting}
                    className="flex-1 btn-gradient py-2.5 text-sm disabled:opacity-50"
                  >
                    {submitting ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
