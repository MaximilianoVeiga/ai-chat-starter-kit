import { useState, useRef, useEffect } from 'react'
import { useChat } from '@/contexts/ChatContext'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import { MessageItem } from './MessageItem'
import { useKeyboardShortcuts, CHAT_SHORTCUTS } from '@/hooks/useKeyboardShortcuts'
import { Send, Bot, Sparkles, MessageSquare } from 'lucide-react'
import { sanitizeInput } from '@/lib/utils-enhanced'
import { validateMessageContent, checkRateLimit } from '@/lib/validation'
import { useToast } from '@/components/ui/toast'

export function ChatArea() {
  const { state, sendMessage, editMessage, deleteMessage, getCurrentConversation } = useChat()
  const { addToast } = useToast()
  const [message, setMessage] = useState('')
  const [messageError, setMessageError] = useState<string | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const currentConversation = getCurrentConversation()

  // Keyboard shortcuts
  useKeyboardShortcuts(CHAT_SHORTCUTS)

  // Handle keyboard shortcut events
  useEffect(() => {
    const handleKeyboardShortcut = (event: CustomEvent) => {
      const { action } = event.detail
      
      switch (action) {
        case 'focus-message-input':
          textareaRef.current?.focus()
          break
        case 'escape':
          setMessage('')
          textareaRef.current?.blur()
          break
      }
    }

    window.addEventListener('keyboard-shortcut', handleKeyboardShortcut as EventListener)
    return () => {
      window.removeEventListener('keyboard-shortcut', handleKeyboardShortcut as EventListener)
    }
  }, [])

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }
  }, [currentConversation?.messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || state.isLoading) return

    // Validate message content
    const validation = validateMessageContent(message.trim())
    if (!validation.isValid) {
      setMessageError(validation.error || 'Invalid message')
      addToast({
        type: 'error',
        title: 'Invalid message',
        description: validation.error
      })
      return
    }

    // Rate limiting check
    const userKey = `user-${Date.now()}`
    if (!checkRateLimit(userKey, 20, 60000)) { // 20 messages per minute
      addToast({
        type: 'warning',
        title: 'Rate limit exceeded',
        description: 'Please wait before sending another message'
      })
      return
    }

    const sanitizedMessage = sanitizeInput(message.trim())
    sendMessage(sanitizedMessage)
    setMessage('')
    setMessageError(null)
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleEditMessage = (messageId: string, content: string) => {
    // Validate edited content
    const validation = validateMessageContent(content)
    if (!validation.isValid) {
      addToast({
        type: 'error',
        title: 'Invalid message',
        description: validation.error
      })
      return
    }
    
    const sanitizedContent = sanitizeInput(content)
    editMessage(messageId, sanitizedContent)
  }

  const handleDeleteMessage = (messageId: string) => {
    deleteMessage(messageId)
  }

  if (!currentConversation) {
    return (
      <div className="flex h-full items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-full blur-3xl" />
            <div className="relative bg-gradient-to-r from-primary to-purple-500 rounded-full p-6 mx-auto w-24 h-24 flex items-center justify-center">
              <Sparkles className="h-12 w-12 text-white" />
            </div>
          </div>
          
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
            Welcome to AI Chat
          </h2>
          
          <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
            Start a conversation with our AI assistant. Ask questions, get help, or just chat!
          </p>
          
          <div className="grid grid-cols-1 gap-4 text-sm">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border">
              <MessageSquare className="h-5 w-5 text-primary" />
              <span>Select a conversation from the sidebar</span>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border">
              <Bot className="h-5 w-5 text-primary" />
              <span>Or create a new chat to get started</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col" role="main" aria-label="Chat conversation">
      {/* Chat Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
              <h1 className="text-xl font-semibold">{currentConversation.title}</h1>
            </div>
          </div>
          <div className="text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
            {currentConversation.messages.length} {currentConversation.messages.length === 1 ? 'message' : 'messages'}
          </div>
        </div>
      </header>

      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="space-y-4">
          {currentConversation.messages.length === 0 ? (
            <div className="text-center py-16">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-full blur-2xl" />
                <div className="relative bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-full p-4 mx-auto w-16 h-16 flex items-center justify-center">
                  <Bot className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">Ready to chat!</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Send your first message to start the conversation with AI
              </p>
            </div>
          ) : (
            currentConversation.messages.map((msg) => (
              <MessageItem
                key={msg.id}
                message={msg}
                onEdit={handleEditMessage}
                onDelete={handleDeleteMessage}
                showTimestamp={true}
              />
            ))
          )}
          
          {state.isLoading && (
            <div className="flex gap-4 justify-start group">
              <Avatar className="h-9 w-9 mt-1 ring-2 ring-primary/20">
                <AvatarFallback className="bg-gradient-to-br from-primary to-purple-500 text-white">
                  <Bot className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <Card className="bg-card border p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                  </div>
                  <span className="text-sm text-muted-foreground">AI is thinking...</span>
                </div>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Message Input */}
      <footer className="border-t bg-card/50 backdrop-blur-sm p-6">
        <form onSubmit={handleSubmit} className="flex gap-4 items-end">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value)
                setMessageError(null)
              }}
              onKeyDown={handleKeyDown}
              placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
              className={`min-h-[60px] max-h-[200px] resize-none pr-12 bg-background transition-colors ${
                messageError ? 'border-destructive focus:border-destructive' : 'border-border focus:border-primary'
              }`}
              disabled={state.isLoading}
              aria-invalid={!!messageError}
              aria-describedby={messageError ? 'message-error' : undefined}
            />
            <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
              {message.length > 0 && (
                <span className={message.length > 1000 ? 'text-destructive' : ''}>
                  {message.length}/1000
                </span>
              )}
            </div>
          </div>
          
          <Button 
            type="submit" 
            size="lg"
            disabled={!message.trim() || state.isLoading || message.length > 1000}
            className="h-[60px] px-6 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {state.isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Send className="h-5 w-5" />
            )}
            <span className="sr-only">Send message</span>
          </Button>
        </form>
        
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>Press Enter to send, Shift+Enter for new line</span>
          <div className="flex items-center gap-4">
            <span>Powered by AI</span>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              <span>Online</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}