'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { GraduationCap, Mail, Lock, Eye, EyeOff, UserPlus, User } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

export default function RegisterPage() {
  const { setUser, setPage } = useAppStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('siswa')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleRegister = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password) {
      toast.error('Mohon isi semua field')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Registrasi gagal')
        return
      }
      setUser(data.user)
      setPage('dashboard')
      toast.success(`Selamat datang, ${data.user.name}!`)
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setLoading(false)
    }
  }, [name, email, password, role, setUser, setPage])

  return (
    <div className="mesh-gradient min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating orbs */}
      <div className="floating-orb w-72 h-72 bg-purple-500 top-[-5%] right-[-10%]" style={{ animation: 'float 8s ease-in-out infinite' }} />
      <div className="floating-orb w-96 h-96 bg-blue-500 bottom-[-10%] left-[-5%]" style={{ animation: 'float-slow 12s ease-in-out infinite' }} />
      <div className="floating-orb w-48 h-48 bg-pink-400 top-[20%] left-[10%]" style={{ animation: 'float 10s ease-in-out infinite 2s' }} />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        <div className="gradient-border p-[1px]">
          <div className="glass-card p-8 space-y-6">
            {/* Logo & Title */}
            <div className="text-center space-y-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center shadow-lg shadow-purple-500/30"
              >
                <GraduationCap className="w-8 h-8 text-white" />
              </motion.div>
              <div>
                <h1 className="text-3xl font-bold gradient-text">Buat Akun</h1>
                <p className="text-[var(--glass-text-secondary)] text-sm mt-1">Bergabung di SMKTTH Classroom</p>
              </div>
            </div>

            {/* Register Form */}
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--glass-text-muted)]" />
                <input
                  type="text"
                  placeholder="Nama Lengkap"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="glass-input pl-10"
                />
              </div>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--glass-text-muted)]" />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input pl-10"
                  autoComplete="email"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--glass-text-muted)]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input pl-10 pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--glass-text-muted)] hover:text-[var(--glass-text)] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Role selector */}
              <div className="space-y-2">
                <label className="text-sm text-[var(--glass-text-secondary)]">Peran</label>
                <div className="grid grid-cols-2 gap-3">
                  {['siswa', 'guru'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                        role === r
                          ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-lg shadow-purple-500/30'
                          : 'glass-btn text-[var(--glass-text-secondary)]'
                      }`}
                    >
                      {r === 'siswa' ? '👨‍🎓 Siswa' : '👨‍🏫 Guru'}
                    </button>
                  ))}
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                className="btn-gradient w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Daftar
                  </>
                )}
              </motion.button>
            </form>

            {/* Login link */}
            <p className="text-center text-sm text-[var(--glass-text-secondary)]">
              Sudah punya akun?{' '}
              <button
                onClick={() => setPage('login')}
                className="text-[#667eea] hover:text-[#764ba2] transition-colors font-medium"
              >
                Masuk
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
