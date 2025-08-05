import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/components/ui/toast'
import { openAIService, type FileInfo } from '@/services/openai'
import { 
  Upload, 
  File, 
  X, 
  CheckCircle, 
  AlertCircle,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileCode
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  onFilesUploaded?: (files: FileInfo[]) => void
  maxFiles?: number
  maxSize?: number // in MB
  accept?: string
  className?: string
}

interface UploadingFile {
  file: File
  progress: number
  status: 'uploading' | 'success' | 'error'
  error?: string
  info?: FileInfo
}

export function FileUpload({
  onFilesUploaded,
  maxFiles = 5,
  maxSize = 10, // 10MB default
  accept = '.pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.xlsx,.xls',
  className
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, UploadingFile>>(new Map())
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { addToast } = useToast()

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <FileImage className="h-4 w-4" />
    if (mimeType.startsWith('video/')) return <FileVideo className="h-4 w-4" />
    if (mimeType.startsWith('audio/')) return <FileAudio className="h-4 w-4" />
    if (mimeType.includes('pdf')) return <FileText className="h-4 w-4" />
    if (mimeType.includes('code') || mimeType.includes('json')) return <FileCode className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize * 1024 * 1024) {
      return `File size exceeds ${maxSize}MB limit`
    }
    
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    const acceptedExtensions = accept.split(',').map(ext => ext.trim().toLowerCase())
    
    if (!acceptedExtensions.includes(fileExtension)) {
      return `File type ${fileExtension} not supported`
    }
    
    return null
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const validFiles: File[] = []
    const errors: string[] = []

    // Validate files
    Array.from(files).slice(0, maxFiles).forEach(file => {
      const error = validateFile(file)
      if (error) {
        errors.push(`${file.name}: ${error}`)
      } else {
        validFiles.push(file)
      }
    })

    if (errors.length > 0) {
      addToast({
        type: 'error',
        title: 'Invalid files',
        description: errors.join(', ')
      })
    }

    if (validFiles.length === 0) return

    // Upload valid files
    const uploadedFiles: FileInfo[] = []
    
    for (const file of validFiles) {
      const fileId = `${file.name}-${Date.now()}`
      
      setUploadingFiles(prev => new Map(prev).set(fileId, {
        file,
        progress: 0,
        status: 'uploading'
      }))

      try {
        // Simulate progress (in real app, use XMLHttpRequest for progress)
        const progressInterval = setInterval(() => {
          setUploadingFiles(prev => {
            const newMap = new Map(prev)
            const current = newMap.get(fileId)
            if (current && current.progress < 90) {
              current.progress += 10
              newMap.set(fileId, current)
            }
            return newMap
          })
        }, 200)

        const fileInfo = await openAIService.uploadFile(file)
        clearInterval(progressInterval)

        setUploadingFiles(prev => {
          const newMap = new Map(prev)
          newMap.set(fileId, {
            file,
            progress: 100,
            status: 'success',
            info: fileInfo
          })
          return newMap
        })

        uploadedFiles.push(fileInfo)

        // Remove successful upload after 3 seconds
        setTimeout(() => {
          setUploadingFiles(prev => {
            const newMap = new Map(prev)
            newMap.delete(fileId)
            return newMap
          })
        }, 3000)

      } catch (error) {
        setUploadingFiles(prev => {
          const newMap = new Map(prev)
          newMap.set(fileId, {
            file,
            progress: 0,
            status: 'error',
            error: error instanceof Error ? error.message : 'Upload failed'
          })
          return newMap
        })

        // Remove error after 5 seconds
        setTimeout(() => {
          setUploadingFiles(prev => {
            const newMap = new Map(prev)
            newMap.delete(fileId)
            return newMap
          })
        }, 5000)
      }
    }

    if (uploadedFiles.length > 0 && onFilesUploaded) {
      onFilesUploaded(uploadedFiles)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
  }

  const removeFile = (fileId: string) => {
    setUploadingFiles(prev => {
      const newMap = new Map(prev)
      newMap.delete(fileId)
      return newMap
    })
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop Zone */}
      <Card
        className={cn(
          "border-2 border-dashed transition-colors cursor-pointer",
          isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
          "p-8"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center justify-center text-center space-y-2">
          <Upload className={cn(
            "h-10 w-10 transition-colors",
            isDragging ? "text-primary" : "text-muted-foreground"
          )} />
          <div>
            <p className="text-sm font-medium">
              Drop files here or click to browse
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Supports: PDF, Word, Excel, Images • Max {maxSize}MB per file
            </p>
          </div>
        </div>
      </Card>

      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Uploading Files */}
      {uploadingFiles.size > 0 && (
        <div className="space-y-2">
          {Array.from(uploadingFiles.entries()).map(([fileId, uploadingFile]) => (
            <Card key={fileId} className="p-3">
              <div className="flex items-center gap-3">
                {getFileIcon(uploadingFile.file.type)}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">
                      {uploadingFile.file.name}
                    </p>
                    <span className="text-xs text-muted-foreground ml-2">
                      {formatFileSize(uploadingFile.file.size)}
                    </span>
                  </div>
                  
                  {uploadingFile.status === 'uploading' && (
                    <Progress value={uploadingFile.progress} className="h-1 mt-2" />
                  )}
                  
                  {uploadingFile.status === 'error' && (
                    <p className="text-xs text-destructive mt-1">
                      {uploadingFile.error}
                    </p>
                  )}
                </div>

                {uploadingFile.status === 'uploading' && (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                )}
                
                {uploadingFile.status === 'success' && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                
                {uploadingFile.status === 'error' && (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFile(fileId)
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}