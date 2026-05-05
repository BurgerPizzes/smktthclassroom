'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Search, Plus, Pencil, Trash2, Shield, X, UserPlus,
  CheckCircle2, BookOpen, GraduationCap, User, Calendar,
  ChevronDown, AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale/id'

interface UserItem {
  id: string
  name: string
  email: string
  role: string
  avatar?: string | null
  createdAt: string
}

const ROLE_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType; gradient: string }> = {
  admin: { label: 'Admin', color: 'bg-[var(--badge-purple-bg)] text-[var(--badge-purple-text)]', icon: Shield, gradient: 'from-purple-500 to-pink-500' },
  guru: { label: 'Guru', color: 'bg-[var(--badge-blue-bg)] text-[var(--badge-blue-text)]', icon: BookOpen, gradient: 'from-blue-500 to-cyan-500' },
  siswa: { label: 'Siswa', color: 'bg-[var(--badge-green-bg)] text-[var(--badge-green-text)]', icon: GraduationCap, gradient: 'from-emerald-500 to-green-500' },
}

function getAvatarColor(name: string) {
  const colors = [
    'from-purple-500 to-pink-500',
    'from-blue-500 to-cyan-500',
    'from-emerald-500 to-green-500',
    'from-amber-500 to-orange-500',
    'from-rose-500 to-red-500',
    'from-violet-500 to-indigo-500',
    'from-teal-500 to-cyan-500',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [showDialog, setShowDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<UserItem | null>(null)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'siswa' })
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/users')
        if (res.ok) setUsers(await res.json())
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  // Compute stats
  const stats = useMemo(() => ({
    total: users.length,
    admin: users.filter(u => u.role === 'admin').length,
    guru: users.filter(u => u.role === 'guru').length,
    siswa: users.filter(u => u.role === 'siswa').length,
  }), [users])

  // Filtered users
  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      const matchRole = roleFilter === 'all' || u.role === roleFilter
      return matchSearch && matchRole
    })
  }, [users, search, roleFilter])

  const openCreate = () => {
    setEditingUser(null)
    setForm({ name: '', email: '', password: '', role: 'siswa' })
    setShowDialog(true)
  }

  const openEdit = (user: UserItem) => {
    setEditingUser(user)
    setForm({ name: user.name, email: user.email, password: '', role: user.role })
    setShowDialog(true)
  }

  const handleSave = useCallback(async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Nama dan email wajib diisi')
      return
    }
    try {
      if (editingUser) {
        const res = await fetch('/api/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingUser.id, name: form.name, email: form.email, role: form.role, ...(form.password ? { password: form.password } : {}) }),
        })
        const data = await res.json()
        if (!res.ok) {
          toast.error(data.error || 'Gagal memperbarui')
          return
        }
        setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? { ...u, ...data } : u)))
        toast.success('User berhasil diperbarui!')
      } else {
        if (!form.password) {
          toast.error('Password wajib diisi untuk user baru')
          return
        }
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        const data = await res.json()
        if (!res.ok) {
          toast.error(data.error || 'Gagal membuat user')
          return
        }
        setUsers((prev) => [data.user || data, ...prev])
        toast.success('User berhasil dibuat!')
      }
      setShowDialog(false)
    } catch {
      toast.error('Terjadi kesalahan')
    }
  }, [form, editingUser])

  const handleDelete = useCallback(async (id: string) => {
    try {
      const res = await fetch('/api/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) {
        toast.error('Gagal menghapus user')
        return
      }
      setUsers((prev) => prev.filter((u) => u.id !== id))
      setSelectedUsers((prev) => { const next = new Set(prev); next.delete(id); return next })
      toast.success('User berhasil dihapus!')
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setShowDeleteConfirm(null)
    }
  }, [])

  const handleBulkDelete = useCallback(async () => {
    try {
      const ids = Array.from(selectedUsers)
      await Promise.all(ids.map(id =>
        fetch('/api/users', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        })
      ))
      setUsers((prev) => prev.filter((u) => !selectedUsers.has(u.id)))
      toast.success(`${ids.length} user berhasil dihapus!`)
      setSelectedUsers(new Set())
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setShowBulkDeleteConfirm(false)
    }
  }, [selectedUsers])

  const toggleSelect = (id: string) => {
    setSelectedUsers(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedUsers.size === filtered.length) {
      setSelectedUsers(new Set())
    } else {
      setSelectedUsers(new Set(filtered.map(u => u.id)))
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="skeleton h-10 w-48 rounded-xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="stat-card"><div className="skeleton h-20 rounded" /></div>
          ))}
        </div>
        <div className="glass-card p-4"><div className="skeleton h-64 rounded" /></div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--glass-text)]">
            <span className="gradient-text">Manajemen</span> User
          </h1>
          <p className="text-[var(--glass-text-secondary)] text-sm mt-1">{users.length} pengguna terdaftar</p>
        </div>
        <button onClick={openCreate} className="btn-gradient flex items-center gap-2 text-sm">
          <UserPlus className="w-4 h-4" /> Tambah User
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total User', value: stats.total, icon: Users, gradient: 'from-[#667eea] to-[#764ba2]', bg: 'bg-[var(--badge-purple-bg)]', text: 'text-[var(--badge-purple-text)]' },
          { label: 'Admin', value: stats.admin, icon: Shield, gradient: 'from-purple-500 to-pink-500', bg: 'bg-[var(--badge-purple-bg)]', text: 'text-[var(--badge-purple-text)]' },
          { label: 'Guru', value: stats.guru, icon: BookOpen, gradient: 'from-blue-500 to-cyan-500', bg: 'bg-[var(--badge-blue-bg)]', text: 'text-[var(--badge-blue-text)]' },
          { label: 'Siswa', value: stats.siswa, icon: GraduationCap, gradient: 'from-emerald-500 to-green-500', bg: 'bg-[var(--badge-green-bg)]', text: 'text-[var(--badge-green-text)]' },
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

      {/* Filters */}
      <div className="glass-card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--glass-text-muted)]" />
            <input
              type="text"
              placeholder="Cari nama atau email..."
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

          {/* Role Filter Tabs */}
          <div className="flex gap-2 flex-wrap">
            {['all', 'admin', 'guru', 'siswa'].map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  roleFilter === role
                    ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white'
                    : 'glass-btn text-[var(--glass-text-secondary)]'
                }`}
              >
                {role === 'all' ? 'Semua' : ROLE_CONFIG[role]?.label || role}
              </button>
            ))}
          </div>
        </div>

        {/* Bulk actions */}
        {selectedUsers.size > 0 && (
          <div className="flex items-center gap-3 pt-3 border-t border-[var(--glass-border)]">
            <span className="text-sm text-[var(--glass-text-secondary)]">{selectedUsers.size} user dipilih</span>
            <button
              onClick={() => setShowBulkDeleteConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--badge-red-bg)] text-[var(--badge-red-text)] hover:opacity-80 transition-opacity"
            >
              <Trash2 className="w-3 h-3" /> Hapus Terpilih
            </button>
            <button
              onClick={() => setSelectedUsers(new Set())}
              className="text-xs text-[var(--glass-text-muted)] hover:text-[var(--glass-text-secondary)]"
            >
              Batal
            </button>
          </div>
        )}
      </div>

      {/* Select All */}
      {filtered.length > 0 && (
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedUsers.size === filtered.length && filtered.length > 0}
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded border-[var(--glass-border)] accent-[#667eea]"
            />
            <span className="text-sm text-[var(--glass-text-secondary)]">Pilih semua ({filtered.length})</span>
          </label>
        </div>
      )}

      {/* User Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filtered.map((u, idx) => {
            const roleConfig = ROLE_CONFIG[u.role] || ROLE_CONFIG.siswa
            const avatarGradient = getAvatarColor(u.name)
            const isSelected = selectedUsers.has(u.id)

            return (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.03 }}
                className={`interactive-card p-4 relative ${isSelected ? 'ring-2 ring-[#667eea]/50 border-[#667eea]/30' : ''}`}
              >
                {/* Select checkbox */}
                <div className="absolute top-3 left-3 z-10">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(u.id)}
                    className="w-4 h-4 rounded border-[var(--glass-border)] accent-[#667eea]"
                  />
                </div>

                <div className="flex flex-col items-center text-center pt-4">
                  {/* Avatar */}
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white text-xl font-bold shadow-lg mb-3`}>
                    {u.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Name */}
                  <h3 className="text-sm font-semibold text-[var(--glass-text)] truncate max-w-full">{u.name}</h3>

                  {/* Email */}
                  <p className="text-xs text-[var(--glass-text-muted)] truncate max-w-full mt-0.5">{u.email}</p>

                  {/* Role Badge */}
                  <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium mt-2 ${roleConfig.color}`}>
                    <roleConfig.icon className="w-3 h-3" />
                    {roleConfig.label}
                  </span>

                  {/* Join Date */}
                  <div className="flex items-center gap-1 mt-2 text-[var(--glass-text-muted)]">
                    <Calendar className="w-3 h-3" />
                    <span className="text-[10px]">Bergabung {format(new Date(u.createdAt), 'dd MMM yyyy', { locale: localeId })}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--glass-border)] w-full justify-center">
                    <button
                      onClick={() => openEdit(u)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium glass-btn text-[var(--glass-text-secondary)] hover:text-[var(--glass-text)]"
                    >
                      <Pencil className="w-3 h-3" /> Edit
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(u.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--badge-red-bg)] text-[var(--badge-red-text)] hover:opacity-80 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" /> Hapus
                    </button>
                  </div>
                </div>

                {/* Delete Confirmation Overlay */}
                <AnimatePresence>
                  {showDeleteConfirm === u.id && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-[var(--overlay-bg)] backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-4 z-20"
                    >
                      <AlertTriangle className="w-8 h-8 text-amber-500 mb-2" />
                      <p className="text-sm text-[var(--glass-text)] font-medium mb-1">Hapus user?</p>
                      <p className="text-xs text-[var(--glass-text-muted)] mb-3 text-center">{u.name} akan dihapus permanen</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowDeleteConfirm(null)}
                          className="glass-btn text-xs px-3 py-1.5"
                        >
                          Batal
                        </button>
                        <button
                          onClick={() => handleDelete(u.id)}
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
        <div className="empty-state py-16">
          <Users className="w-16 h-16 mb-4" />
          <h3 className="text-lg font-medium text-[var(--glass-text-secondary)] mb-2">Tidak ada user ditemukan</h3>
          <p className="text-[var(--glass-text-muted)] text-sm">
            {search || roleFilter !== 'all' ? 'Coba filter lain' : 'Mulai tambahkan user baru'}
          </p>
        </div>
      )}

      {/* Bulk Delete Confirmation */}
      <AnimatePresence>
        {showBulkDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-bg)] backdrop-blur-sm p-4"
            onClick={() => setShowBulkDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="gradient-border max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="glass-card p-6 text-center space-y-3">
                <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
                <h3 className="text-lg font-semibold text-[var(--glass-text)]">Hapus {selectedUsers.size} User?</h3>
                <p className="text-sm text-[var(--glass-text-muted)]">Tindakan ini tidak dapat dibatalkan. Semua user yang dipilih akan dihapus permanen.</p>
                <div className="flex gap-2 justify-center pt-2">
                  <button onClick={() => setShowBulkDeleteConfirm(false)} className="btn-glass text-sm">Batal</button>
                  <button onClick={handleBulkDelete} className="bg-red-500 text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors">
                    Hapus Semua
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                    <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    {editingUser ? 'Edit User' : 'Tambah User'}
                  </h2>
                  <button onClick={() => setShowDialog(false)} className="text-[var(--glass-text-muted)] hover:text-[var(--glass-text)]">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Nama Lengkap"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="glass-input"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="glass-input"
                  />
                  <input
                    type="password"
                    placeholder={editingUser ? 'Password (kosongkan jika tidak diubah)' : 'Password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="glass-input"
                  />
                  <div>
                    <label className="text-sm text-[var(--glass-text-secondary)] mb-1.5 block">Peran</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['admin', 'guru', 'siswa'].map((role) => {
                        const rc = ROLE_CONFIG[role]
                        return (
                          <button
                            key={role}
                            onClick={() => setForm({ ...form, role })}
                            className={`py-2.5 rounded-lg text-xs font-medium transition-all flex flex-col items-center gap-1 ${
                              form.role === role
                                ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-lg shadow-purple-500/20'
                                : 'glass-btn text-[var(--glass-text-secondary)]'
                            }`}
                          >
                            <rc.icon className="w-4 h-4" />
                            {rc.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowDialog(false)} className="btn-glass text-sm">Batal</button>
                  <button onClick={handleSave} className="btn-gradient text-sm">
                    {editingUser ? 'Simpan' : 'Buat'}
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
