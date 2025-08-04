import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useToast } from '@/components/ui/toast'
import { useUserSettings } from '@/contexts/UserSettingsContext'
import { 
  Settings, User, Palette, Type, Volume2, VolumeX,
  Minimize2, Clock, Save
} from 'lucide-react'
import { Separator } from '@/components/ui/separator'

interface SettingsDialogProps {
  children?: React.ReactNode
}

export function SettingsDialog({ children }: SettingsDialogProps) {
  const { settings, userData, updateSettings, updateUserData } = useUserSettings()
  const { addToast } = useToast()
  const [open, setOpen] = useState(false)
  const [tempUserData, setTempUserData] = useState(userData)

  // Handle keyboard shortcut events
  React.useEffect(() => {
    const handleKeyboardShortcut = (event: CustomEvent) => {
      const { action } = event.detail
      
      if (action === 'open-settings') {
        setOpen(true)
      }
    }

    window.addEventListener('keyboard-shortcut', handleKeyboardShortcut as EventListener)
    return () => {
      window.removeEventListener('keyboard-shortcut', handleKeyboardShortcut as EventListener)
    }
  }, [])

  const handleSave = () => {
    updateUserData(tempUserData)
    addToast({
      type: 'success',
      title: 'Settings saved',
      description: 'Your preferences have been updated'
    })
    setOpen(false)
  }

  const handleCancel = () => {
    setTempUserData(userData)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </DialogTitle>
          <DialogDescription>
            Customize your chat experience
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Profile */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <Label className="text-sm font-medium">Profile</Label>
            </div>
            
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg bg-gradient-to-br from-primary to-purple-500 text-white">
                  {tempUserData.name.slice(0, 2).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div>
                  <Label htmlFor="name" className="text-xs">Display Name</Label>
                  <Input
                    id="name"
                    value={tempUserData.name}
                    onChange={(e) => setTempUserData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Your name"
                    className="h-8"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-xs">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={tempUserData.email}
                    onChange={(e) => setTempUserData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="your@email.com"
                    className="h-8"
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Appearance */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <Label className="text-sm font-medium">Appearance</Label>
            </div>

            {/* Font Size */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Type className="h-4 w-4" />
                <Label>Font Size</Label>
              </div>
              <div className="flex gap-1">
                {(['small', 'medium', 'large'] as const).map((size) => (
                  <Button
                    key={size}
                    variant={settings.fontSize === size ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 px-3 capitalize"
                    onClick={() => updateSettings({ fontSize: size })}
                  >
                    {size}
                  </Button>
                ))}
              </div>
            </div>

            {/* Compact Mode */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Minimize2 className="h-4 w-4" />
                <Label>Compact Mode</Label>
              </div>
              <Switch
                checked={settings.compactMode}
                onCheckedChange={(checked: boolean) => updateSettings({ compactMode: checked })}
              />
            </div>

            {/* Show Timestamps */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <Label>Show Timestamps</Label>
              </div>
              <Switch
                checked={settings.showTimestamps}
                onCheckedChange={(checked: boolean) => updateSettings({ showTimestamps: checked })}
              />
            </div>
          </div>

          <Separator />

          {/* Audio */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {settings.soundEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
              <Label className="text-sm font-medium">Audio</Label>
            </div>

            <div className="flex items-center justify-between">
              <Label>Sound Effects</Label>
              <Switch
                checked={settings.soundEnabled}
                onCheckedChange={(checked: boolean) => updateSettings({ soundEnabled: checked })}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}