'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, Plus, Search, Pencil, Trash2, X, Hash,
  GraduationCap, FileText, AlertTriangle, Library,
  Calculator, FlaskConical, Globe, BookMarked, Code,
  Palette, Dumbbell, Music, Monitor, Microscope, Zap
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

interface SubjectItem {
  id: string
  name: string
  code?: string | null
  description?: string | null
  createdAt: string
  _count?: { classes: number; assignments: number }
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

const SUBJECT_COLORS: Record<string, { gradient: string; accent: string; iconBg: string }> = {
  matematika: { gradient: 'from-blue-500/20 to-cyan-500/20', accent: 'border-l-blue-500', iconBg: 'bg-blue-500' },
  fisika: { gradient: 'from-red-500/20 to-orange-500/20', accent: 'border-l-red-500', iconBg: 'bg-red-500' },
  kimia: { gradient: 'from-green-500/20 to-emerald-500/20', accent: 'border-l-green-500', iconBg: 'bg-green-500' },
  biologi: { gradient: 'from-teal-500/20 to-cyan-500/20', accent: 'border-l-teal-500', iconBg: 'bg-teal-500' },
  bahasa: { gradient: 'from-amber-500/20 to-yellow-500/20', accent: 'border-l-amber-500', iconBg: 'bg-amber-500' },
  inggris: { gradient: 'from-rose-500/20 to-pink-500/20', accent: 'border-l-rose-500', iconBg: 'bg-rose-500' },
  komputer: { gradient: 'from-indigo-500/20 to-violet-500/20', accent: 'border-l-indigo-500', iconBg: 'bg-indigo-500' },
  seni: { gradient: 'from-pink-500/20 to-fuchsia-500/20', accent: 'border-l-pink-500', iconBg: 'bg-pink-500' },
  olahraga: { gradient: 'from-orange-500/20 to-red-500/20', accent: 'border-l-orange-500', iconBg: 'bg-orange-500' },
  tik: { gradient: 'from-cyan-500/20 to-sky-500/20', accent: 'border-l-cyan-500', iconBg: 'bg-cyan-500' },
  musik: { gradient: 'from-purple-500/20 to-fuchsia-500/20', accent: 'border-l-purple-500', iconBg: 'bg-purple-500' },
  default: { gradient: 'from-gray-500/20 to-slate-500/20', accent: 'border-l-gray-500', iconBg: 'bg-gray-500' },
}

const CARD_GRADIENTS = [
  { gradient: 'from-blue-500/20 to-cyan-500/20', accent: 'border-l-blue-500', iconBg: 'bg-blue-500' },
  { gradient: 'from-purple-500/20 to-pink-500/20', accent: 'border-l-purple-500', iconBg: 'bg-purple-500' },
  { gradient: 'from-amber-500/20 to-orange-500/20', accent: 'border-l-amber-500', iconBg: 'bg-amber-500' },
  { gradient: 'from-emerald-500/20 to-green-500/20', accent: 'border-l-emerald-500', iconBg: 'bg-emerald-500' },
  { gradient: 'from-rose-500/20 to-pink-500/20', accent: 'border-l-rose-500', iconBg: 'bg-rose-500' },
  { gradient: 'from-cyan-500/20 to-teal-500/20', accent: 'border-l-cyan-500', iconBg: 'bg-cyan-500' },
  { gradient: 'from-teal-500/20 to-emerald-500/20', accent: 'border-l-teal-500', iconBg: 'bg-teal-500' },
  { gradient: 'from-orange-500/20 to-red-500/20', accent: 'border-l-orange-500', iconBg: 'bg-orange-500' },
  { gradient: 'from-pink-500/20 to-rose-500/20', accent: 'border-l-pink-500', iconBg: 'bg-pink-500' },
  { gradient: 'from-indigo-500/20 to-violet-500/20', accent: 'border-l-indigo-500', iconBg: 'bg-indigo-500' },
]

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

export default function SubjectsPage() {
  const { user } = useAppStore()
  const [subjects, setSubjects] = useState<SubjectItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showDialog, setShowDialog] = useState(false)
  const [editingSubject, setEditingSubject] = useState<SubjectItem | null>(null)
  const [form, setForm] = useState({ name: '', code: '', description: '' })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const isAdmin = user?.role === 'admin'
  const isGuruOrAdmin = user?.role === 'guru' || user?.role === 'admin'

