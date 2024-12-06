import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { token, type } = await request.json()
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // E-Mail Bestätigung
    if (type === 'email') {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'email'
      })

      if (error) {
        console.error('Email verification error:', error)
        return NextResponse.json(
          { error: 'E-Mail-Bestätigung fehlgeschlagen' },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'E-Mail-Adresse wurde erfolgreich bestätigt'
      })
    }

    return NextResponse.json(
      { error: 'Ungültiger Token-Typ' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Token verification error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Ein unbekannter Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}

// Optional: GET-Methode für die Überprüfung des Verifizierungsstatus
export async function GET(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      emailVerified: session.user.email_confirmed_at !== null,
      email: session.user.email
    })
  } catch (error) {
    console.error('Status check error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Ein unbekannter Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
} 