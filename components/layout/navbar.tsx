'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { 
  Home, 
  BarChart, 
  Settings, 
  Menu,
  Battery,
  User,
  LogOut,
  Coffee
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { ModeToggle } from "@/components/ui/mode-toggle"
import { SupportDialog } from "@/components/support-dialog"

const routes = [
  {
    label: 'Dashboard',
    icon: Home,
    href: '/dashboard',
    color: 'text-sky-500',
  },
  {
    label: 'Wallboxen',
    icon: Battery,
    href: '/dashboard/wallboxes',
    color: 'text-violet-500',
  },
  {
    label: 'Berichte',
    icon: BarChart,
    href: '/dashboard/reports',
    color: 'text-pink-700',
  },
  {
    label: 'Einstellungen',
    icon: Settings,
    href: '/dashboard/settings',
    color: 'text-orange-700',
  },
]

const gradientTextStyle = "bg-gradient-to-r from-blue-600 via-blue-500 to-violet-500 bg-clip-text text-transparent bg-[size:200%] animate-gradient"

interface NavbarProps {
  children?: React.ReactNode
}

export function Navbar({ children }: NavbarProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // Prüfe Login-Status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsLoggedIn(!!session)
    }
    checkAuth()
  }, [supabase.auth])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 border-b bg-background mb-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="w-48">
            <Link href="/" className="flex items-center">
              {children || (
                <h1 className={`text-xl font-bold ${gradientTextStyle}`}>
                  EVSync
                </h1>
              )}
            </Link>
          </div>

          {isLoggedIn && (
            <nav className="hidden md:flex items-center justify-center flex-1">
              <div className="flex items-center space-x-1 rounded-lg bg-muted p-1">
                {routes.map((route) => (
                  <Link
                    key={route.href}
                    href={route.href}
                    className={cn(
                      'flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      pathname === route.href
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-background hover:text-foreground'
                    )}
                  >
                    <route.icon className={cn('h-4 w-4', route.color)} />
                    <span>{route.label}</span>
                  </Link>
                ))}
              </div>
            </nav>
          )}

          <div className="w-48 flex justify-end">
            <div className="hidden md:flex items-center gap-2">
              <SupportDialog 
                trigger={
                  <Button variant="ghost" size="sm">
                    <Coffee className="mr-2 h-4 w-4" />
                    Unterstützen
                  </Button>
                }
              />
              <ModeToggle />
              {isLoggedIn ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      Abmelden
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/auth">
                  <Button variant="default">
                    Anmelden
                  </Button>
                </Link>
              )}
            </div>
          </div>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="fixed inset-y-0 right-0 h-full w-72 z-50">
              <div className="flex flex-col space-y-4 py-4">
                <div className="px-3 py-2">
                  {isLoggedIn ? (
                    <>
                      <h2 className="mb-2 px-4 text-lg font-semibold">Navigation</h2>
                      <div className="space-y-1">
                        {routes.map((route) => (
                          <Link
                            key={route.href}
                            href={route.href}
                            onClick={() => setOpen(false)}
                            className={cn(
                              'flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground',
                              pathname === route.href
                                ? 'bg-accent text-accent-foreground'
                                : 'transparent'
                            )}
                          >
                            <route.icon className={cn('mr-2 h-4 w-4', route.color)} />
                            {route.label}
                          </Link>
                        ))}
                      </div>
                      
                      <div className="mt-6 px-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Design</span>
                          <ModeToggle />
                        </div>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start text-red-600"
                          onClick={handleSignOut}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Abmelden
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <Link href="/auth" className="w-full">
                        <Button className="w-full" onClick={() => setOpen(false)}>
                          Anmelden
                        </Button>
                      </Link>
                      <div className="flex items-center justify-between px-3">
                        <span className="text-sm font-medium">Design</span>
                        <ModeToggle />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  )
} 