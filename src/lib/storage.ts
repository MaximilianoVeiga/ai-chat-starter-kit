import type { Conversation } from '@/types/chat'

export interface UserSettings {
  theme: 'light' | 'dark' | 'system'
  fontSize: 'small' | 'medium' | 'large'
}

const STORAGE_KEYS = {
  CONVERSATIONS: 'ai-chat-conversations',
  CURRENT_CONVERSATION: 'ai-chat-current-conversation',
  USER_SETTINGS: 'ai-chat-settings',
  USER_DATA: 'ai-chat-user-data'
} as const

// Safe JSON parse with fallback
function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

// Conversations storage
export const conversationStorage = {
  save: (conversations: Conversation[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations))
    } catch (error) {
      console.error('Failed to save conversations:', error)
    }
  },

  load: (): Conversation[] => {
    const data = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS)
    const conversations = safeJsonParse(data, [])
    
    // Convert date strings back to Date objects
    return conversations.map((conv: any) => ({
      ...conv,
      createdAt: new Date(conv.createdAt),
      updatedAt: new Date(conv.updatedAt),
      messages: conv.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }))
    }))
  },

  clear: () => {
    localStorage.removeItem(STORAGE_KEYS.CONVERSATIONS)
  },

  export: () => {
    const conversations = conversationStorage.load()
    const dataStr = JSON.stringify(conversations, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `ai-chat-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  },

  import: (file: File): Promise<Conversation[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string)
          const conversations = Array.isArray(data) ? data : []
          resolve(conversations)
        } catch (error) {
          reject(new Error('Invalid file format'))
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  },

  // Additional methods for compatibility
  getAll: () => conversationStorage.load(),
  saveAll: (conversations: Conversation[]) => conversationStorage.save(conversations),
  delete: (conversationId: string) => {
    const conversations = conversationStorage.load()
    const filtered = conversations.filter(c => c.id !== conversationId)
    conversationStorage.save(filtered)
  }
}

// Current conversation storage
export const currentConversationStorage = {
  save: (conversationId: string | null) => {
    if (conversationId) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_CONVERSATION, conversationId)
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_CONVERSATION)
    }
  },

  load: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_CONVERSATION)
  },

  // Additional method for compatibility
  get: () => currentConversationStorage.load()
}

// User settings storage
export const settingsStorage = {
  save: (settings: Partial<UserSettings>) => {
    const data = localStorage.getItem(STORAGE_KEYS.USER_SETTINGS)
    const current = safeJsonParse(data, {
      theme: 'system',
      fontSize: 'medium',
    })
    const updated = { ...current, ...settings }
    localStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(updated))
  },

  load: (): UserSettings => {
    const data = localStorage.getItem(STORAGE_KEYS.USER_SETTINGS)
    return safeJsonParse(data, {
      theme: 'system',
      fontSize: 'medium',
    })
  },

  clear: () => {
    localStorage.removeItem(STORAGE_KEYS.USER_SETTINGS)
  }
}

// User data storage
export const userDataStorage = {
  save: (userData: { name?: string; email?: string; avatar?: string }) => {
    const current = userDataStorage.load()
    const updated = { ...current, ...userData }
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updated))
  },

  load: () => {
    const data = localStorage.getItem(STORAGE_KEYS.USER_DATA)
    return safeJsonParse(data, {
      name: '',
      email: '',
      avatar: ''
    })
  },

  clear: () => {
    localStorage.removeItem(STORAGE_KEYS.USER_DATA)
  }
}

// Clear all stored data
export const clearAllStorage = () => {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key)
  })
  // Also clear legacy keys
  localStorage.removeItem('isAuthenticated')
  localStorage.removeItem('userEmail')
  localStorage.removeItem('userName')
}
