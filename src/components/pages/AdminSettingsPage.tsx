'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Settings, Globe, Bell, Shield, Palette, Save, RefreshCw,
  Clock, Sun, Moon, Volume2, Lock, KeyRound, Fingerprint,
  Smartphone, Mail, MessageSquare, FileText, Users, Calendar
} from 'lucide-react'
import { toast } from 'sonner'

interface SettingsGroup {
  [key: string]: string
}

const TABS = [
  { key: 'general', label: 'Umum', icon: Globe, description: 'Pengaturan dasar sistem' },
  { key: 'appearance', label: 'Tampilan', icon: Palette, description: 'Kustomisasi tampilan' },
  { key: 'notifications', label: 'Notifikasi', icon: Bell, description: 'Pengaturan notifikasi' },
  { key: 'security', label: 'Keamanan', icon: Shield, description: 'Keamanan & privasi' },
]

const DEFAULT_SETTINGS: Record<string, SettingsGroup> = {
  general: {
    siteName: 'SMKTTH Classroom',
    siteDescription: 'Sistem Manajemen Pembelajaran Digital',
    academicYear: '2024/2025',
    semester: 'Ganjil',
    language: 'id',
    timezone: 'Asia/Jakarta',
  },
  appearance: {
    defaultTheme: 'dark',
    primaryColor: '#667eea',
    fontSize: 'medium',
    compactMode: 'false',
    sidebarPosition: 'left',
  },
  notifications: {
    emailNotifications: 'true',
    pushNotifications: 'true',
    notificationSound: 'true',
    assignmentReminder: 'true',
    gradeNotification: 'true',
    announcementNotification: 'true',
    discussionNotification: 'false',
  },
  security: {
    minPasswordLength: '8',
    requireUppercase: 'true',
    requireNumbers: 'true',
    requireSpecialChars: 'false',
    sessionTimeout: '24',
    twoFactorAuth: 'false',
    loginAttemptLimit: '5',
  },
}

