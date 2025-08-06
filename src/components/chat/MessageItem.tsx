import { useState } from 'react'
import type { Message } from '@/types/chat'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import { MarkdownRenderer } from '@/components/MarkdownRenderer'
import { useMarkdownDetection } from '@/hooks/useMarkdownDetection'
import { 
  Bot, User, Copy, Edit2, Trash2, Check, X, 
  MoreHorizontal, ThumbsUp, ThumbsDown 
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { copyToClipboard, formatMessageTime } from '@/lib/utils-enhanced'

interface MessageItemProps {
  message: Message
  onEdit?: (messageId: string, newContent: string) => void
  onDelete?: (messageId: string) => void
  showTimestamp?: boolean
}

export function MessageItem({ 
  message, 
  onEdit, 
  onDelete, 
  showTimestamp = true 
}: MessageItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)
  const [reaction, setReaction] = useState<'like' | 'dislike' | null>(null)
  const { addToast } = useToast()
  const hasMarkdown = useMarkdownDetection(message.content)

  const handleCopy = async () => {
    const success = await copyToClipboard(message.content)
    if (success) {
      addToast({
        type: 'success',
        title: 'Copied to clipboard',
        duration: 2000
      })
    } else {
      addToast({
        type: 'error',
        title: 'Failed to copy',
        description: 'Please try selecting and copying manually'
      })
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
    setEditContent(message.content)
  }

  const handleSaveEdit = () => {
    if (editContent.trim() && editContent !== message.content) {
      onEdit?.(message.id, editContent.trim())
      addToast({
        type: 'success',
        title: 'Message updated',
        duration: 2000
      })
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditContent(message.content)
  }

  const handleDelete = () => {
    onDelete?.(message.id)
    addToast({
      type: 'success',
      title: 'Message deleted',
      duration: 2000
    })
  }

  const handleReaction = (newReaction: 'like' | 'dislike') => {
    setReaction(reaction === newReaction ? null : newReaction)
  }

  return (
    <div
      className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'} group`}
    >
      {message.role === 'assistant' && (
        <div className="flex-shrink-0">
          <Avatar className="h-9 w-9 mt-1 ring-2 ring-primary/20">
            <AvatarFallback className="bg-gradient-to-br from-primary to-purple-500 text-white">
              <Bot className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
        </div>
      )}
      
      <div className={`max-w-[75%] ${message.role === 'user' ? 'order-first' : ''}`}>
        <Card className={`p-4 shadow-sm transition-all duration-200 hover:shadow-md ${
          message.role === 'user' 
            ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground border-0' 
            : 'bg-card border hover:bg-muted/50'
        }`}>
          {isEditing ? (
            <div className="space-y-3">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-20 resize-none"
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancelEdit}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  disabled={!editContent.trim()}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {hasMarkdown ? (
                <MarkdownRenderer 
                  content={message.content} 
                  className="text-sm leading-relaxed"
                />
              ) : (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>
              )}
              
              {/* Message reactions */}
              {message.role === 'assistant' && (
                <div className="flex items-center gap-1 mt-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className={`h-7 px-2 ${reaction === 'like' ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' : ''}`}
                    onClick={() => handleReaction('like')}
                    aria-label="Like this response"
                    title="Like this response"
                  >
                    <ThumbsUp className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={`h-7 px-2 ${reaction === 'dislike' ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400' : ''}`}
                    onClick={() => handleReaction('dislike')}
                    aria-label="Dislike this response"
                    title="Dislike this response"
                  >
                    <ThumbsDown className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>
        
        {/* Message actions and timestamp */}
        <div className={`flex items-center gap-2 mt-2 px-1 ${
          message.role === 'user' ? 'justify-end' : 'justify-start'
        }`}>
          {showTimestamp && (
            <p className="text-xs text-muted-foreground">
              {formatMessageTime(message.timestamp)}
            </p>
          )}
          
          {!isEditing && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={message.role === 'user' ? 'end' : 'start'}>
                  <DropdownMenuItem onClick={handleCopy}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </DropdownMenuItem>
                  
                  {message.role === 'user' && onEdit && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleEdit}>
                        <Edit2 className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  {onDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={handleDelete}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>

      {message.role === 'user' && (
        <div className="flex-shrink-0">
          <Avatar className="h-9 w-9 mt-1 ring-2 ring-muted">
            <AvatarFallback className="bg-muted">
              <User className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
        </div>
      )}
    </div>
  )
}