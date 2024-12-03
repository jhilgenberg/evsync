import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    // Hole die Filter-Parameter aus der URL
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    // Erstelle die Basis-Query
    let query = supabase
      .from('charging_sessions')
      .select('*')
      .eq('user_id', session.user.id)
      .order('start_time', { ascending: false })

    // Füge Filter hinzu, wenn vorhanden
    if (from) {
      query = query.gte('start_time', `${from}T00:00:00`)
    }
    if (to) {
      query = query.lte('start_time', `${to}T23:59:59`)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Ein unbekannter Fehler ist aufgetreten'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
} 