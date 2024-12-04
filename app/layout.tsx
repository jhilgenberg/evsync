import type { Metadata } from "next";
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import "./globals.css";
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { MainLayout } from '@/components/layout/main-layout'

export const metadata: Metadata = {
  title: "EVSync",
  description: "Einfache Berichte für deine Wallboxabrechnungen.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })
  
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
          <MainLayout>
            {children}
          </MainLayout>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
