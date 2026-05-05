'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, Mail, Lock, Eye, EyeOff, UserPlus, User, BookOpen, Users, Shield, Sparkles } from 'lucide-react'
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
    <div className="login-bg min-h-screen flex items-center justify-center p-4 relative">
      {/* Floating shapes */}
      <div className="floating-shape floating-shape-1" />
      <div className="floating-shape floating-shape-2" />
      <div className="floating-shape floating-shape-3" />
      <div className="floating-shape floating-shape-4" />

      {/* Particles */}
      <div className="login-particle" style={{ top: '15%', left: '20%' }} />
      <div className="login-particle" style={{ top: '25%', right: '25%' }} />
      <div className="login-particle" style={{ bottom: '35%', left: '30%' }} />
      <div className="login-particle" style={{ top: '60%', right: '15%' }} />
      <div className="login-particle" style={{ bottom: '20%', left: '15%' }} />
      <div className="login-particle" style={{ top: '45%', left: '60%' }} />

      <div className="w-full max-w-5xl flex items-center relative z-10 gap-8">
        {/* Left decorative panel - desktop only */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="hidden lg:flex login-deco-panel rounded-3xl p-10 flex-col justify-between min-h-[560px] w-[45%] text-white shadow-2xl shadow-purple-500/20"
        >
          <div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.3 }}
              className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-8"
            >
              <GraduationCap className="w-9 h-9 text-white" />
            </motion.div>
            <h2 className="text-3xl font-bold mb-3">Bergabung di</h2>
            <h1 className="text-4xl font-extrabold tracking-tight mb-4">SMKTTH<br />Classroom</h1>
            <p className="text-white/70 text-sm leading-relaxed max-w-sm">
              Daftar sekarang dan mulai kelola pembelajaran digital Anda. Akses tugas, kelas, dan sumber belajar kapan saja.
            </p>
          </div>

          <div className="space-y-4 mt-8">
            {[
              { icon: BookOpen, text: 'Akses materi & tugas 24/7' },
              { icon: Users, text: 'Kolaborasi dengan guru & siswa' },
              { icon: Shield, text: 'Data akun aman & terlindungi' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.15 }}
                className="flex items-center gap-3 text-white/80"
              >
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                  <item.icon className="w-4 h-4" />
                </div>
                <span className="text-sm">{item.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Register Card */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="w-full lg:w-[55%] max-w-md mx-auto lg:mx-0"
        >
          <div className="glass-card-login p-8 space-y-6">
            {/* Logo & Title */}
            <div className="text-center space-y-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center shadow-lg shadow-purple-500/30 pulse-glow"
              >
                <GraduationCap className="w-10 h-10 text-white" />
              </motion.div>
              <div>
                <h1 className="text-3xl font-bold text-white">Buat Akun</h1>
                <p className="text-white/40 text-sm mt-1 flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Bergabung di SMKTTH Classroom
                </p>
              </div>
            </div>

            {/* Register Form */}
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
                <input
                  type="text"
                  placeholder="Nama Lengkap"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="login-input"
                />
              </div>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="login-input"
                  autoComplete="email"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="login-input pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/35 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Role selector - only siswa registration allowed, guru/admin created by admin */}
              <div className="space-y-2">
                <label className="text-sm text-white/50">Peran</label>
                <div className="grid grid-cols-1 gap-3">
                  <div className="py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-lg shadow-purple-500/30">
                    <GraduationCap className="w-4 h-4" />
                    Siswa
                  </div>
                </div>
                <p className="text-xs text-white/30 text-center">Akun guru dibuat oleh admin</p>
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                className="btn-pulse-gradient w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed py-3"
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
            <p className="text-center text-sm text-white/40">
              Sudah punya akun?{' '}
              <button
                onClick={() => setPage('login')}
                className="text-white/70 hover:text-white transition-colors font-medium"
              >
                Masuk
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
