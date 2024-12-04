import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createWallboxService } from '@/services/wallbox/factory'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Hole die Wallbox-Verbindung
    const { data: connection, error } = await supabase
      .from('wallbox_connections')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !connection) {
      return NextResponse.json(
        { error: 'Wallbox nicht gefunden' },
        { status: 404 }
      )
    }

    // Prüfe ob die Wallbox dem Benutzer gehört
    if (connection.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 403 }
      )
    }

    const service = createWallboxService(connection)
    const status = await service.getStatus()

    // Aktualisiere last_sync in der Datenbank
    await supabase
      .from('wallbox_connections')
      .update({ last_sync: new Date().toISOString() })
      .eq('id', params.id)

    return NextResponse.json(status)
  } catch (error) {
    console.error('Wallbox Status Fehler:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unbekannter Fehler' },
      { status: 500 }
    )
  }
} 