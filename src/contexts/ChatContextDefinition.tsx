import { createContext } from 'react'
import type { Conversation, Message } from '@/types/chat'
import type { FileInfo } from '@/services/openai'

interface ChatState {
  conversations: Conversation[]
  currentConversationId: string | null
  isLoading: boolean
  uploadedFiles: FileInfo[]
  sessionId: string | null
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
  | { type: 'SET_UPLOADED_FILES'; payload: FileInfo[] }
  | { type: 'ADD_UPLOADED_FILE'; payload: FileInfo }
  | { type: 'REMOVE_UPLOADED_FILE'; payload: string }
  | { type: 'SET_SESSION_ID'; payload: string | null }

interface ChatContextType {
  state: ChatState
  dispatch: React.Dispatch<ChatAction>
  createNewConversation: () => void
  sendMessage: (content: string, fileIds?: string[]) => void
  editMessage: (messageId: string, content: string) => void
  deleteMessage: (messageId: string) => void
  deleteConversation: (conversationId: string) => void
  getCurrentConversation: () => Conversation | null
  addUploadedFiles: (files: FileInfo[]) => void
  removeUploadedFile: (fileId: string) => void
  clearUploadedFiles: () => void
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined)
export type { ChatContextType, ChatState, ChatAction }