'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Upload, Search, Download, File, FileImage,
  FileVideo, FileAudio, FileCode, FilePlus, X, Eye, AlertCircle,
  LayoutGrid, List, HardDrive, BookOpen
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale/id'
import { toast } from 'sonner'

interface Resource {
  id: string
  title: string
  fileUrl: string
  fileType: string
  class: { id: string; name: string }
  uploader: { name: string }
  createdAt: string
}

interface ClassInfo {
  id: string
  name: string
}

// FILE_TYPE_CONFIG: maps file types to icon, colors, and gradient
const FILE_TYPE_CONFIG: Record<string, {
  icon: React.ElementType
  bg: string
  text: string
  gradient: string
  shadow: string
}> = {
  pdf: {
    icon: FileText,
    bg: 'bg-red-500/15',
    text: 'text-red-600 dark:text-red-400',
    gradient: 'from-red-500 to-rose-600',
    shadow: 'shadow-red-500/20',
  },
  doc: {
    icon: FileText,
    bg: 'bg-blue-500/15',
    text: 'text-blue-600 dark:text-blue-400',
    gradient: 'from-blue-500 to-indigo-600',
    shadow: 'shadow-blue-500/20',
  },
  docx: {
    icon: FileText,
    bg: 'bg-blue-500/15',
    text: 'text-blue-600 dark:text-blue-400',
    gradient: 'from-blue-500 to-indigo-600',
    shadow: 'shadow-blue-500/20',
  },
  xls: {
    icon: File,
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-600 dark:text-emerald-400',
    gradient: 'from-emerald-500 to-green-600',
    shadow: 'shadow-emerald-500/20',
  },
  xlsx: {
    icon: File,
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-600 dark:text-emerald-400',
    gradient: 'from-emerald-500 to-green-600',
    shadow: 'shadow-emerald-500/20',
  },
  ppt: {
    icon: FileText,
    bg: 'bg-orange-500/15',
    text: 'text-orange-600 dark:text-orange-400',
    gradient: 'from-orange-500 to-amber-600',
    shadow: 'shadow-orange-500/20',
  },
  pptx: {
    icon: FileText,
    bg: 'bg-orange-500/15',
    text: 'text-orange-600 dark:text-orange-400',
    gradient: 'from-orange-500 to-amber-600',
    shadow: 'shadow-orange-500/20',
  },
  jpg: {
    icon: FileImage,
    bg: 'bg-purple-500/15',
    text: 'text-purple-600 dark:text-purple-400',
    gradient: 'from-purple-500 to-violet-600',
    shadow: 'shadow-purple-500/20',
  },
  jpeg: {
    icon: FileImage,
    bg: 'bg-purple-500/15',
    text: 'text-purple-600 dark:text-purple-400',
    gradient: 'from-purple-500 to-violet-600',
    shadow: 'shadow-purple-500/20',
  },
  png: {
    icon: FileImage,
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-600 dark:text-emerald-400',
    gradient: 'from-emerald-500 to-teal-600',
    shadow: 'shadow-emerald-500/20',
  },
  gif: {
    icon: FileImage,
    bg: 'bg-purple-500/15',
    text: 'text-purple-600 dark:text-purple-400',
    gradient: 'from-purple-500 to-pink-600',
    shadow: 'shadow-purple-500/20',
  },
  mp4: {
    icon: FileVideo,
    bg: 'bg-rose-500/15',
    text: 'text-rose-600 dark:text-rose-400',
    gradient: 'from-rose-500 to-red-600',
    shadow: 'shadow-rose-500/20',
  },
  avi: {
    icon: FileVideo,
    bg: 'bg-rose-500/15',
    text: 'text-rose-600 dark:text-rose-400',
    gradient: 'from-rose-500 to-red-600',
    shadow: 'shadow-rose-500/20',
  },
  mp3: {
    icon: FileAudio,
    bg: 'bg-cyan-500/15',
    text: 'text-cyan-600 dark:text-cyan-400',
    gradient: 'from-cyan-500 to-blue-600',
    shadow: 'shadow-cyan-500/20',
  },
  wav: {
    icon: FileAudio,
    bg: 'bg-cyan-500/15',
    text: 'text-cyan-600 dark:text-cyan-400',
    gradient: 'from-cyan-500 to-blue-600',
    shadow: 'shadow-cyan-500/20',
  },
  zip: {
    icon: File,
    bg: 'bg-amber-500/15',
    text: 'text-amber-600 dark:text-amber-400',
    gradient: 'from-amber-500 to-yellow-600',
    shadow: 'shadow-amber-500/20',
  },
  js: {
    icon: FileCode,
    bg: 'bg-yellow-500/15',
    text: 'text-yellow-600 dark:text-yellow-400',
    gradient: 'from-yellow-500 to-amber-600',
    shadow: 'shadow-yellow-500/20',
  },
  py: {
    icon: FileCode,
    bg: 'bg-sky-500/15',
    text: 'text-sky-600 dark:text-sky-400',
    gradient: 'from-sky-500 to-blue-600',
    shadow: 'shadow-sky-500/20',
  },
}

