import { cn } from '@/lib/utils'

interface MarkdownRendererProps {
  content: string
  className?: string
}

// Simple markdown parser for common formatting
function parseMarkdown(text: string): string {
  let html = text

  // Headers (### ## #)
  html = html.replace(/^### (.*$)/gim, '<h3 class="font-bold text-lg mb-2 mt-4">$1</h3>')
  html = html.replace(/^## (.*$)/gim, '<h2 class="font-bold text-xl mb-2 mt-4">$1</h2>')
  html = html.replace(/^# (.*$)/gim, '<h1 class="font-bold text-2xl mb-2 mt-4">$1</h1>')

  // Bold **text** or __text__
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
  html = html.replace(/__(.*?)__/g, '<strong class="font-semibold">$1</strong>')

  // Italic *text* or _text_
  html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
  html = html.replace(/_(.*?)_/g, '<em class="italic">$1</em>')

  // Strikethrough ~~text~~
  html = html.replace(/~~(.*?)~~/g, '<del class="line-through opacity-75">$1</del>')

  // Inline code `code`
  html = html.replace(/`([^`]+)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')

  // Code blocks ```language ... ```
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, language, code) => {
    const lang = language || 'text'
    return `<div class="bg-muted/50 border rounded-lg p-4 my-2 overflow-x-auto">
      <div class="text-xs text-muted-foreground mb-2 font-mono">${lang}</div>
      <pre class="text-sm font-mono overflow-x-auto"><code>${escapeHtml(code.trim())}</code></pre>
    </div>`
  })

  // Code blocks ``` ... ``` (no language specified)
  html = html.replace(/```\n([\s\S]*?)```/g, (_, code) => {
    return `<div class="bg-muted/50 border rounded-lg p-4 my-2 overflow-x-auto">
      <pre class="text-sm font-mono overflow-x-auto"><code>${escapeHtml(code.trim())}</code></pre>
    </div>`
  })

  // Links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')

  // Blockquotes > text
  html = html.replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-muted-foreground/20 pl-4 italic text-muted-foreground my-2">$1</blockquote>')

  // Unordered lists - item or * item
  html = html.replace(/^[-*] (.*$)/gim, '<li class="ml-4 list-disc">$1</li>')
  html = html.replace(/(<li.*<\/li>)/s, '<ul class="my-2">$1</ul>')

  // Ordered lists 1. item
  html = html.replace(/^\d+\. (.*$)/gim, '<li class="ml-4 list-decimal">$1</li>')

  // Line breaks
  html = html.replace(/\n/g, '<br>')

  // Checkboxes - [ ] and - [x]
  html = html.replace(/- \[ \] (.*)/g, '<div class="flex items-center gap-2 my-1"><input type="checkbox" disabled class="h-4 w-4" /> <span>$1</span></div>')
  html = html.replace(/- \[x\] (.*)/g, '<div class="flex items-center gap-2 my-1"><input type="checkbox" checked disabled class="h-4 w-4" /> <span>$1</span></div>')

  return html
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const htmlContent = parseMarkdown(content)

  return (
    <div
      className={cn(
        'prose prose-sm max-w-none',
        'prose-headings:text-foreground',
        'prose-p:text-foreground prose-p:leading-relaxed',
        'prose-strong:text-foreground',
        'prose-em:text-foreground',
        'prose-code:text-foreground',
        'prose-pre:bg-muted prose-pre:text-foreground',
        'prose-blockquote:text-muted-foreground prose-blockquote:border-border',
        'prose-ul:text-foreground prose-ol:text-foreground',
        'prose-li:text-foreground',
        'prose-a:text-primary hover:prose-a:text-primary/80',
        className
      )}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  )
}


