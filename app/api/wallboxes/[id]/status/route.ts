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

    const { id } = params

    const { data: connection } = await supabase
      .from('wallbox_connections')
      .select('*')
      .eq('id', id)
      .single()

    if (connection.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 403 }
      )
    }

    const service = await createWallboxService(connection)
    const status = await service.getStatus()

    // Aktualisiere last_sync in der Datenbank
    await supabase
      .from('wallbox_connections')
      .update({ last_sync: new Date().toISOString() })
      .eq('id', id)

    return NextResponse.json(status)
  } catch (error) {
    console.error('Status error:', error)
    return NextResponse.json(
      { error: 'Status konnte nicht abgerufen werden' },
      { status: 500 }
    )
  }
} 