  const fetchSubjects = useCallback(async () => {
    try {
      const res = await fetch('/api/subjects')
      if (res.ok) {
        const data = await res.json()
        setSubjects(data.subjects || [])
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSubjects()
  }, [fetchSubjects])

  // Compute stats
  const stats = useMemo(() => ({
    total: subjects.length,
    totalClasses: subjects.reduce((sum, s) => sum + (s._count?.classes || 0), 0),
    totalAssignments: subjects.reduce((sum, s) => sum + (s._count?.assignments || 0), 0),
  }), [subjects])

  // Filtered subjects
  const filtered = useMemo(() => {
    return subjects.filter((s) => {
      const q = search.toLowerCase()
      return s.name.toLowerCase().includes(q) ||
        (s.code?.toLowerCase().includes(q)) ||
        (s.description?.toLowerCase().includes(q))
    })
  }, [subjects, search])

  const openCreate = () => {
    setEditingSubject(null)
    setForm({ name: '', code: '', description: '' })
    setShowDialog(true)
  }

  const openEdit = (subject: SubjectItem) => {
    setEditingSubject(subject)
    setForm({ name: subject.name, code: subject.code || '', description: subject.description || '' })
    setShowDialog(true)
  }

  const handleSave = useCallback(async () => {
    if (!form.name.trim()) {
      toast.error('Nama mata pelajaran wajib diisi')
      return
    }

    setSaving(true)
    try {
      if (editingSubject) {
        const res = await fetch('/api/subjects', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingSubject.id, name: form.name, code: form.code, description: form.description }),
        })
        const data = await res.json()
        if (!res.ok) {
          toast.error(data.error || 'Gagal memperbarui mata pelajaran')
          return
        }
        setSubjects((prev) => prev.map((s) => s.id === editingSubject.id ? { ...s, ...data.subject } : s))
        toast.success('Mata pelajaran berhasil diperbarui!')
      } else {
        const res = await fetch('/api/subjects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: form.name, code: form.code, description: form.description }),
        })
        const data = await res.json()
        if (!res.ok) {
          toast.error(data.error || 'Gagal membuat mata pelajaran')
          return
        }
        setSubjects((prev) => [data.subject, ...prev])
        toast.success('Mata pelajaran berhasil dibuat!')
      }
      setShowDialog(false)
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }, [form, editingSubject])

  const handleDelete = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/subjects?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Gagal menghapus mata pelajaran')
        return
      }
      setSubjects((prev) => prev.filter((s) => s.id !== id))
      toast.success('Mata pelajaran berhasil dihapus!')
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setShowDeleteConfirm(null)
    }
  }, [])

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="skeleton h-10 w-56 rounded-xl" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="stat-card"><div className="skeleton h-20 rounded" /></div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="interactive-card p-5 h-44">
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
            <span className="gradient-text">Mata Pelajaran</span>
          </h1>
          <p className="text-[var(--glass-text-secondary)] text-sm mt-1">Kelola daftar mata pelajaran sekolah</p>
        </div>
        {isGuruOrAdmin && (
          <button onClick={openCreate} className="btn-gradient flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Tambah Mapel
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total Mapel', value: stats.total, icon: Library, gradient: 'from-[#667eea] to-[#764ba2]', bg: 'bg-[var(--badge-purple-bg)]', text: 'text-[var(--badge-purple-text)]' },
          { label: 'Total Kelas', value: stats.totalClasses, icon: GraduationCap, gradient: 'from-blue-500 to-cyan-500', bg: 'bg-[var(--badge-blue-bg)]', text: 'text-[var(--badge-blue-text)]' },
          { label: 'Total Tugas', value: stats.totalAssignments, icon: FileText, gradient: 'from-emerald-500 to-green-500', bg: 'bg-[var(--badge-green-bg)]', text: 'text-[var(--badge-green-text)]' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="stat-card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[var(--glass-text-secondary)] text-xs">{s.label}</p>
                <p className="text-2xl font-bold text-[var(--glass-text)] mt-1 counter-animate">{s.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.text}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--glass-text-muted)]" />
        <input
          type="text"
          placeholder="Cari mata pelajaran berdasarkan nama, kode, atau deskripsi..."
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

      {/* Subject Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filtered.map((subject, idx) => {
            const Icon = getSubjectIcon(subject.name)
            const subjectColor = getSubjectColor(subject.name)
            const fallbackColor = CARD_GRADIENTS[idx % CARD_GRADIENTS.length]
            const gradient = subjectColor.gradient || fallbackColor.gradient
            const accentBorder = subjectColor.accent || fallbackColor.accent
            const iconBg = subjectColor.iconBg || fallbackColor.iconBg

            return (
              <motion.div
                key={subject.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: idx * 0.04 }}
                className="interactive-card border-l-4 overflow-hidden relative"
                style={{ borderLeftColor: undefined }}
              >
                {/* Card Header with Icon & Gradient */}
                <div className={`h-28 bg-gradient-to-br ${gradient} flex items-center justify-center relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-[var(--glass-bg)] opacity-30" />
                  <div className={`w-14 h-14 rounded-2xl ${iconBg} flex items-center justify-center shadow-lg relative z-10`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  {subject.code && (
                    <div className="absolute top-3 right-3 bg-[var(--chip-bg)] backdrop-blur-sm rounded-lg px-2.5 py-1 text-xs text-[var(--glass-text-secondary)] font-mono font-medium z-10">
                      {subject.code}
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-[var(--glass-text)] text-sm truncate">{subject.name}</h3>
                  {subject.description && (
                    <p className="text-xs text-[var(--glass-text-muted)] mt-1.5 line-clamp-2">{subject.description}</p>
                  )}

                  {/* Stats Row */}
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[var(--glass-border)]">
                    <span className="text-xs text-[var(--glass-text-muted)] flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5" /> {subject._count?.classes || 0} kelas
                    </span>
                    <span className="text-xs text-[var(--glass-text-muted)] flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" /> {subject._count?.assignments || 0} tugas
                    </span>
                  </div>

                  {/* Action Buttons */}
                  {isGuruOrAdmin && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--glass-border)]">
                      <button
                        onClick={() => openEdit(subject)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium glass-btn text-[var(--glass-text-secondary)] hover:text-[var(--glass-text)] transition-colors"
                      >
                        <Pencil className="w-3 h-3" /> Edit
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => setShowDeleteConfirm(subject.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--badge-red-bg)] text-[var(--badge-red-text)] hover:opacity-80 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" /> Hapus
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Delete Confirmation Overlay */}
                <AnimatePresence>
                  {showDeleteConfirm === subject.id && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-[var(--overlay-bg)] backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-4 z-20"
                    >
                      <AlertTriangle className="w-8 h-8 text-amber-500 mb-2" />
                      <p className="text-sm text-[var(--glass-text)] font-medium mb-1">Hapus mata pelajaran?</p>
                      <p className="text-xs text-[var(--glass-text-muted)] mb-3 text-center">{subject.name} akan dihapus permanen</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowDeleteConfirm(null)}
                          className="glass-btn text-xs px-3 py-1.5"
                        >
                          Batal
                        </button>
                        <button
                          onClick={() => handleDelete(subject.id)}
                          className="bg-red-500 text-white text-xs px-3 py-1.5 rounded-lg font-medium hover:bg-red-600 transition-colors"
                        >
                          Hapus
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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
            <Library className="w-10 h-10 text-[var(--badge-purple-text)]" />
          </div>
          <h3 className="text-xl font-semibold text-[var(--glass-text)] mb-2">
            {search ? 'Tidak ada mata pelajaran ditemukan' : 'Belum ada mata pelajaran'}
          </h3>
          <p className="text-[var(--glass-text-muted)] text-sm max-w-sm mx-auto">
            {search ? 'Coba kata kunci lain atau kata kunci yang lebih umum' : 'Tambahkan mata pelajaran baru untuk mulai mengelola kurikulum sekolah'}
          </p>
          {!search && isGuruOrAdmin && (
            <button onClick={openCreate} className="btn-gradient text-sm flex items-center gap-2 px-5 py-2.5 mt-6">
              <Plus className="w-4 h-4" /> Tambah Mata Pelajaran
            </button>
          )}
        </motion.div>
      )}

      {/* Create/Edit Dialog */}
      <AnimatePresence>
        {showDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-bg)] backdrop-blur-sm p-4"
            onClick={() => setShowDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="gradient-border w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="glass-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-[var(--glass-text)] flex items-center gap-2">
                    <Library className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    {editingSubject ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'}
                  </h2>
                  <button onClick={() => setShowDialog(false)} className="text-[var(--glass-text-muted)] hover:text-[var(--glass-text)]">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-[var(--glass-text-muted)] mb-1.5 block">
                      Nama Mata Pelajaran <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="contoh: Matematika"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="glass-input"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[var(--glass-text-muted)] mb-1.5 block">
                      Kode Mapel <span className="text-[var(--glass-text-muted)]">(opsional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="contoh: MTK, FIS, KIM"
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                      className="glass-input font-mono tracking-wider"
                      maxLength={10}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[var(--glass-text-muted)] mb-1.5 block">
                      Deskripsi <span className="text-[var(--glass-text-muted)]">(opsional)</span>
                    </label>
                    <textarea
                      placeholder="Deskripsi singkat tentang mata pelajaran..."
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="glass-input min-h-[80px] resize-none"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowDialog(false)} className="btn-glass text-sm" disabled={saving}>Batal</button>
                  <button onClick={handleSave} className="btn-gradient text-sm" disabled={saving}>
                    {saving ? 'Menyimpan...' : editingSubject ? 'Simpan' : 'Buat'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
