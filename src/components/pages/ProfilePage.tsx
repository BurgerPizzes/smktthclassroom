'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Mail, Camera, Save, Shield, Calendar, BookOpen, FileText,
  Users, CheckCircle2, Clock, Star, Pencil, X, Loader2, Award, Bell
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale/id'

interface ProfileStats {
  totalClasses: number
  totalAssignments: number
  totalSubmissions: number
  totalStudents?: number
  gradedCount?: number
  averageGrade?: number
  pendingSubmissions?: number
}

interface ActivityItem {
  id: string
  type: 'submission' | 'assignment' | 'announcement'
  title: string
  subtitle: string
  date: string
  icon: React.ElementType
  color: string
}

export default function ProfilePage() {
  const { user, setUser, setPage } = useAppStore()
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [stats, setStats] = useState<ProfileStats | null>(null)
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [statsLoading, setStatsLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/dashboard')
        if (res.ok) {
          const data = await res.json()
          setStats({
            totalClasses: data.stats.totalClasses,
            totalAssignments: data.stats.totalAssignments,
            totalSubmissions: data.stats.totalSubmissions,
            totalStudents: data.stats.totalStudents,
            gradedCount: data.stats.gradedCount,
            averageGrade: data.stats.averageGrade,
            pendingSubmissions: data.stats.pendingSubmissions,
          })
        }
      } catch {
        // silently fail
      } finally {
        setStatsLoading(false)
      }
    }

    const fetchActivities = async () => {
      try {
        const [subRes, annRes] = await Promise.all([
          fetch('/api/submissions'),
          fetch('/api/announcements'),
        ])
        const items: ActivityItem[] = []

        if (subRes.ok) {
          const subs = await subRes.json()
          subs.slice(0, 5).forEach((s: any) => {
            items.push({
              id: s.id,
              type: 'submission',
              title: s.assignment?.title || 'Tugas',
              subtitle: s.assignment?.class?.name || '',
              date: s.submittedAt,
              icon: s.status === 'graded' ? CheckCircle2 : Clock,
              color: s.status === 'graded'
                ? 'text-emerald-600 dark:text-emerald-400 bg-[var(--badge-green-bg)]'
                : 'text-blue-600 dark:text-blue-400 bg-[var(--badge-blue-bg)]',
            })
          })
        }

        if (annRes.ok) {
          const anns = await annRes.json()
          anns.slice(0, 3).forEach((a: any) => {
            items.push({
              id: a.id,
              type: 'announcement',
              title: a.title,
              subtitle: a.class?.name || '',
              date: a.createdAt,
              icon: Bell,
              color: 'text-purple-600 dark:text-purple-400 bg-[var(--badge-purple-bg)]',
            })
          })
        }

        items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        setActivities(items.slice(0, 5))
      } catch {
        // silently fail
      }
    }

    fetchStats()
    fetchActivities()
  }, [])

  const handleAvatarUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Format file tidak didukung. Gunakan JPG, PNG, GIF, atau WebP.')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB')
      return
    }

    setUploading(true)
    try {
      // Step 1: Upload file to /api/upload
      const formData = new FormData()
      formData.append('file', file)

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadRes.ok) {
        const uploadData = await uploadRes.json()
        toast.error(uploadData.error || 'Gagal mengunggah foto')
        return
      }

      const uploadData = await uploadRes.json()
      const avatarUrl = uploadData.url

      // Step 2: Save avatar URL to profile
      const profileRes = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: avatarUrl }),
      })

      if (!profileRes.ok) {
        toast.error('Gagal menyimpan foto profil')
        return
      }

      const updatedUser = await profileRes.json()
      setUser({ ...user!, avatar: updatedUser.avatar })
      toast.success('Foto profil berhasil diperbarui!')
    } catch {
      toast.error('Terjadi kesalahan saat mengunggah')
    } finally {
      setUploading(false)
      // Reset the input
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [user, setUser])

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      toast.error('Nama tidak boleh kosong')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Gagal menyimpan')
        return
      }
      setUser({ ...user!, name: data.name })
      setEditing(false)
      toast.success('Profil berhasil diperbarui!')
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }, [name, user, setUser])

  const handleCancelEdit = useCallback(() => {
    setName(user?.name || '')
    setEmail(user?.email || '')
    setEditing(false)
  }, [user?.name, user?.email])

  const roleLabels: Record<string, { label: string; color: string }> = {
    admin: { label: 'Administrator', color: 'from-rose-500 to-pink-500' },
    guru: { label: 'Guru', color: 'from-purple-500 to-violet-500' },
    siswa: { label: 'Siswa', color: 'from-blue-500 to-cyan-500' },
  }

  const roleInfo = roleLabels[user?.role || ''] || { label: user?.role || '', color: 'from-gray-500 to-gray-600' }

  const statCards = user?.role === 'guru' || user?.role === 'admin'
    ? [
        { icon: BookOpen, label: 'Total Kelas', value: stats?.totalClasses || 0, gradient: 'from-blue-500 to-cyan-500' },
        { icon: FileText, label: 'Tugas Dibuat', value: stats?.totalAssignments || 0, gradient: 'from-purple-500 to-pink-500' },
        { icon: Users, label: 'Total Siswa', value: stats?.totalStudents || 0, gradient: 'from-emerald-500 to-green-500' },
        { icon: CheckCircle2, label: 'Submissions Masuk', value: stats?.totalSubmissions || 0, gradient: 'from-amber-500 to-orange-500' },
      ]
    : [
        { icon: BookOpen, label: 'Kelas Diikuti', value: stats?.totalClasses || 0, gradient: 'from-blue-500 to-cyan-500' },
        { icon: CheckCircle2, label: 'Tugas Selesai', value: stats?.totalSubmissions || 0, gradient: 'from-emerald-500 to-green-500' },
        { icon: Clock, label: 'Belum Dikumpulkan', value: stats?.pendingSubmissions || 0, gradient: 'from-amber-500 to-orange-500' },
        { icon: FileText, label: 'Tugas Aktif', value: stats?.totalAssignments || 0, gradient: 'from-purple-500 to-pink-500' },
      ]

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Profile Banner */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className="bg-gradient-to-r from-[#667eea] to-[#764ba2] h-36 md:h-44 relative">
          <div className="dot-pattern absolute inset-0 opacity-20" />
          {/* Decorative circles */}
          <div className="absolute top-4 right-8 w-32 h-32 rounded-full bg-white/5" />
          <div className="absolute bottom-0 right-1/3 w-48 h-48 rounded-full bg-white/5" />
        </div>

        <div className="absolute -bottom-16 left-6 md:left-8">
          <div className="relative group">
            {/* Avatar */}
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl overflow-hidden border-4 border-[var(--main-bg)] shadow-xl bg-gradient-to-br from-[#667eea] to-[#764ba2]">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-4xl font-bold">
                  {user?.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
            </div>

            {/* Camera overlay */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 rounded-2xl flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-all duration-300 cursor-pointer"
            >
              {uploading ? (
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              ) : (
                <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>
        </div>

        {/* Edit button in banner */}
        <div className="absolute top-4 right-4">
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="glass-btn bg-white/20 border-white/30 text-white hover:bg-white/30 flex items-center gap-2 text-sm"
            >
              <Pencil className="w-4 h-4" /> Edit Profil
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleCancelEdit}
                className="glass-btn bg-white/20 border-white/30 text-white hover:bg-white/30 flex items-center gap-1 text-sm"
              >
                <X className="w-4 h-4" /> Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-gradient flex items-center gap-1 text-sm"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Simpan
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Profile Info Card */}
      <div className="mt-20 md:mt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 space-y-5"
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-[var(--glass-text)]">
                {editing ? (
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--glass-text-muted)]" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="glass-input pl-10 text-lg font-bold"
                      autoFocus
                    />
                  </div>
                ) : (
                  user?.name
                )}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <Mail className="w-3.5 h-3.5 text-[var(--glass-text-muted)]" />
                <span className="text-sm text-[var(--glass-text-secondary)]">{user?.email}</span>
              </div>
            </div>
            <div className={`px-3 py-1.5 rounded-lg bg-gradient-to-r ${roleInfo.color} text-white text-xs font-semibold`}>
              {roleInfo.label}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[var(--glass-border)]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[var(--badge-purple-bg)] flex items-center justify-center">
                <Shield className="w-4 h-4 text-[var(--badge-purple-text)]" />
              </div>
              <div>
                <p className="text-xs text-[var(--glass-text-muted)]">Peran</p>
                <p className="text-sm text-[var(--glass-text)] font-medium">{roleInfo.label}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[var(--badge-blue-bg)] flex items-center justify-center">
                <Mail className="w-4 h-4 text-[var(--badge-blue-text)]" />
              </div>
              <div>
                <p className="text-xs text-[var(--glass-text-muted)]">Email</p>
                <p className="text-sm text-[var(--glass-text)] font-medium">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[var(--badge-green-bg)] flex items-center justify-center">
                <Calendar className="w-4 h-4 text-[var(--badge-green-text)]" />
              </div>
              <div>
                <p className="text-xs text-[var(--glass-text-muted)]">Bergabung</p>
                <p className="text-sm text-[var(--glass-text)] font-medium">
                  {user?.id ? format(new Date(), 'dd MMM yyyy', { locale: localeId }) : '-'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[var(--badge-amber-bg)] flex items-center justify-center">
                <Award className="w-4 h-4 text-[var(--badge-amber-text)]" />
              </div>
              <div>
                <p className="text-xs text-[var(--glass-text-muted)]">Status</p>
                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <span className="status-dot status-dot-success" /> Aktif
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-4 border-t border-[var(--glass-border)]">
            <button onClick={() => setPage('change-password')} className="btn-glass text-sm flex items-center gap-2">
              Ubah Password
            </button>
          </div>
        </motion.div>
      </div>

      {/* Stats Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h3 className="text-lg font-semibold text-[var(--glass-text)] mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-[var(--badge-amber-text)]" /> Statistik
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="stat-card animate-pulse">
                <div className="skeleton h-5 w-16 rounded mb-3" />
                <div className="skeleton h-8 w-12 rounded" />
              </div>
            ))
          ) : (
            statCards.map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="glass-card-glow p-4 group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className="w-4 h-4 text-white" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-[var(--glass-text)]">{stat.value}</p>
                <p className="text-xs text-[var(--glass-text-secondary)] mt-1">{stat.label}</p>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      {/* Activity Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-lg font-semibold text-[var(--glass-text)] mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-[var(--badge-blue-text)]" /> Aktivitas Terbaru
        </h3>
        <div className="glass-card p-4">
          {activities.length > 0 ? (
            <div className="space-y-3">
              <AnimatePresence>
                {activities.map((activity, idx) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--glass-hover-bg)] transition-colors"
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${activity.color}`}>
                      <activity.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--glass-text)] truncate">{activity.title}</p>
                      <p className="text-xs text-[var(--glass-text-muted)]">{activity.subtitle}</p>
                    </div>
                    <span className="text-xs text-[var(--glass-text-muted)] shrink-0">
                      {format(new Date(activity.date), 'dd MMM', { locale: localeId })}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="empty-state py-8">
              <Clock className="w-10 h-10 mb-2" />
              <p className="text-sm">Belum ada aktivitas</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
