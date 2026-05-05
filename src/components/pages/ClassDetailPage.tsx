'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, FileText, Users, Bell, Plus, ArrowLeft,
  Megaphone, Clock, Send, MessageSquare, X, Search,
  Pin, Heart, Trash2, AlertTriangle, Zap, Calendar,
  UserMinus, Shield, GraduationCap, Share2, ThumbsUp, PartyPopper,
  Paperclip, TrendingUp, LogOut
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { format, formatDistanceToNow } from 'date-fns'
import { id as localeId } from 'date-fns/locale/id'
import { toast } from 'sonner'

interface ClassData {
  id: string
  name: string
  description?: string
  code: string
  grade?: number
  direction?: string
  subject?: { name: string }
  creator: { name: string; id: string }
  classUsers: Array<{ id: string; role: string; user: { id: string; name: string; email: string; avatar?: string } }>
  _count?: { classUsers: number; assignments: number }
}

type TabName = 'stream' | 'tugas' | 'anggota'

const TYPE_STYLES: Record<string, { icon: React.ElementType; bg: string; text: string; border: string; badge: string; iconBg: string; gradient: string; progressColor: string }> = {
  tugas: { icon: FileText, bg: 'from-blue-500/10 to-cyan-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/20', badge: 'bg-[var(--badge-blue-bg)] text-[var(--badge-blue-text)]', iconBg: 'bg-[var(--badge-blue-bg)]', gradient: 'from-blue-500 to-cyan-500', progressColor: 'bg-blue-500' },
  ujian: { icon: AlertTriangle, bg: 'from-red-500/10 to-rose-500/10', text: 'text-red-600 dark:text-red-400', border: 'border-red-500/20', badge: 'bg-[var(--badge-red-bg)] text-[var(--badge-red-text)]', iconBg: 'bg-[var(--badge-red-bg)]', gradient: 'from-red-500 to-rose-500', progressColor: 'bg-red-500' },
  kuis: { icon: Zap, bg: 'from-amber-500/10 to-orange-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/20', badge: 'bg-[var(--badge-amber-bg)] text-[var(--badge-amber-text)]', iconBg: 'bg-[var(--badge-amber-bg)]', gradient: 'from-amber-500 to-orange-500', progressColor: 'bg-amber-500' },
  TUGAS: { icon: FileText, bg: 'from-blue-500/10 to-cyan-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/20', badge: 'bg-[var(--badge-blue-bg)] text-[var(--badge-blue-text)]', iconBg: 'bg-[var(--badge-blue-bg)]', gradient: 'from-blue-500 to-cyan-500', progressColor: 'bg-blue-500' },
  UJIAN: { icon: AlertTriangle, bg: 'from-red-500/10 to-rose-500/10', text: 'text-red-600 dark:text-red-400', border: 'border-red-500/20', badge: 'bg-[var(--badge-red-bg)] text-[var(--badge-red-text)]', iconBg: 'bg-[var(--badge-red-bg)]', gradient: 'from-red-500 to-rose-500', progressColor: 'bg-red-500' },
  KUIS: { icon: Zap, bg: 'from-amber-500/10 to-orange-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/20', badge: 'bg-[var(--badge-amber-bg)] text-[var(--badge-amber-text)]', iconBg: 'bg-[var(--badge-amber-bg)]', gradient: 'from-amber-500 to-orange-500', progressColor: 'bg-amber-500' },
}

function getDifficultyInfo(points: number): { label: string; className: string } {
  if (points < 50) return { label: 'Mudah', className: 'difficulty-badge difficulty-badge-mudah' }
  if (points <= 80) return { label: 'Sedang', className: 'difficulty-badge difficulty-badge-sedang' }
  return { label: 'Sulit', className: 'difficulty-badge difficulty-badge-sulit' }
}

function getCountdownInfo(dueDate: string): { text: string; color: string; urgent: boolean } {
  const now = new Date()
  const due = new Date(dueDate)
  const diff = due.getTime() - now.getTime()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))

  if (diff < 0) return { text: 'Terlambat', color: 'text-red-500', urgent: false }
  if (days === 0) return { text: 'Hari ini', color: 'text-red-500', urgent: true }
  if (days === 1) return { text: '1 hari lagi', color: 'text-amber-500', urgent: true }
  if (days <= 3) return { text: `${days} hari lagi`, color: 'text-amber-500', urgent: true }
  return { text: `${days} hari lagi`, color: 'text-[var(--glass-text-secondary)]', urgent: false }
}

