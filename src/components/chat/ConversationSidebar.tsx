import React, { useState, useCallback } from 'react'
import { useChat } from '@/hooks/useChat'
import { Button } from '@/components/ui/button'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { ThemeToggle } from '@/components/ThemeToggle'
import { SettingsDialog } from '@/components/SettingsDialog'
import { KeyboardShortcutsHelp } from '@/components/KeyboardShortcutsHelp'
import { useUserSettings } from '@/hooks/useUserSettings'
import { Plus, MessageSquare, Trash2, LogOut, Sparkles, Settings, Search, X, HelpCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { clearAllStorage } from '@/lib/storage'
import { searchConversations, debounce } from '@/lib/utils-enhanced'
import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger
} from '@/components/ui/sidebar'

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
    <>
      {/* Header */}
      <SidebarHeader className="border-b">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-gradient-to-br from-primary to-purple-500 rounded-lg flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">AI Chat</h2>
              <p className="text-xs text-muted-foreground">Conversations</p>
            </div>
          </div>
          <SidebarTrigger className="md:hidden" />
        </div>

        <div className="px-2 space-y-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Search... (/ or Ctrl+K)"
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
            className="w-full justify-start gap-2 h-10 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-sm"
            variant="default"
          >
            <Plus className="h-4 w-4" />
            <span>New Conversation</span>
          </Button>
        </div>
      </SidebarHeader>

      {/* Conversations */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Recent Chats</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {searchQuery && filteredConversations.length === 0 && state.conversations.length > 0 ? (
                <div className="text-center text-muted-foreground py-8 px-2">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No conversations found</p>
                  <p className="text-xs">Try a different search term</p>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center text-muted-foreground py-12 px-2">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-full blur-xl" />
                    <div className="relative bg-muted/50 rounded-full p-4 mx-auto w-16 h-16 flex items-center justify-center">
                      <MessageSquare className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </div>
                  <h3 className="font-medium mb-1">No conversations</h3>
                  <p className="text-sm">Start a new chat to begin</p>
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                  <SidebarMenuItem key={conversation.id} className="group relative">
                    <SidebarMenuButton
                      isActive={state.currentConversationId === conversation.id}
                      onClick={() => dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: conversation.id })}
                      className="pr-10"
                    >
                      <MessageSquare className="h-4 w-4 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="truncate text-sm">{conversation.title}</span>
                        <p className="text-xs text-muted-foreground truncate">
                          {formatDate(conversation.updatedAt)}
                        </p>
                      </div>
                    </SidebarMenuButton>
                    <div
                      className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteConversation(conversation.id)
                      }}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User Profile */}
      <SidebarFooter className="border-t">
        <div className="p-2 space-y-2">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs font-medium bg-gradient-to-br from-primary to-purple-500 text-white">
                {userData.name.slice(0, 2).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{userData.name || 'User'}</p>
              <p className="text-xs text-muted-foreground truncate">{userData.email}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <KeyboardShortcutsHelp>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Keyboard shortcuts"
              >
                <HelpCircle className="h-4 w-4" />
              </Button>
            </KeyboardShortcutsHelp>
            <SettingsDialog>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </SettingsDialog>
            <ThemeToggle />
            <Button 
              onClick={handleLogout}
              variant="ghost" 
              size="icon"
              className="h-8 w-8 ml-auto"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SidebarFooter>
    </>
  )
}