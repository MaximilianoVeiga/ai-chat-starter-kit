// API Configuration
export const apiConfig = {
  // Base URL for the API - can be your backend or OpenAI directly
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  
  // OpenAI API Key - required for direct OpenAI access
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
  
  // Model to use for chat completions
  model: import.meta.env.VITE_OPENAI_MODEL || 'gpt-4',
  
  // Request timeout in milliseconds
  timeout: 30000,
  
  // Max file upload size in MB
  maxFileSize: 10,
  
  // Allowed file types
  allowedFileTypes: [
    '.pdf',
    '.doc',
    '.docx',
    '.txt',
    '.png',
    '.jpg',
    '.jpeg',
    '.xlsx',
    '.xls',
    '.csv',
    '.json',
    '.md'
  ]
}

// Check if API is configured
export const isApiConfigured = () => {
  return apiConfig.baseUrl && (
    // Either using a backend proxy (no API key needed)
    !apiConfig.baseUrl.includes('openai.com') ||
    // Or using OpenAI directly (API key required)
    (apiConfig.baseUrl.includes('openai.com') && apiConfig.apiKey)
  )
}