import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createWallboxService } from '@/services/wallbox/factory'

// Typ-Definition hinzufügen
type ChargingSession = {
  id: string
  start_time: string
  end_time: string
  energy: number
  max_power: number
  duration_minutes: number
  cost?: number
}

export async function POST(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const [cookieStore, id] = await Promise.all([
      cookies(),
      Promise.resolve(context.params.id)
    ])

    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    })

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    // Hole die Wallbox-Verbindung
    const { data: connection, error: connectionError } = await supabase
      .from('wallbox_connections')
      .select('*')
      .eq('id', id)
      .single()

    if (connectionError || !connection) {
      return NextResponse.json(
        { error: 'Wallbox nicht gefunden' },
        { status: 404 }
      )
    }

    // Hole das Datum der letzten Synchronisation
    const { data: lastSession } = await supabase
      .from('charging_sessions')
      .select('end_time')
      .eq('wallbox_id', id)
      .order('end_time', { ascending: false })
      .limit(1)
      .single()

    // Setze den Zeitraum für die Abfrage
    const to = new Date()
    const from = lastSession?.end_time 
      ? new Date(lastSession.end_time)
      : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000) // 30 Tage zurück

    // Hole die Ladevorgänge von der Wallbox
    const service = await createWallboxService(connection)
    const sessions = await service.getChargingSessions(from, to)

    // Speichere die Ladevorgänge in der Datenbank
    const { error: insertError } = await supabase
      .from('charging_sessions')
      .upsert(
        sessions.map((session: ChargingSession) => ({
          wallbox_id: id,
          session_id: session.id,
          start_time: new Date(session.start_time).toISOString(),
          end_time: new Date(session.end_time).toISOString(),
          energy_kwh: session.energy / 1000, // Umrechnung von Wh in kWh
          cost: session.cost || null
        })),
        { 
          onConflict: 'wallbox_id,session_id',
          ignoreDuplicates: true 
        }
      )

    if (insertError) throw insertError

    // Aktualisiere last_sync in der wallbox_connections Tabelle
    await supabase
      .from('wallbox_connections')
      .update({ last_sync: new Date().toISOString() })
      .eq('id', id)

    return NextResponse.json({ 
      success: true,
      message: `${sessions.length} Ladevorgänge synchronisiert`
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Ein unbekannter Fehler ist aufgetreten'
    console.error('Sync Error:', error)
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
} 