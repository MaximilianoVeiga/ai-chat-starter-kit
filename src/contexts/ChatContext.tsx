import React, { createContext, useContext, useReducer, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { Conversation, Message } from '@/types/chat'
import { conversationStorage, currentConversationStorage } from '@/lib/storage'
import { generateId, generateConversationTitle } from '@/lib/utils-enhanced'

interface ChatState {
  conversations: Conversation[]
  currentConversationId: string | null
  isLoading: boolean
}

type ChatAction =
  | { type: 'SET_CONVERSATIONS'; payload: Conversation[] }
  | { type: 'ADD_CONVERSATION'; payload: Conversation }
  | { type: 'SET_CURRENT_CONVERSATION'; payload: string }
  | { type: 'ADD_MESSAGE'; payload: { conversationId: string; message: Message } }
  | { type: 'EDIT_MESSAGE'; payload: { conversationId: string; messageId: string; content: string } }
  | { type: 'DELETE_MESSAGE'; payload: { conversationId: string; messageId: string } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'DELETE_CONVERSATION'; payload: string }

const initialState: ChatState = {
  conversations: [],
  currentConversationId: null,
  isLoading: false,
}

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_CONVERSATIONS':
      return { ...state, conversations: action.payload }
    case 'ADD_CONVERSATION':
      return { 
        ...state, 
        conversations: [action.payload, ...state.conversations],
        currentConversationId: action.payload.id
      }
    case 'SET_CURRENT_CONVERSATION':
      return { ...state, currentConversationId: action.payload }
    case 'ADD_MESSAGE':
      return {
        ...state,
        conversations: state.conversations.map(conv =>
          conv.id === action.payload.conversationId
            ? {
                ...conv,
                messages: [...conv.messages, action.payload.message],
                updatedAt: new Date(),
                title: conv.messages.length === 0 && action.payload.message.role === 'user' 
                  ? generateConversationTitle(action.payload.message.content) 
                  : conv.title
              }
            : conv
        )
      }
    case 'EDIT_MESSAGE':
      return {
        ...state,
        conversations: state.conversations.map(conv =>
          conv.id === action.payload.conversationId
            ? {
                ...conv,
                messages: conv.messages.map(msg =>
                  msg.id === action.payload.messageId
                    ? { ...msg, content: action.payload.content }
                    : msg
                ),
                updatedAt: new Date()
              }
            : conv
        )
      }
    case 'DELETE_MESSAGE':
      return {
        ...state,
        conversations: state.conversations.map(conv =>
          conv.id === action.payload.conversationId
            ? {
                ...conv,
                messages: conv.messages.filter(msg => msg.id !== action.payload.messageId),
                updatedAt: new Date()
              }
            : conv
        )
      }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'DELETE_CONVERSATION':
      return {
        ...state,
        conversations: state.conversations.filter(conv => conv.id !== action.payload),
        currentConversationId: state.currentConversationId === action.payload ? null : state.currentConversationId
      }
    default:
      return state
  }
}

interface ChatContextType {
  state: ChatState
  dispatch: React.Dispatch<ChatAction>
  createNewConversation: () => void
  sendMessage: (content: string) => void
  editMessage: (messageId: string, content: string) => void
  deleteMessage: (messageId: string) => void
  deleteConversation: (conversationId: string) => void
  getCurrentConversation: () => Conversation | null
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState)

  // Load conversations from storage on mount
  useEffect(() => {
    const savedConversations = conversationStorage.load()
    const savedCurrentConversationId = currentConversationStorage.load()
    
    if (savedConversations.length > 0) {
      dispatch({ type: 'SET_CONVERSATIONS', payload: savedConversations })
      
      if (savedCurrentConversationId && savedConversations.find(c => c.id === savedCurrentConversationId)) {
        dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: savedCurrentConversationId })
      }
    }
  }, [])

  // Save conversations to storage whenever they change
  useEffect(() => {
    if (state.conversations.length > 0) {
      conversationStorage.save(state.conversations)
    }
  }, [state.conversations])

  // Save current conversation ID to storage whenever it changes
  useEffect(() => {
    currentConversationStorage.save(state.currentConversationId)
  }, [state.currentConversationId])

  const createNewConversation = () => {
    const newConversation: Conversation = {
      id: generateId(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    dispatch({ type: 'ADD_CONVERSATION', payload: newConversation })
  }

  const sendMessage = async (content: string) => {
    if (!state.currentConversationId) return

    const userMessage: Message = {
      id: generateId(),
      content,
      role: 'user',
      timestamp: new Date(),
    }

    dispatch({ 
      type: 'ADD_MESSAGE', 
      payload: { conversationId: state.currentConversationId, message: userMessage } 
    })

    // Simulate AI response
    dispatch({ type: 'SET_LOADING', payload: true })
    
    setTimeout(() => {
      const aiMessage: Message = {
        id: generateId(),
        content: `This is a mock response to: "${content}". In a real application, this would be connected to an AI service like OpenAI, Claude, or similar.\n\n**Key features of this starter kit:**\n- ✅ Persistent conversation storage\n- ✅ Dark/light theme toggle\n- ✅ Copy, edit, delete messages\n- ✅ Export/import conversations\n- ✅ Search functionality\n- ✅ Error handling\n- ✅ Toast notifications\n\nTry asking about any of these features!`,
        role: 'assistant',
        timestamp: new Date(),
      }
      
      dispatch({ 
        type: 'ADD_MESSAGE', 
        payload: { conversationId: state.currentConversationId!, message: aiMessage } 
      })
      dispatch({ type: 'SET_LOADING', payload: false })
    }, 1000 + Math.random() * 2000) // Random delay between 1-3 seconds
  }

  const deleteConversation = (conversationId: string) => {
    dispatch({ type: 'DELETE_CONVERSATION', payload: conversationId })
  }

  const editMessage = (messageId: string, content: string) => {
    if (!state.currentConversationId) return
    
    dispatch({ 
      type: 'EDIT_MESSAGE', 
      payload: { 
        conversationId: state.currentConversationId, 
        messageId, 
        content 
      } 
    })
  }

  const deleteMessage = (messageId: string) => {
    if (!state.currentConversationId) return
    
    dispatch({ 
      type: 'DELETE_MESSAGE', 
      payload: { 
        conversationId: state.currentConversationId, 
        messageId 
      } 
    })
  }

  const getCurrentConversation = () => {
    return state.conversations.find(conv => conv.id === state.currentConversationId) || null
  }

  return (
    <ChatContext.Provider value={{
      state,
      dispatch,
      createNewConversation,
      sendMessage,
      editMessage,
      deleteMessage,
      deleteConversation,
      getCurrentConversation,
    }}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}