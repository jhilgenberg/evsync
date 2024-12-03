import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { format, subDays } from 'date-fns'

type DashboardData = {
  [key: string]: {
    date: string
    energy: number
    cost: number
  }
}

export async function GET() {
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

    // Hole aktive Wallboxen
    const { data: wallboxes, error: wallboxError } = await supabase
      .from('wallbox_connections')
      .select('*')
      .eq('user_id', session.user.id)

    if (wallboxError) throw wallboxError

    // Hole alle Ladevorgänge
    const { data: allSessions, error: sessionsError } = await supabase
      .from('charging_sessions')
      .select('*')
      .eq('user_id', session.user.id)

    if (sessionsError) throw sessionsError

    // Hole Ladevorgänge der letzten 7 Tage
    const sevenDaysAgo = subDays(new Date(), 7)
    const { data: recentSessions, error: recentError } = await supabase
      .from('charging_sessions')
      .select('*')
      .eq('user_id', session.user.id)
      .gte('start_time', sevenDaysAgo.toISOString())
      .order('start_time', { ascending: true })

    if (recentError) throw recentError

    // Gruppiere die letzten Ladevorgänge nach Tag
    const dailyData: DashboardData = recentSessions.reduce((acc: DashboardData, session) => {
      const date = format(new Date(session.start_time), 'yyyy-MM-dd')
      if (!acc[date]) {
        acc[date] = { date, energy: 0, cost: 0 }
      }
      acc[date].energy += session.energy_kwh
      acc[date].cost += session.cost
      return acc
    }, {})

    // Fülle fehlende Tage auf
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd')
      return dailyData[date] || { date, energy: 0, cost: 0 }
    }).reverse()

    return NextResponse.json({
      activeChargers: wallboxes.length,
      totalEnergy: allSessions.reduce((sum, session) => sum + session.energy_kwh, 0),
      totalCost: allSessions.reduce((sum, session) => sum + session.cost, 0),
      lastSync: wallboxes[0]?.last_sync || null,
      recentSessions: last7Days
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Ein unbekannter Fehler ist aufgetreten'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
} 