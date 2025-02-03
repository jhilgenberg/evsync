import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createWallboxService } from '@/services/wallbox/factory';
import { encrypt } from '@/services/encryption';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Teste die Verbindung mit Original-Konfiguration
    try {
      const service = await createWallboxService({
        ...body,
        configuration: body.configuration
      });
      await service.getStatus();
    } catch (error: unknown) {
      return NextResponse.json(
        { error: 'Verbindung konnte nicht hergestellt werden', details: error },
        { status: 400 }
      );
    }

    // Verschlüssele die gesamte Konfiguration
    const encryptedConfig = encrypt(JSON.stringify(body.configuration));

    const { data, error } = await supabase
      .from('wallbox_connections')
      .update({
        name: body.name,
        configuration: encryptedConfig,
        last_sync: body.last_sync
      })
      .eq('id', params.id)
      .eq('user_id', session.user.id);

    if (error) throw error;

    // Dekryptiere die Konfiguration für die Antwort
    return NextResponse.json({
      ...data,
      configuration: body.configuration // Sende die ursprüngliche Konfiguration zurück
    });
  } catch (error) {
    console.error('Error updating wallbox:', error);
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren der Wallbox' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    const { id } = params;

    const { error } = await supabase
      .from('wallbox_connections')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Fehler beim Löschen der Wallbox:', error);
    return NextResponse.json(
      { error: 'Fehler beim Löschen der Wallbox' },
      { status: 500 }
    );
  }
} 