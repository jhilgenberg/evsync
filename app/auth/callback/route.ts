import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const token = requestUrl.searchParams.get('token')
    const type = requestUrl.searchParams.get('type')

    // E-Mail Bestätigung
    if (type === 'email' && token) {
      const response = await fetch(`${requestUrl.origin}/api/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, type }),
      })

      if (!response.ok) {
        console.error('Email verification failed')
        return NextResponse.redirect(new URL('/auth?error=verification-failed', request.url))
      }

      return NextResponse.redirect(new URL('/dashboard?verified=true', request.url))
    }

    // Normaler Auth Callback
    if (code) {
      const cookieStore = cookies()
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Auth callback error:', error)
        return NextResponse.redirect(new URL('/auth?error=callback-failed', request.url))
      }
    }

    return NextResponse.redirect(new URL('/dashboard', request.url))
  } catch (error) {
    console.error('Callback error:', error)
    return NextResponse.redirect(new URL('/auth?error=unknown', request.url))
  }
} 