function getAvatarColor(name: string): string {
  const colors = [
    'from-purple-500 to-pink-500',
    'from-blue-500 to-cyan-500',
    'from-green-500 to-emerald-500',
    'from-amber-500 to-orange-500',
    'from-red-500 to-rose-500',
    'from-indigo-500 to-violet-500',
    'from-teal-500 to-cyan-500',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

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
  const [memberSearch, setMemberSearch] = useState('')
  const [likedAnnouncements, setLikedAnnouncements] = useState<Set<string>>(new Set())
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)
  const [pinnedAnnouncements, setPinnedAnnouncements] = useState<Set<string>>(new Set())
  const [reactions, setReactions] = useState<Record<string, Record<string, number | boolean>>>({})
  const [confirmLeave, setConfirmLeave] = useState(false)

  const togglePin = useCallback((annId: string) => {
    setPinnedAnnouncements((prev) => {
      const next = new Set(prev)
      if (next.has(annId)) next.delete(annId)
      else next.add(annId)
      return next
    })
  }, [])

  const toggleReaction = useCallback((annId: string, emoji: string) => {
    setReactions((prev) => {
      const annReactions = prev[annId] || { '👍': 0, '❤️': 0, '🎉': 0 }
      const activeKey = `_active_${emoji}`
      const isActive = Boolean(prev[annId]?.[activeKey])
      return {
        ...prev,
        [annId]: {
          ...annReactions,
          [emoji]: ((annReactions[emoji] as number) || 0) + (isActive ? -1 : 1),
          [activeKey]: !isActive,
        },
      }
    })
  }, [])

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

  const handleRemoveMember = useCallback(async (classUserId: string, memberName: string) => {
    try {
      const res = await fetch(`/api/classes/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId, classUserId }),
      })
      if (!res.ok) {
        toast.error('Gagal menghapus anggota')
        return
      }
      setClassData((prev) => prev ? {
        ...prev,
        classUsers: prev.classUsers.filter((u) => u.id !== classUserId),
      } : prev)
      setConfirmRemove(null)
      toast.success(`${memberName} telah dihapus dari kelas`)
    } catch {
      toast.error('Terjadi kesalahan')
    }
  }, [classId])

  const handleLeaveClass = useCallback(async () => {
    try {
      const res = await fetch(`/api/classes/${classId}/leave`, {
        method: 'POST',
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Gagal keluar dari kelas')
        return
      }
      toast.success('Berhasil keluar dari kelas')
      setPage('classes')
    } catch {
      toast.error('Terjadi kesalahan')
    }
  }, [classId, setPage])

  const toggleLike = useCallback((annId: string) => {
    setLikedAnnouncements((prev) => {
      const next = new Set(prev)
      if (next.has(annId)) next.delete(annId)
      else next.add(annId)
      return next
    })
  }, [])

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
  const isClassOwner = classData?.creator?.id === user?.id || user?.role === 'admin'
  const members = classData?.classUsers || []
  const guruMembers = members.filter((m) => m.role === 'guru')
  const siswaMembers = members.filter((m) => m.role === 'siswa')

  const filteredGuru = memberSearch
    ? guruMembers.filter((m) => m.user.name.toLowerCase().includes(memberSearch.toLowerCase()) || m.user.email.toLowerCase().includes(memberSearch.toLowerCase()))
    : guruMembers
  const filteredSiswa = memberSearch
    ? siswaMembers.filter((m) => m.user.name.toLowerCase().includes(memberSearch.toLowerCase()) || m.user.email.toLowerCase().includes(memberSearch.toLowerCase()))
    : siswaMembers

  const tabs: { key: TabName; label: string; icon: React.ElementType }[] = [
    { key: 'stream', label: 'Stream', icon: Bell },
    { key: 'tugas', label: 'Tugas', icon: FileText },
    { key: 'anggota', label: 'Anggota', icon: Users },
  ]

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="welcome-banner p-6 md:p-8">
          <div className="relative z-10">
            <button
              onClick={() => setPage('classes')}
              className="flex items-center gap-1 text-white/70 hover:text-white text-sm mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali ke Kelas
            </button>
            <h1 className="text-2xl md:text-3xl font-bold text-white">{classData?.name || 'Kelas'}</h1>
            {classData?.subject && (
              <p className="text-white/80 mt-1">{classData.subject.name}</p>
            )}
            {classData?.description && (
              <p className="text-white/50 text-sm mt-2">{classData.description}</p>
            )}
            <div className="flex items-center gap-4 mt-3 text-sm text-white/60 flex-wrap">
              <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {members.length} anggota</span>
              <span className="flex items-center gap-1"><FileText className="w-4 h-4" /> {assignments.length} tugas</span>
              <span className="bg-white/10 px-2 py-0.5 rounded font-mono text-xs">Kode: {classData?.code}</span>
              {classData?.grade && classData?.direction && (
                <span className="bg-gradient-to-r from-white/20 to-white/10 px-2.5 py-0.5 rounded-lg text-xs font-semibold text-white/80">
                  Kelas {classData.grade}-{classData.direction}
                </span>
              )}
            </div>

            {/* Exit Class Button */}
            {!isClassOwner && (
              <div className="mt-4">
                {confirmLeave ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-red-300">Keluar dari kelas ini?</span>
                    <button
                      onClick={handleLeaveClass}
                      className="text-xs px-3 py-1.5 rounded-lg bg-red-500/80 text-white hover:bg-red-500 font-medium transition-colors"
                    >
                      Ya, Keluar
                    </button>
                    <button
                      onClick={() => setConfirmLeave(false)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmLeave(true)}
                    className="flex items-center gap-1.5 text-xs text-white/40 hover:text-red-300 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Keluar dari Kelas
                  </button>
                )}
              </div>
            )}
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
                <div className="relative pl-10">
                  {/* Timeline line */}
                  <div className="timeline-line" />

                  {announcements.map((ann: any, index: number) => {
                    const isImportant = ann.priority === 'high'
                    const isPinned = pinnedAnnouncements.has(ann.id)
                    const annReactions = (reactions[ann.id] || { '👍': 0, '❤️': 0, '🎉': 0 }) as Record<string, number | boolean>
                    return (
                      <motion.div
                        key={ann.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="relative mb-4"
                      >
                        {/* Timeline dot with avatar */}
                        <div className="absolute -left-10 top-4 z-[2]">
                          <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${getAvatarColor(ann.creator?.name || 'U')} flex items-center justify-center text-white text-[10px] font-bold border-2 border-[var(--glass-bg)] shadow-md`}>
                            {ann.creator?.name?.charAt(0) || 'U'}
                          </div>
                        </div>

                        <div className="glass-card p-5">
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(ann.creator?.name || 'U')} flex items-center justify-center shrink-0 text-white text-sm font-bold`}>
                              {ann.creator?.name?.charAt(0) || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium text-[var(--glass-text)]">{ann.creator?.name}</span>
                                {(isImportant || isPinned) && (
                                  <span className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-[var(--badge-red-bg)] text-[var(--badge-red-text)] font-medium">
                                    <Pin className={`w-3 h-3 ${isPinned ? 'fill-current' : ''}`} /> {isPinned ? 'Dipin' : 'Penting'}
                                  </span>
                                )}
                                <span className="text-xs text-[var(--glass-text-muted)]">
                                  {formatDistanceToNow(new Date(ann.createdAt), { addSuffix: true, locale: localeId })}
                                </span>
                              </div>
                              <h3 className="font-semibold text-[var(--glass-text)] mt-1">{ann.title}</h3>
                              <p className="text-sm text-[var(--glass-text-secondary)] mt-1 whitespace-pre-wrap">{ann.content}</p>
                              <p className="text-xs text-[var(--glass-text-muted)] mt-3">
                                {format(new Date(ann.createdAt), "dd MMM yyyy, HH:mm", { locale: localeId })}
                              </p>
                              {/* Emoji reactions */}
                              <div className="flex items-center gap-2 mt-3 flex-wrap">
                                {['👍', '❤️', '🎉'].map((emoji) => (
                                  <button
                                    key={emoji}
                                    onClick={() => toggleReaction(ann.id, emoji)}
                                    className={`reaction-emoji ${annReactions[`_active_${emoji}`] ? 'active' : ''}`}
                                  >
                                    <span className="emoji-pop">{emoji}</span>
                                    <span className="text-[10px] font-medium">{(annReactions[emoji] as number) || 0}</span>
                                  </button>
                                ))}
                                {/* Pin toggle button */}
                                <button
                                  onClick={() => togglePin(ann.id)}
                                  className={`reaction-emoji ${isPinned ? 'active' : ''}`}
                                  title={isPinned ? 'Lepas pin' : 'Pin pengumuman'}
                                >
                                  <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-current' : ''}`} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
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
                <div className="stagger-in">
                  {assignments.map((assignment: any) => {
                    const typeStyle = TYPE_STYLES[assignment.type] || TYPE_STYLES.tugas
                    const TypeIcon = typeStyle.icon
                    const countdown = getCountdownInfo(assignment.dueDate)
                    const isClosed = new Date(assignment.dueDate) < new Date()
                    const submissionCount = assignment._count?.submissions ?? assignment.submissionCount ?? 0
                    const totalStudents = siswaMembers.length || 1
                    const submissionPercent = Math.min(100, Math.round((submissionCount / totalStudents) * 100))
                    const difficulty = getDifficultyInfo(assignment.points || 100)
                    const hasAttachment = assignment.fileUrl || assignment.description?.includes('http') || assignment.description?.includes('attach')

                    return (
                      <div
                        key={assignment.id}
                        className={`interactive-card p-4 mb-3 bg-gradient-to-r ${typeStyle.bg} border ${typeStyle.border} ${isClosed ? 'assignment-closed-overlay' : ''}`}
                        onClick={() => setPage('assignment-detail', { id: assignment.id })}
                      >
                        <div className="flex items-start justify-between relative z-[3]">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${typeStyle.gradient} flex items-center justify-center shrink-0 shadow-md`}>
                              <TypeIcon className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-[var(--glass-text)] text-sm">{assignment.title}</p>
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <span className={difficulty.className}>
                                  <TrendingUp className="w-2.5 h-2.5" />
                                  {difficulty.label}
                                </span>
                                {hasAttachment && (
                                  <span className="flex items-center gap-0.5 text-[10px] text-[var(--glass-text-muted)]">
                                    <Paperclip className="w-3 h-3" />
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-2 text-xs text-[var(--glass-text-secondary)] flex-wrap">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {format(new Date(assignment.dueDate), 'dd MMM', { locale: localeId })}
                                </span>
                                <span className="flex items-center gap-1">{assignment.points} poin</span>
                              </div>
                              {/* Submission progress bar */}
                              {isGuru && submissionCount > 0 && (
                                <div className="mt-2.5 space-y-1">
                                  <div className="flex items-center justify-between text-[10px]">
                                    <span className="text-[var(--glass-text-muted)]">{submissionCount}/{totalStudents} siswa</span>
                                    <span className="font-medium text-[var(--glass-text-secondary)]">{submissionPercent}%</span>
                                  </div>
                                  <div className="submission-progress">
                                    <motion.div
                                      className={`submission-progress-fill ${typeStyle.progressColor}`}
                                      initial={{ width: 0 }}
                                      animate={{ width: `${submissionPercent}%` }}
                                      transition={{ duration: 0.8, ease: 'easeOut' }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1.5 shrink-0 ml-3">
                            <span className={`text-xs px-3 py-1.5 rounded-lg bg-gradient-to-r ${typeStyle.gradient} text-white font-semibold shadow-sm`}>
                              {assignment.type?.charAt(0).toUpperCase() + assignment.type?.slice(1)}
                            </span>
                            <span className={`text-[10px] font-medium ${countdown.color} ${countdown.urgent ? 'countdown-urgent' : ''}`}>
                              {countdown.text}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                navigator.clipboard?.writeText(`${window.location.origin}?page=class-detail&id=${classId}&assignment=${assignment.id}`)
                                toast.success('Link tugas disalin!')
                              }}
                              className="text-[var(--glass-text-muted)] hover:text-[var(--glass-text-secondary)] transition-colors p-1"
                              title="Bagikan ke kelas"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
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
              className="space-y-5"
            >
              {/* Member count & search */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-[var(--glass-text)] flex items-center gap-2">
                    <Users className="w-5 h-5" /> Anggota
                  </h3>
                  <span className="counter-animate text-sm px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white font-semibold">
                    {members.length}
                  </span>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--glass-text-muted)]" />
                  <input
                    type="text"
                    placeholder="Cari anggota..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="glass-input pl-9 py-2 text-sm"
                  />
                  {memberSearch && (
                    <button
                      onClick={() => setMemberSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--glass-text-muted)] hover:text-[var(--glass-text)] transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Guru Members */}
              {filteredGuru.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-[var(--glass-text-secondary)] mb-3 flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-[var(--badge-purple-bg)] flex items-center justify-center">
                      <GraduationCap className="w-3 h-3 text-[var(--badge-purple-text)]" />
                    </div>
                    Guru ({filteredGuru.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 stagger-in">
                    {filteredGuru.map((m) => (
                      <div key={m.id} className={`member-card member-card-guru`}>
                        <div className="flex items-center gap-3">
                          <div className="avatar-gradient-ring">
                            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(m.user.name)} flex items-center justify-center text-white font-bold text-sm`}>
                              {m.user.name.charAt(0)}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-[var(--glass-text)] font-medium truncate">{m.user.name}</p>
                            <p className="text-xs text-[var(--glass-text-muted)] truncate">{m.user.email}</p>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--badge-purple-bg)] text-[var(--badge-purple-text)] font-semibold shrink-0">
                            Guru
                          </span>
                        </div>
                        {isClassOwner && m.user.id !== user?.id && (
                          <div className="mt-2 pt-2 border-t border-[var(--glass-border)] flex justify-end">
                            {confirmRemove === m.id ? (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-[var(--badge-red-text)]">Yakin?</span>
                                <button
                                  onClick={() => handleRemoveMember(m.id, m.user.name)}
                                  className="text-xs px-2 py-1 rounded bg-[var(--badge-red-bg)] text-[var(--badge-red-text)] hover:opacity-80 font-medium"
                                >
                                  Hapus
                                </button>
                                <button
                                  onClick={() => setConfirmRemove(null)}
                                  className="text-xs px-2 py-1 rounded bg-[var(--chip-bg)] text-[var(--glass-text-secondary)] hover:opacity-80"
                                >
                                  Batal
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmRemove(m.id)}
                                className="text-xs flex items-center gap-1 text-[var(--glass-text-muted)] hover:text-[var(--badge-red-text)] transition-colors"
                              >
                                <UserMinus className="w-3 h-3" /> Keluarkan
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Siswa Members */}
              {filteredSiswa.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-[var(--glass-text-secondary)] mb-3 flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-[var(--badge-blue-bg)] flex items-center justify-center">
                      <Shield className="w-3 h-3 text-[var(--badge-blue-text)]" />
                    </div>
                    Siswa ({filteredSiswa.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto custom-scrollbar stagger-in">
                    {filteredSiswa.map((m) => (
                      <div key={m.id} className={`member-card member-card-siswa`}>
                        <div className="flex items-center gap-3">
                          <div className="avatar-gradient-ring">
                            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(m.user.name)} flex items-center justify-center text-white font-bold text-sm`}>
                              {m.user.name.charAt(0)}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-[var(--glass-text)] font-medium truncate">{m.user.name}</p>
                            <p className="text-xs text-[var(--glass-text-muted)] truncate">{m.user.email}</p>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--badge-blue-bg)] text-[var(--badge-blue-text)] font-semibold shrink-0">
                            Siswa
                          </span>
                        </div>
                        {isClassOwner && (
                          <div className="mt-2 pt-2 border-t border-[var(--glass-border)] flex justify-end">
                            {confirmRemove === m.id ? (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-[var(--badge-red-text)]">Yakin?</span>
                                <button
                                  onClick={() => handleRemoveMember(m.id, m.user.name)}
                                  className="text-xs px-2 py-1 rounded bg-[var(--badge-red-bg)] text-[var(--badge-red-text)] hover:opacity-80 font-medium"
                                >
                                  Hapus
                                </button>
                                <button
                                  onClick={() => setConfirmRemove(null)}
                                  className="text-xs px-2 py-1 rounded bg-[var(--chip-bg)] text-[var(--glass-text-secondary)] hover:opacity-80"
                                >
                                  Batal
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmRemove(m.id)}
                                className="text-xs flex items-center gap-1 text-[var(--glass-text-muted)] hover:text-[var(--badge-red-text)] transition-colors"
                              >
                                <UserMinus className="w-3 h-3" /> Keluarkan
                              </button>
                            )}
                          </div>
                        )}
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
                    {(['tugas', 'ujian', 'kuis'] as const).map((t) => {
                      const ts = TYPE_STYLES[t]
                      const TIcon = ts.icon
                      return (
                        <button
                          key={t}
                          onClick={() => setNewAssignment({ ...newAssignment, type: t })}
                          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                            newAssignment.type === t
                              ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white'
                              : 'glass-btn text-[var(--glass-text-secondary)]'
                          }`}
                        >
                          <TIcon className="w-3.5 h-3.5" />
                          {t === 'tugas' ? 'Tugas' : t === 'ujian' ? 'Ujian' : 'Kuis'}
                        </button>
                      )
                    })}
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
