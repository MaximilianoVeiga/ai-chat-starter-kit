import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { validateEmail } from '@/lib/validation'
import { userDataStorage } from '@/lib/storage'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const { addToast } = useToast()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    
    // Validate form
    const newErrors: { email?: string; password?: string } = {}
    
    const emailValidation = validateEmail(email)
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.error
    }
    
    if (!password.trim()) {
      newErrors.password = 'Password is required'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      addToast({
        type: 'error',
        title: 'Validation failed',
        description: 'Please fix the errors and try again'
      })
      return
    }
    
    setIsLoading(true)
    
    // Mock authentication - in real app, call your auth API
    setTimeout(() => {
      localStorage.setItem('isAuthenticated', 'true')
      
      // Extract name from email for demo purposes
      const name = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ').trim()
      
      // Save user data
      userDataStorage.save({ 
        name: name || 'User',
        email: email 
      })
      
      addToast({
        type: 'success',
        title: 'Welcome back!',
        description: 'You have been signed in successfully'
      })
      
      setIsLoading(false)
      navigate('/chat')
    }, 1000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-muted-foreground">
            Sign in to your account to continue
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center pb-4">
            <CardTitle className="text-2xl font-semibold">Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (errors.email) {
                        setErrors(prev => ({ ...prev, email: undefined }))
                      }
                    }}
                    className={`pl-10 h-11 ${
                      errors.email ? 'border-destructive focus:border-destructive' : ''
                    }`}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    required
                  />
                  {errors.email && (
                    <p id="email-error" className="text-sm text-destructive mt-1">
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (errors.password) {
                        setErrors(prev => ({ ...prev, password: undefined }))
                      }
                    }}
                    className={`pl-10 pr-10 h-11 ${
                      errors.password ? 'border-destructive focus:border-destructive' : ''
                    }`}
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                    required
                  />
                  {errors.password && (
                    <p id="password-error" className="text-sm text-destructive mt-1">
                      {errors.password}
                    </p>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-11 w-11 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Forgot Password */}
              <div className="flex justify-end">
                <Button variant="link" className="h-auto p-0 text-sm text-muted-foreground hover:text-primary">
                  Forgot your password?
                </Button>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 pt-2">
              <Button 
                type="submit" 
                className="w-full h-11 font-medium" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>
              
              <div className="text-center text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link 
                  to="/register" 
                  className="font-medium text-primary hover:underline transition-colors"
                >
                  Sign up
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          By signing in, you agree to our{' '}
          <Button variant="link" className="h-auto p-0 text-xs">
            Terms of Service
          </Button>{' '}
          and{' '}
          <Button variant="link" className="h-auto p-0 text-xs">
            Privacy Policy
          </Button>
        </p>
      </div>
    </div>
  )
}