'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, Plus, Search, Users, Hash, GraduationCap,
  Palette, Calculator, FlaskConical, Globe, BookMarked, Code,
  Zap, ArrowRight, Music, Dumbbell, Monitor, Microscope,
  LogOut, Trash2
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

interface ClassUser {
  user: {
    id: string
    name: string
    email: string
    avatar?: string | null
  }
  role: string
}

interface ClassItem {
  id: string
  name: string
  description?: string
  code: string
  grade?: number
  direction?: string
  subject?: { name: string; code?: string }
  creator?: { id: string; name: string }
  classUsers?: ClassUser[]
  _count?: { classUsers: number; assignments: number }
}

const SUBJECT_ICONS: Record<string, React.ElementType> = {
  matematika: Calculator,
  fisika: Microscope,
  kimia: FlaskConical,
  biologi: GraduationCap,
  bahasa: BookMarked,
  inggris: Globe,
  komputer: Code,
  seni: Palette,
  olahraga: Dumbbell,
  musik: Music,
  tik: Monitor,
  default: BookOpen,
}

const SUBJECT_COLORS: Record<string, { gradient: string; accent: string; iconBg: string; subjectClass: string }> = {
  matematika: { gradient: 'from-blue-500/20 to-cyan-500/20', accent: 'border-l-blue-500', iconBg: 'bg-blue-500', subjectClass: 'subject-blue' },
  fisika: { gradient: 'from-red-500/20 to-orange-500/20', accent: 'border-l-red-500', iconBg: 'bg-red-500', subjectClass: 'subject-rose' },
  kimia: { gradient: 'from-green-500/20 to-emerald-500/20', accent: 'border-l-green-500', iconBg: 'bg-green-500', subjectClass: 'subject-green' },
  biologi: { gradient: 'from-teal-500/20 to-cyan-500/20', accent: 'border-l-teal-500', iconBg: 'bg-teal-500', subjectClass: 'subject-teal' },
  bahasa: { gradient: 'from-amber-500/20 to-yellow-500/20', accent: 'border-l-amber-500', iconBg: 'bg-amber-500', subjectClass: 'subject-amber' },
  inggris: { gradient: 'from-rose-500/20 to-pink-500/20', accent: 'border-l-rose-500', iconBg: 'bg-rose-500', subjectClass: 'subject-rose' },
  komputer: { gradient: 'from-indigo-500/20 to-violet-500/20', accent: 'border-l-indigo-500', iconBg: 'bg-indigo-500', subjectClass: 'subject-indigo' },
  seni: { gradient: 'from-pink-500/20 to-fuchsia-500/20', accent: 'border-l-pink-500', iconBg: 'bg-pink-500', subjectClass: 'subject-pink' },
  olahraga: { gradient: 'from-orange-500/20 to-red-500/20', accent: 'border-l-orange-500', iconBg: 'bg-orange-500', subjectClass: 'subject-orange' },
  tik: { gradient: 'from-cyan-500/20 to-sky-500/20', accent: 'border-l-cyan-500', iconBg: 'bg-cyan-500', subjectClass: 'subject-cyan' },
  musik: { gradient: 'from-purple-500/20 to-fuchsia-500/20', accent: 'border-l-purple-500', iconBg: 'bg-purple-500', subjectClass: 'subject-purple' },
  default: { gradient: 'from-gray-500/20 to-slate-500/20', accent: 'border-l-gray-500', iconBg: 'bg-gray-500', subjectClass: '' },
}

function getSubjectIcon(subjectName?: string) {
  if (!subjectName) return SUBJECT_ICONS.default
  const lower = subjectName.toLowerCase()
  for (const [key, Icon] of Object.entries(SUBJECT_ICONS)) {
    if (key !== 'default' && lower.includes(key)) return Icon
  }
  return SUBJECT_ICONS.default
}

function getSubjectColor(subjectName?: string) {
  if (!subjectName) return SUBJECT_COLORS.default
  const lower = subjectName.toLowerCase()
  for (const [key, color] of Object.entries(SUBJECT_COLORS)) {
    if (key !== 'default' && lower.includes(key)) return color
  }
  return SUBJECT_COLORS.default
}

const FALLBACK_COLORS = [
  { gradient: 'from-blue-500/20 to-cyan-500/20', accent: 'border-l-blue-500', iconBg: 'bg-blue-500' },
  { gradient: 'from-purple-500/20 to-pink-500/20', accent: 'border-l-purple-500', iconBg: 'bg-purple-500' },
  { gradient: 'from-amber-500/20 to-orange-500/20', accent: 'border-l-amber-500', iconBg: 'bg-amber-500' },
  { gradient: 'from-emerald-500/20 to-green-500/20', accent: 'border-l-emerald-500', iconBg: 'bg-emerald-500' },
  { gradient: 'from-rose-500/20 to-pink-500/20', accent: 'border-l-rose-500', iconBg: 'bg-rose-500' },
  { gradient: 'from-cyan-500/20 to-teal-500/20', accent: 'border-l-cyan-500', iconBg: 'bg-cyan-500' },
]

