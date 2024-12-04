'use client'

import { usePathname } from 'next/navigation'
import { Navbar } from './navbar'
import { Suspense } from 'react'
import { LoadingLogo } from '@/components/ui/loading-logo'
import { cn } from '@/lib/utils'

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = pathname === "/auth"

  return (
    <>
      {!isAuthPage && (
        <Navbar>
          <Suspense fallback={<LoadingLogo />}>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-blue-500 to-violet-500 bg-clip-text text-transparent bg-[size:200%] animate-gradient">
              EVSync
            </h1>
          </Suspense>
        </Navbar>
      )}
      <main className={cn(!isAuthPage && "pt-16")}>
        {children}
      </main>
    </>
  )
} 