import type { Message, Conversation } from '@/types/chat'

// Generate unique IDs
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

// Format date with relative time
export function formatMessageTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  
  return date.toLocaleDateString()
}

// Copy text to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'absolute'
      textArea.style.left = '-9999px'
      document.body.appendChild(textArea)
      textArea.select()
      const success = document.execCommand('copy')
      document.body.removeChild(textArea)
      return success
    }
  } catch (error) {
    console.error('Failed to copy text:', error)
    return false
  }
}

// Sanitize input to prevent XSS
export function sanitizeInput(input: string): string {
  const div = document.createElement('div')
  div.textContent = input
  return div.innerHTML
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + '...'
}

// Search messages in a conversation
export function searchMessages(conversation: Conversation, query: string): Message[] {
  if (!query.trim()) return conversation.messages
  
  const lowerQuery = query.toLowerCase()
  return conversation.messages.filter(message =>
    message.content.toLowerCase().includes(lowerQuery)
  )
}

// Search conversations by title or content
export function searchConversations(conversations: Conversation[], query: string): Conversation[] {
  if (!query.trim()) return conversations
  
  const lowerQuery = query.toLowerCase()
  return conversations.filter(conversation => {
    // Search in title
    if (conversation.title.toLowerCase().includes(lowerQuery)) {
      return true
    }
    
    // Search in message content
    return conversation.messages.some(message =>
      message.content.toLowerCase().includes(lowerQuery)
    )
  })
}

// Get conversation summary (first message or title)
export function getConversationSummary(conversation: Conversation, maxLength: number = 100): string {
  if (conversation.messages.length === 0) {
    return 'Empty conversation'
  }
  
  const firstUserMessage = conversation.messages.find(msg => msg.role === 'user')
  const content = firstUserMessage?.content || conversation.messages[0].content
  
  return truncateText(content, maxLength)
}

// Calculate conversation stats
export function getConversationStats(conversation: Conversation) {
  const messageCount = conversation.messages.length
  const userMessages = conversation.messages.filter(msg => msg.role === 'user').length
  const assistantMessages = conversation.messages.filter(msg => msg.role === 'assistant').length
  const totalCharacters = conversation.messages.reduce((sum, msg) => sum + msg.content.length, 0)
  
  return {
    messageCount,
    userMessages,
    assistantMessages,
    totalCharacters,
    averageMessageLength: messageCount > 0 ? Math.round(totalCharacters / messageCount) : 0
  }
}

// Debounce function for search and other inputs
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

// Download file
export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Generate conversation title from first message
export function generateConversationTitle(firstMessage: string): string {
  const cleaned = firstMessage.trim()
  if (cleaned.length <= 50) return cleaned
  
  // Try to cut at sentence boundary
  const sentences = cleaned.split(/[.!?]/g)
  if (sentences[0] && sentences[0].length <= 50) {
    return sentences[0].trim()
  }
  
  // Cut at word boundary
  const words = cleaned.split(' ')
  let title = ''
  for (const word of words) {
    if ((title + ' ' + word).length > 50) break
    title += (title ? ' ' : '') + word
  }
  
  return title || cleaned.substring(0, 50)
}