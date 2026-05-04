'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Clock, ArrowLeft, Upload, Send, MessageSquare,
  CheckCircle2, XCircle, Star, AlertCircle, Download, Trash2
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale/id'
import { toast } from 'sonner'

export default function AssignmentDetailPage() {
  const { params, user, setPage } = useAppStore()
  const assignmentId = params.id

  const [assignment, setAssignment] = useState<any>(null)
  const [submissions, setSubmissions] = useState<any[]>([])
  const [comments, setComments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mySubmission, setMySubmission] = useState<any>(null)
  const [content, setContent] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [fileName, setFileName] = useState('')
  const [gradeInput, setGradeInput] = useState<Record<string, string>>({})
  const [feedbackInput, setFeedbackInput] = useState<Record<string, string>>({})
  const [commentText, setCommentText] = useState('')

  useEffect(() => {
    if (!assignmentId) return
    const fetchData = async () => {
      try {
        const [assRes, subRes, commRes] = await Promise.all([
          fetch(`/api/assignments?id=${assignmentId}`),
          fetch(`/api/submissions?assignmentId=${assignmentId}`),
          fetch(`/api/comments?assignmentId=${assignmentId}`),
        ])
        if (assRes.ok) {
          const assJson = await assRes.json()
          const assData = Array.isArray(assJson) ? assJson.find((a: any) => a.id === assignmentId) : assJson
          setAssignment(assData)
        }
        if (subRes.ok) {
          const subData = await subRes.json()
          setSubmissions(subData)
          if (user?.role === 'siswa') {
            const mine = subData.find((s: any) => s.userId === user.id)
            setMySubmission(mine || null)
          }
        }
        if (commRes.ok) setComments(await commRes.json())
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [assignmentId, user?.id, user?.role])

  const getTypeGradient = (type: string) => {
    const t = type?.toUpperCase()
    if (t === 'UJIAN') return { bg: 'from-red-500/20 to-rose-500/20', border: 'border-red-500/30', text: 'text-red-600 dark:text-red-400', label: 'Ujian' }
    if (t === 'KUIS') return { bg: 'from-amber-500/20 to-orange-500/20', border: 'border-amber-500/30', text: 'text-amber-600 dark:text-amber-400', label: 'Kuis' }
    return { bg: 'from-blue-500/20 to-cyan-500/20', border: 'border-blue-500/30', text: 'text-blue-600 dark:text-blue-400', label: 'Tugas' }
  }

  const handleSubmit = useCallback(async () => {
    if (!content && !fileName) {
      toast.error('Mohon isi konten atau unggah file')
      return
    }
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId, content, fileUrl: fileName || undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Gagal mengumpulkan')
        return
      }
      setMySubmission(data)
      setContent('')
      setFileName('')
      toast.success('Tugas berhasil dikumpulkan!')
    } catch {
      toast.error('Terjadi kesalahan')
    }
  }, [assignmentId, content, fileName])

  const handleGrade = useCallback(async (submissionId: string) => {
    const grade = parseFloat(gradeInput[submissionId] || '0')
    const feedback = feedbackInput[submissionId] || ''
    if (isNaN(grade)) {
      toast.error('Nilai harus berupa angka')
      return
    }
    try {
      const res = await fetch('/api/submissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: submissionId, grade, feedback, status: 'graded' }),
      })
      if (!res.ok) {
        toast.error('Gagal memberi nilai')
        return
      }
      setSubmissions((prev) =>
        prev.map((s) => s.id === submissionId ? { ...s, grade, feedback, status: 'graded' } : s)
      )
      toast.success('Nilai berhasil disimpan!')
    } catch {
      toast.error('Terjadi kesalahan')
    }
  }, [gradeInput, feedbackInput])

  const handleComment = useCallback(async () => {
    if (!commentText.trim()) return
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentText, assignmentId }),
      })
      const data = await res.json()
      if (!res.ok) return
      setComments((prev) => [...prev, data])
      setCommentText('')
    } catch {
      // silently fail
    }
  }, [commentText, assignmentId])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      setFileName(file.name)
      toast.info(`File "${file.name}" dipilih (simulasi)`)
    }
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFileName(file.name)
      toast.info(`File "${file.name}" dipilih (simulasi)`)
    }
  }, [])

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="skeleton h-32 w-full rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2"><div className="skeleton h-64 rounded-xl" /></div>
          <div><div className="skeleton h-64 rounded-xl" /></div>
        </div>
      </div>
    )
  }

  const typeStyle = getTypeGradient(assignment?.type || 'tugas')
  const isGuru = user?.role === 'guru' || user?.role === 'admin'
  const isOverdue = assignment ? new Date(assignment.dueDate) < new Date() : false

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className={`bg-gradient-to-r ${typeStyle.bg} p-6 md:p-8 border-b ${typeStyle.border}`}>
        <div className="relative z-10">
          <button
            onClick={() => setPage('classes')}
            className="flex items-center gap-1 text-[var(--glass-text-secondary)] hover:text-[var(--glass-text)] text-sm mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali
          </button>
          <div className="flex items-start justify-between">
            <div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-md bg-[var(--chip-bg)] ${typeStyle.text}`}>
                {typeStyle.label.toUpperCase()}
              </span>
              <h1 className="text-2xl md:text-3xl font-bold text-[var(--glass-text)] mt-2">{assignment?.title}</h1>
              <div className="flex items-center gap-4 mt-3 text-sm text-[var(--glass-text-secondary)]">
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {assignment?.dueDate ? format(new Date(assignment.dueDate), 'dd MMM yyyy, HH:mm', { locale: localeId }) : '-'}</span>
                <span>{assignment?.points} poin</span>
                {isOverdue && <span className="text-red-600 dark:text-red-400 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> Terlambat</span>}
              </div>
            </div>
            <span className={`text-xs px-3 py-1 rounded-full ${
              assignment?.status === 'active' ? 'bg-[var(--badge-green-bg)] text-[var(--badge-green-text)]' :
              assignment?.status === 'closed' ? 'bg-[var(--badge-red-bg)] text-[var(--badge-red-text)]' :
              'bg-[var(--chip-bg)] text-[var(--glass-text-secondary)]'
            }`}>
              {assignment?.status === 'active' ? 'Aktif' : assignment?.status === 'closed' ? 'Ditutup' : 'Draft'}
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-6 pb-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6">
            <h2 className="font-semibold text-[var(--glass-text)] mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" /> Deskripsi
            </h2>
            <p className="text-[var(--glass-text-secondary)] text-sm whitespace-pre-wrap leading-relaxed">
              {assignment?.description || 'Tidak ada deskripsi'}
            </p>
          </div>

          {/* Siswa: Submission area */}
          {!isGuru && (
            <div className="glass-card p-6 space-y-4">
              <h2 className="font-semibold text-[var(--glass-text)] flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Pengumpulan Tugas
              </h2>

              {mySubmission ? (
                <div className={`glass-card p-4 ${mySubmission.status === 'graded' ? 'border-emerald-500/30' : mySubmission.status === 'late' ? 'border-amber-500/30' : 'border-blue-500/30'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {mySubmission.status === 'graded' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    ) : mySubmission.status === 'late' ? (
                      <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    ) : (
                      <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    )}
                    <span className="text-sm font-medium text-[var(--glass-text)]">
                      {mySubmission.status === 'graded' ? 'Sudah Dinilai' : mySubmission.status === 'late' ? 'Terlambat' : 'Terkumpul'}
                    </span>
                  </div>
                  {mySubmission.content && <p className="text-sm text-[var(--glass-text-secondary)] mb-2">{mySubmission.content}</p>}
                  {mySubmission.fileUrl && (
                    <a href={mySubmission.fileUrl} download className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline">
                      <Download className="w-3 h-3" /> {mySubmission.fileUrl.split('/').pop()}
                    </a>
                  )}
                  {mySubmission.status === 'graded' && (
                    <div className="mt-3 p-3 rounded-lg bg-[var(--badge-green-bg)] border border-emerald-500/20">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{Number.isFinite(mySubmission.grade) ? Math.round(mySubmission.grade) : 0}/{assignment?.points}</span>
                      </div>
                      {mySubmission.feedback && <p className="text-sm text-[var(--glass-text-secondary)] mt-1">{mySubmission.feedback}</p>}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Drop zone */}
                  <div
                    className={`drop-zone p-8 text-center ${dragActive ? 'active' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('file-input')?.click()}
                  >
                    <Upload className="w-10 h-10 text-[var(--glass-text-muted)] mx-auto mb-3" />
                    <p className="text-[var(--glass-text-secondary)] text-sm">Drag & drop file atau klik untuk memilih</p>
                    {fileName && <p className="text-blue-600 dark:text-blue-400 text-sm mt-2">📎 {fileName}</p>}
                    <input
                      id="file-input"
                      type="file"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                  </div>
                  <textarea
                    placeholder="Tulis komentar atau catatan (opsional)..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="glass-input min-h-[80px] resize-none"
                  />
                  <button onClick={handleSubmit} className="btn-gradient flex items-center gap-2 text-sm">
                    <Send className="w-4 h-4" /> Kumpulkan
                  </button>
                </>
              )}
            </div>
          )}

          {/* Guru: Submissions list */}
          {isGuru && (
            <div className="glass-card p-6 space-y-4">
              <h2 className="font-semibold text-[var(--glass-text)] flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> Submissions ({submissions.length})
              </h2>
              {submissions.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                  {submissions.map((sub) => (
                    <div key={sub.id} className="glass-card p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                            {sub.user?.name?.charAt(0) || '?'}
                          </div>
                          <span className="text-sm text-[var(--glass-text)] font-medium">{sub.user?.name || 'Siswa'}</span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          sub.status === 'graded' ? 'bg-[var(--badge-green-bg)] text-[var(--badge-green-text)]' :
                          sub.status === 'late' ? 'bg-[var(--badge-amber-bg)] text-[var(--badge-amber-text)]' :
                          'bg-[var(--badge-blue-bg)] text-[var(--badge-blue-text)]'
                        }`}>
                          {sub.status === 'graded' ? 'Dinilai' : sub.status === 'late' ? 'Terlambat' : 'Terkumpul'}
                        </span>
                      </div>
                      {sub.content && <p className="text-xs text-[var(--glass-text-secondary)]">{sub.content}</p>}
                      {sub.fileUrl && (
                      <a href={sub.fileUrl} download className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline">
                        <Download className="w-3 h-3" /> {sub.fileUrl.split('/').pop()}
                      </a>
                    )}

                      {sub.status !== 'graded' && (
                        <div className="flex items-center gap-2 pt-2">
                          <input
                            type="number"
                            placeholder="Nilai"
                            min={0}
                            max={assignment?.points || 100}
                            value={gradeInput[sub.id] || ''}
                            onChange={(e) => setGradeInput({ ...gradeInput, [sub.id]: e.target.value })}
                            className="glass-input w-20 text-sm py-1.5"
                          />
                          <input
                            type="text"
                            placeholder="Feedback..."
                            value={feedbackInput[sub.id] || ''}
                            onChange={(e) => setFeedbackInput({ ...feedbackInput, [sub.id]: e.target.value })}
                            className="glass-input flex-1 text-sm py-1.5"
                          />
                          <button onClick={() => handleGrade(sub.id)} className="btn-gradient text-xs py-1.5 px-3">
                            Nilai
                          </button>
                        </div>
                      )}
                      {sub.status === 'graded' && (
                        <div className="flex items-center gap-2 text-sm">
                          <Star className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">{Number.isFinite(sub.grade) ? Math.round(sub.grade) : 0}/{assignment?.points}</span>
                          {sub.feedback && <span className="text-[var(--glass-text-muted)] text-xs">— {sub.feedback}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state py-8">
                  <FileText className="w-10 h-10 mb-2" />
                  <p className="text-sm">Belum ada submission</p>
                </div>
              )}
            </div>
          )}

          {/* Comments */}
          <div className="glass-card p-6 space-y-4">
            <h2 className="font-semibold text-[var(--glass-text)] flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-cyan-600 dark:text-cyan-400" /> Komentar ({comments.length})
            </h2>
            <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
              {comments.map((c) => (
                <div key={c.id} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {c.user?.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-[var(--glass-text)]">{c.user?.name}</span>
                    <span className="text-xs text-[var(--glass-text-muted)] ml-2">{format(new Date(c.createdAt), 'dd MMM HH:mm', { locale: localeId })}</span>
                    <p className="text-sm text-[var(--glass-text-secondary)] mt-0.5">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Tulis komentar..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                className="glass-input flex-1 text-sm py-2"
              />
              <button onClick={handleComment} className="btn-glass text-sm flex items-center gap-1">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Sidebar info */}
        <div className="space-y-4">
          <div className="glass-card p-5">
            <h3 className="font-semibold text-[var(--glass-text)] mb-3">Info Tugas</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--glass-text-secondary)]">Kelas</span>
                <span className="text-[var(--glass-text-secondary)]">{assignment?.class?.name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--glass-text-secondary)]">Dibuat oleh</span>
                <span className="text-[var(--glass-text-secondary)]">{assignment?.creator?.name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--glass-text-secondary)]">Deadline</span>
                <span className={`text-[var(--glass-text-secondary)] ${isOverdue ? 'text-red-600 dark:text-red-400' : ''}`}>
                  {assignment?.dueDate ? format(new Date(assignment.dueDate), 'dd MMM yyyy', { locale: localeId }) : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--glass-text-secondary)]">Poin</span>
                <span className="text-[var(--glass-text-secondary)]">{assignment?.points || 100}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--glass-text-secondary)]">Submissions</span>
                <span className="text-[var(--glass-text-secondary)]">{submissions.length}</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="font-semibold text-[var(--glass-text)] mb-3">Status</h3>
            <div className="flex items-center gap-2">
              {isOverdue ? (
                <>
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <span className="text-red-600 dark:text-red-400 text-sm">Sudah lewat deadline</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-600 dark:text-emerald-400 text-sm">Masih dibuka</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
