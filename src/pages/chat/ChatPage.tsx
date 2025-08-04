import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConversationSidebar } from '@/components/chat/ConversationSidebar'
import { ChatArea } from '@/components/chat/ChatArea'
import { ChatProvider } from '@/contexts/ChatContext'

function ChatContent() {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-80 flex-shrink-0 border-r border-border">
        <ConversationSidebar />
      </aside>
      
      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0">
        <ChatArea />
      </main>
    </div>
  )
}

export function ChatPage() {
  const navigate = useNavigate()

  useEffect(() => {
    // Check if user is authenticated
    const isAuthenticated = localStorage.getItem('isAuthenticated')
    if (!isAuthenticated) {
      navigate('/login')
    }
  }, [navigate])

  return (
    <ChatProvider>
      <ChatContent />
    </ChatProvider>
  )
}