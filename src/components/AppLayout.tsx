'use client'

import { useEffect, useState, useCallback, useSyncExternalStore } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu, X, Sun, Moon, Bell, User, LogOut,
  LayoutDashboard, BookOpen, FileText, Calendar, MessageSquare,
  ClipboardCheck, Settings, Users, FolderOpen,
  GraduationCap, Lock, ChevronDown, TrendingUp
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

const NAV_ITEMS: { page: PageName; label: string; icon: React.ElementType; roles?: string[]; roleLabels?: Record<string, string> }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { page: 'classes', label: 'Kelas', icon: BookOpen },
  { page: 'my-submissions', label: 'Submissions', icon: FileText },
  { page: 'progress-analytics', label: 'Progres Belajar', icon: TrendingUp, roleLabels: { guru: 'Analitik', admin: 'Analitik', siswa: 'Progres Belajar' } },
  { page: 'calendar', label: 'Kalender', icon: Calendar },
  { page: 'discussions', label: 'Diskusi', icon: MessageSquare },
  { page: 'attendance', label: 'Absensi', icon: ClipboardCheck },
  { page: 'learning-resources', label: 'Sumber Belajar', icon: FolderOpen },
  { page: 'admin-settings', label: 'Pengaturan', icon: Settings, roles: ['admin'] },
  { page: 'user-management', label: 'Manajemen User', icon: Users, roles: ['admin'] },
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
      className="glass-btn p-2 rounded-lg flex items-center justify-center"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
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

  const handleLogout = () => {
    logout()
    setShowProfileMenu(false)
    toast.success('Berhasil logout')
  }

  return (
    <div className="min-h-screen flex aurora-bg">
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
                <button onClick={toggleSidebar} className="text-[var(--glass-text-muted)] hover:text-[var(--glass-text-secondary)] p-1 lg:hidden transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
                {filteredNav.map((item) => {
                  const isActive = currentPage === item.page
                  return (
                    <button
                      key={item.page}
                      onClick={() => setPage(item.page)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative group ${
                        isActive
                          ? 'bg-gradient-to-r from-[#667eea]/20 to-[#764ba2]/20 text-[var(--glass-text)]'
                          : 'text-[var(--glass-text-secondary)] hover:text-[var(--glass-text)] hover:bg-[var(--glass-hover-bg)]'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-active"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-[#667eea] to-[#764ba2] rounded-r-full"
                        />
                      )}
                      <item.icon className={`w-4 h-4 ${isActive ? 'text-[#667eea]' : ''}`} />
                      {(item.roleLabels && user ? item.roleLabels[user.role] || item.label : item.label)}
                    </button>
                  )
                })}
              </nav>

              {/* Sidebar Footer */}
              <div className="p-3 border-t border-[var(--glass-border)]">
                <div className="flex items-center gap-3 p-2">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {user.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--glass-text)] font-medium truncate">{user.name}</p>
                    <p className="text-xs text-[var(--glass-text-muted)] capitalize">{user.role}</p>
                  </div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Navigation - Mobile Only */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden glass-panel border-t border-[var(--glass-border)] safe-area-bottom">
        <div className="flex items-center justify-around py-2 px-2">
          {[
            { page: 'dashboard' as PageName, label: 'Dashboard', icon: LayoutDashboard },
            { page: 'classes' as PageName, label: 'Kelas', icon: BookOpen },
            { page: 'progress-analytics' as PageName, label: 'Progres', icon: TrendingUp },
            { page: 'attendance' as PageName, label: 'Absensi', icon: ClipboardCheck },
            { page: 'profile' as PageName, label: 'Profil', icon: User },
          ].map((item) => {
            const isActive = currentPage === item.page
            return (
              <button
                key={item.page}
                onClick={() => setPage(item.page)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-all min-w-0 ${
                  isActive
                    ? 'text-[#667eea]'
                    : 'text-[var(--glass-text-muted)] hover:text-[var(--glass-text-secondary)]'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium truncate">{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 glass-panel border-b border-[var(--glass-border)] px-4 md:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {!sidebarOpen && (
                <button onClick={toggleSidebar} className="glass-btn p-2 rounded-lg flex items-center justify-center">
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

            <div className="flex items-center gap-2">
              {/* Notifications */}
              <button
                onClick={() => setPage('notifications')}
                className="glass-btn p-2 rounded-lg relative flex items-center justify-center"
              >
                <Bell className="w-4 h-4" />
                {notifCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center badge-bounce">
                    {notifCount > 9 ? '9+' : notifCount}
                  </span>
                )}
              </button>

              <ThemeToggle />

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 glass-btn px-3 py-1.5 rounded-lg"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center text-white text-xs font-bold">
                    {user.name.charAt(0)}
                  </div>
                  <span className="text-sm text-[var(--glass-text-secondary)] hidden sm:inline max-w-[100px] truncate">{user.name}</span>
                  <ChevronDown className="w-3 h-3 text-[var(--glass-text-muted)]" />
                </button>

                <AnimatePresence>
                  {showProfileMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        className="absolute right-0 top-full mt-2 w-52 glass-card p-2 z-50"
                      >
                        <button
                          onClick={() => { setPage('profile'); setShowProfileMenu(false) }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--glass-text-secondary)] hover:text-[var(--glass-text)] hover:bg-[var(--glass-hover-bg)] transition-colors"
                        >
                          <User className="w-4 h-4" /> Profil
                        </button>
                        <button
                          onClick={() => { setPage('change-password'); setShowProfileMenu(false) }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--glass-text-secondary)] hover:text-[var(--glass-text)] hover:bg-[var(--glass-hover-bg)] transition-colors"
                        >
                          <Lock className="w-4 h-4" /> Ubah Password
                        </button>
                        <div className="border-t border-[var(--glass-border)] my-1" />
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-500/10 transition-colors"
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

          {/* Footer - hidden on mobile to not conflict with bottom nav */}
          <footer className="mt-auto border-t border-[var(--glass-border)] px-6 py-4 text-center hidden lg:block">
            <p className="text-xs text-[var(--glass-text-muted)]">
              © {new Date().getFullYear()} SMKTTH Classroom — Sistem Manajemen Pembelajaran Digital
            </p>
          </footer>
        </main>
      </div>
    </div>
  )
}

export default function AppLayout() {
  return <AppLayoutInner />
}
