import React from 'react'

// Hook to detect if content contains markdown
export function useMarkdownDetection(content: string): boolean {
  return React.useMemo(() => {
    const markdownPatterns = [
      /^#{1,6}\s/m, // Headers
      /\*\*.*?\*\*/, // Bold
      /\*.*?\*/, // Italic
      /`.*?`/, // Inline code
      /```[\s\S]*?```/, // Code blocks
      /\[.*?\]\(.*?\)/, // Links
      /^>\s/m, // Blockquotes
      /^[-*]\s/m, // Lists
      /^\d+\.\s/m, // Ordered lists
      /~~.*?~~/, // Strikethrough
    ]

    return markdownPatterns.some(pattern => pattern.test(content))
  }, [content])
}