const SETTING_CONFIG: Record<string, Record<string, { label: string; description?: string; type?: 'toggle' | 'select' | 'text' | 'color'; options?: string[]; icon?: React.ElementType }>> = {
  general: {
    siteName: { label: 'Nama Sekolah', icon: Globe },
    siteDescription: { label: 'Deskripsi', icon: FileText },
    academicYear: { label: 'Tahun Ajaran', icon: Calendar, type: 'select', options: ['2023/2024', '2024/2025', '2025/2026'] },
    semester: { label: 'Semester', icon: Calendar, type: 'select', options: ['Ganjil', 'Genap'] },
    language: { label: 'Bahasa', icon: MessageSquare, type: 'select', options: ['id', 'en'] },
    timezone: { label: 'Zona Waktu', icon: Clock },
  },
  appearance: {
    defaultTheme: { label: 'Tema', description: 'Pilih tema default aplikasi', icon: Sun, type: 'select', options: ['light', 'dark', 'system'] },
    primaryColor: { label: 'Warna Utama', description: 'Warna aksen utama', icon: Palette, type: 'color' },
    fontSize: { label: 'Ukuran Font', icon: FileText, type: 'select', options: ['small', 'medium', 'large'] },
    compactMode: { label: 'Mode Kompak', description: 'Tampilkan UI yang lebih ringkas', icon: Users, type: 'toggle' },
    sidebarPosition: { label: 'Posisi Sidebar', icon: Globe, type: 'select', options: ['left', 'right'] },
  },
  notifications: {
    emailNotifications: { label: 'Notifikasi Email', description: 'Terima notifikasi melalui email', icon: Mail, type: 'toggle' },
    pushNotifications: { label: 'Notifikasi Push', description: 'Terima notifikasi push browser', icon: Smartphone, type: 'toggle' },
    notificationSound: { label: 'Suara Notifikasi', description: 'Putar suara saat notifikasi masuk', icon: Volume2, type: 'toggle' },
    assignmentReminder: { label: 'Pengingat Tugas', description: 'Ingatkan deadline tugas', icon: Bell, type: 'toggle' },
    gradeNotification: { label: 'Notifikasi Nilai', description: 'Beritahu saat nilai diterbitkan', icon: FileText, type: 'toggle' },
    announcementNotification: { label: 'Notifikasi Pengumuman', description: 'Beritahu pengumuman baru', icon: MessageSquare, type: 'toggle' },
    discussionNotification: { label: 'Notifikasi Diskusi', description: 'Beritahu balasan diskusi', icon: MessageSquare, type: 'toggle' },
  },
  security: {
    minPasswordLength: { label: 'Panjang Password Min', icon: Lock },
    requireUppercase: { label: 'Huruf Besar Wajib', description: 'Password harus mengandung huruf besar', icon: KeyRound, type: 'toggle' },
    requireNumbers: { label: 'Angka Wajib', description: 'Password harus mengandung angka', icon: KeyRound, type: 'toggle' },
    requireSpecialChars: { label: 'Karakter Khusus Wajib', description: 'Password harus mengandung karakter khusus', icon: Fingerprint, type: 'toggle' },
    sessionTimeout: { label: 'Sesi Berakhir (jam)', icon: Clock },
    twoFactorAuth: { label: 'Autentikasi Dua Faktor', description: 'Tambahkan lapisan keamanan ekstra', icon: Fingerprint, type: 'toggle' },
    loginAttemptLimit: { label: 'Batas Percobaan Login', icon: Shield },
  },
}

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('general')
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

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
      setLastUpdated(new Date().toLocaleString('id-ID'))
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
  const currentConfig = SETTING_CONFIG[activeTab] || {}
  const activeTabInfo = TABS.find((t) => t.key === activeTab)

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--glass-text)]">
            <span className="gradient-text">Pengaturan</span>
          </h1>
          <p className="text-[var(--glass-text-secondary)] text-sm mt-1">
            {activeTabInfo?.description || 'Konfigurasi sistem SMKTTH Classroom'}
          </p>
        </div>
        {lastUpdated && (
          <div className="flex items-center gap-1.5 text-xs text-[var(--glass-text-muted)] bg-[var(--chip-bg)] px-3 py-1.5 rounded-lg">
            <Clock className="w-3.5 h-3.5" />
            Terakhir disimpan: {lastUpdated}
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="glass-card p-2 lg:w-60 shrink-0">
          <div className="flex lg:flex-col gap-1 overflow-x-auto custom-scrollbar">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-md shadow-purple-500/20'
                    : 'text-[var(--glass-text-secondary)] hover:text-[var(--glass-text)] hover:bg-[var(--glass-hover-bg)]'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <div className="text-left hidden lg:block">
                  <div>{tab.label}</div>
                  <div className={`text-[10px] font-normal ${activeTab === tab.key ? 'text-white/60' : 'text-[var(--glass-text-muted)]'}`}>
                    {tab.description}
                  </div>
                </div>
                <span className="lg:hidden">{tab.label}</span>
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
          <div className="space-y-1">
            {Object.entries(currentSettings).map(([key, value]) => {
              const config = currentConfig[key]
              const label = config?.label || key
              const description = config?.description
              const Icon = config?.icon
              const isBoolean = value === 'true' || value === 'false'
              const isToggle = config?.type === 'toggle' || isBoolean
              const isSelect = config?.type === 'select'
              const isColor = config?.type === 'color'
              const options = config?.options

              if (isToggle) {
                return (
                  <div key={key} className="flex items-center justify-between py-3 px-2 rounded-xl hover:bg-[var(--glass-hover-bg)] transition-colors group">
                    <div className="flex items-center gap-3">
                      {Icon && (
                        <div className="w-8 h-8 rounded-lg bg-[var(--chip-bg)] flex items-center justify-center text-[var(--glass-text-muted)] group-hover:text-[var(--glass-text-secondary)] transition-colors">
                          <Icon className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <span className="text-sm text-[var(--glass-text)] font-medium">{label}</span>
                        {description && (
                          <p className="text-xs text-[var(--glass-text-muted)] mt-0.5">{description}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => updateSetting(activeTab, key, value === 'true' ? 'false' : 'true')}
                      className={`settings-toggle ${value === 'true' ? 'settings-toggle-on' : 'settings-toggle-off'}`}
                    >
                      <div className="settings-toggle-thumb" />
                    </button>
                  </div>
                )
              }

              if (isSelect && options) {
                return (
                  <div key={key} className="flex items-center justify-between py-3 px-2 rounded-xl hover:bg-[var(--glass-hover-bg)] transition-colors group">
                    <div className="flex items-center gap-3">
                      {Icon && (
                        <div className="w-8 h-8 rounded-lg bg-[var(--chip-bg)] flex items-center justify-center text-[var(--glass-text-muted)] group-hover:text-[var(--glass-text-secondary)] transition-colors">
                          <Icon className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <span className="text-sm text-[var(--glass-text)] font-medium">{label}</span>
                        {description && (
                          <p className="text-xs text-[var(--glass-text-muted)] mt-0.5">{description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {options.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => updateSetting(activeTab, key, opt)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            value === opt
                              ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white'
                              : 'bg-[var(--chip-bg)] text-[var(--glass-text-secondary)] hover:bg-[var(--glass-hover-bg)]'
                          }`}
                        >
                          {opt === 'light' ? '🌙 Terang' : opt === 'dark' ? '🌙 Gelap' : opt === 'system' ? '💻 Sistem' :
                           opt === 'small' ? 'Kecil' : opt === 'medium' ? 'Sedang' : opt === 'large' ? 'Besar' :
                           opt === 'left' ? 'Kiri' : opt === 'right' ? 'Kanan' :
                           opt === 'id' ? '🇮🇩 Indonesia' : opt === 'en' ? '🇬🇧 English' :
                           opt}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              }

              if (isColor) {
                return (
                  <div key={key} className="flex items-center justify-between py-3 px-2 rounded-xl hover:bg-[var(--glass-hover-bg)] transition-colors group">
                    <div className="flex items-center gap-3">
                      {Icon && (
                        <div className="w-8 h-8 rounded-lg bg-[var(--chip-bg)] flex items-center justify-center text-[var(--glass-text-muted)] group-hover:text-[var(--glass-text-secondary)] transition-colors">
                          <Icon className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <span className="text-sm text-[var(--glass-text)] font-medium">{label}</span>
                        {description && (
                          <p className="text-xs text-[var(--glass-text-muted)] mt-0.5">{description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={value}
                        onChange={(e) => updateSetting(activeTab, key, e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border border-[var(--glass-border)]"
                      />
                      <span className="text-xs text-[var(--glass-text-muted)] font-mono">{value}</span>
                    </div>
                  </div>
                )
              }

              return (
                <div key={key} className="py-3 px-2 rounded-xl hover:bg-[var(--glass-hover-bg)] transition-colors group">
                  <div className="flex items-center gap-3 mb-2">
                    {Icon && (
                      <div className="w-8 h-8 rounded-lg bg-[var(--chip-bg)] flex items-center justify-center text-[var(--glass-text-muted)] group-hover:text-[var(--glass-text-secondary)] transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                    )}
                    <label className="text-sm text-[var(--glass-text)] font-medium">{label}</label>
                  </div>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => updateSetting(activeTab, key, e.target.value)}
                    className="glass-input text-sm"
                  />
                </div>
              )
            })}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-[var(--glass-border)]">
            <button onClick={handleSave} disabled={saving} className="btn-gradient flex items-center justify-center gap-2 text-sm disabled:opacity-50">
              <Save className="w-4 h-4" /> {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </button>
            <button
              onClick={() => {
                setSettings(DEFAULT_SETTINGS)
                toast.info('Pengaturan dikembalikan ke default')
              }}
              className="btn-glass flex items-center justify-center gap-2 text-sm"
            >
              <RefreshCw className="w-4 h-4" /> Reset Default
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
