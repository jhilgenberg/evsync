import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, password, action, firstName, lastName, company, phone } = await request.json()
    const cookieStore = cookies()
    
    // Erstelle einen Service-Role Client
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore,
    }, {
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    })

    if (action === 'login') {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      return NextResponse.json({ user: data.user })
    }

    if (action === 'signup') {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName
          },
        },
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Keine User ID erhalten')

      // Erstelle das Profil mit Service-Role
      const { error: profileError } = await supabase
        .from('user_profiles')
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
    }

    return NextResponse.json(
      { error: 'Ungültige Aktion' },
      { status: 400 }
    )
  } catch (error: unknown) {
    console.error('Auth error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Ein unbekannter Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
} 