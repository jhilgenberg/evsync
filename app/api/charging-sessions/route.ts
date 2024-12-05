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

    const { searchParams } = new URL(request.url)
    const carId = searchParams.get('car_id')

    let query = supabase
      .from('charging_sessions')
      .select('*')
      .eq('user_id', session.user.id)

    if (carId) {
      query = query.eq('car_id', carId)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Fehler beim Abrufen der Ladesitzungen:', error)
    return NextResponse.json({ error: 'Fehler beim Abrufen der Ladesitzungen' }, { status: 500 })
  }
} 