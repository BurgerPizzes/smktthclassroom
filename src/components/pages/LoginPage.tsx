'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, Mail, Lock, Eye, EyeOff, ChevronDown, ChevronUp, LogIn } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@smktth.sch.id', password: 'admin123', role: 'admin' },
  { label: 'Guru', email: 'guru1@smktth.sch.id', password: 'teacher123', role: 'guru' },
  { label: 'Siswa', email: 'siswa1@smktth.sch.id', password: 'student123', role: 'siswa' },
]

export default function LoginPage() {
  const { setUser, setPage } = useAppStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showDemo, setShowDemo] = useState(false)

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Mohon isi email dan password')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Login gagal')
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
  }, [email, password, setUser, setPage])

  const fillDemo = useCallback((account: typeof DEMO_ACCOUNTS[number]) => {
    setEmail(account.email)
    setPassword(account.password)
    toast.info(`Akun ${account.label} dipilih`)
  }, [])

  return (
    <div className="mesh-gradient min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating orbs */}
      <div className="floating-orb w-72 h-72 bg-purple-500 top-[-5%] left-[-10%]" style={{ animation: 'float 8s ease-in-out infinite' }} />
      <div className="floating-orb w-96 h-96 bg-blue-500 bottom-[-10%] right-[-5%]" style={{ animation: 'float-slow 12s ease-in-out infinite' }} />
      <div className="floating-orb w-48 h-48 bg-pink-400 top-[30%] right-[10%]" style={{ animation: 'float 10s ease-in-out infinite 2s' }} />
      <div className="floating-orb w-64 h-64 bg-cyan-500 bottom-[20%] left-[5%]" style={{ animation: 'float-slow 9s ease-in-out infinite 1s' }} />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        {/* Gradient border glow */}
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
                <h1 className="text-3xl font-bold gradient-text">SMKTTH</h1>
                <p className="text-sm tracking-[0.3em] text-[var(--glass-text-secondary)] font-medium mt-1">CLASSROOM</p>
              </div>
              <p className="text-[var(--glass-text-secondary)] text-sm">Sistem Manajemen Pembelajaran Digital</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
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
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--glass-text-muted)] hover:text-[var(--glass-text)] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
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
                    <LogIn className="w-4 h-4" />
                    Masuk
                  </>
                )}
              </motion.button>
            </form>

            {/* Register link */}
            <p className="text-center text-sm text-[var(--glass-text-secondary)]">
              Belum punya akun?{' '}
              <button
                onClick={() => setPage('register')}
                className="text-[#667eea] hover:text-[#764ba2] transition-colors font-medium"
              >
                Daftar sekarang
              </button>
            </p>

            {/* Demo Accounts */}
            <div className="border-t border-[var(--glass-border)] pt-4">
              <button
                onClick={() => setShowDemo(!showDemo)}
                className="flex items-center justify-center w-full text-sm text-[var(--glass-text-muted)] hover:text-[var(--glass-text-secondary)] transition-colors gap-1"
              >
                Akun Demo {showDemo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              <AnimatePresence>
                {showDemo && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {DEMO_ACCOUNTS.map((account) => (
                        <button
                          key={account.role}
                          onClick={() => fillDemo(account)}
                          className="glass-btn text-xs py-2 px-2 text-center hover:bg-[var(--glass-hover-bg)] transition-all"
                        >
                          <div className="font-medium text-[var(--glass-text-secondary)]">{account.label}</div>
                          <div className="text-[var(--glass-text-muted)] mt-0.5 truncate">{account.email}</div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
