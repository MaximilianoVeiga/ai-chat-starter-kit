import { useState, useRef, useEffect } from 'react'
import { useChat } from '@/hooks/useChat'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageItem } from './MessageItem'
import { FileUpload } from '@/components/FileUpload'
import { useKeyboardShortcuts, CHAT_SHORTCUTS } from '@/hooks/useKeyboardShortcuts'
import { Send, Bot, Sparkles, MessageSquare, Menu, Paperclip, X, FileText } from 'lucide-react'
import { sanitizeInput } from '@/lib/utils-enhanced'
import { validateMessageContent, checkRateLimit } from '@/lib/validation'
import { useToast } from '@/components/ui/toast'
import { useSidebar } from '@/components/ui/sidebar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function ChatArea() {
  const { state, sendMessage, editMessage, deleteMessage, getCurrentConversation, addUploadedFiles, removeUploadedFile } = useChat()
  const { addToast } = useToast()
  const { toggleSidebar } = useSidebar()
  const [message, setMessage] = useState('')
  const [messageError, setMessageError] = useState<string | null>(null)
  const [showFileUpload, setShowFileUpload] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const MAX_MESSAGE_LENGTH = 4000

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
      const scrollElement = scrollAreaRef.current.querySelector('[data-slot="scroll-area-viewport"]')
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
    const rateKey = 'send-message-global'
    if (!checkRateLimit(rateKey, 20, 60000)) { // 20 messages per minute
      addToast({
        type: 'warning',
        title: 'Rate limit exceeded',
        description: 'Please wait before sending another message'
      })
      return
    }

    const sanitizedMessage = sanitizeInput(message.trim())
    const fileIds = state.uploadedFiles.map(f => f.id)
    sendMessage(sanitizedMessage, fileIds.length > 0 ? fileIds : undefined)
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
      <div className="flex h-full items-center justify-center">
        <div className="text-center max-w-lg mx-auto p-8">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-full blur-2xl" />
            <div className="relative bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-full p-5 mx-auto w-20 h-20 flex items-center justify-center">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>
          </div>
          
          <h2 className="text-2xl font-semibold mb-3">
            Welcome to AI Chat
          </h2>
          
          <p className="text-muted-foreground mb-6">
            Start a conversation with our AI assistant
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
              <MessageSquare className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-left">Select a chat from sidebar</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
              <Bot className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-left">Create a new conversation</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden" role="main" aria-label="Chat conversation">
      {/* Chat Header */}
      <header className="flex-shrink-0 border-b bg-card/50 backdrop-blur-sm px-4 py-3 lg:px-6 lg:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-8 w-8"
              onClick={toggleSidebar}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
              <h1 className="text-lg lg:text-xl font-semibold truncate">{currentConversation.title}</h1>
            </div>
          </div>
          <div className="text-sm text-muted-foreground bg-muted/50 px-2 lg:px-3 py-1 rounded-full">
            {currentConversation.messages.length} {currentConversation.messages.length === 1 ? 'message' : 'messages'}
          </div>
        </div>
      </header>

      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 overflow-y-auto px-4 py-4 lg:px-6">
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
              <div className="flex-shrink-0">
                <Avatar className="h-9 w-9 mt-1 ring-2 ring-primary/20">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-purple-500 text-white">
                    <Bot className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
              </div>
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

      {/* Uploaded Files Display */}
      {state.uploadedFiles.length > 0 && (
        <div className="flex-shrink-0 border-t bg-muted/30 px-4 py-2 lg:px-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Attached:</span>
            {state.uploadedFiles.map(file => (
              <Badge key={file.id} variant="secondary" className="gap-1">
                <FileText className="h-3 w-3" />
                <span className="text-xs">{file.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => removeUploadedFile(file.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Message Input */}
      <footer className="flex-shrink-0 border-t bg-card/50 backdrop-blur-sm p-4 lg:p-6">
        <form onSubmit={handleSubmit} className="flex gap-2 lg:gap-4 items-end">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value)
                setMessageError(null)
              }}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className={`min-h-[52px] max-h-[200px] resize-none pr-12 bg-background transition-colors ${
                messageError ? 'border-destructive focus:border-destructive' : 'border-border focus:border-primary'
              }`}
              disabled={state.isLoading}
              aria-invalid={!!messageError}
              aria-describedby={messageError ? 'message-error' : undefined}
            />
            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
              {message.length > 0 && (
                <span className={message.length > MAX_MESSAGE_LENGTH ? 'text-destructive' : ''}>
                  {message.length}/{MAX_MESSAGE_LENGTH}
                </span>
              )}
            </div>
          </div>
          
          <Button
            type="button"
            variant="outline"
            size="default"
            className="h-[52px] px-4"
            onClick={() => setShowFileUpload(true)}
            disabled={state.isLoading}
          >
            <Paperclip className="h-5 w-5" />
            <span className="sr-only">Attach files</span>
          </Button>
          
          <Button 
            type="submit" 
            size="default"
            disabled={!message.trim() || state.isLoading || message.length > MAX_MESSAGE_LENGTH}
            className="h-[52px] px-4 lg:px-6 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {state.isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Send className="h-5 w-5" />
            )}
            <span className="sr-only">Send message</span>
          </Button>
        </form>
        
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span className="hidden sm:inline">Enter to send • Shift+Enter for new line</span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              <span>Online</span>
            </div>
          </div>
        </div>
      </footer>

      {/* File Upload Dialog */}
      <Dialog open={showFileUpload} onOpenChange={setShowFileUpload}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Files</DialogTitle>
          </DialogHeader>
          <FileUpload
            onFilesUploaded={(files) => {
              addUploadedFiles(files)
              setShowFileUpload(false)
              addToast({
                type: 'success',
                title: 'Files uploaded',
                description: `${files.length} file(s) attached to your message`
              })
            }}
            maxFiles={5}
            maxSize={10}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}