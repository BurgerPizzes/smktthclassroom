'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Upload, Search, Download, File, FileImage,
  FileVideo, FileAudio, FileCode, FilePlus, X, Eye, ExternalLink, AlertCircle
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

const FILE_ICONS: Record<string, React.ElementType> = {
  pdf: FileText,
  doc: FileText,
  docx: FileText,
  xls: File,
  xlsx: File,
  ppt: File,
  pptx: File,
  jpg: FileImage,
  jpeg: FileImage,
  png: FileImage,
  gif: FileImage,
  mp4: FileVideo,
  avi: FileVideo,
  mp3: FileAudio,
  wav: FileAudio,
  js: FileCode,
  py: FileCode,
  zip: File,
  default: FileText,
}

const FILE_COLORS: Record<string, string> = {
  pdf: 'bg-[var(--badge-red-bg)] text-[var(--badge-red-text)]',
  doc: 'bg-[var(--badge-blue-bg)] text-[var(--badge-blue-text)]',
  docx: 'bg-[var(--badge-blue-bg)] text-[var(--badge-blue-text)]',
  xls: 'bg-[var(--badge-green-bg)] text-[var(--badge-green-text)]',
  xlsx: 'bg-[var(--badge-green-bg)] text-[var(--badge-green-text)]',
  ppt: 'bg-[var(--badge-amber-bg)] text-[var(--badge-amber-text)]',
  pptx: 'bg-[var(--badge-amber-bg)] text-[var(--badge-amber-text)]',
  jpg: 'bg-[var(--badge-purple-bg)] text-[var(--badge-purple-text)]',
  png: 'bg-[var(--badge-purple-bg)] text-[var(--badge-purple-text)]',
  mp4: 'bg-[var(--badge-purple-bg)] text-[var(--badge-purple-text)]',
  mp3: 'bg-[var(--badge-blue-bg)] text-[var(--badge-blue-text)]',
  default: 'bg-[var(--chip-bg)] text-[var(--chip-text)]',
}

// File types that can be previewed in browser
const PREVIEWABLE_TYPES = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'mp4', 'mp3', 'wav', 'txt', 'html']

function getFileIcon(type: string) {
  return FILE_ICONS[type?.toLowerCase()] || FILE_ICONS.default
}

function getFileColor(type: string) {
  return FILE_COLORS[type?.toLowerCase()] || FILE_COLORS.default
}

function isPreviewable(type: string) {
  return PREVIEWABLE_TYPES.includes(type?.toLowerCase())
}

export default function LearningResourcesPage() {
  const { user, setPage } = useAppStore()
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showUpload, setShowUpload] = useState(false)
  const [uploadForm, setUploadForm] = useState({ title: '', fileType: 'pdf', classId: '' })
  const [fileName, setFileName] = useState('')
  const [uploadingFile, setUploadingFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [previewResource, setPreviewResource] = useState<Resource | null>(null)
  const [previewError, setPreviewError] = useState(false)
  const [userClasses, setUserClasses] = useState<ClassInfo[]>([])

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
      if (FILE_ICONS[ext]) {
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

  const types = [...new Set(resources.map((r) => r.fileType))]

  const filtered = resources.filter((r) => {
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === 'all' || r.fileType === typeFilter
    return matchSearch && matchType
  })

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
        {isGuru && (
          <button onClick={() => setShowUpload(true)} className="btn-gradient flex items-center gap-2 text-sm">
            <Upload className="w-4 h-4" /> Unggah
          </button>
        )}
      </div>

      {/* Search & Filter */}
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
        </div>
        <div className="flex gap-2 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              typeFilter === 'all' ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white' : 'glass-btn text-[var(--glass-text-secondary)]'
            }`}
          >
            Semua
          </button>
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                typeFilter === t ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white' : 'glass-btn text-[var(--glass-text-secondary)]'
              }`}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Resource Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filtered.map((resource, idx) => {
            const Icon = getFileIcon(resource.fileType)
            const color = getFileColor(resource.fileType)
            const canPreview = isPreviewable(resource.fileType)
            return (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: idx * 0.05 }}
                className="interactive-card p-4"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-[var(--glass-text)] truncate">{resource.title}</h3>
                    <p className="text-xs text-[var(--glass-text-muted)] mt-0.5">{resource.class.name}</p>
                    <p className="text-xs text-[var(--glass-text-muted)] mt-0.5">oleh {resource.uploader.name}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--glass-border)]">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>
                      {resource.fileType.toUpperCase()}
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
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getFileColor(previewResource.fileType)}`}>
                      {(() => { const PI = getFileIcon(previewResource.fileType); return <PI className="w-4 h-4" /> })()}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-[var(--glass-text)]">{previewResource.title}</h3>
                      <p className="text-xs text-[var(--glass-text-muted)]">{previewResource.class.name} • {previewResource.uploader.name}</p>
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
                    className="glass-input w-full"
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
                    {['pdf', 'doc', 'xls', 'ppt', 'jpg', 'mp4', 'mp3', 'zip'].map((t) => (
                      <button
                        key={t}
                        onClick={() => setUploadForm({ ...uploadForm, fileType: t })}
                        className={`py-2 rounded-lg text-xs font-medium transition-all ${
                          uploadForm.fileType === t
                            ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white'
                            : 'glass-btn text-[var(--glass-text-secondary)]'
                        }`}
                      >
                        {t.toUpperCase()}
                      </button>
                    ))}
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
