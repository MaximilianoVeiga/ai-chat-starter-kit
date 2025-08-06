import { useContext, createContext } from 'react'
import type { UserSettings } from '@/lib/storage'

export interface UserData {
  name: string
  email: string
  avatar?: string
}

export interface UserSettingsContextType {
  settings: UserSettings
  userData: UserData
  updateSettings: (newSettings: Partial<UserSettings>) => void
  updateUserData: (newUserData: Partial<UserData>) => void
  resetSettings: () => void
}

export const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined)

export function useUserSettings() {
  const context = useContext(UserSettingsContext)
  if (!context) {
    throw new Error('useUserSettings must be used within a UserSettingsProvider')
  }
  return context
}

