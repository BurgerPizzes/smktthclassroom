'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeOff, Shield, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

export default function ChangePasswordPage() {
  const { user, setPage } = useAppStore()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [saving, setSaving] = useState(false)

  const strength = useMemo(() => {
    let score = 0
    if (newPassword.length >= 8) score++
    if (/[a-z]/.test(newPassword)) score++
    if (/[A-Z]/.test(newPassword)) score++
    if (/[0-9]/.test(newPassword)) score++
    if (/[^a-zA-Z0-9]/.test(newPassword)) score++
    return score
  }, [newPassword])

  const strengthLabel = ['', 'Sangat Lemah', 'Lemah', 'Sedang', 'Kuat', 'Sangat Kuat'][strength]
  const strengthColor = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500', 'bg-green-500'][strength]

  const requirements = useMemo(() => [
    { label: 'Minimal 8 karakter', met: newPassword.length >= 8 },
    { label: 'Huruf kecil', met: /[a-z]/.test(newPassword) },
    { label: 'Huruf besar', met: /[A-Z]/.test(newPassword) },
    { label: 'Angka', met: /[0-9]/.test(newPassword) },
    { label: 'Karakter khusus', met: /[^a-zA-Z0-9]/.test(newPassword) },
  ], [newPassword])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Mohon isi semua field')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Password baru tidak cocok')
      return
    }
    if (strength < 3) {
      toast.error('Password terlalu lemah')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Gagal mengubah password')
        return
      }
      toast.success('Password berhasil diubah!')
      setPage('profile')
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }, [currentPassword, newPassword, confirmPassword, strength, setPage])

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => setPage('profile')}
          className="flex items-center gap-1 text-[var(--glass-text-secondary)] hover:text-[var(--glass-text)] text-sm mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Profil
        </button>
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--glass-text)]">
          <span className="gradient-text">Ubah Password</span>
        </h1>
        <p className="text-[var(--glass-text-secondary)] text-sm mt-1">Perbarui password akun Anda</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Current Password */}
          <div>
            <label className="text-sm text-[var(--glass-text-secondary)] mb-1.5 block">Password Saat Ini</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--glass-text-muted)]" />
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="glass-input pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--glass-text-muted)] hover:text-[var(--glass-text)]"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="text-sm text-[var(--glass-text-secondary)] mb-1.5 block">Password Baru</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--glass-text-muted)]" />
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="glass-input pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--glass-text-muted)] hover:text-[var(--glass-text)]"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Strength Meter */}
            {newPassword && (
              <div className="mt-3 space-y-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-all ${
                        i <= strength ? strengthColor : 'bg-[var(--chip-bg)]'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-[var(--glass-text-muted)]">{strengthLabel}</p>

                {/* Requirements */}
                <div className="space-y-1">
                  {requirements.map((req) => (
                    <div key={req.label} className="flex items-center gap-2 text-xs">
                      {req.met ? (
                        <CheckCircle2 className="w-3 h-3 text-[var(--badge-green-text)]" />
                      ) : (
                        <XCircle className="w-3 h-3 text-[var(--glass-text-muted)]" />
                      )}
                      <span className={req.met ? 'text-[var(--badge-green-text)]' : 'text-[var(--glass-text-muted)]'}>{req.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-sm text-[var(--glass-text-secondary)] mb-1.5 block">Konfirmasi Password Baru</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--glass-text-muted)]" />
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="glass-input pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--glass-text-muted)] hover:text-[var(--glass-text)]"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-[var(--badge-red-text)] mt-1">Password tidak cocok</p>
            )}
            {confirmPassword && newPassword === confirmPassword && (
              <p className="text-xs text-[var(--badge-green-text)] mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Password cocok
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={saving || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
            className="btn-gradient flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Shield className="w-4 h-4" /> {saving ? 'Menyimpan...' : 'Ubah Password'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
