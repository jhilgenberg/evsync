'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          action: isLogin ? 'login' : 'signup',
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Ein Fehler ist aufgetreten')
      }

      router.push('/dashboard')
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: error.message,
      })
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f5f7]">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-medium text-center">
            {isLogin ? 'Willkommen zurück' : 'Account erstellen'}
          </CardTitle>
          <CardDescription className="text-center text-zinc-500">
            {isLogin 
              ? 'Melde dich an um deine Wallbox zu verwalten' 
              : 'Erstelle einen Account für deine Wallbox'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="E-Mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-lg bg-[#f5f5f7] border-zinc-200"
                required
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Passwort"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 rounded-lg bg-[#f5f5f7] border-zinc-200"
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-11 rounded-lg bg-[#0071e3] hover:bg-[#0077ED] text-white"
            >
              {isLogin ? 'Anmelden' : 'Registrieren'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Button
              variant="link"
              className="text-[#0071e3] hover:text-[#0077ED]"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin
                ? 'Noch kein Account? Registrieren'
                : 'Bereits registriert? Anmelden'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 