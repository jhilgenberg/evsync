import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createWallboxService } from '@/services/wallbox/factory'
import { CostCalculator } from '@/services/cost-calculator'

interface ChargingSession {
  id: string
  start_time: string
  end_time: string | null
  energy: number
  max_power: number
  duration_minutes: number
}

export async function POST() {
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

    // Hole alle Wallboxen des Benutzers
    const { data: connections, error: connectionsError } = await supabase
      .from('wallbox_connections')
      .select('*')
      .eq('user_id', session.user.id)

    if (connectionsError) throw connectionsError

    // Hole die Tarife des Benutzers
    const { data: tariffs, error: tariffsError } = await supabase
      .from('electricity_tariffs')
      .select('*')
      .eq('user_id', session.user.id)
      .order('valid_from', { ascending: false })

    if (tariffsError) throw tariffsError

    const costCalculator = new CostCalculator(tariffs || [])
    let totalSessions = 0

    // Synchronisiere jede Wallbox
    for (const connection of connections) {
      try {
        const service = createWallboxService(connection)
        
        // Hole die Ladevorgänge
        const sessions = await service.getChargingSessions()

        // Berechne die Kosten für jeden Ladevorgang
        const sessionsWithCosts = sessions.map((session: ChargingSession) => {
          const startTime = new Date(session.start_time)
          const endTime = session.end_time ? new Date(session.end_time) : new Date()
          const energyKwh = session.energy // Bereits in kWh von go-e

          const { cost, tariff } = costCalculator.calculateSessionCost(
            startTime,
            energyKwh
          )

          return {
            wallbox_id: connection.id,
            user_id: connection.user_id,
            session_id: session.id,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            energy_kwh: energyKwh,
            cost: Number(cost.toFixed(2)),
            tariff_id: tariff?.id || null,
            tariff_name: tariff?.name || null,
            energy_rate: tariff?.energy_rate || null,
            raw_data: session
          }
        })

        if (sessionsWithCosts.length > 0) {
          // Speichere die Ladevorgänge
          const { error: insertError } = await supabase
            .from('charging_sessions')
            .upsert(sessionsWithCosts, {
              onConflict: 'wallbox_id,session_id',
              ignoreDuplicates: false
            })

          if (insertError) throw insertError

          totalSessions += sessionsWithCosts.length

          // Aktualisiere last_sync
          await supabase
            .from('wallbox_connections')
            .update({ last_sync: new Date().toISOString() })
            .eq('id', connection.id)
        }

      } catch (error) {
        console.error(`Sync error for wallbox ${connection.id}:`, error)
      }
    }

    return NextResponse.json({ 
      success: true,
      message: `${totalSessions} Ladevorgänge synchronisiert`
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Ein unbekannter Fehler ist aufgetreten'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
} 