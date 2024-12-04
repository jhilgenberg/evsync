import type { Metadata } from "next";
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import "./globals.css";
import { Toaster } from "@/components/ui/toaster"
import { Navbar } from "@/components/layout/navbar"
import { ThemeProvider } from "@/components/theme-provider"
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Suspense } from 'react'
import { LoadingLogo } from '@/components/ui/loading-logo'

const gradientTextStyle = "bg-gradient-to-r from-blue-600 via-blue-500 to-violet-500 bg-clip-text text-transparent bg-[size:200%] animate-gradient"

export const metadata: Metadata = {
  title: "EVSync",
  description: "Verwalte deine Wallbox",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })
  
  // Hole das gespeicherte Theme
  const { data: { session } } = await supabase.auth.getSession()
  let defaultTheme = 'system'
  
  if (session?.user) {
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('theme')
      .eq('user_id', session.user.id)
      .single()
    
    if (preferences?.theme) {
      defaultTheme = preferences.theme
    }
  }

  return (
    <html lang="de" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme={defaultTheme} enableSystem>
          <Navbar>
            <Suspense fallback={<LoadingLogo />}>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-blue-500 to-violet-500 bg-clip-text text-transparent bg-[size:200%] animate-gradient">
                EVSync
              </h1>
            </Suspense>
          </Navbar>
          <main className="pt-6">
            {children}
          </main>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
