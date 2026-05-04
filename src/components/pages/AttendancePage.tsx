'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  UserCheck, UserX, Clock, Calendar, CheckCircle2, XCircle,
  AlertCircle
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { format } from 'date-fns'
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

  const isGuru = user?.role === 'guru' || user?.role === 'admin'

  // Fetch teacher's classes
  useEffect(() => {
    if (!isGuru || !user) return
    const fetchClasses = async () => {
      try {
        const res = await fetch('/api/classes')
        if (res.ok) {
          const allClasses = await res.json()
          // Filter classes where the current user is a guru
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
      // Refresh data
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

      {/* Class selector & Date picker */}
      <div className="glass-card p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 flex-1">
          <Calendar className="w-5 h-5 text-[var(--glass-text-secondary)]" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="glass-input max-w-xs"
          />
        </div>
        <div className="flex items-center gap-2 flex-1">
          <span className="text-sm text-[var(--glass-text-secondary)]">Kelas:</span>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="glass-input flex-1"
          >
            <option value="">Pilih Kelas</option>
            {teacherClasses.map((cls) => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Attendance List */}
      <div className="glass-card p-5 space-y-3">
        <h2 className="font-semibold text-[var(--glass-text)] mb-4">
          Daftar Siswa {selectedClassId ? `- ${teacherClasses.find(c => c.id === selectedClassId)?.name || ''}` : ''}
        </h2>
        {selectedClassId && students.length > 0 ? (
          <>
            <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
              {students.map((s) => {
                const currentStatus = attendanceForm[s.id] || 'hadir'
                return (
                  <div key={s.id} className="interactive-card p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                        {s.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm text-[var(--glass-text)] font-medium">{s.name}</p>
                        <p className="text-xs text-[var(--glass-text-muted)]">{s.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {(['hadir', 'terlambat', 'tidak'] as const).map((status) => {
                        const isActive = currentStatus === status
                        const activeStyles: Record<string, string> = {
                          hadir: 'bg-emerald-500 text-white border-emerald-500',
                          terlambat: 'bg-amber-500 text-white border-amber-500',
                          tidak: 'bg-red-500 text-white border-red-500',
                        }
                        const inactiveStyles = 'bg-transparent text-[var(--glass-text-muted)] border-[var(--glass-border)] hover:bg-[var(--icon-btn-hover-bg)]'
                        return (
                          <button
                            key={status}
                            onClick={() => setAttendanceForm({ ...attendanceForm, [s.id]: status })}
                            className={`px-2 py-1 rounded-lg text-xs font-medium transition-all border ${
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
            <div className="pt-4">
              <button onClick={handleMarkAttendance} className="btn-gradient flex items-center gap-2 text-sm">
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