function getAvatarColor(name: string) {
  const colors = [
    'from-blue-500 to-cyan-500',
    'from-purple-500 to-pink-500',
    'from-amber-500 to-orange-500',
    'from-emerald-500 to-green-500',
    'from-rose-500 to-pink-500',
    'from-cyan-500 to-teal-500',
    'from-indigo-500 to-purple-500',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export default function ClassesPage() {
  const { user, setPage } = useAppStore()
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [newClass, setNewClass] = useState({ name: '', description: '', subjectId: '', code: '', grade: 10, direction: 'RPL' })
  const [subjects, setSubjects] = useState<Array<{id: string; name: string; code?: string}>>([])
  const [quickJoinCode, setQuickJoinCode] = useState('')
  const [leavingClassId, setLeavingClassId] = useState<string | null>(null)

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await fetch('/api/classes')
        if (res.ok) {
          const json = await res.json()
          setClasses(json)
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchClasses()
  }, [])

  // Fetch subjects for class creation
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await fetch('/api/subjects')
        if (res.ok) {
          const data = await res.json()
          setSubjects(data.subjects || [])
        }
      } catch {
        // silently fail
      }
    }
    fetchSubjects()
  }, [])

  const handleCreate = useCallback(async () => {
    if (!newClass.name.trim()) {
      toast.error('Nama kelas wajib diisi')
      return
    }
    try {
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClass),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Gagal membuat kelas')
        return
      }
      setClasses((prev) => [data, ...prev])
      setShowCreate(false)
      setNewClass({ name: '', description: '', subjectId: '', code: '', grade: 10, direction: 'RPL' })
      toast.success('Kelas berhasil dibuat!')
    } catch {
      toast.error('Terjadi kesalahan')
    }
  }, [newClass])

  const handleJoin = useCallback(async (code?: string) => {
    const codeToUse = code || joinCode.trim()
    if (!codeToUse) {
      toast.error('Masukkan kode kelas')
      return
    }
    try {
      const res = await fetch('/api/classes/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeToUse }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Gagal bergabung')
        return
      }
      setClasses((prev) => [data, ...prev])
      setShowJoin(false)
      setJoinCode('')
      setQuickJoinCode('')
      toast.success('Berhasil bergabung ke kelas!')
    } catch {
      toast.error('Terjadi kesalahan')
    }
  }, [joinCode])

  const handleLeaveClass = useCallback(async (classId: string, className: string) => {
    if (leavingClassId !== classId) {
      setLeavingClassId(classId)
      return
    }
    try {
      const res = await fetch(`/api/classes/${classId}/leave`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Gagal keluar dari kelas')
        return
      }
      toast.success(`Berhasil keluar dari ${className}`)
      setClasses(prev => prev.filter(c => c.id !== classId))
      setLeavingClassId(null)
    } catch {
      toast.error('Terjadi kesalahan')
    }
  }, [leavingClassId])

  const handleQuickJoin = useCallback(() => {
    if (quickJoinCode.trim()) {
      handleJoin(quickJoinCode.trim())
    }
  }, [quickJoinCode, handleJoin])

  const filtered = classes.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.subject?.name?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="skeleton h-10 w-48 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="class-card p-6 h-48">
              <div className="shimmer h-full rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--glass-text)]">
            <span className="gradient-text">Kelas</span> Saya
          </h1>
          <p className="text-[var(--glass-text-secondary)] text-sm mt-1">Kelola dan jelajahi kelas kamu</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowJoin(true)} className="btn-glass flex items-center gap-2 text-sm">
            <Hash className="w-4 h-4" /> Gabung
          </button>
          {(user?.role === 'guru' || user?.role === 'admin') && (
            <button onClick={() => setShowCreate(true)} className="btn-gradient flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> Buat Kelas
            </button>
          )}
        </div>
      </div>

      {/* Quick Join Section */}
      {user?.role === 'siswa' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card-glow p-5"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--glass-text)]">Gabung Kelas Cepat</p>
                <p className="text-xs text-[var(--glass-text-muted)]">Tempel kode kelas dari guru kamu</p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto sm:flex-1 sm:max-w-sm sm:ml-auto">
              <input
                type="text"
                placeholder="Kode kelas..."
                value={quickJoinCode}
                onChange={(e) => setQuickJoinCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => { if (e.key === 'Enter') handleQuickJoin() }}
                className="glass-input text-center tracking-widest font-mono text-sm py-2.5 flex-1"
              />
              <button
                onClick={handleQuickJoin}
                disabled={!quickJoinCode.trim()}
                className="btn-gradient text-sm px-5 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 whitespace-nowrap"
              >
                <ArrowRight className="w-4 h-4" /> Gabung
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Search & Filter */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--glass-text-muted)]" />
        <input
          type="text"
          placeholder="Cari kelas berdasarkan nama atau mata pelajaran..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="glass-input pl-10 py-2.5"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[var(--chip-bg)] flex items-center justify-center text-[var(--glass-text-muted)] hover:text-[var(--glass-text)] hover:bg-[var(--glass-hover-bg)] transition-all"
          >
            <span className="text-xs">\u2715</span>
          </button>
        )}
      </div>

      {/* Class Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <AnimatePresence>
          {filtered.map((cls, idx) => {
            const Icon = getSubjectIcon(cls.subject?.name)
            const subjectColor = getSubjectColor(cls.subject?.name)
            const fallbackColor = FALLBACK_COLORS[idx % FALLBACK_COLORS.length]
            const gradient = cls.subject ? subjectColor.gradient : fallbackColor.gradient
            const accentBorder = cls.subject ? subjectColor.accent : fallbackColor.accent
            const iconBg = cls.subject ? subjectColor.iconBg : fallbackColor.iconBg

            // Get members for avatar display (max 5 shown)
            const members = cls.classUsers || []
            const displayMembers = members.slice(0, 5)
            const extraCount = members.length > 5 ? members.length - 5 : 0

            return (
              <motion.div
                key={cls.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: idx * 0.05 }}
                className="class-card cursor-pointer border-l-4"
                style={{ borderLeftColor: `var(--subject-color, ${iconBg.replace('bg-', '').replace(/-\d+$/, '')})` }}
                onClick={() => setPage('class-detail', { id: cls.id })}
              >
                <div className={`h-24 bg-gradient-to-br ${gradient} flex items-center justify-center relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-[var(--glass-bg)] opacity-30" />
                  <div className={`w-14 h-14 rounded-2xl ${iconBg} flex items-center justify-center shadow-lg relative z-10`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="absolute top-3 right-3 bg-[var(--chip-bg)] backdrop-blur-sm rounded-lg px-2.5 py-1 text-xs text-[var(--glass-text-secondary)] font-mono font-medium z-10">
                    {cls.code}
                  </div>
                  {cls.grade && cls.direction && (
                    <div className="absolute top-3 left-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] backdrop-blur-sm rounded-lg px-2.5 py-1 text-xs text-white font-semibold z-10 shadow-md">
                      {cls.grade}-{cls.direction}
                    </div>
                  )}
                  {cls.subject && (
                    <div className="absolute bottom-3 left-3 text-xs text-[var(--glass-text-muted)] font-medium bg-[var(--chip-bg)] backdrop-blur-sm rounded-md px-2 py-0.5 z-10">
                      {cls.subject.name}
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-[var(--glass-text)] text-sm truncate">{cls.name}</h3>
                  {cls.description && (
                    <p className="text-xs text-[var(--glass-text-muted)] mt-1.5 line-clamp-2">{cls.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--glass-border)]">
                    {/* Stacked avatars */}
                    <div className="flex items-center gap-2">
                      {displayMembers.length > 0 ? (
                        <div className="avatar-stack">
                          {displayMembers.map((cu, i) => (
                            <div
                              key={cu.user.id}
                              className={`w-7 h-7 rounded-full bg-gradient-to-br ${getAvatarColor(cu.user.name)} flex items-center justify-center text-white text-[11px] font-bold ring-2 ring-[var(--glass-bg)]`}
                              title={cu.user.name}
                            >
                              {cu.user.avatar ? (
                                <img src={cu.user.avatar} alt={cu.user.name} className="w-full h-full rounded-full object-cover" />
                              ) : (
                                cu.user.name.charAt(0).toUpperCase()
                              )}
                            </div>
                          ))}
                          {extraCount > 0 && (
                            <div className="w-7 h-7 rounded-full bg-[var(--chip-bg)] flex items-center justify-center text-[var(--glass-text-muted)] text-[10px] font-medium ring-2 ring-[var(--glass-bg)]">
                              +{extraCount}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-[var(--glass-text-muted)] flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" /> {cls._count?.classUsers || 0} anggota
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--glass-text-muted)] flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" /> {cls._count?.assignments || 0} tugas
                      </span>
                      {user?.role === 'siswa' && cls.creator?.id !== user?.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleLeaveClass(cls.id, cls.name)
                          }}
                          className={`text-xs transition-colors flex items-center gap-0.5 ml-auto ${
                            leavingClassId === cls.id
                              ? 'text-red-400 font-medium'
                              : 'text-[var(--glass-text-muted)] hover:text-red-400'
                          }`}
                          title="Keluar dari kelas"
                        >
                          <LogOut className="w-3 h-3" /> {leavingClassId === cls.id ? 'Yakin?' : 'Keluar'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filtered.length === 0 && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="empty-state py-20"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--badge-purple-bg)] to-[var(--badge-blue-bg)] flex items-center justify-center mb-5">
            <BookOpen className="w-10 h-10 text-[var(--badge-purple-text)]" />
          </div>
          <h3 className="text-xl font-semibold text-[var(--glass-text)] mb-2">
            {search ? 'Tidak ada kelas ditemukan' : 'Belum ada kelas'}
          </h3>
          <p className="text-[var(--glass-text-muted)] text-sm max-w-sm mx-auto">
            {search ? 'Coba kata kunci lain atau kata kunci yang lebih umum' : 'Buat kelas baru atau gabung ke kelas yang sudah ada untuk mulai belajar'}
          </p>
          {!search && (
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button onClick={() => setShowJoin(true)} className="btn-glass text-sm flex items-center justify-center gap-2 px-5 py-2.5">
                <Hash className="w-4 h-4" /> Gabung Kelas
              </button>
              {(user?.role === 'guru' || user?.role === 'admin') && (
                <button onClick={() => setShowCreate(true)} className="btn-gradient text-sm flex items-center justify-center gap-2 px-5 py-2.5">
                  <Plus className="w-4 h-4" /> Buat Kelas Baru
                </button>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Create Class Dialog */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-bg)] backdrop-blur-sm p-4"
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="gradient-border w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="glass-card p-6 space-y-4 max-h-[85vh] overflow-y-auto custom-scrollbar">
                <h2 className="text-lg font-semibold text-[var(--glass-text)]">Buat Kelas Baru</h2>
                
                <input
                  type="text"
                  placeholder="Nama Kelas (contoh: XII-RPL-1)"
                  value={newClass.name}
                  onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                  className="glass-input"
                />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[var(--glass-text-muted)] mb-1.5 block">Kelas (Tingkat)</label>
                    <div className="flex gap-1.5">
                      {[10, 11, 12].map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setNewClass({ ...newClass, grade: g })}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                            newClass.grade === g
                              ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-md'
                              : 'glass-btn text-[var(--glass-text-secondary)]'
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-[var(--glass-text-muted)] mb-1.5 block">Jurusan / Arah</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {['RPL', 'TKJ', 'MM', 'AVI', 'EI'].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setNewClass({ ...newClass, direction: d })}
                          className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                            newClass.direction === d
                              ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-md'
                              : 'glass-btn text-[var(--glass-text-secondary)]'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-[var(--glass-text-muted)] mb-1.5 block">Mata Pelajaran</label>
                  <select
                    value={newClass.subjectId}
                    onChange={(e) => setNewClass({ ...newClass, subjectId: e.target.value })}
                    className="glass-input styled-select"
                  >
                    <option value="">Pilih Mata Pelajaran (opsional)</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-[var(--glass-text-muted)] mb-1.5 block">Kode Kelas</label>
                  <input
                    type="text"
                    placeholder="Kode kelas kustom (contoh: XII-RPL1) atau kosongkan untuk otomatis"
                    value={newClass.code}
                    onChange={(e) => setNewClass({ ...newClass, code: e.target.value.toUpperCase() })}
                    className="glass-input font-mono tracking-wider"
                    maxLength={12}
                  />
                  <p className="text-[10px] text-[var(--glass-text-muted)] mt-1">Biarkan kosong untuk kode otomatis</p>
                </div>

                <textarea
                  placeholder="Deskripsi (opsional)"
                  value={newClass.description}
                  onChange={(e) => setNewClass({ ...newClass, description: e.target.value })}
                  className="glass-input min-h-[80px] resize-none"
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowCreate(false)} className="btn-glass text-sm">Batal</button>
                  <button onClick={handleCreate} className="btn-gradient text-sm">Buat</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Join Class Dialog */}
      <AnimatePresence>
        {showJoin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-bg)] backdrop-blur-sm p-4"
            onClick={() => setShowJoin(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="gradient-border w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="glass-card p-6 space-y-4">
                <h2 className="text-lg font-semibold text-[var(--glass-text)]">Gabung Kelas</h2>
                <p className="text-sm text-[var(--glass-text-secondary)]">Masukkan kode kelas yang diberikan guru</p>
                <input
                  type="text"
                  placeholder="Kode Kelas (contoh: ABC123)"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="glass-input text-center text-lg tracking-widest font-mono"
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowJoin(false)} className="btn-glass text-sm">Batal</button>
                  <button onClick={() => handleJoin()} className="btn-gradient text-sm">Gabung</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
