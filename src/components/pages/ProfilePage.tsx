'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Camera, Save, Shield } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

export default function ProfilePage() {
  const { user, setUser, setPage } = useAppStore()
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [saving, setSaving] = useState(false)

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      toast.error('Nama tidak boleh kosong')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user?.id, name, email }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Gagal menyimpan')
        return
      }
      setUser({ ...user!, name, email })
      toast.success('Profil berhasil diperbarui!')
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }, [name, email, user, setUser])

  const roleLabels: Record<string, string> = {
    admin: 'Administrator',
    guru: 'Guru',
    siswa: 'Siswa',
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className="bg-gradient-to-r from-[#667eea] to-[#764ba2] h-32 md:h-40" />
        <div className="dot-pattern absolute inset-0 opacity-20" />
        <div className="absolute -bottom-12 left-6">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center text-white text-3xl font-bold border-4 border-[var(--main-bg)] shadow-xl">
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
        </div>
        <button className="absolute bottom-2 right-4 glass-btn p-2 rounded-lg" onClick={() => toast.info('Upload avatar (simulasi)')}>
          <Camera className="w-4 h-4" />
        </button>
      </div>

      {/* Profile Form */}
      <div className="mt-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 space-y-5"
        >
          <h2 className="text-lg font-semibold text-[var(--glass-text)]">Informasi Profil</h2>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-[var(--glass-text-secondary)] mb-1.5 block">Nama Lengkap</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--glass-text-muted)]" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="glass-input pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-[var(--glass-text-secondary)] mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--glass-text-muted)]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-[var(--glass-text-secondary)] mb-1.5 block">Peran</label>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[var(--badge-purple-text)]" />
                <span className="text-sm text-[var(--glass-text-secondary)]">{roleLabels[user?.role || ''] || user?.role}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-[var(--glass-border)]">
            <button onClick={handleSave} disabled={saving} className="btn-gradient flex items-center gap-2 text-sm disabled:opacity-50">
              <Save className="w-4 h-4" /> {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
            <button onClick={() => setPage('change-password')} className="btn-glass text-sm">
              Ubah Password
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
