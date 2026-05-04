'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, FileText, Users, Bell, Plus, ArrowLeft,
  Megaphone, Clock, Send, MessageSquare, X
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale/id'
import { toast } from 'sonner'

interface ClassData {
  id: string
  name: string
  description?: string
  code: string
  subject?: { name: string }
  creator: { name: string }
  classUsers: Array<{ id: string; role: string; user: { id: string; name: string; email: string; avatar?: string } }>
  _count?: { classUsers: number; assignments: number }
}

type TabName = 'stream' | 'tugas' | 'anggota'

export default function ClassDetailPage() {
  const { params, user, setPage } = useAppStore()
  const classId = params.id

  const [classData, setClassData] = useState<ClassData | null>(null)
  const [announcements, setAnnouncements] = useState<Array<any>>([])
  const [assignments, setAssignments] = useState<Array<any>>([])
  const [activeTab, setActiveTab] = useState<TabName>('stream')
  const [loading, setLoading] = useState(true)
  const [showCreateAnn, setShowCreateAnn] = useState(false)
  const [showCreateAssignment, setShowCreateAssignment] = useState(false)
  const [newAnn, setNewAnn] = useState({ title: '', content: '', priority: 'normal' })
  const [newAssignment, setNewAssignment] = useState({ title: '', description: '', dueDate: '', points: 100, type: 'tugas' })

  useEffect(() => {
    if (!classId) return
    const fetchData = async () => {
      try {
        const [classRes, annRes, assRes] = await Promise.all([
          fetch(`/api/classes?id=${classId}`),
          fetch(`/api/announcements?classId=${classId}`),
          fetch(`/api/assignments?classId=${classId}`),
        ])
        if (classRes.ok) {
          const classJson = await classRes.json()
          setClassData(Array.isArray(classJson) ? classJson.find((c: any) => c.id === classId) : classJson)
        }
        if (annRes.ok) setAnnouncements(await annRes.json())
        if (assRes.ok) setAssignments(await assRes.json())
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [classId])

  const handleCreateAnnouncement = useCallback(async () => {
    if (!newAnn.title.trim() || !newAnn.content.trim()) {
      toast.error('Judul dan konten wajib diisi')
      return
    }
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newAnn, classId }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Gagal membuat pengumuman')
        return
      }
      setAnnouncements((prev) => [data, ...prev])
      setShowCreateAnn(false)
      setNewAnn({ title: '', content: '', priority: 'normal' })
      toast.success('Pengumuman berhasil dibuat!')
    } catch {
      toast.error('Terjadi kesalahan')
    }
  }, [newAnn, classId])

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="skeleton h-32 w-full rounded-xl" />
        <div className="skeleton h-10 w-64 rounded-xl" />
        <div className="skeleton h-64 rounded-xl" />
      </div>
    )
  }

  const isGuru = user?.role === 'guru' || user?.role === 'admin'
  const members = classData?.classUsers || []
  const guruMembers = members.filter((m) => m.role === 'guru')
  const siswaMembers = members.filter((m) => m.role === 'siswa')

  const tabs: { key: TabName; label: string; icon: React.ElementType }[] = [
    { key: 'stream', label: 'Stream', icon: Bell },
    { key: 'tugas', label: 'Tugas', icon: FileText },
    { key: 'anggota', label: 'Anggota', icon: Users },
  ]

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="bg-gradient-to-r from-[#667eea]/20 to-[#764ba2]/20 p-6 md:p-8">
          <div className="dot-pattern absolute inset-0 opacity-30" />
          <div className="relative z-10">
            <button
              onClick={() => setPage('classes')}
              className="flex items-center gap-1 text-[var(--glass-text-secondary)] hover:text-[var(--glass-text)] text-sm mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali ke Kelas
            </button>
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--glass-text)]">{classData?.name || 'Kelas'}</h1>
            {classData?.subject && (
              <p className="text-[var(--glass-text-secondary)] mt-1">{classData.subject.name}</p>
            )}
            {classData?.description && (
              <p className="text-[var(--glass-text-muted)] text-sm mt-2">{classData.description}</p>
            )}
            <div className="flex items-center gap-4 mt-3 text-sm text-[var(--glass-text-muted)]">
              <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {members.length} anggota</span>
              <span className="flex items-center gap-1"><FileText className="w-4 h-4" /> {assignments.length} tugas</span>
              <span className="bg-[var(--chip-bg)] px-2 py-0.5 rounded font-mono text-xs">Kode: {classData?.code}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 md:px-6">
        <div className="flex gap-1 border-b border-[var(--glass-border)]">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all relative ${
                activeTab === tab.key ? 'text-[var(--glass-text)]' : 'text-[var(--glass-text-secondary)] hover:text-[var(--glass-text)]'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {activeTab === tab.key && (
                <motion.div
                  layoutId="class-tab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#667eea] to-[#764ba2]"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 md:px-6 pb-6">
        <AnimatePresence mode="wait">
          {activeTab === 'stream' && (
            <motion.div
              key="stream"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {isGuru && (
                <button
                  onClick={() => setShowCreateAnn(true)}
                  className="interactive-card p-4 w-full flex items-center gap-3 text-[var(--glass-text-secondary)] hover:text-[var(--glass-text)]"
                >
                  <Plus className="w-5 h-5" /> Buat pengumuman...
                </button>
              )}

              {announcements.length > 0 ? (
                announcements.map((ann) => (
                  <div key={ann.id} className="glass-card p-5">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center shrink-0">
                        <Megaphone className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[var(--glass-text)]">{ann.creator?.name}</span>
                          {ann.priority === 'high' && <span className="status-dot status-dot-danger" />}
                        </div>
                        <h3 className="font-semibold text-[var(--glass-text)] mt-1">{ann.title}</h3>
                        <p className="text-sm text-[var(--glass-text-secondary)] mt-1 whitespace-pre-wrap">{ann.content}</p>
                        <p className="text-xs text-[var(--glass-text-muted)] mt-3">
                          {format(new Date(ann.createdAt), "dd MMM yyyy, HH:mm", { locale: localeId })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state py-12">
                  <Bell className="w-12 h-12 mb-3" />
                  <p className="text-sm">Belum ada pengumuman di kelas ini</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'tugas' && (
            <motion.div
              key="tugas"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {isGuru && (
                <button
                  onClick={() => setShowCreateAssignment(true)}
                  className="interactive-card p-4 w-full flex items-center gap-3 text-[var(--glass-text-secondary)] hover:text-[var(--glass-text)]"
                >
                  <Plus className="w-5 h-5" /> Buat tugas baru...
                </button>
              )}
              {assignments.length > 0 ? (
                assignments.map((assignment: any) => {
                  const typeColor: Record<string, string> = {
                    tugas: 'from-blue-500/20 to-cyan-500/20 border-blue-500/20',
                    ujian: 'from-red-500/20 to-rose-500/20 border-red-500/20',
                    kuis: 'from-amber-500/20 to-orange-500/20 border-amber-500/20',
                    TUGAS: 'from-blue-500/20 to-cyan-500/20 border-blue-500/20',
                    UJIAN: 'from-red-500/20 to-rose-500/20 border-red-500/20',
                    KUIS: 'from-amber-500/20 to-orange-500/20 border-amber-500/20',
                  }
                  return (
                    <div
                      key={assignment.id}
                      className={`interactive-card p-4 bg-gradient-to-r ${typeColor[assignment.type] || typeColor.tugas}`}
                      onClick={() => setPage('assignment-detail', { id: assignment.id })}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[var(--glass-text)] text-sm">{assignment.title}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-[var(--glass-text-secondary)]">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {format(new Date(assignment.dueDate), 'dd MMM', { locale: localeId })}</span>
                            <span>{assignment.points} poin</span>
                          </div>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-lg bg-[var(--chip-bg)] text-[var(--glass-text-secondary)] font-medium">
                          {assignment.type?.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="empty-state py-12">
                  <FileText className="w-12 h-12 mb-3" />
                  <p className="text-sm">Belum ada tugas di kelas ini</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'anggota' && (
            <motion.div
              key="anggota"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {guruMembers.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-[var(--glass-text-secondary)] mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Guru ({guruMembers.length})
                  </h3>
                  <div className="space-y-2">
                    {guruMembers.map((m) => (
                      <div key={m.id} className="glass-card p-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                          {m.user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm text-[var(--glass-text)] font-medium">{m.user.name}</p>
                          <p className="text-xs text-[var(--glass-text-muted)]">{m.user.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {siswaMembers.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-[var(--glass-text-secondary)] mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Siswa ({siswaMembers.length})
                  </h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                    {siswaMembers.map((m) => (
                      <div key={m.id} className="glass-card p-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                          {m.user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm text-[var(--glass-text)] font-medium">{m.user.name}</p>
                          <p className="text-xs text-[var(--glass-text-muted)]">{m.user.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {members.length === 0 && (
                <div className="empty-state py-12">
                  <Users className="w-12 h-12 mb-3" />
                  <p className="text-sm">Belum ada anggota di kelas ini</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Create Assignment Dialog */}
      <AnimatePresence>
        {showCreateAssignment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-bg)] backdrop-blur-sm p-4"
            onClick={() => setShowCreateAssignment(false)}
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
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Buat Tugas Baru
                  </h2>
                  <button onClick={() => setShowCreateAssignment(false)} className="text-[var(--glass-text-muted)] hover:text-[var(--glass-text)]">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Judul Tugas"
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                  className="glass-input"
                />
                <textarea
                  placeholder="Deskripsi tugas (opsional)"
                  value={newAssignment.description}
                  onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                  className="glass-input min-h-[80px] resize-none"
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-[var(--glass-text-secondary)] mb-1.5 block">Deadline</label>
                    <input
                      type="date"
                      value={newAssignment.dueDate}
                      onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                      className="glass-input"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-[var(--glass-text-secondary)] mb-1.5 block">Poin</label>
                    <input
                      type="number"
                      placeholder="100"
                      value={newAssignment.points}
                      onChange={(e) => setNewAssignment({ ...newAssignment, points: parseInt(e.target.value) || 100 })}
                      className="glass-input"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-[var(--glass-text-secondary)] mb-1.5 block">Tipe</label>
                  <div className="flex gap-2">
                    {(['tugas', 'ujian', 'kuis'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setNewAssignment({ ...newAssignment, type: t })}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                          newAssignment.type === t
                            ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white'
                            : 'glass-btn text-[var(--glass-text-secondary)]'
                        }`}
                      >
                        {t === 'tugas' ? '📝 Tugas' : t === 'ujian' ? '📋 Ujian' : '❓ Kuis'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowCreateAssignment(false)} className="btn-glass text-sm">Batal</button>
                  <button
                    onClick={async () => {
                      if (!newAssignment.title.trim()) {
                        toast.error('Judul tugas wajib diisi')
                        return
                      }
                      if (!newAssignment.dueDate) {
                        toast.error('Deadline wajib diisi')
                        return
                      }
                      try {
                        const res = await fetch('/api/assignments', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ ...newAssignment, classId }),
                        })
                        const data = await res.json()
                        if (!res.ok) {
                          toast.error(data.error || 'Gagal membuat tugas')
                          return
                        }
                        setAssignments((prev) => [data, ...prev])
                        setShowCreateAssignment(false)
                        setNewAssignment({ title: '', description: '', dueDate: '', points: 100, type: 'tugas' })
                        toast.success('Tugas berhasil dibuat!')
                      } catch {
                        toast.error('Terjadi kesalahan')
                      }
                    }}
                    className="btn-gradient text-sm flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" /> Buat
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Announcement Dialog */}
      <AnimatePresence>
        {showCreateAnn && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-bg)] backdrop-blur-sm p-4"
            onClick={() => setShowCreateAnn(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="gradient-border w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="glass-card p-6 space-y-4">
                <h2 className="text-lg font-semibold text-[var(--glass-text)] flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-purple-600 dark:text-purple-400" /> Buat Pengumuman
                </h2>
                <input
                  type="text"
                  placeholder="Judul"
                  value={newAnn.title}
                  onChange={(e) => setNewAnn({ ...newAnn, title: e.target.value })}
                  className="glass-input"
                />
                <textarea
                  placeholder="Konten pengumuman..."
                  value={newAnn.content}
                  onChange={(e) => setNewAnn({ ...newAnn, content: e.target.value })}
                  className="glass-input min-h-[120px] resize-none"
                />
                <div className="flex gap-2">
                  {(['low', 'normal', 'high'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setNewAnn({ ...newAnn, priority: p })}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                        newAnn.priority === p
                          ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white'
                          : 'glass-btn text-[var(--glass-text-secondary)]'
                      }`}
                    >
                      {p === 'high' ? '🔴 Tinggi' : p === 'normal' ? '🟡 Normal' : '🟢 Rendah'}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowCreateAnn(false)} className="btn-glass text-sm">Batal</button>
                  <button onClick={handleCreateAnnouncement} className="btn-gradient text-sm flex items-center gap-2">
                    <Send className="w-4 h-4" /> Kirim
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
