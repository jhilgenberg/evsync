import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createWallboxService } from '@/services/wallbox/factory'
import { EncryptionService } from '@/services/encryption'

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
    const encryptionService = new EncryptionService()

    // Verschlüssele die sensiblen Konfigurationsdaten
    const encryptedConfig = encryptionService.encryptConfig(body.configuration)

    const connection = {
      ...body,
      user_id: session.user.id,
      configuration: encryptedConfig
    }

    // Teste die Verbindung mit entschlüsselter Konfiguration
    try {
      const service = await createWallboxService({
        ...connection,
        configuration: body.configuration // Verwende Original-Konfiguration für Test
      })
      await service.getStatus()
    } catch (error: unknown) {
      return NextResponse.json(
        { error: 'Verbindung konnte nicht hergestellt werden' },
        { status: 400 }
      )
    }

    // Speichere die Verbindung mit verschlüsselter Konfiguration
    const { data, error } = await supabase
      .from('wallbox_connections')
      .insert(connection)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unbekannter Fehler' },
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