import React, { useState, useEffect } from 'react'
import { settingsStorage, userDataStorage, type UserSettings } from '@/lib/storage'
import { UserSettingsContext, type UserData } from '@/hooks/useUserSettings'

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
