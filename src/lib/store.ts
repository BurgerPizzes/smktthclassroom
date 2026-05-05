'use client'

import { create } from 'zustand'

export type PageName =
  | 'login'
  | 'dashboard'
  | 'classes'
  | 'subjects'
  | 'class-detail'
  | 'assignment-detail'
  | 'admin-settings'
  | 'user-management'
  | 'learning-resources'
  | 'my-submissions'
  | 'calendar'
  | 'attendance'
  | 'discussions'
  | 'profile'
  | 'change-password'
  | 'notifications'
  | 'progress-analytics'
  | 'schedule'
  | 'system-health'

interface UserInfo {
  id: string
  email: string
  name: string
  role: string
  avatar?: string | null
}

interface AppState {
  currentPage: PageName
  params: Record<string, string>
  user: UserInfo | null
  sidebarOpen: boolean
  notifications: any[]
  notifCount: number

  setPage: (page: PageName, params?: Record<string, string>) => void
  setUser: (user: UserInfo | null) => void
  logout: () => Promise<void>
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setNotifications: (notifications: any[]) => void
  setNotifCount: (count: number) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: 'login',
  params: {},
  user: null,
  sidebarOpen: false,
  notifications: [],
  notifCount: 0,

  setPage: (page, params = {}) =>
    set({ currentPage: page, params }),

  setUser: (user) =>
    set({ user }),

  logout: async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // ignore network errors
    }
    set({ user: null, currentPage: 'login', params: {}, sidebarOpen: false, notifications: [], notifCount: 0 })
  },

  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setSidebarOpen: (open) =>
    set({ sidebarOpen: open }),

  setNotifications: (notifications) =>
    set({ notifications }),

  setNotifCount: (count) =>
    set({ notifCount: count }),
}))
