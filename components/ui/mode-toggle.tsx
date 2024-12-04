"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export function ModeToggle() {
  const { theme, setTheme } = useTheme()
  const supabase = createClientComponentClient()

  const toggleTheme = async () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('user_preferences')
          .upsert({ 
            user_id: user.id, 
            theme: newTheme 
          }, { 
            onConflict: 'user_id' 
          })
      }
    } catch (error) {
      console.error('Fehler beim Speichern des Themes:', error)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Design wechseln</span>
    </Button>
  )
} 