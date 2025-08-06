import { useReducer, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { Conversation, Message } from '@/types/chat'
import { conversationStorage, currentConversationStorage } from '@/lib/storage'
import { generateId, generateConversationTitle } from '@/lib/utils-enhanced'
import { useToast } from '@/components/ui/toast'
import { openAIService, type FileInfo, type ChatMessage } from '@/services/openai'
import { ChatContext, type ChatState, type ChatAction } from './ChatContextDefinition'

const initialState: ChatState = {
  conversations: [],
  currentConversationId: null,
  isLoading: false,
  uploadedFiles: [],
  sessionId: null
}

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_CONVERSATIONS':
      return { ...state, conversations: action.payload }
    case 'ADD_CONVERSATION':
      return { 
        ...state, 
        conversations: [action.payload, ...state.conversations],
        currentConversationId: action.payload.id,
        sessionId: null // Reset session for new conversation
      }
    case 'SET_CURRENT_CONVERSATION':
      return { ...state, currentConversationId: action.payload, sessionId: null }
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
    case 'DELETE_CONVERSATION': {
      const remainingConvs = state.conversations.filter(conv => conv.id !== action.payload)
      const newCurrentId = state.currentConversationId === action.payload
        ? (remainingConvs.length > 0 ? remainingConvs[0].id : null)
        : state.currentConversationId
      
      return {
        ...state,
        conversations: remainingConvs,
        currentConversationId: newCurrentId,
        sessionId: state.currentConversationId === action.payload ? null : state.sessionId
      }
    }
    case 'SET_UPLOADED_FILES':
      return { ...state, uploadedFiles: action.payload }
    case 'ADD_UPLOADED_FILE':
      return { ...state, uploadedFiles: [...state.uploadedFiles, action.payload] }
    case 'REMOVE_UPLOADED_FILE':
      return { ...state, uploadedFiles: state.uploadedFiles.filter(f => f.id !== action.payload) }
    case 'SET_SESSION_ID':
      return { ...state, sessionId: action.payload }
    default:
      return state
  }
}



