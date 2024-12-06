import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, password, firstName, lastName, company, phone } = await request.json()
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // 1. Registriere den Benutzer
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      }
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('Keine User ID erhalten')

    // 2. Erstelle das Profil
    const { error: profileError } = await supabase
      .from('user_profiles') // Stellen Sie sicher, dass dies der richtige Tabellenname ist
      .insert({
        user_id: authData.user.id,
        first_name: firstName,
        last_name: lastName,
        company,
        phone,
        updated_at: new Date().toISOString(),
      })

    if (profileError) throw profileError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Registrierung fehlgeschlagen' },
      { status: 500 }
    )
  }
} 