import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const publicRoutes = ['/', '/auth', '/auth/callback']
const publicFiles = ['/logos/go-e.png', '/logos/easee.png', '/example-report.png']
const publicApiRoutes = ['/api/auth']

export async function middleware(request: NextRequest) {
  // Erlaube Zugriff auf statische Dateien
  if (publicFiles.some(file => request.nextUrl.pathname.endsWith(file))) {
    return NextResponse.next()
  }

  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })
  const { data: { session } } = await supabase.auth.getSession()

  // Prüfe ob die Route öffentlich ist
  const isPublicRoute = publicRoutes.includes(request.nextUrl.pathname)
  const isPublicApiRoute = publicApiRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  // Wenn nicht eingeloggt und keine öffentliche Route/API, redirect zu /auth
  if (!session && !isPublicRoute && !isPublicApiRoute) {
    return NextResponse.redirect(new URL('/auth', request.url))
  }

  // Wenn eingeloggt und auf Auth-Seite, redirect zu /dashboard
  if (session && request.nextUrl.pathname === '/auth') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return res
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/:path*'
  ]
} 