export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState)
  const { addToast } = useToast()

  // Load conversations from storage on mount
  useEffect(() => {
    const loadedConversations = conversationStorage.getAll()
    const savedCurrentId = currentConversationStorage.get()
    
    if (loadedConversations.length > 0) {
      dispatch({ type: 'SET_CONVERSATIONS', payload: loadedConversations })
      
      // Restore current conversation or use the most recent
      if (savedCurrentId && loadedConversations.some((c: Conversation) => c.id === savedCurrentId)) {
        dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: savedCurrentId })
      } else {
                const mostRecent = loadedConversations.reduce((prev: Conversation, current: Conversation) =>
          prev.updatedAt > current.updatedAt ? prev : current
        )
        dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: mostRecent.id })
      }
    }
  }, [])

  // Save conversations to storage whenever they change
  useEffect(() => {
    if (state.conversations.length > 0) {
      conversationStorage.saveAll(state.conversations)
    }
  }, [state.conversations])

  // Save current conversation ID
  useEffect(() => {
    if (state.currentConversationId) {
      currentConversationStorage.save(state.currentConversationId)
    }
  }, [state.currentConversationId])

  const createNewConversation = () => {
    const newConversation: Conversation = {
      id: generateId(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
    dispatch({ type: 'ADD_CONVERSATION', payload: newConversation })
    dispatch({ type: 'SET_UPLOADED_FILES', payload: [] }) // Clear files for new conversation
  }

  const sendMessage = async (content: string, fileIds?: string[]) => {
    if (!state.currentConversationId) {
      createNewConversation()
      return
    }

    const userMessage: Message = {
      id: generateId(),
      content,
      role: 'user',
      timestamp: new Date(),
      attachments: fileIds
    }

    dispatch({ 
      type: 'ADD_MESSAGE', 
      payload: { conversationId: state.currentConversationId, message: userMessage } 
    })

    dispatch({ type: 'SET_LOADING', payload: true })

    try {
      // Get current conversation
      const currentConv = state.conversations.find(c => c.id === state.currentConversationId)
      if (!currentConv) {
        throw new Error('No current conversation')
      }

      // Create user message
      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        content,
        timestamp: new Date(),
        attachments: fileIds
      }

      // Convert all messages to ChatMessage format for API
      const allMessages = [...currentConv.messages, userMessage]
      const chatMessages = allMessages.map((msg): ChatMessage => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp.toISOString(),
        files: msg.attachments?.map((id: string) => ({ id, name: '', size: 0, type: '', uploadedAt: new Date().toISOString() }))
      }))

      // Call OpenAI API
      const response = await openAIService.createChatCompletion({
        messages: chatMessages,
        model: import.meta.env.VITE_OPENAI_MODEL || 'gpt-4',
        temperature: 0.7
      })

      // Store session ID for conversation continuity
      if (response.session_id && !state.sessionId) {
        dispatch({ type: 'SET_SESSION_ID', payload: response.session_id })
      }

      // Add AI response
      const aiMessage: Message = {
        id: generateId(),
        content: response.choices[0]?.message.content || 'No response generated.',
        role: 'assistant',
        timestamp: new Date()
      }
      
      dispatch({ 
        type: 'ADD_MESSAGE', 
        payload: { conversationId: state.currentConversationId!, message: aiMessage } 
      })

      // Clear uploaded files after successful send
      if (fileIds && fileIds.length > 0) {
        dispatch({ type: 'SET_UPLOADED_FILES', payload: [] })
      }

    } catch (error) {
      console.error('Error calling OpenAI API:', error)
      
      // Check if it's a development environment without API configured
      const isDev = !import.meta.env.VITE_API_BASE_URL && !import.meta.env.VITE_OPENAI_API_KEY
      
      if (isDev) {
        // Simulate response in development
        const simulatedMessage: Message = {
          id: generateId(),
          content: `I received your message: "${content}". ${fileIds?.length ? `You attached ${fileIds.length} file(s).` : ''}\n\nNote: This is a simulated response. Configure your OpenAI API key to get real responses.`,
          role: 'assistant',
          timestamp: new Date()
        }
        
        dispatch({ 
          type: 'ADD_MESSAGE', 
          payload: { conversationId: state.currentConversationId!, message: simulatedMessage } 
        })
      } else {
        addToast({
          type: 'error',
          title: 'Failed to send message',
          description: error instanceof Error ? error.message : 'Please try again later'
        })

        // Add error message
        const errorMessage: Message = {
          id: generateId(),
          content: 'Sorry, I encountered an error processing your request. Please try again.',
          role: 'assistant',
          timestamp: new Date()
        }
        
        dispatch({ 
          type: 'ADD_MESSAGE', 
          payload: { conversationId: state.currentConversationId!, message: errorMessage } 
        })
      }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const deleteConversation = (conversationId: string) => {
    dispatch({ type: 'DELETE_CONVERSATION', payload: conversationId })
    conversationStorage.delete(conversationId)
    
    // If no conversations left, create a new one
    if (state.conversations.length <= 1) {
      createNewConversation()
    }
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
    return state.conversations.find(c => c.id === state.currentConversationId) || null
  }

  const addUploadedFiles = (files: FileInfo[]) => {
    files.forEach(file => {
      dispatch({ type: 'ADD_UPLOADED_FILE', payload: file })
    })
  }

  const removeUploadedFile = (fileId: string) => {
    dispatch({ type: 'REMOVE_UPLOADED_FILE', payload: fileId })
  }

  const clearUploadedFiles = () => {
    dispatch({ type: 'SET_UPLOADED_FILES', payload: [] })
  }

  const value = {
    state,
    dispatch,
    createNewConversation,
    sendMessage,
    editMessage,
    deleteMessage,
    deleteConversation,
    getCurrentConversation,
    addUploadedFiles,
    removeUploadedFile,
    clearUploadedFiles
  }

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

