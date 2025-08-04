import React, { createContext, useContext, useReducer } from 'react'
import type { ReactNode } from 'react'
import type { Conversation, Message } from '@/types/chat'

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
                title: conv.messages.length === 0 ? action.payload.message.content.slice(0, 50) + '...' : conv.title
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
  deleteConversation: (conversationId: string) => void
  getCurrentConversation: () => Conversation | null
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState)

  const createNewConversation = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
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
      id: Date.now().toString(),
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
        id: (Date.now() + 1).toString(),
        content: `This is a mock response to: "${content}". In a real application, this would be connected to an AI service like OpenAI, Claude, or similar.`,
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

  const getCurrentConversation = () => {
    return state.conversations.find(conv => conv.id === state.currentConversationId) || null
  }

  return (
    <ChatContext.Provider value={{
      state,
      dispatch,
      createNewConversation,
      sendMessage,
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