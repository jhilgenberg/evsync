import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createWallboxService } from '@/services/wallbox/factory'

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    // Warte auf die Cookies und ID
    const [cookieStore, id] = await Promise.all([
      cookies(),
      Promise.resolve(context.params.id)
    ])

    // Erstelle den Supabase-Client mit den aufgelösten Cookies
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    })

    // Überprüfe die Authentifizierung
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
      .eq('id', id)
      .single()

    if (error || !connection) {
      return NextResponse.json(
        { error: 'Wallbox nicht gefunden' },
        { status: 404 }
      )
    }

    // Hole den Status von der Wallbox
    const service = createWallboxService(connection)
    const status = await service.getStatus()

    // Aktualisiere last_sync in der Datenbank
    await supabase
      .from('wallbox_connections')
      .update({ last_sync: new Date().toISOString() })
      .eq('id', id)

    return NextResponse.json(status)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Ein unbekannter Fehler ist aufgetreten'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
} 