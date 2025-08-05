import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConversationSidebar } from '@/components/chat/ConversationSidebar'
import { ChatArea } from '@/components/chat/ChatArea'
import { ChatProvider } from '@/contexts/ChatContext'
import { SidebarProvider, SidebarInset, Sidebar } from '@/components/ui/sidebar'

function ChatContent() {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        {/* Sidebar */}
        <Sidebar className="border-r" collapsible="icon">
          <ConversationSidebar />
        </Sidebar>
        
        {/* Main Chat Area */}
        <SidebarInset className="flex-1 overflow-hidden">
          <ChatArea />
        </SidebarInset>
      </div>
    </SidebarProvider>
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