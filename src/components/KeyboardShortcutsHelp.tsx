import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Keyboard, Command } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

interface KeyboardShortcut {
  keys: string[]
  description: string
  category: string
}

const shortcuts: KeyboardShortcut[] = [
  {
    keys: ['Ctrl', 'N'],
    description: 'Create new conversation',
    category: 'Navigation'
  },
  {
    keys: ['Ctrl', 'K'],
    description: 'Focus search',
    category: 'Navigation'
  },
  {
    keys: ['/'],
    description: 'Focus search (alternative)',
    category: 'Navigation'
  },
  {
    keys: ['Ctrl', 'M'],
    description: 'Focus message input',
    category: 'Navigation'
  },
  {
    keys: ['Ctrl', ','],
    description: 'Open settings',
    category: 'Navigation'
  },
  {
    keys: ['Escape'],
    description: 'Close modals / Clear search',
    category: 'General'
  },
  {
    keys: ['Enter'],
    description: 'Send message',
    category: 'Messaging'
  },
  {
    keys: ['Shift', 'Enter'],
    description: 'New line in message',
    category: 'Messaging'
  },
]

const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
  if (!acc[shortcut.category]) {
    acc[shortcut.category] = []
  }
  acc[shortcut.category].push(shortcut)
  return acc
}, {} as Record<string, KeyboardShortcut[]>)

interface KeyboardShortcutsHelpProps {
  children?: React.ReactNode
}

export function KeyboardShortcutsHelp({ children }: KeyboardShortcutsHelpProps) {
  const [open, setOpen] = useState(false)

  // Handle keyboard shortcut events
  React.useEffect(() => {
    const handleKeyboardShortcut = (event: CustomEvent) => {
      const { action } = event.detail
      
      if (action === 'show-shortcuts-help') {
        setOpen(prev => !prev)
      }
    }

    window.addEventListener('keyboard-shortcut', handleKeyboardShortcut as EventListener)
    return () => {
      window.removeEventListener('keyboard-shortcut', handleKeyboardShortcut as EventListener)
    }
  }, [])

  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0

  const formatKey = (key: string) => {
    if (key === 'Ctrl' && isMac) return 'Cmd'
    if (key === 'Alt' && isMac) return 'Option'
    return key
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Keyboard className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Speed up your workflow with these keyboard shortcuts
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
            <div key={category} className="space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                {category}
              </h3>
              
              <div className="space-y-2">
                {categoryShortcuts.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <React.Fragment key={keyIndex}>
                          <Badge variant="outline" className="px-2 py-1 text-xs font-mono">
                            {formatKey(key)}
                          </Badge>
                          {keyIndex < shortcut.keys.length - 1 && (
                            <span className="text-xs text-muted-foreground">+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              {category !== Object.keys(groupedShortcuts)[Object.keys(groupedShortcuts).length - 1] && (
                <Separator />
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
          <Command className="h-4 w-4" />
          <span>
            Tip: Press <Badge variant="outline" className="px-1 py-0.5 text-xs">?</Badge> to toggle this help
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}