const DEFAULT_FILE_CONFIG = {
  icon: FileText,
  bg: 'bg-[var(--chip-bg)]',
  text: 'text-[var(--glass-text-secondary)]',
  gradient: 'from-gray-500 to-slate-600',
  shadow: 'shadow-gray-500/20',
}

// File types that can be previewed in browser
const PREVIEWABLE_TYPES = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'mp4', 'mp3', 'wav', 'txt', 'html']

function getFileConfig(type: string) {
  return FILE_TYPE_CONFIG[type?.toLowerCase()] || DEFAULT_FILE_CONFIG
}

function isPreviewable(type: string) {
  return PREVIEWABLE_TYPES.includes(type?.toLowerCase())
}

// Generate simulated file size from title hash
function getSimulatedFileSize(title: string): string {
  let hash = 0
  for (let i = 0; i < title.length; i++) {
    hash = ((hash << 5) - hash) + title.charCodeAt(i)
    hash |= 0
  }
  const absHash = Math.abs(hash)
  const sizeInKB = (absHash % 10000) + 50 // 50 KB to ~10 MB
  if (sizeInKB >= 1024) {
    return `${(sizeInKB / 1024).toFixed(1)} MB`
  }
  return `${sizeInKB} KB`
}

// Check if resource was added within 7 days
function isRecentlyAdded(createdAt: string): boolean {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  return new Date(createdAt) > sevenDaysAgo
}

