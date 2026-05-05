'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Clock, ArrowLeft, Upload, Send, MessageSquare,
  CheckCircle2, XCircle, Star, AlertCircle, Download, Trash2,
  Loader2, File, Image, FileCheck2, FolderOpen, Eye, Play, X
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
  const [fileUrl, setFileUrl] = useState('')
  const [fileType, setFileType] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [gradeInput, setGradeInput] = useState<Record<string, string>>({})
  const [feedbackInput, setFeedbackInput] = useState<Record<string, string>>({})
  const [commentText, setCommentText] = useState('')
  const [classResources, setClassResources] = useState<any[]>([])
  const [downloadCounts, setDownloadCounts] = useState<Record<string, number>>({})
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string; type: string } | null>(null)

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

  // Fetch class resources
  useEffect(() => {
    if (!assignment?.classId) return
    const fetchResources = async () => {
      try {
        const res = await fetch(`/api/resources?classId=${assignment.classId}`)
        if (res.ok) {
          const data = await res.json()
          setClassResources(data)
          // Initialize download counts with random demo values
          const counts: Record<string, number> = {}
          data.forEach((r: any) => {
            counts[r.id] = Math.floor(Math.random() * 25) + 1
          })
          // Also add counts for assignment attachments
          if (assignment?.attachments) {
            try {
              const atts = JSON.parse(assignment.attachments)
              if (Array.isArray(atts)) {
                atts.forEach((a: any, idx: number) => {
                  counts[`att-${idx}`] = Math.floor(Math.random() * 30) + 1
                })
              }
            } catch { /* ignore */ }
          }
          setDownloadCounts(counts)
        }
      } catch {
        // silently fail
      }
    }
    fetchResources()
  }, [assignment?.classId, assignment?.attachments])

  const getTypeGradient = (type: string) => {
    const t = type?.toUpperCase()
    if (t === 'UJIAN') return { bg: 'from-red-500/20 to-rose-500/20', border: 'border-red-500/30', text: 'text-red-600 dark:text-red-400', label: 'Ujian' }
    if (t === 'KUIS') return { bg: 'from-amber-500/20 to-orange-500/20', border: 'border-amber-500/30', text: 'text-amber-600 dark:text-amber-400', label: 'Kuis' }
    return { bg: 'from-blue-500/20 to-cyan-500/20', border: 'border-blue-500/30', text: 'text-blue-600 dark:text-blue-400', label: 'Tugas' }
  }

  const uploadFile = useCallback(async (file: File) => {
    setUploading(true)
    setUploadProgress(0)
    setFileName(file.name)
    setFileType(file.type)

    try {
      const formData = new FormData()
      formData.append('file', file)

      // Simulate progress during upload
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + Math.random() * 15
        })
      }, 200)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Gagal mengunggah file')
        setFileName('')
        setFileUrl('')
        setFileType('')
        return
      }

      const data = await res.json()
      setUploadProgress(100)
      setFileUrl(data.url)
      setFileName(data.filename || file.name)
      toast.success(`File "${data.filename || file.name}" berhasil diunggah!`)
    } catch {
      toast.error('Terjadi kesalahan saat mengunggah file')
      setFileName('')
      setFileUrl('')
      setFileType('')
    } finally {
      setUploading(false)
    }
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!content && !fileUrl) {
      toast.error('Mohon isi konten atau unggah file')
      return
    }
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId, content, fileUrl: fileUrl || undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Gagal mengumpulkan')
        return
      }
      setMySubmission(data)
      setContent('')
      setFileName('')
      setFileUrl('')
      setFileType('')
      toast.success('Tugas berhasil dikumpulkan!')
    } catch {
      toast.error('Terjadi kesalahan')
    }
  }, [assignmentId, content, fileUrl])

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
      uploadFile(file)
    }
  }, [uploadFile])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadFile(file)
    }
    // Reset the input
    e.target.value = ''
  }, [uploadFile])

  const handleRemoveFile = useCallback(() => {
    setFileName('')
    setFileUrl('')
    setFileType('')
    toast.info('File dihapus')
  }, [])

  const isImageFile = (type: string) => type.startsWith('image/')
  const isPdfFile = (type: string) => type === 'application/pdf'
  const isVideoFile = (type: string) => type.startsWith('video/')
  const isAudioFile = (type: string) => type.startsWith('audio/')

  // Determine file type from URL extension
  const getFileTypeFromUrl = (url: string): string => {
    const ext = url.split('.').pop()?.toLowerCase() || ''
    const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp']
    const videoExts = ['mp4', 'webm', 'ogg', 'mov', 'avi']
    const audioExts = ['mp3', 'wav', 'ogg', 'aac', 'flac']
    const pdfExts = ['pdf']
    if (imageExts.includes(ext)) return 'image'
    if (videoExts.includes(ext)) return 'video'
    if (audioExts.includes(ext)) return 'audio'
    if (pdfExts.includes(ext)) return 'pdf'
    return 'other'
  }

  const openPreview = (url: string, name?: string) => {
    const fileType = getFileTypeFromUrl(url)
    setPreviewFile({ url, name: name || url.split('/').pop() || 'File', type: fileType })
  }

  // File type badge config
  const getFileTypeBadge = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase() || ''
    const badges: Record<string, { label: string; color: string; bg: string }> = {
      pdf: { label: 'PDF', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10' },
      zip: { label: 'ZIP', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
      rar: { label: 'RAR', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
      png: { label: 'PNG', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
      jpg: { label: 'JPG', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
      jpeg: { label: 'JPG', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
      gif: { label: 'GIF', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
      svg: { label: 'SVG', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
      doc: { label: 'DOC', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
      docx: { label: 'DOCX', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
      xls: { label: 'XLS', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
      xlsx: { label: 'XLSX', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
      ppt: { label: 'PPT', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10' },
      pptx: { label: 'PPTX', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10' },
      mp4: { label: 'MP4', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10' },
      mp3: { label: 'MP3', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10' },
      pkt: { label: 'PKT', color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-500/10' },
      psd: { label: 'PSD', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
    }
    return badges[ext] || { label: ext.toUpperCase() || 'FILE', color: 'text-[var(--glass-text-muted)]', bg: 'bg-[var(--chip-bg)]' }
  }

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
          {/* Deskripsi */}
          <div className="glass-card p-6">
            <h2 className="font-semibold text-[var(--glass-text)] mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" /> Deskripsi
            </h2>
            <p className="text-[var(--glass-text-secondary)] text-sm whitespace-pre-wrap leading-relaxed">
              {assignment?.description || 'Tidak ada deskripsi'}
            </p>
          </div>

          {/* Resource Materials */}
          {classResources.length > 0 && (
            <div className="glass-card p-6">
              <h2 className="font-semibold text-[var(--glass-text)] mb-3 flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" /> Materi Pendukung
              </h2>
              <p className="text-xs text-[var(--glass-text-muted)] mb-3">Sumber belajar dari kelas {assignment?.class?.name || ''}</p>
              <div className="space-y-2">
                {classResources.slice(0, 5).map((resource: any) => {
                  const badge = getFileTypeBadge(resource.fileUrl || resource.title || '')
                  const dlCount = downloadCounts[resource.id] || 0
                  return (
                    <div key={resource.id} className="interactive-card p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${badge.bg} ${badge.color} shrink-0`}>
                          {badge.label}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm text-[var(--glass-text)] font-medium truncate">{resource.title}</p>
                          <p className="text-[10px] text-[var(--glass-text-muted)]">{resource.fileType?.toUpperCase() || 'FILE'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="flex items-center gap-1 text-[10px] text-[var(--glass-text-muted)]">
                          <Download className="w-3 h-3" /> {dlCount}
                        </span>
                        <a
                          href={resource.fileUrl}
                          download
                          className="p-1.5 rounded-lg hover:bg-[var(--glass-hover-bg)] text-[var(--glass-text-muted)] hover:text-[var(--glass-text)] transition-colors"
                          onClick={() => {
                            setDownloadCounts(prev => ({ ...prev, [resource.id]: (prev[resource.id] || 0) + 1 }))
                          }}
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        {(resource.fileType === 'pdf' || resource.fileUrl?.endsWith('.pdf')) && (
                          <a
                            href={resource.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg hover:bg-[var(--glass-hover-bg)] text-[var(--glass-text-muted)] hover:text-[var(--glass-text)] transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

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
                    <div className="mt-2 p-3 rounded-lg bg-[var(--glass-input-bg)] border border-[var(--glass-border)]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <a href={mySubmission.fileUrl} download className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline truncate">
                            <Download className="w-3 h-3 shrink-0" /> {mySubmission.fileUrl.split('/').pop()}
                          </a>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${getFileTypeBadge(mySubmission.fileUrl).bg} ${getFileTypeBadge(mySubmission.fileUrl).color}`}>
                            {getFileTypeBadge(mySubmission.fileUrl).label}
                          </span>
                        </div>
                        <button
                          onClick={() => openPreview(mySubmission.fileUrl)}
                          className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-[var(--badge-blue-bg)] text-[var(--badge-blue-text)] hover:opacity-80 transition-opacity shrink-0"
                        >
                          <Eye className="w-3 h-3" /> Lihat
                        </button>
                      </div>
                    </div>
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
                    className={`drop-zone p-8 text-center ${dragActive ? 'active' : ''} ${uploading ? 'pointer-events-none opacity-70' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={handleDrop}
                    onClick={() => !uploading && document.getElementById('file-input')?.click()}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-10 h-10 text-[var(--badge-purple-text)] mx-auto mb-3 animate-spin" />
                        <p className="text-[var(--glass-text-secondary)] text-sm mb-3">Mengunggah file...</p>
                        <div className="max-w-xs mx-auto">
                          <div className="progress-bar h-2">
                            <motion.div
                              className="progress-bar-fill h-2"
                              initial={{ width: 0 }}
                              animate={{ width: `${uploadProgress}%` }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                          <p className="text-xs text-[var(--glass-text-muted)] mt-1">{Math.round(uploadProgress)}%</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <Upload className="w-10 h-10 text-[var(--glass-text-muted)] mx-auto mb-3" />
                        <p className="text-[var(--glass-text-secondary)] text-sm">Drag & drop file atau klik untuk memilih</p>
                        <p className="text-[var(--glass-text-muted)] text-xs mt-1">Maksimal 10MB</p>
                      </>
                    )}
                    <input
                      id="file-input"
                      type="file"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                  </div>

                  {/* File preview after upload */}
                  {fileName && !uploading && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass-card p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[var(--badge-green-bg)] flex items-center justify-center shrink-0">
                          <FileCheck2 className="w-5 h-5 text-[var(--badge-green-text)]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--glass-text)] truncate">{fileName}</p>
                          <p className="text-xs text-[var(--badge-green-text)]">Berhasil diunggah</p>
                        </div>
                        <button
                          onClick={handleRemoveFile}
                          className="p-1.5 rounded-lg hover:bg-[var(--badge-red-bg)] text-[var(--glass-text-muted)] hover:text-[var(--badge-red-text)] transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Image preview */}
                      {isImageFile(fileType) && fileUrl && (
                        <div className="mt-3 rounded-lg overflow-hidden border border-[var(--glass-border)]">
                          <img
                            src={fileUrl}
                            alt="Preview"
                            className="max-h-48 w-auto mx-auto"
                          />
                        </div>
                      )}

                      {/* PDF preview */}
                      {isPdfFile(fileType) && fileUrl && (
                        <div className="mt-3 rounded-lg overflow-hidden border border-[var(--glass-border)]">
                          <iframe
                            src={fileUrl}
                            className="w-full h-48"
                            title="PDF Preview"
                          />
                        </div>
                      )}
                    </motion.div>
                  )}

                  <textarea
                    placeholder="Tulis komentar atau catatan (opsional)..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="glass-input min-h-[80px] resize-none"
                  />
                  <button
                    onClick={handleSubmit}
                    disabled={uploading || (!content && !fileUrl)}
                    className="btn-gradient flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
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
                <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
                  {submissions.map((sub) => (
                    <div key={sub.id} className="glass-card p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                            {sub.user?.name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <span className="text-sm text-[var(--glass-text)] font-medium">{sub.user?.name || 'Siswa'}</span>
                            <p className="text-[10px] text-[var(--glass-text-muted)]">{sub.user?.email || ''}</p>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          sub.status === 'graded' ? 'bg-[var(--badge-green-bg)] text-[var(--badge-green-text)]' :
                          sub.status === 'late' ? 'bg-[var(--badge-amber-bg)] text-[var(--badge-amber-text)]' :
                          'bg-[var(--badge-blue-bg)] text-[var(--badge-blue-text)]'
                        }`}>
                          {sub.status === 'graded' ? 'Dinilai' : sub.status === 'late' ? 'Terlambat' : 'Terkumpul'}
                        </span>
                      </div>

                      {/* Submission content */}
                      {sub.content && (
                        <div className="p-3 rounded-lg bg-[var(--glass-input-bg)] border border-[var(--glass-border)]">
                          <p className="text-xs text-[var(--glass-text-muted)] mb-1 font-medium">Jawaban:</p>
                          <p className="text-sm text-[var(--glass-text-secondary)] whitespace-pre-wrap">{sub.content}</p>
                        </div>
                      )}

                      {/* Submission file with preview */}
                      {sub.fileUrl && (
                        <div className="p-3 rounded-lg bg-[var(--glass-input-bg)] border border-[var(--glass-border)]">
                          <p className="text-xs text-[var(--glass-text-muted)] mb-2 font-medium">File Terlampir:</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <a href={sub.fileUrl} download className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline truncate">
                                <Download className="w-3 h-3 shrink-0" /> {sub.fileUrl.split('/').pop()}
                              </a>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${getFileTypeBadge(sub.fileUrl).bg} ${getFileTypeBadge(sub.fileUrl).color}`}>
                                {getFileTypeBadge(sub.fileUrl).label}
                              </span>
                            </div>
                            <button
                              onClick={() => openPreview(sub.fileUrl)}
                              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white hover:opacity-90 transition-opacity shrink-0 shadow-sm"
                            >
                              <Eye className="w-3 h-3" /> Lihat File
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Grading section */}
                      {sub.status !== 'graded' && (
                        <div className="flex items-center gap-2 pt-2 border-t border-[var(--glass-border)]">
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
                        <div className="flex items-center gap-2 text-sm pt-2 border-t border-[var(--glass-border)]">
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
                <span className="text-[var(--glass-text-secondary)]">
                  {assignment?.class?.grade && assignment?.class?.direction 
                    ? `${assignment.class.grade}-${assignment.class.direction} ` 
                    : ''}{assignment?.class?.name || '-'}
                </span>
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

      {/* File Preview Modal */}
      <AnimatePresence>
        {previewFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setPreviewFile(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card max-w-4xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-[var(--glass-border)]">
                <div className="flex items-center gap-2 min-w-0">
                  <Eye className="w-5 h-5 text-[var(--glass-text-secondary)] shrink-0" />
                  <h3 className="text-sm font-semibold text-[var(--glass-text)] truncate">{previewFile.name}</h3>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${getFileTypeBadge(previewFile.url).bg} ${getFileTypeBadge(previewFile.url).color}`}>
                    {previewFile.type.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={previewFile.url}
                    download
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white hover:opacity-90 transition-opacity"
                  >
                    <Download className="w-3 h-3" /> Unduh
                  </a>
                  <button
                    onClick={() => setPreviewFile(null)}
                    className="p-1.5 rounded-lg hover:bg-[var(--glass-hover-bg)] text-[var(--glass-text-muted)] hover:text-[var(--glass-text)] transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-4 flex items-center justify-center overflow-auto max-h-[calc(90vh-64px)]">
                {previewFile.type === 'image' && (
                  <img
                    src={previewFile.url}
                    alt={previewFile.name}
                    className="max-w-full max-h-[70vh] object-contain rounded-lg"
                  />
                )}
                {previewFile.type === 'video' && (
                  <video
                    src={previewFile.url}
                    controls
                    className="max-w-full max-h-[70vh] rounded-lg"
                  >
                    Browser Anda tidak mendukung pemutar video.
                  </video>
                )}
                {previewFile.type === 'audio' && (
                  <div className="p-8 text-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4">
                      <Play className="w-8 h-8 text-white ml-1" />
                    </div>
                    <p className="text-sm text-[var(--glass-text)] font-medium mb-4">{previewFile.name}</p>
                    <audio src={previewFile.url} controls className="w-full max-w-md" />
                  </div>
                )}
                {previewFile.type === 'pdf' && (
                  <iframe
                    src={previewFile.url}
                    className="w-full h-[70vh] rounded-lg border border-[var(--glass-border)]"
                    title="PDF Preview"
                  />
                )}
                {previewFile.type === 'other' && (
                  <div className="py-12 text-center">
                    <div className="w-20 h-20 rounded-2xl bg-[var(--glass-input-bg)] flex items-center justify-center mx-auto mb-4">
                      <File className="w-10 h-10 text-[var(--glass-text-muted)]" />
                    </div>
                    <p className="text-sm text-[var(--glass-text)] font-medium mb-1">{previewFile.name}</p>
                    <p className="text-xs text-[var(--glass-text-muted)] mb-4">Preview tidak tersedia untuk tipe file ini</p>
                    <a
                      href={previewFile.url}
                      download
                      className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white hover:opacity-90 transition-opacity"
                    >
                      <Download className="w-4 h-4" /> Unduh File
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
