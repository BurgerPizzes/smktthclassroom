'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Search, Plus, Pencil, Trash2, Shield, X, UserPlus
} from 'lucide-react'
import { toast } from 'sonner'

interface UserItem {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-[var(--badge-purple-bg)] text-[var(--badge-purple-text)]',
  guru: 'bg-[var(--badge-blue-bg)] text-[var(--badge-blue-text)]',
  siswa: 'bg-[var(--badge-green-bg)] text-[var(--badge-green-text)]',
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  guru: 'Guru',
  siswa: 'Siswa',
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [showDialog, setShowDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<UserItem | null>(null)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'siswa' })

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

  const filtered = users.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    return matchSearch && matchRole
  })

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
    if (!confirm('Yakin ingin menghapus user ini?')) return
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
      toast.success('User berhasil dihapus!')
    } catch {
      toast.error('Terjadi kesalahan')
    }
  }, [])

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="skeleton h-10 w-48 rounded-xl" />
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--glass-text-muted)]" />
          <input
            type="text"
            placeholder="Cari user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="glass-input pl-10"
          />
        </div>
        <div className="flex gap-2">
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
              {role === 'all' ? 'Semua' : ROLE_LABELS[role]}
            </button>
          ))}
        </div>
      </div>

      {/* User Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--glass-border)]">
                <th className="text-left text-xs font-medium text-[var(--glass-text-muted)] px-4 py-3">User</th>
                <th className="text-left text-xs font-medium text-[var(--glass-text-muted)] px-4 py-3">Email</th>
                <th className="text-left text-xs font-medium text-[var(--glass-text-muted)] px-4 py-3">Peran</th>
                <th className="text-right text-xs font-medium text-[var(--glass-text-muted)] px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-[var(--glass-border)] hover:bg-[var(--table-hover-bg)] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {u.name.charAt(0)}
                      </div>
                      <span className="text-sm text-[var(--glass-text)] font-medium truncate">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--glass-text-secondary)]">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${ROLE_COLORS[u.role] || 'bg-[var(--chip-bg)] text-[var(--chip-text)]'}`}>
                      {ROLE_LABELS[u.role] || u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(u)} className="p-2 rounded-lg hover:bg-[var(--icon-btn-hover-bg)] text-[var(--glass-text-muted)] hover:text-[var(--glass-text-secondary)] transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(u.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-[var(--glass-text-muted)] hover:text-red-600 dark:hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="empty-state py-12">
            <Users className="w-12 h-12 mb-3" />
            <p className="text-sm text-[var(--glass-text-secondary)]">Tidak ada user ditemukan</p>
          </div>
        )}
      </div>

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
                      {['admin', 'guru', 'siswa'].map((role) => (
                        <button
                          key={role}
                          onClick={() => setForm({ ...form, role })}
                          className={`py-2 rounded-lg text-xs font-medium transition-all ${
                            form.role === role
                              ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white'
                              : 'glass-btn text-[var(--glass-text-secondary)]'
                          }`}
                        >
                          {ROLE_LABELS[role]}
                        </button>
                      ))}
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