export default function LearningResourcesPage() {
  const { user, setPage } = useAppStore()
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [classFilter, setClassFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest')
  const [showUpload, setShowUpload] = useState(false)
  const [uploadForm, setUploadForm] = useState({ title: '', fileType: 'pdf', classId: '' })
  const [fileName, setFileName] = useState('')
  const [uploadingFile, setUploadingFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [previewResource, setPreviewResource] = useState<Resource | null>(null)
  const [previewError, setPreviewError] = useState(false)
  const [userClasses, setUserClasses] = useState<ClassInfo[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const isGuru = user?.role === 'guru' || user?.role === 'admin'

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const res = await fetch('/api/resources')
        if (res.ok) setResources(await res.json())
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchResources()
  }, [])

  // Fetch user's classes for upload form
  useEffect(() => {
    if (!isGuru) return
    const fetchClasses = async () => {
      try {
        const res = await fetch('/api/classes')
        if (res.ok) {
          const classes = await res.json()
          setUserClasses(classes.map((c: any) => ({ id: c.id, name: c.name })))
          if (classes.length > 0 && !uploadForm.classId) {
            setUploadForm(prev => ({ ...prev, classId: classes[0].id }))
          }
        }
      } catch {
        // silently fail
      }
    }
    fetchClasses()
  }, [isGuru])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadingFile(file)
      setFileName(file.name)
      // Auto-detect file type
      const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf'
      if (FILE_TYPE_CONFIG[ext]) {
        setUploadForm(prev => ({ ...prev, fileType: ext }))
      }
    }
  }, [])

  const handleUpload = useCallback(async () => {
    if (!uploadForm.title.trim()) {
      toast.error('Judul wajib diisi')
      return
    }
    if (!uploadForm.classId) {
      toast.error('Pilih kelas terlebih dahulu')
      return
    }

    setIsUploading(true)
    try {
      let fileUrl = fileName || `${uploadForm.title}.${uploadForm.fileType}`

      // If there's an actual file, upload it
      if (uploadingFile) {
        const formData = new FormData()
        formData.append('file', uploadingFile)
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json()
          fileUrl = uploadData.url
        }
      }

      const res = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...uploadForm,
          fileUrl,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Gagal mengunggah')
        return
      }
      setResources((prev) => [data, ...prev])
      setShowUpload(false)
      setUploadForm({ title: '', fileType: 'pdf', classId: userClasses[0]?.id || '' })
      setFileName('')
      setUploadingFile(null)
      toast.success('Resource berhasil diunggah!')
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setIsUploading(false)
    }
  }, [uploadForm, fileName, uploadingFile, userClasses])

  const handleDownload = useCallback((resource: Resource) => {
    const link = document.createElement('a')
    link.href = resource.fileUrl
    link.download = `${resource.title}.${resource.fileType}`
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(`Mengunduh ${resource.title}`)
  }, [])

  const handlePreview = useCallback((resource: Resource) => {
    setPreviewResource(resource)
    setPreviewError(false)
  }, [])

  const types = useMemo(() => [...new Set(resources.map((r) => r.fileType))], [resources])

  // Resource count per class for filter tabs
  const classCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    resources.forEach((r) => {
      counts[r.class.name] = (counts[r.class.name] || 0) + 1
    })
    return counts
  }, [resources])

  // Type filter count
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    resources.forEach((r) => {
      counts[r.fileType] = (counts[r.fileType] || 0) + 1
    })
    return counts
  }, [resources])

  const classFilterOptions = useMemo(() => {
    const classes = new Map<string, string>()
    resources.forEach((r) => {
      classes.set(r.class.id, r.class.name)
    })
    return Array.from(classes.entries())
  }, [resources])

  const filtered = useMemo(() => {
    let result = resources.filter((r) => {
      const matchSearch = r.title.toLowerCase().includes(search.toLowerCase())
      const matchType = typeFilter === 'all' || r.fileType === typeFilter
      const matchClass = classFilter === 'all' || r.class.id === classFilter
      return matchSearch && matchType && matchClass
    })
    result.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      return a.title.localeCompare(b.title)
    })
    return result
  }, [resources, search, typeFilter, classFilter, sortBy])

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="skeleton h-10 w-48 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass-card p-4"><div className="skeleton h-24 rounded" /></div>
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
            <span className="gradient-text">Sumber Belajar</span>
          </h1>
          <p className="text-[var(--glass-text-secondary)] text-sm mt-1">Materi dan dokumen pembelajaran</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="view-toggle">
            <button
              onClick={() => setViewMode('grid')}
              className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              title="Tampilan grid"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              title="Tampilan daftar"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
          {isGuru && (
            <button onClick={() => setShowUpload(true)} className="btn-gradient flex items-center gap-2 text-sm">
              <Upload className="w-4 h-4" /> Unggah
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter */}
      <div className="glass-card p-4 md:p-5 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--glass-text-muted)]" />
            <input
              type="text"
              placeholder="Cari resource..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="glass-input pl-10"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--glass-text-muted)] hover:text-[var(--glass-text)]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'name')}
            className="glass-input styled-select text-sm w-auto sm:w-40"
          >
            <option value="newest">Terbaru</option>
            <option value="oldest">Terlama</option>
            <option value="name">Nama A-Z</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setTypeFilter('all'); setClassFilter('all') }}
            className={`category-chip ${typeFilter === 'all' && classFilter === 'all' ? 'active' : ''}`}
          >
            Semua ({resources.length})
          </button>
          {types.map((t) => {
            const config = getFileConfig(t)
            const ConfigIcon = config.icon
            return (
              <button
                key={t}
                onClick={() => { setTypeFilter(t); setClassFilter('all') }}
                className={`category-chip ${typeFilter === t ? 'active' : ''}`}
              >
                <ConfigIcon className="w-3 h-3" />
                {t.toUpperCase()} ({typeCounts[t] || 0})
              </button>
            )
          })}
        </div>
        {/* Class filter */}
        {classFilterOptions.length > 1 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-[var(--glass-text-muted)] flex items-center gap-1 mr-1">
              <BookOpen className="w-3 h-3" /> Kelas:
            </span>
            <button
              onClick={() => setClassFilter('all')}
              className={`category-chip ${classFilter === 'all' ? 'active' : ''}`}
            >
              Semua
            </button>
            {classFilterOptions.map(([id, name]) => (
              <button
                key={id}
                onClick={() => { setClassFilter(id); setTypeFilter('all') }}
                className={`category-chip ${classFilter === id ? 'active' : ''}`}
              >
                {name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Resource Grid / List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((resource, idx) => {
              const config = getFileConfig(resource.fileType)
              const ConfigIcon = config.icon
              const canPreview = isPreviewable(resource.fileType)
              const isNew = isRecentlyAdded(resource.createdAt)
              const fileSize = getSimulatedFileSize(resource.title)

              return (
                <motion.div
                  key={resource.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: idx * 0.05 }}
                  className="interactive-card p-5 md:p-6"
                >
                  <div className="flex items-start gap-4">
                    {/* Large file type badge */}
                    <div className={`file-type-badge w-14 h-14 bg-gradient-to-br ${config.gradient} ${config.shadow} shadow-lg shrink-0`}>
                      <ConfigIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-[var(--glass-text)] truncate">{resource.title}</h3>
                        {isNew && <span className="new-badge">Baru</span>}
                      </div>
                      <p className="text-xs text-[var(--glass-text-muted)] mt-0.5">{resource.class.name}</p>
                      <p className="text-xs text-[var(--glass-text-muted)] mt-0.5">oleh {resource.uploader.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--glass-border)]">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.bg} ${config.text}`}>
                        {resource.fileType.toUpperCase()}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-[var(--glass-text-muted)]">
                        <HardDrive className="w-3 h-3" />
                        {fileSize}
                      </span>
                      <span className="text-xs text-[var(--glass-text-muted)]">
                        {format(new Date(resource.createdAt), 'dd MMM', { locale: localeId })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {canPreview && (
                        <button
                          onClick={() => handlePreview(resource)}
                          className="text-[var(--glass-text-muted)] hover:text-purple-600 dark:hover:text-purple-400 transition-colors p-1"
                          title="Lihat"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDownload(resource)}
                        className="text-[var(--glass-text-muted)] hover:text-[var(--glass-text-secondary)] transition-colors p-1"
                        title="Unduh"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      ) : (
        /* List view */
        <div className="space-y-2">
          <AnimatePresence>
            {filtered.map((resource, idx) => {
              const config = getFileConfig(resource.fileType)
              const ConfigIcon = config.icon
              const canPreview = isPreviewable(resource.fileType)
              const isNew = isRecentlyAdded(resource.createdAt)
              const fileSize = getSimulatedFileSize(resource.title)

              return (
                <motion.div
                  key={resource.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ delay: idx * 0.03 }}
                  className="interactive-card p-4 flex items-center gap-4"
                >
                  {/* Large file type badge */}
                  <div className={`file-type-badge w-12 h-12 bg-gradient-to-br ${config.gradient} ${config.shadow} shadow-md shrink-0`}>
                    <ConfigIcon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-[var(--glass-text)] truncate">{resource.title}</h3>
                      {isNew && <span className="new-badge">Baru</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-[var(--glass-text-muted)]">
                      <span>{resource.class.name}</span>
                      <span>•</span>
                      <span>{resource.uploader.name}</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5"><HardDrive className="w-2.5 h-2.5" />{fileSize}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.bg} ${config.text}`}>
                      {resource.fileType.toUpperCase()}
                    </span>
                    <span className="text-xs text-[var(--glass-text-muted)] hidden sm:inline">
                      {format(new Date(resource.createdAt), 'dd MMM', { locale: localeId })}
                    </span>
                    {canPreview && (
                      <button
                        onClick={() => handlePreview(resource)}
                        className="text-[var(--glass-text-muted)] hover:text-purple-600 dark:hover:text-purple-400 transition-colors p-1"
                        title="Lihat"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDownload(resource)}
                      className="text-[var(--glass-text-muted)] hover:text-[var(--glass-text-secondary)] transition-colors p-1"
                      title="Unduh"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Empty State */}
      {filtered.length === 0 && !loading && (
        <div className="empty-state py-16">
          <FileText className="w-16 h-16 mb-4" />
          <h3 className="text-lg font-medium text-[var(--glass-text-secondary)] mb-2">Tidak ada resource</h3>
          <p className="text-[var(--glass-text-muted)] text-sm">
            {search || typeFilter !== 'all' ? 'Coba filter lain' : 'Belum ada sumber belajar yang diunggah'}
          </p>
        </div>
      )}

      {/* File Preview Dialog */}
      <AnimatePresence>
        {previewResource && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-bg)] backdrop-blur-sm p-4"
            onClick={() => setPreviewResource(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="gradient-border w-full max-w-4xl max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="glass-card p-0 overflow-hidden flex flex-col max-h-[90vh]">
                {/* Preview Header */}
                <div className="flex items-center justify-between p-4 border-b border-[var(--glass-border)]">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const cfg = getFileConfig(previewResource.fileType)
                      const CIcon = cfg.icon
                      return (
                        <div className={`file-type-badge w-8 h-8 bg-gradient-to-br ${cfg.gradient}`}>
                          <CIcon className="w-4 h-4 text-white" />
                        </div>
                      )
                    })()}
                    <div>
                      <h3 className="text-sm font-medium text-[var(--glass-text)]">{previewResource.title}</h3>
                      <p className="text-xs text-[var(--glass-text-muted)]">{previewResource.class.name} • {previewResource.uploader.name} • {getSimulatedFileSize(previewResource.title)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownload(previewResource)}
                      className="btn-glass flex items-center gap-1 text-xs"
                    >
                      <Download className="w-3 h-3" /> Unduh
                    </button>
                    <button onClick={() => setPreviewResource(null)} className="text-[var(--glass-text-muted)] hover:text-[var(--glass-text)]">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                {/* Preview Content */}
                <div className="flex-1 overflow-auto p-4 min-h-[400px]">
                  {previewError ? (
                    <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
                      <AlertCircle className="w-16 h-16 text-amber-500 mb-4" />
                      <p className="text-[var(--glass-text-secondary)] text-sm mb-4">
                        File tidak ditemukan. File mungkin telah dihapus atau dipindahkan.
                      </p>
                      <button
                        onClick={() => handleDownload(previewResource)}
                        className="btn-gradient flex items-center gap-2 text-sm"
                      >
                        <Download className="w-4 h-4" /> Coba Unduh
                      </button>
                    </div>
                  ) : previewResource.fileType.toLowerCase() === 'pdf' ? (
                    <iframe
                      src={previewResource.fileUrl}
                      className="w-full h-[70vh] rounded-lg border border-[var(--glass-border)]"
                      title={previewResource.title}
                      onError={() => setPreviewError(true)}
                    />
                  ) : ['jpg', 'jpeg', 'png', 'gif'].includes(previewResource.fileType.toLowerCase()) ? (
                    <div className="flex items-center justify-center min-h-[400px]">
                      <img
                        src={previewResource.fileUrl}
                        alt={previewResource.title}
                        className="max-w-full max-h-[70vh] rounded-lg object-contain"
                        onError={() => setPreviewError(true)}
                      />
                    </div>
                  ) : ['mp4', 'avi'].includes(previewResource.fileType.toLowerCase()) ? (
                    <video
                      src={previewResource.fileUrl}
                      controls
                      className="w-full max-h-[70vh] rounded-lg"
                      onError={() => setPreviewError(true)}
                    >
                      Browser Anda tidak mendukung pemutaran video.
                    </video>
                  ) : ['mp3', 'wav'].includes(previewResource.fileType.toLowerCase()) ? (
                    <div className="flex items-center justify-center min-h-[200px]">
                      <audio src={previewResource.fileUrl} controls className="w-full max-w-md" onError={() => setPreviewError(true)} />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
                      <FileText className="w-16 h-16 text-[var(--glass-text-muted)] mb-4" />
                      <p className="text-[var(--glass-text-secondary)] text-sm mb-4">
                        Preview tidak tersedia untuk tipe file ini
                      </p>
                      <button
                        onClick={() => handleDownload(previewResource)}
                        className="btn-gradient flex items-center gap-2 text-sm"
                      >
                        <Download className="w-4 h-4" /> Unduh File
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Dialog */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-bg)] backdrop-blur-sm p-4"
            onClick={() => setShowUpload(false)}
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
                    <FilePlus className="w-5 h-5 text-purple-600 dark:text-purple-400" /> Unggah Resource
                  </h2>
                  <button onClick={() => setShowUpload(false)} className="text-[var(--glass-text-muted)] hover:text-[var(--glass-text)]">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Judul Resource"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  className="glass-input"
                />

                {/* Class selector */}
                <div>
                  <label className="text-sm text-[var(--glass-text-secondary)] mb-1.5 block">Kelas</label>
                  <select
                    value={uploadForm.classId}
                    onChange={(e) => setUploadForm({ ...uploadForm, classId: e.target.value })}
                    className="glass-input styled-select w-full"
                  >
                    <option value="">Pilih Kelas</option>
                    {userClasses.map((cls) => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-[var(--glass-text-secondary)] mb-1.5 block">Tipe File</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['pdf', 'doc', 'xls', 'ppt', 'jpg', 'mp4', 'mp3', 'zip'].map((t) => {
                      const tConfig = getFileConfig(t)
                      const TIcon = tConfig.icon
                      return (
                        <button
                          key={t}
                          onClick={() => setUploadForm({ ...uploadForm, fileType: t })}
                          className={`py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                            uploadForm.fileType === t
                              ? `bg-gradient-to-br ${tConfig.gradient} text-white shadow-md`
                              : 'glass-btn text-[var(--glass-text-secondary)]'
                          }`}
                        >
                          <TIcon className="w-3 h-3" />
                          {t.toUpperCase()}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div
                  className="drop-zone p-4 text-center cursor-pointer"
                  onClick={() => document.getElementById('file-upload-input')?.click()}
                >
                  <Upload className="w-8 h-8 text-[var(--glass-text-muted)] mx-auto mb-2" />
                  <p className="text-[var(--glass-text-muted)] text-sm">Klik untuk memilih file</p>
                  {fileName && <p className="text-blue-600 dark:text-blue-400 text-xs mt-1">📎 {fileName}</p>}
                  <input
                    id="file-upload-input"
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowUpload(false)} className="btn-glass text-sm">Batal</button>
                  <button onClick={handleUpload} disabled={isUploading} className="btn-gradient text-sm flex items-center gap-2">
                    {isUploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Mengunggah...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" /> Unggah
                      </>
                    )}
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
