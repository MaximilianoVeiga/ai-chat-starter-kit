import { useEffect } from 'react'

interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  metaKey?: boolean
  altKey?: boolean
  callback: (event: KeyboardEvent) => void
  description?: string
  preventDefault?: boolean
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      ) {
        return
      }

      for (const shortcut of shortcuts) {
        const {
          key,
          ctrlKey = false,
          shiftKey = false,
          metaKey = false,
          altKey = false,
          callback,
          preventDefault = true
        } = shortcut

        if (
          event.key.toLowerCase() === key.toLowerCase() &&
          event.ctrlKey === ctrlKey &&
          event.shiftKey === shiftKey &&
          event.metaKey === metaKey &&
          event.altKey === altKey
        ) {
          if (preventDefault) {
            event.preventDefault()
          }
          callback(event)
          break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}

// Common keyboard shortcuts for the chat application
export const CHAT_SHORTCUTS: KeyboardShortcut[] = [
  {
    key: 'n',
    ctrlKey: true,
    callback: () => {
      // Create new conversation
      const event = new CustomEvent('keyboard-shortcut', { 
        detail: { action: 'new-conversation' } 
      })
      window.dispatchEvent(event)
    },
    description: 'Create new conversation'
  },
  {
    key: 'k',
    ctrlKey: true,
    callback: () => {
      // Focus search
      const event = new CustomEvent('keyboard-shortcut', { 
        detail: { action: 'focus-search' } 
      })
      window.dispatchEvent(event)
    },
    description: 'Focus search'
  },
  {
    key: '/',
    callback: () => {
      // Focus search (alternative)
      const event = new CustomEvent('keyboard-shortcut', { 
        detail: { action: 'focus-search' } 
      })
      window.dispatchEvent(event)
    },
    description: 'Focus search'
  },
  {
    key: 'Escape',
    callback: () => {
      // Close modals, clear search, etc.
      const event = new CustomEvent('keyboard-shortcut', { 
        detail: { action: 'escape' } 
      })
      window.dispatchEvent(event)
    },
    description: 'Close modals/clear search'
  },
  {
    key: 'm',
    ctrlKey: true,
    callback: () => {
      // Focus message input
      const event = new CustomEvent('keyboard-shortcut', { 
        detail: { action: 'focus-message-input' } 
      })
      window.dispatchEvent(event)
    },
    description: 'Focus message input'
  },
  {
    key: ',',
    ctrlKey: true,
    callback: () => {
      // Open settings
      const event = new CustomEvent('keyboard-shortcut', { 
        detail: { action: 'open-settings' } 
      })
      window.dispatchEvent(event)
    },
    description: 'Open settings'
  },
  {
    key: '?',
    callback: () => {
      // Show keyboard shortcuts help
      const event = new CustomEvent('keyboard-shortcut', { 
        detail: { action: 'show-shortcuts-help' } 
      })
      window.dispatchEvent(event)
    },
    description: 'Show keyboard shortcuts'
  }
]