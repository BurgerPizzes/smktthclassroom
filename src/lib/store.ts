'use client'

import { create } from 'zustand'

export type PageName =
  | 'login'
  | 'register'
  | 'dashboard'
  | 'classes'
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

  setPage: (page: PageName, params?: Record<string, string>) => void
  setUser: (user: UserInfo | null) => void
  logout: () => Promise<void>
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: 'login',
  params: {},
  user: null,
  sidebarOpen: false,

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
    set({ user: null, currentPage: 'login', params: {}, sidebarOpen: false })
  },

  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setSidebarOpen: (open) =>
    set({ sidebarOpen: open }),
}))
