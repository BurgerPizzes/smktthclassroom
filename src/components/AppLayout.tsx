'use client'

import { useEffect, useState, useCallback, useSyncExternalStore } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu, X, Sun, Moon, Bell, User, LogOut,
  LayoutDashboard, BookOpen, FileText, Calendar, MessageSquare,
  ClipboardCheck, Settings, Users, FolderOpen,
  GraduationCap, Lock, ChevronDown, TrendingUp,
  CalendarDays, Activity, Heart, ExternalLink
} from 'lucide-react'
import { useAppStore, type PageName } from '@/lib/store'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'

import LoginPage from '@/components/pages/LoginPage'
import RegisterPage from '@/components/pages/RegisterPage'
import DashboardPage from '@/components/pages/DashboardPage'
import ClassesPage from '@/components/pages/ClassesPage'
import ClassDetailPage from '@/components/pages/ClassDetailPage'
import AssignmentDetailPage from '@/components/pages/AssignmentDetailPage'
import MySubmissionsPage from '@/components/pages/MySubmissionsPage'
import CalendarPage from '@/components/pages/CalendarPage'
import DiscussionsPage from '@/components/pages/DiscussionsPage'
import AttendancePage from '@/components/pages/AttendancePage'
import NotificationsPage from '@/components/pages/NotificationsPage'
import ProfilePage from '@/components/pages/ProfilePage'
import ChangePasswordPage from '@/components/pages/ChangePasswordPage'
import AdminSettingsPage from '@/components/pages/AdminSettingsPage'
import UserManagementPage from '@/components/pages/UserManagementPage'
import LearningResourcesPage from '@/components/pages/LearningResourcesPage'
import ProgressAnalyticsPage from '@/components/pages/ProgressAnalyticsPage'
import SchedulePage from '@/components/pages/SchedulePage'
import SystemHealthPage from '@/components/pages/SystemHealthPage'

interface NavItem {
  page: PageName
  label: string
  icon: React.ElementType
  roles?: string[]
  roleLabels?: Record<string, string>
  section?: string
}

const NAV_ITEMS: NavItem[] = [
  { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'Utama' },
  { page: 'classes', label: 'Kelas', icon: BookOpen, section: 'Utama' },
  { page: 'my-submissions', label: 'Submissions', icon: FileText, section: 'Utama' },
  { page: 'progress-analytics', label: 'Progres Belajar', icon: TrendingUp, roleLabels: { guru: 'Analitik', admin: 'Analitik', siswa: 'Progres Belajar' }, section: 'Pembelajaran' },
  { page: 'schedule', label: 'Jadwal', icon: CalendarDays, section: 'Pembelajaran' },
  { page: 'calendar', label: 'Kalender', icon: Calendar, section: 'Pembelajaran' },
  { page: 'discussions', label: 'Diskusi', icon: MessageSquare, section: 'Pembelajaran' },
  { page: 'attendance', label: 'Absensi', icon: ClipboardCheck, section: 'Pembelajaran' },
  { page: 'learning-resources', label: 'Sumber Belajar', icon: FolderOpen, section: 'Pembelajaran' },
  { page: 'admin-settings', label: 'Pengaturan', icon: Settings, roles: ['admin'], section: 'Admin' },
  { page: 'user-management', label: 'Manajemen User', icon: Users, roles: ['admin'], section: 'Admin' },
  { page: 'system-health', label: 'Kesehatan Sistem', icon: Activity, roles: ['admin'], section: 'Admin' },
]

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false)

  if (!mounted) return <div className="w-9 h-9" />

  const toggleTheme = () => {
    const html = document.documentElement
    html.classList.add('theme-transition')
    setTheme(theme === 'dark' ? 'light' : 'dark')
    setTimeout(() => html.classList.remove('theme-transition'), 300)
  }

  return (
    <button
      onClick={toggleTheme}
      className="glass-btn p-2 rounded-lg flex items-center justify-center hover:bg-[var(--glass-hover-bg)]"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[var(--glass-text-secondary)]" />}
    </button>
  )
}

function PageRenderer() {
  const { currentPage } = useAppStore()

  const pages: Record<PageName, React.ComponentType> = {
    login: LoginPage,
    register: RegisterPage,
    dashboard: DashboardPage,
    classes: ClassesPage,
    'class-detail': ClassDetailPage,
    'assignment-detail': AssignmentDetailPage,
    'my-submissions': MySubmissionsPage,
    calendar: CalendarPage,
    discussions: DiscussionsPage,
    attendance: AttendancePage,
    notifications: NotificationsPage,
    profile: ProfilePage,
    'change-password': ChangePasswordPage,
    'admin-settings': AdminSettingsPage,
    'user-management': UserManagementPage,
    'learning-resources': LearningResourcesPage,
    'progress-analytics': ProgressAnalyticsPage,
    schedule: SchedulePage,
    'system-health': SystemHealthPage,
  }

  const Page = pages[currentPage] || DashboardPage

  return (
    <motion.div
      key={currentPage}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex-1"
    >
      <Page />
    </motion.div>
  )
}

