import { apiConfig } from '@/config/api'

export interface FileInfo {
  id: string
  name: string
  size: number
  type: string
  url?: string
  uploadedAt: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  files?: FileInfo[]
}

export interface ChatCompletionRequest {
  messages: ChatMessage[]
  model?: string
  temperature?: number
  maxTokens?: number
  stream?: boolean
}

export interface ChatCompletionResponse {
  id: string
  object?: string
  created?: number
  choices: Array<{
    index?: number
    message: {
      role: 'assistant'
      content: string
    }
    finish_reason?: string
    finishReason?: string // Support both formats
  }>
  usage: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
    // Also support camelCase for compatibility
    promptTokens?: number
    completionTokens?: number
    totalTokens?: number
  }
  session_id?: string // Custom field from your backend
}

interface OpenAIFile {
  id: string
  filename: string
  bytes: number
  purpose: string
  created_at: number
}

interface APIResponseChoice {
  index?: number
  message?: {
    role: string
    content: string
  }
  finish_reason?: string
  finishReason?: string
}

class OpenAIService {
  private apiKey: string
  private baseUrl: string
  private model: string

  constructor() {
    this.apiKey = apiConfig.apiKey
    this.baseUrl = apiConfig.baseUrl
    this.model = apiConfig.model
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = this.baseUrl.includes('openai.com') 
      ? `https://api.openai.com/v1${endpoint}`
      : `${this.baseUrl}${endpoint}`

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    }

    // Add authorization header if using OpenAI directly
    if (this.baseUrl.includes('openai.com') && this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`
    }

    const response = await fetch(url, {
      ...options,
      headers,
      signal: AbortSignal.timeout(apiConfig.timeout)
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    return response
  }

  async uploadFile(file: File): Promise<FileInfo> {
    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('purpose', 'assistants') // or 'fine-tune' depending on use case

      // If using OpenAI directly, use Files API
      if (this.baseUrl.includes('openai.com')) {
        const response = await fetch('https://api.openai.com/v1/files', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
            // Don't set Content-Type to let browser set it with boundary for FormData
          },
          body: formData,
          signal: AbortSignal.timeout(apiConfig.timeout)
        })

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
        }

        const result = await response.json()
        
        return {
          id: result.id,
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString()
        }
      } else {
        // Using custom backend
        const response = await fetch(`${this.baseUrl}/api/files/upload`, {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
        }

        const result = await response.json()
        
        return {
          id: result.id || `file_${Date.now()}`,
          name: file.name,
          size: file.size,
          type: file.type,
          url: result.url,
          uploadedAt: new Date().toISOString()
        }
      }
    } catch (error) {
      console.error('File upload error:', error)
      throw new Error(error instanceof Error ? error.message : 'Failed to upload file')
    }
  }

  async deleteFile(fileId: string): Promise<void> {
    try {
      await this.makeRequest(`/files/${fileId}`, {
        method: 'DELETE'
      })
    } catch (error) {
      console.error('File deletion error:', error)
      throw new Error(error instanceof Error ? error.message : 'Failed to delete file')
    }
  }

  async listFiles(): Promise<FileInfo[]> {
    try {
      const response = await this.makeRequest('/files')
      const result = await response.json()
      
      return result.data?.map((file: OpenAIFile) => ({
        id: file.id,
        name: file.filename,
        size: file.bytes,
        type: file.purpose === 'assistants' ? 'document' : 'unknown',
        uploadedAt: new Date(file.created_at * 1000).toISOString()
      })) || []
    } catch (error) {
      console.error('List files error:', error)
      throw new Error(error instanceof Error ? error.message : 'Failed to list files')
    }
  }

  async createChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    try {
      const response = await this.makeRequest('/chat/completions', {
        method: 'POST',
        body: JSON.stringify({
          model: request.model || this.model,
          messages: request.messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          temperature: request.temperature || 0.7,
          max_tokens: request.maxTokens || 2000,
          stream: request.stream || false
        })
      })

      const result = await response.json()
      
      // Normalize the response to handle both snake_case and camelCase
      return {
        ...result,
        choices: result.choices?.map((choice: APIResponseChoice) => ({
          ...choice,
          finishReason: choice.finish_reason || choice.finishReason
        })),
        usage: {
          promptTokens: result.usage?.prompt_tokens || result.usage?.promptTokens || 0,
          completionTokens: result.usage?.completion_tokens || result.usage?.completionTokens || 0,
          totalTokens: result.usage?.total_tokens || result.usage?.totalTokens || 0,
          // Also preserve original format
          ...result.usage
        }
      }
    } catch (error) {
      console.error('Chat completion error:', error)
      throw new Error(error instanceof Error ? error.message : 'Failed to create chat completion')
    }
  }

  async createStreamingChatCompletion(
    request: ChatCompletionRequest,
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      const response = await this.makeRequest('/chat/completions', {
        method: 'POST',
        body: JSON.stringify({
          model: request.model || this.model,
          messages: request.messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          temperature: request.temperature || 0.7,
          max_tokens: request.maxTokens || 2000,
          stream: true
        })
      })

      if (!response.body) {
        throw new Error('No response body for streaming')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) {
          onComplete()
          break
        }

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(line => line.trim())

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            
            if (data === '[DONE]') {
              onComplete()
              return
            }

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content
              
              if (content) {
                onChunk(content)
              }
            } catch (parseError) {
              console.warn('Failed to parse streaming chunk:', parseError)
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming chat completion error:', error)
      onError(error instanceof Error ? error : new Error('Streaming failed'))
    }
  }
}

export const openAIService = new OpenAIService()