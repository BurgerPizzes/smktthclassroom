'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, Mail, Lock, Eye, EyeOff, ChevronDown, ChevronUp, LogIn, KeyRound, BookOpen, Users, Shield, Sparkles, Globe, MonitorSmartphone } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@smktth.sch.id', password: 'admin123', role: 'admin', icon: Shield, color: 'from-red-500 to-orange-500' },
  { label: 'Guru', email: 'guru1@smktth.sch.id', password: 'teacher123', role: 'guru', icon: BookOpen, color: 'from-purple-500 to-pink-500' },
  { label: 'Siswa', email: 'siswa1@smktth.sch.id', password: 'student123', role: 'siswa', icon: Users, color: 'from-blue-500 to-cyan-500' },
]

export default function LoginPage() {
  const { setUser, setPage } = useAppStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showDemo, setShowDemo] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  // Typing animation for "Selamat Datang"
  const [typedText, setTypedText] = useState('')
  const fullText = 'Selamat Datang'
  const typingStarted = useRef(false)

  useEffect(() => {
    if (typingStarted.current) return
    typingStarted.current = true
    let i = 0
    const timer = setInterval(() => {
      if (i < fullText.length) {
        setTypedText(fullText.slice(0, i + 1))
        i++
      } else {
        clearInterval(timer)
      }
    }, 80)
    return () => clearInterval(timer)
  }, [])

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
          className="hidden lg:flex login-deco-panel rounded-3xl p-10 flex-col justify-between min-h-[520px] w-[45%] text-white shadow-2xl shadow-purple-500/20"
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
            <h2 className="text-3xl font-bold mb-3">{typedText}<span className="typing-cursor" /> di</h2>
            <h1 className="text-4xl font-extrabold tracking-tight mb-4">SMKTTH<br />Classroom</h1>
            <p className="text-white/70 text-sm leading-relaxed max-w-sm">
              Platform pembelajaran digital terpadu untuk mengelola kelas, tugas, dan kolaborasi antara guru dan siswa.
            </p>
          </div>

          <div className="space-y-4 mt-8">
            {[
              { icon: BookOpen, text: 'Kelola tugas & ujian dengan mudah' },
              { icon: Users, text: 'Kolaborasi real-time dalam kelas' },
              { icon: Shield, text: 'Keamanan data terjamin' },
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

        {/* Login Card */}
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
                <h1 className="text-3xl font-bold text-white">SMKTTH</h1>
                <p className="text-sm tracking-[0.3em] text-white/50 font-medium mt-1">CLASSROOM</p>
              </div>
              <p className="text-white/40 text-sm flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Sistem Manajemen Pembelajaran Digital
                <span className="version-badge">v10.0</span>
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
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
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/35 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="custom-checkbox"
                  />
                  <span className="text-xs text-white/40 hover:text-white/60 transition-colors">Ingat saya</span>
                </label>
                <button
                  type="button"
                  className="text-xs text-white/40 hover:text-white/60 transition-colors flex items-center gap-1"
                  onClick={() => toast.info('Fitur lupa password akan segera tersedia')}
                >
                  <KeyRound className="w-3 h-3" />
                  Lupa Password?
                </button>
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
                    <LogIn className="w-4 h-4" />
                    Masuk
                  </>
                )}
              </motion.button>
            </form>

            {/* Social Login Buttons */}
            <div className="space-y-2">
              <div className="relative flex items-center gap-3">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[10px] text-white/30">atau masuk dengan</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => toast.info('Fitur segera hadir')}
                  className="social-login-btn"
                >
                  <Globe className="w-4 h-4" />
                  Google
                </button>
                <button
                  type="button"
                  onClick={() => toast.info('Fitur segera hadir')}
                  className="social-login-btn"
                >
                  <MonitorSmartphone className="w-4 h-4" />
                  Microsoft
                </button>
              </div>
            </div>

            {/* Note: Registration is admin-only */}

            {/* Demo Accounts */}
            <div className="border-t border-white/10 pt-4">
              <button
                onClick={() => setShowDemo(!showDemo)}
                className="flex items-center justify-center w-full text-sm text-white/35 hover:text-white/55 transition-colors gap-1"
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
                        <motion.button
                          key={account.role}
                          onClick={() => fillDemo(account)}
                          className="gradient-border-animate group relative rounded-xl p-3 text-center transition-all overflow-hidden bg-white/5"
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${account.color} flex items-center justify-center mx-auto mb-2 shadow-lg`}>
                            <account.icon className="w-4 h-4 text-white" />
                          </div>
                          <div className="font-medium text-white/70 text-xs group-hover:text-white/90 transition-colors">{account.label}</div>
                          <div className="text-white/30 mt-0.5 truncate text-[10px]">{account.email.split('@')[0]}</div>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
