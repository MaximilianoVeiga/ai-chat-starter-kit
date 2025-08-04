import React, { createContext, useContext, useState, useEffect } from 'react'
import { settingsStorage, userDataStorage, type UserSettings } from '@/lib/storage'

interface UserData {
  name: string
  email: string
  avatar?: string
}

interface UserSettingsContextType {
  settings: UserSettings
  userData: UserData
  updateSettings: (newSettings: Partial<UserSettings>) => void
  updateUserData: (newUserData: Partial<UserData>) => void
  resetSettings: () => void
}

const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined)

export function UserSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(() => settingsStorage.load())
  const [userData, setUserData] = useState<UserData>(() => {
    const stored = userDataStorage.load()
    // Migration from legacy localStorage
    return {
      name: stored.name || localStorage.getItem('userName') || '',
      email: stored.email || localStorage.getItem('userEmail') || '',
      avatar: stored.avatar
    }
  })

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    const updated = { ...settings, ...newSettings }
    setSettings(updated)
    settingsStorage.save(updated)
  }

  const updateUserData = (newUserData: Partial<UserData>) => {
    const updated = { ...userData, ...newUserData }
    setUserData(updated)
    userDataStorage.save(updated)
    
    // Keep legacy localStorage in sync for compatibility
    if (newUserData.name) localStorage.setItem('userName', newUserData.name)
    if (newUserData.email) localStorage.setItem('userEmail', newUserData.email)
  }

  const resetSettings = () => {
    const defaultSettings: UserSettings = {
      theme: 'system',
      fontSize: 'medium',
      soundEnabled: true,
      compactMode: false,
      showTimestamps: true
    }
    setSettings(defaultSettings)
    settingsStorage.save(defaultSettings)
  }

  // Apply font size to document
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('text-sm', 'text-base', 'text-lg')
    
    switch (settings.fontSize) {
      case 'small':
        root.classList.add('text-sm')
        break
      case 'large':
        root.classList.add('text-lg')
        break
      default:
        root.classList.add('text-base')
    }
  }, [settings.fontSize])

  return (
    <UserSettingsContext.Provider value={{
      settings,
      userData,
      updateSettings,
      updateUserData,
      resetSettings
    }}>
      {children}
    </UserSettingsContext.Provider>
  )
}

export function useUserSettings() {
  const context = useContext(UserSettingsContext)
  if (!context) {
    throw new Error('useUserSettings must be used within a UserSettingsProvider')
  }
  return context
}