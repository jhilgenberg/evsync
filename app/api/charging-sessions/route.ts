import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

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

    const { searchParams } = new URL(request.url)
    const carId = searchParams.get('car_id')

    let query = supabase
      .from('charging_sessions')
      .select('*')
      .eq('user_id', session.user.id)
      .order('start_time', { ascending: false })

    if (carId) {
      query = query.eq('car_id', carId)
    }

    const { data: sessions, error } = await query

    if (error) throw error

    console.log('API Response - Sessions:', sessions?.length || 0)

    return NextResponse.json({ sessions: sessions || [] })
  } catch (error: unknown) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unbekannter Fehler' },
      { status: 500 }
    )
  }
} 