import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `https://evsync.de/auth/reset-password`,
    })

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Anweisungen zum Zurücksetzen wurden per E-Mail versendet'
    })
  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
} 