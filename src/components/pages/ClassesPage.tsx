'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, Plus, Search, Users, Hash, GraduationCap,
  Palette, Calculator, FlaskConical, Globe, BookMarked, Code
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

interface ClassItem {
  id: string
  name: string
  description?: string
  code: string
  subject?: { name: string; code?: string }
  creator: { name: string }
  _count?: { classUsers: number; assignments: number }
}

const SUBJECT_ICONS: Record<string, React.ElementType> = {
  matematika: Calculator,
  fisika: FlaskConical,
  kimia: FlaskConical,
  biologi: GraduationCap,
  bahasa: BookMarked,
  inggris: Globe,
  komputer: Code,
  seni: Palette,
  default: BookOpen,
}

function getSubjectIcon(subjectName?: string) {
  if (!subjectName) return SUBJECT_ICONS.default
  const lower = subjectName.toLowerCase()
  for (const [key, Icon] of Object.entries(SUBJECT_ICONS)) {
    if (key !== 'default' && lower.includes(key)) return Icon
  }
  return SUBJECT_ICONS.default
}

const GRADIENT_COLORS = [
  'from-blue-500/20 to-cyan-500/20',
  'from-purple-500/20 to-pink-500/20',
  'from-amber-500/20 to-orange-500/20',
  'from-emerald-500/20 to-green-500/20',
  'from-rose-500/20 to-pink-500/20',
  'from-cyan-500/20 to-teal-500/20',
]

export default function ClassesPage() {
  const { user, setPage } = useAppStore()
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [newClass, setNewClass] = useState({ name: '', description: '', subjectId: '' })

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
      setNewClass({ name: '', description: '', subjectId: '' })
      toast.success('Kelas berhasil dibuat!')
    } catch {
      toast.error('Terjadi kesalahan')
    }
  }, [newClass])

  const handleJoin = useCallback(async () => {
    if (!joinCode.trim()) {
      toast.error('Masukkan kode kelas')
      return
    }
    try {
      const res = await fetch('/api/classes/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: joinCode }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Gagal bergabung')
        return
      }
      setClasses((prev) => [data, ...prev])
      setShowJoin(false)
      setJoinCode('')
      toast.success('Berhasil bergabung ke kelas!')
    } catch {
      toast.error('Terjadi kesalahan')
    }
  }, [joinCode])

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

      {/* Search & Filter */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--glass-text-muted)]" />
        <input
          type="text"
          placeholder="Cari kelas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="glass-input pl-10"
        />
      </div>

      {/* Class Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filtered.map((cls, idx) => {
            const Icon = getSubjectIcon(cls.subject?.name)
            const gradient = GRADIENT_COLORS[idx % GRADIENT_COLORS.length]
            return (
              <motion.div
                key={cls.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: idx * 0.05 }}
                className="class-card cursor-pointer"
                onClick={() => setPage('class-detail', { id: cls.id })}
              >
                <div className={`h-24 bg-gradient-to-br ${gradient} flex items-center justify-center relative`}>
                  <Icon className="w-10 h-10 text-[var(--glass-text-muted)]" />
                  <div className="absolute top-3 right-3 bg-[var(--chip-bg)] backdrop-blur-sm rounded-lg px-2 py-0.5 text-xs text-[var(--glass-text-secondary)]">
                    {cls.code}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-[var(--glass-text)] text-sm truncate">{cls.name}</h3>
                  {cls.subject && (
                    <p className="text-xs text-[var(--glass-text-secondary)] mt-0.5">{cls.subject.name}</p>
                  )}
                  {cls.description && (
                    <p className="text-xs text-[var(--glass-text-muted)] mt-1 line-clamp-2">{cls.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--glass-border)]">
                    <span className="text-xs text-[var(--glass-text-muted)] flex items-center gap-1">
                      <Users className="w-3 h-3" /> {cls._count?.classUsers || 0} anggota
                    </span>
                    <span className="text-xs text-[var(--glass-text-muted)]">
                      {cls._count?.assignments || 0} tugas
                    </span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filtered.length === 0 && !loading && (
        <div className="empty-state py-16">
          <BookOpen className="w-16 h-16 mb-4" />
          <h3 className="text-lg font-medium text-[var(--glass-text-secondary)] mb-2">
            {search ? 'Tidak ada kelas ditemukan' : 'Belum ada kelas'}
          </h3>
          <p className="text-[var(--glass-text-muted)] text-sm">
            {search ? 'Coba kata kunci lain' : 'Buat atau gabung ke kelas untuk memulai'}
          </p>
        </div>
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
              className="gradient-border w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="glass-card p-6 space-y-4">
                <h2 className="text-lg font-semibold text-[var(--glass-text)]">Buat Kelas Baru</h2>
                <input
                  type="text"
                  placeholder="Nama Kelas"
                  value={newClass.name}
                  onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                  className="glass-input"
                />
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
                  <button onClick={handleJoin} className="btn-gradient text-sm">Gabung</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
