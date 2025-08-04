import React, { useState, useCallback } from 'react'
import { useChat } from '@/contexts/ChatContext'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { ThemeToggle } from '@/components/ThemeToggle'
import { SettingsDialog } from '@/components/SettingsDialog'
import { KeyboardShortcutsHelp } from '@/components/KeyboardShortcutsHelp'
import { useUserSettings } from '@/contexts/UserSettingsContext'
import { Plus, MessageSquare, Trash2, LogOut, Sparkles, Settings, Search, X, HelpCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { clearAllStorage } from '@/lib/storage'
import { searchConversations, debounce } from '@/lib/utils-enhanced'

export function ConversationSidebar() {
  const { state, createNewConversation, deleteConversation, dispatch } = useChat()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredConversations, setFilteredConversations] = useState(state.conversations)

  const handleLogout = () => {
    clearAllStorage()
    addToast({
      type: 'success',
      title: 'Signed out successfully',
      description: 'See you again soon!'
    })
    navigate('/login')
  }

  const { userData } = useUserSettings()
  const searchInputRef = React.useRef<HTMLInputElement>(null)

  const handleSearch = React.useMemo(() => debounce((query: string) => {
    if (!query.trim()) {
      setFilteredConversations(state.conversations)
    } else {
      const filtered = searchConversations(state.conversations, query)
      setFilteredConversations(filtered)
    }
  }, 300), [state.conversations])

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)
    handleSearch(value)
  }, [handleSearch])

  // Handle keyboard shortcut events
  React.useEffect(() => {
    const handleKeyboardShortcut = (event: CustomEvent) => {
      const { action } = event.detail
      
      switch (action) {
        case 'new-conversation':
          createNewConversation()
          break
        case 'focus-search':
          searchInputRef.current?.focus()
          break
        case 'escape':
          if (searchQuery) {
            handleSearchChange('')
          }
          searchInputRef.current?.blur()
          break
      }
    }

    window.addEventListener('keyboard-shortcut', handleKeyboardShortcut as EventListener)
    return () => {
      window.removeEventListener('keyboard-shortcut', handleKeyboardShortcut as EventListener)
    }
  }, [searchQuery, createNewConversation, handleSearchChange])



  const formatDate = (date: Date) => {
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'Today'
    if (diffDays === 2) return 'Yesterday'
    if (diffDays <= 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }



  // Update filtered conversations when conversations change
  React.useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredConversations(state.conversations)
    } else {
      handleSearch(searchQuery)
    }
  }, [state.conversations, handleSearch, searchQuery])

  return (
    <div className="flex h-full w-full flex-col bg-card/30 backdrop-blur-sm">
      {/* Header */}
      <header className="p-6 border-b">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-8 w-8 bg-gradient-to-br from-primary to-purple-500 rounded-lg flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">AI Chat</h2>
            <p className="text-xs text-muted-foreground">Conversations</p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Search conversations... (Press / or Ctrl+K)"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 h-9 bg-background/50"
            aria-label="Search conversations"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
              onClick={() => handleSearchChange('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        
        <Button 
          onClick={createNewConversation}
          className="w-full justify-start gap-3 h-11 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-sm"
          variant="default"
        >
          <Plus className="h-4 w-4" />
          New Conversation
        </Button>
      </header>

      {/* Conversations */}
      <ScrollArea className="flex-1 px-4 py-2">
        <div className="space-y-2">
          {searchQuery && filteredConversations.length === 0 && state.conversations.length > 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No conversations found</p>
              <p className="text-xs">Try a different search term</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-full blur-xl" />
                <div className="relative bg-muted/50 rounded-full p-4 mx-auto w-16 h-16 flex items-center justify-center">
                  <MessageSquare className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>
              <h3 className="font-medium mb-1">No conversations</h3>
              <p className="text-sm">Start a new chat to begin your AI conversation</p>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`group relative flex items-center gap-3 rounded-xl p-4 cursor-pointer transition-all duration-200 hover:shadow-sm border ${
                  state.currentConversationId === conversation.id 
                    ? 'bg-primary/5 border-primary/20 shadow-sm' 
                    : 'hover:bg-muted/50 border-transparent hover:border-border'
                }`}
                onClick={() => dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: conversation.id })}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <h3 className="text-sm font-medium truncate">
                      {conversation.title}
                    </h3>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {formatDate(conversation.updatedAt)}
                    </p>
                    {conversation.messages.length > 0 && (
                      <Badge variant="secondary" className="text-xs px-2 py-0.5 rounded-full">
                        {conversation.messages.length}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-destructive/10 hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteConversation(conversation.id)
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* User Profile */}
      <footer className="border-t p-6 bg-card/50">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-10 w-10 ring-2 ring-primary/20">
            <AvatarFallback className="text-sm font-medium bg-gradient-to-br from-primary to-purple-500 text-white">
              {userData.name.slice(0, 2).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{userData.name || 'User'}</p>
            <p className="text-xs text-muted-foreground truncate">{userData.email}</p>
          </div>
          <KeyboardShortcutsHelp>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              title="Keyboard shortcuts"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
          </KeyboardShortcutsHelp>
          <SettingsDialog>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </SettingsDialog>
          <ThemeToggle />
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={handleLogout}
            variant="outline" 
            size="sm" 
            className="flex-1 justify-center gap-2 h-9"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </footer>
    </div>
  )
}