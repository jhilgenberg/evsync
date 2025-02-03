import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
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

    const { sessionIds, carId } = await request.json()

    const { error } = await supabase
      .from('charging_sessions')
      .update({ car_id: carId })
      .in('id', sessionIds)
      .eq('user_id', session.user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error assigning car:', error)
    return NextResponse.json(
      { error: 'Fehler bei der Zuweisung' },
      { status: 500 }
    )
  }
} 