function AppLayoutInner() {
  const { user, currentPage, sidebarOpen, setPage, setUser, logout, toggleSidebar, setSidebarOpen, setNotifications, setNotifCount: setStoreNotifCount } = useAppStore()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [notifCount, setNotifCount] = useState(0)

  const isAuthPage = currentPage === 'login' || currentPage === 'register'

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          if (data.user) {
            setUser(data.user)
            if (currentPage === 'login' || currentPage === 'register') {
              setPage('dashboard')
            }
          }
        }
      } catch {
        // silently fail
      }
    }
    checkSession()
  }, [])

  // Open sidebar on desktop by default after login
  useEffect(() => {
    if (user && !sidebarOpen && typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setSidebarOpen(true)
    }
  }, [user])

  // Fetch notification count
  useEffect(() => {
    if (!user) return
    const fetchCount = async () => {
      try {
        const res = await fetch('/api/notifications')
        if (res.ok) {
          const data = await res.json()
          const unreadCount = data.filter((n: any) => !n.read).length
          setNotifCount(unreadCount)
          setStoreNotifCount(unreadCount)
          setNotifications(data)
        }
      } catch {
        // silently fail
      }
    }
    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [user, setNotifications, setStoreNotifCount])

  // Close sidebar on mobile when navigating
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false)
    }
  }, [currentPage, setSidebarOpen])

  // Auth pages: no sidebar/layout
  if (isAuthPage || !user) {
    return (
      <>
        {currentPage === 'register' ? <RegisterPage /> : <LoginPage />}
      </>
    )
  }

  const filteredNav = NAV_ITEMS.filter((item) => {
    if (!item.roles) return true
    return item.roles.includes(user.role)
  })

  // Group nav items by section
  const navSections: { label: string; items: NavItem[] }[] = []
  let currentSection = ''
  for (const item of filteredNav) {
    const section = item.section || ''
    if (section !== currentSection) {
      navSections.push({ label: section, items: [] })
      currentSection = section
    }
    navSections[navSections.length - 1].items.push(item)
  }

  const handleLogout = () => {
    logout()
    setShowProfileMenu(false)
    toast.success('Berhasil logout')
  }

  return (
    <div className="min-h-screen flex flex-col aurora-bg">
      <div className="flex flex-1">
        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              {/* Mobile overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
              <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="fixed lg:sticky top-0 left-0 z-50 w-[260px] h-screen glass-panel flex flex-col border-r border-[var(--glass-border)]"
              >
                {/* Sidebar Header */}
                <div className="p-4 flex items-center justify-between border-b border-[var(--glass-border)]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center shadow-lg shadow-purple-500/20">
                      <GraduationCap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold gradient-text">SMKTTH</h2>
                      <p className="text-[10px] text-[var(--glass-text-muted)] tracking-wider">CLASSROOM</p>
                    </div>
                  </div>
                  <button onClick={toggleSidebar} className="text-[var(--glass-text-muted)] hover:text-[var(--glass-text-secondary)] p-1.5 rounded-lg hover:bg-[var(--glass-hover-bg)] lg:hidden transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Navigation with sections */}
                <nav className="flex-1 py-2 overflow-y-auto custom-scrollbar">
                  {navSections.map((section, sIdx) => (
                    <div key={section.label}>
                      {sIdx > 0 && <div className="sidebar-section-divider" />}
                      <div className="sidebar-section-label">{section.label}</div>
                      <div className="px-2 space-y-0.5">
                        {section.items.map((item) => {
                          const isActive = currentPage === item.page
                          const itemLabel = (item.roleLabels && user ? item.roleLabels[user.role] || item.label : item.label)
                          return (
                            <button
                              key={item.page}
                              onClick={() => setPage(item.page)}
                              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all relative group ${
                                isActive
                                  ? 'bg-gradient-to-r from-[#667eea]/15 to-[#764ba2]/15 text-[var(--glass-text)]'
                                  : 'text-[var(--glass-text-secondary)] hover:text-[var(--glass-text)] hover:bg-[var(--glass-hover-bg)]'
                              }`}
                            >
                              {isActive && (
                                <motion.div
                                  layoutId="sidebar-active"
                                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-7 bg-gradient-to-b from-[#667eea] to-[#764ba2] rounded-r-full"
                                />
                              )}
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                isActive
                                  ? 'bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20 text-[#667eea]'
                                  : 'text-[var(--glass-text-muted)] group-hover:text-[var(--glass-text-secondary)]'
                              }`}>
                                <item.icon className="w-4 h-4" />
                              </div>
                              <span className="truncate">{itemLabel}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </nav>

                {/* Sidebar Footer — User Section */}
                <div className="p-3 border-t border-[var(--glass-border)]">
                  <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--glass-hover-bg)] transition-colors cursor-pointer" onClick={() => setPage('profile')}>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center text-white text-sm font-bold shrink-0 ring-2 ring-white/10">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        user.name.charAt(0)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--glass-text)] font-semibold truncate">{user.name}</p>
                      <p className="text-[11px] text-[var(--glass-text-muted)] capitalize">{user.role === 'guru' ? 'Guru' : user.role === 'siswa' ? 'Siswa' : 'Admin'}</p>
                    </div>
                  </div>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Navbar */}
          <header className="sticky top-0 z-30 glass-panel border-b border-[var(--glass-border)] px-4 md:px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {!sidebarOpen && (
                  <button onClick={toggleSidebar} className="glass-btn p-2 rounded-lg flex items-center justify-center hover:bg-[var(--glass-hover-bg)]">
                    <Menu className="w-5 h-5" />
                  </button>
                )}
                {!sidebarOpen && (
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center">
                      <GraduationCap className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-bold gradient-text hidden sm:inline">SMKTTH</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* Notifications */}
                <button
                  onClick={() => setPage('notifications')}
                  className="glass-btn p-2.5 rounded-lg relative flex items-center justify-center hover:bg-[var(--glass-hover-bg)]"
                >
                  <Bell className="w-[18px] h-[18px]" />
                  {notifCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 bg-gradient-to-r from-red-500 to-rose-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center px-1 badge-bounce shadow-lg shadow-red-500/30">
                      {notifCount > 99 ? '99+' : notifCount}
                    </span>
                  )}
                </button>

                <ThemeToggle />

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-2.5 glass-btn px-3 py-1.5 rounded-lg hover:bg-[var(--glass-hover-bg)]"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center text-white text-xs font-bold ring-2 ring-white/10">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        user.name.charAt(0)
                      )}
                    </div>
                    <span className="text-sm text-[var(--glass-text)] font-medium hidden sm:inline max-w-[120px] truncate">{user.name}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-[var(--glass-text-muted)]" />
                  </button>

                  <AnimatePresence>
                    {showProfileMenu && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          className="absolute right-0 top-full mt-2 w-56 glass-card p-2 z-50"
                        >
                          {/* User info header */}
                          <div className="px-3 py-2.5 border-b border-[var(--glass-border)] mb-1">
                            <p className="text-sm font-semibold text-[var(--glass-text)] truncate">{user.name}</p>
                            <p className="text-xs text-[var(--glass-text-muted)] truncate">{user.email || user.role + '@smktth.sch.id'}</p>
                          </div>
                          <button
                            onClick={() => { setPage('profile'); setShowProfileMenu(false) }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--glass-text-secondary)] hover:text-[var(--glass-text)] hover:bg-[var(--glass-hover-bg)] transition-colors"
                          >
                            <User className="w-4 h-4" /> Profil
                          </button>
                          <button
                            onClick={() => { setPage('change-password'); setShowProfileMenu(false) }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--glass-text-secondary)] hover:text-[var(--glass-text)] hover:bg-[var(--glass-hover-bg)] transition-colors"
                          >
                            <Lock className="w-4 h-4" /> Ubah Password
                          </button>
                          <div className="border-t border-[var(--glass-border)] my-1" />
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                          >
                            <LogOut className="w-4 h-4" /> Logout
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 flex flex-col">
            <PageRenderer />

            {/* Footer — sticky at bottom, hidden on mobile */}
            <footer className="mt-auto app-footer hidden lg:block">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-5xl mx-auto">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-[var(--glass-text-muted)]" />
                  <span className="app-footer-text">© {new Date().getFullYear()} SMKTTH Classroom</span>
                </div>
                <div className="flex items-center gap-4">
                  <a href="#" className="app-footer-link hover:underline">Tentang</a>
                  <span className="text-[var(--glass-text-muted)] text-xs">·</span>
                  <a href="#" className="app-footer-link hover:underline">Bantuan</a>
                  <span className="text-[var(--glass-text-muted)] text-xs">·</span>
                  <a href="#" className="app-footer-link hover:underline">Kebijakan Privasi</a>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-[var(--glass-text-muted)]">Sistem Manajemen Pembelajaran Digital</span>
                  <Heart className="w-3 h-3 text-red-400/60" />
                </div>
              </div>
            </footer>
          </main>
        </div>
      </div>

      {/* Bottom Navigation — Mobile Only */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden glass-panel border-t border-[var(--glass-border)] safe-area-bottom">
        <div className="flex items-center justify-around py-1.5 px-2">
          {[
            { page: 'dashboard' as PageName, label: 'Dashboard', icon: LayoutDashboard },
            { page: 'classes' as PageName, label: 'Kelas', icon: BookOpen },
            { page: 'schedule' as PageName, label: 'Jadwal', icon: CalendarDays },
            { page: 'attendance' as PageName, label: 'Absensi', icon: ClipboardCheck },
            { page: 'profile' as PageName, label: 'Profil', icon: User },
          ].map((item) => {
            const isActive = currentPage === item.page
            return (
              <button
                key={item.page}
                onClick={() => setPage(item.page)}
                className={`mobile-nav-item ${isActive ? 'active' : ''} px-4 py-1.5 ${
                  !isActive ? 'text-[var(--glass-text-muted)] hover:text-[var(--glass-text-secondary)]' : ''
                }`}
              >
                <item.icon className="w-6 h-6" />
                <span className="text-[10px] font-semibold truncate">{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function AppLayout() {
  return <AppLayoutInner />
}
