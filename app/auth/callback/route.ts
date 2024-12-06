import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    const token = requestUrl.searchParams.get('token')
    const next = requestUrl.searchParams.get('next') ?? '/dashboard'

    if (token) {
      const cookieStore = cookies()
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

      const { error } = await supabase.auth.verifyOtp({
        type: 'email',
        token_hash: token,
      })

      if (error) {
        console.error('Email verification error:', error)
        return NextResponse.redirect(new URL('/auth?error=verification-failed', request.url))
      }

      return NextResponse.redirect(new URL(`${next}?verified=true`, request.url))
    }

    // Code exchange
    const code = requestUrl.searchParams.get('code')
    if (code) {
      const cookieStore = cookies()
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Auth callback error:', error)
        return NextResponse.redirect(new URL('/auth?error=callback-failed', request.url))
      }
    }

    return NextResponse.redirect(new URL(next, request.url))
  } catch (error) {
    console.error('Callback error:', error)
    return NextResponse.redirect(new URL('/auth?error=unknown', request.url))
  }
} 