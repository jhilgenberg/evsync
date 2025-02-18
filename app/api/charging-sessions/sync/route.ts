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
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    // Hole alle Wallboxen des Benutzers
    const { data: wallboxes, error: wallboxError } = await supabase
      .from('wallbox_connections')
      .select('*')
      .eq('user_id', session.user.id)

    if (wallboxError) throw wallboxError
    if (!wallboxes || wallboxes.length === 0) {
      return NextResponse.json({ 
        success: true,
        message: 'Keine Wallboxen gefunden'
      })
    }

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
    for (const wallbox of wallboxes) {
      try {
        const service = await createWallboxService(wallbox)
        const sessions = await service.getChargingSessions()
        
        // Verarbeite die Sessions in Batches von 50
        const BATCH_SIZE = 50
        for (let i = 0; i < sessions.length; i += BATCH_SIZE) {
          const sessionsBatch = sessions.slice(i, i + BATCH_SIZE)
          
          const sessionsWithCosts = sessionsBatch.map((session: ChargingSession) => {
            const startTime = new Date(session.start_time)
            const endTime = session.end_time ? new Date(session.end_time) : new Date()
            const energyKwh = session.energy

            const { cost, tariff } = costCalculator.calculateSessionCost(
              startTime,
              energyKwh
            )

            return {
              wallbox_id: wallbox.id,
              user_id: wallbox.user_id,
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
            const { error: insertError } = await supabase
              .from('charging_sessions')
              .upsert(sessionsWithCosts, {
                onConflict: 'wallbox_id,session_id',
                ignoreDuplicates: false
              })

            if (insertError) throw insertError
            totalSessions += sessionsWithCosts.length
          }
        }

        // Aktualisiere last_sync erst nach erfolgreicher Verarbeitung aller Batches
        await supabase
          .from('wallbox_connections')
          .update({ last_sync: new Date().toISOString() })
          .eq('id', wallbox.id)

      } catch (error) {
        console.error(`Fehler bei Wallbox ${wallbox.id}:`, error)
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