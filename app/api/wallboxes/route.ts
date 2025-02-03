import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createWallboxService } from '@/services/wallbox/factory'
import { EncryptionService } from '@/services/encryption'
import { encrypt } from '@/services/encryption'

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

    const body = await request.json()

    // Teste die Verbindung mit Original-Konfiguration
    try {
      const service = await createWallboxService({
        ...body,
        configuration: body.configuration
      })
      await service.getStatus()
    } catch (error: unknown) {
      return NextResponse.json(
        { error: 'Verbindung konnte nicht hergestellt werden', details: error },
        { status: 400 }
      )
    }

    // Verschlüssele nur die sensiblen Daten
    const encryptedConfig = encrypt(JSON.stringify(body.configuration))

    const connection = {
      ...body,
      user_id: session.user.id,
      configuration: encryptedConfig // Speichere verschlüsselte Konfiguration
    }

    // Speichere die Verbindung
    const { data, error } = await supabase
      .from('wallbox_connections')
      .insert(connection)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: unknown) {
    console.error('Error saving wallbox:', error)
    return NextResponse.json(
      { error: 'Fehler beim Speichern der Wallbox' },
      { status: 500 }
    )
  }
}

export async function GET() {
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

    const { data, error } = await supabase
      .from('wallbox_connections')
      .select('*')
      .eq('user_id', session.user.id)

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unbekannter Fehler' },
      { status: 500 }
    )
  }
} 