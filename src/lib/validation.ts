import { z } from 'zod'

// Email validation schema
export const emailSchema = z.string()
  .email('Please enter a valid email address')
  .min(1, 'Email is required')

// Password validation schema
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')

// Name validation schema
export const nameSchema = z.string()
  .min(1, 'Name is required')
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must be less than 50 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')

// Message content validation schema
export const messageContentSchema = z.string()
  .min(1, 'Message cannot be empty')
  .max(4000, 'Message must be less than 4000 characters')
  .refine(
    (content) => content.trim().length > 0,
    'Message cannot be only whitespace'
  )

// Conversation title validation schema
export const conversationTitleSchema = z.string()
  .min(1, 'Title is required')
  .max(100, 'Title must be less than 100 characters')
  .refine(
    (title) => title.trim().length > 0,
    'Title cannot be only whitespace'
  )

// Search query validation schema
export const searchQuerySchema = z.string()
  .max(200, 'Search query must be less than 200 characters')

// User settings validation schemas
export const fontSizeSchema = z.enum(['small', 'medium', 'large'])
export const themeSchema = z.enum(['light', 'dark', 'system'])

export const userSettingsSchema = z.object({
  theme: themeSchema,
  fontSize: fontSizeSchema,
})

// User data validation schema
export const userDataSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  avatar: z.string().optional()
})

// Login form validation schema
export const loginFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required')
})

// Register form validation schema
export const registerFormSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string()
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Passwords don't match",
    path: ['confirmPassword']
  }
)

// Validation helper functions
export function validateEmail(email: string): { isValid: boolean; error?: string } {
  try {
    emailSchema.parse(email)
    return { isValid: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.issues[0].message }
    }
    return { isValid: false, error: 'Invalid email' }
  }
}

export function validatePassword(password: string): { 
  isValid: boolean
  error?: string
  strength: 'weak' | 'medium' | 'strong'
} {
  try {
    passwordSchema.parse(password)
    
    // Calculate password strength
    let score = 0
    if (password.length >= 8) score++
    if (password.length >= 12) score++
    if (/[A-Z]/.test(password)) score++
    if (/[a-z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++
    
    const strength = score < 3 ? 'weak' : score < 5 ? 'medium' : 'strong'
    
    return { isValid: true, strength }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        isValid: false, 
        error: error.issues[0].message,
        strength: 'weak'
      }
    }
    return { isValid: false, error: 'Invalid password', strength: 'weak' }
  }
}

export function validateMessageContent(content: string): { isValid: boolean; error?: string } {
  try {
    messageContentSchema.parse(content)
    return { isValid: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.issues[0].message }
    }
    return { isValid: false, error: 'Invalid message content' }
  }
}

export function validateConversationTitle(title: string): { isValid: boolean; error?: string } {
  try {
    conversationTitleSchema.parse(title)
    return { isValid: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.issues[0].message }
    }
    return { isValid: false, error: 'Invalid title' }
  }
}

// Sanitization functions
export function sanitizeHtml(input: string): string {
  const div = document.createElement('div')
  div.textContent = input
  return div.innerHTML
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, '') // Remove leading/trailing underscores
    .substring(0, 255) // Limit length
}

// Rate limiting utilities
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  key: string, 
  maxRequests: number = 10, 
  windowMs: number = 60000
): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(key)
  
  if (!record) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (record.count >= maxRequests) {
    return false
  }
  
  record.count++
  return true
}

export function clearExpiredRateLimits(): void {
  const now = Date.now()
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}

// Content filtering
export const INAPPROPRIATE_PATTERNS = [
  /spam/gi,
  /abuse/gi,
  // Add more patterns as needed
]

export function filterInappropriateContent(content: string): {
  isClean: boolean
  filteredContent: string
  violations: string[]
} {
  const violations: string[] = []
  let filteredContent = content
  
  for (const pattern of INAPPROPRIATE_PATTERNS) {
    if (pattern.test(content)) {
      violations.push(pattern.source)
      filteredContent = filteredContent.replace(pattern, '***')
    }
  }
  
  return {
    isClean: violations.length === 0,
    filteredContent,
    violations
  }
}
