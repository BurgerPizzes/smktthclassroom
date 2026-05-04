'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Settings, Globe, Bell, Shield, Palette, Save, RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'

interface SettingsGroup {
  [key: string]: string
}

const TABS = [
  { key: 'general', label: 'Umum', icon: Globe },
  { key: 'notifications', label: 'Notifikasi', icon: Bell },
  { key: 'security', label: 'Keamanan', icon: Shield },
  { key: 'appearance', label: 'Tampilan', icon: Palette },
]

const DEFAULT_SETTINGS: Record<string, SettingsGroup> = {
  general: {
    siteName: 'SMKTTH Classroom',
    siteDescription: 'Sistem Manajemen Pembelajaran Digital',
    language: 'id',
    timezone: 'Asia/Jakarta',
  },
  notifications: {
    emailNotifications: 'true',
    pushNotifications: 'true',
    assignmentReminder: 'true',
    gradeNotification: 'true',
    announcementNotification: 'true',
  },
  security: {
    minPasswordLength: '8',
    requireUppercase: 'true',
    requireNumbers: 'true',
    requireSpecialChars: 'false',
    sessionTimeout: '24',
  },
  appearance: {
    defaultTheme: 'dark',
    primaryColor: '#667eea',
    sidebarPosition: 'left',
    compactMode: 'false',
  },
}

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('general')
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings')
        if (res.ok) {
          const data = await res.json()
          if (data && typeof data === 'object') {
            const merged = { ...DEFAULT_SETTINGS }
            Object.keys(data).forEach((key) => {
              const group = key.split('_')[0]
              if (merged[group]) {
                merged[group][key] = data[key].value || data[key]
              }
            })
            setSettings(merged)
          }
        }
      } catch {
        // use defaults
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const flatSettings: Record<string, string> = {}
      Object.entries(settings).forEach(([group, items]) => {
        Object.entries(items).forEach(([key, value]) => {
          flatSettings[`${group}_${key}`] = value
        })
      })
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flatSettings),
      })
      if (!res.ok) {
        toast.error('Gagal menyimpan pengaturan')
        return
      }
      toast.success('Pengaturan berhasil disimpan!')
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }, [settings])

  const updateSetting = (group: string, key: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [group]: { ...prev[group], [key]: value },
    }))
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="skeleton h-10 w-48 rounded-xl" />
        <div className="glass-card p-6"><div className="skeleton h-64 rounded" /></div>
      </div>
    )
  }

  const currentSettings = settings[activeTab] || {}

  const settingLabels: Record<string, Record<string, string>> = {
    general: {
      siteName: 'Nama Situs',
      siteDescription: 'Deskripsi Situs',
      language: 'Bahasa',
      timezone: 'Zona Waktu',
    },
    notifications: {
      emailNotifications: 'Notifikasi Email',
      pushNotifications: 'Notifikasi Push',
      assignmentReminder: 'Pengingat Tugas',
      gradeNotification: 'Notifikasi Nilai',
      announcementNotification: 'Notifikasi Pengumuman',
    },
    security: {
      minPasswordLength: 'Panjang Password Minimum',
      requireUppercase: 'Huruf Besar Wajib',
      requireNumbers: 'Angka Wajib',
      requireSpecialChars: 'Karakter Khusus Wajib',
      sessionTimeout: 'Sesi Berakhir (jam)',
    },
    appearance: {
      defaultTheme: 'Tema Default',
      primaryColor: 'Warna Utama',
      sidebarPosition: 'Posisi Sidebar',
      compactMode: 'Mode Kompak',
    },
  }

  const labels = settingLabels[activeTab] || {}

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--glass-text)]">
          <span className="gradient-text">Pengaturan</span>
        </h1>
        <p className="text-[var(--glass-text-secondary)] text-sm mt-1">Konfigurasi sistem SMKTTH Classroom</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="glass-card p-2 lg:w-56 shrink-0">
          <div className="flex lg:flex-col gap-1 overflow-x-auto custom-scrollbar">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white'
                    : 'text-[var(--glass-text-secondary)] hover:text-[var(--glass-text)] hover:bg-[var(--glass-hover-bg)]'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Settings Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 flex-1"
        >
          <div className="space-y-5">
            {Object.entries(currentSettings).map(([key, value]) => {
              const label = labels[key] || key
              const isBoolean = value === 'true' || value === 'false'

              if (isBoolean) {
                return (
                  <div key={key} className="flex items-center justify-between py-2">
                    <span className="text-sm text-[var(--glass-text-secondary)]">{label}</span>
                    <button
                      onClick={() => updateSetting(activeTab, key, value === 'true' ? 'false' : 'true')}
                      className={`w-11 h-6 rounded-full transition-all relative ${
                        value === 'true' ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2]' : 'bg-[var(--chip-bg)]'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${
                        value === 'true' ? 'right-0.5' : 'left-0.5'
                      }`} />
                    </button>
                  </div>
                )
              }

              return (
                <div key={key}>
                  <label className="text-sm text-[var(--glass-text-secondary)] mb-1.5 block">{label}</label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => updateSetting(activeTab, key, e.target.value)}
                    className="glass-input"
                  />
                </div>
              )
            })}
          </div>

          <div className="flex gap-3 mt-8 pt-6 border-t border-[var(--glass-border)]">
            <button onClick={handleSave} disabled={saving} className="btn-gradient flex items-center gap-2 text-sm disabled:opacity-50">
              <Save className="w-4 h-4" /> {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </button>
            <button
              onClick={() => setSettings(DEFAULT_SETTINGS)}
              className="btn-glass flex items-center gap-2 text-sm"
            >
              <RefreshCw className="w-4 h-4" /> Reset Default
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
