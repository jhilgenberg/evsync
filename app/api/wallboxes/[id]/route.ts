import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { EncryptionService } from '@/services/encryption';

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

    const { id } = params;
    const updates = await request.json();
    const encryptionService = new EncryptionService();

    // Hole die aktuelle Konfiguration
    const { data: currentWallbox, error: fetchError } = await supabase
      .from('wallbox_connections')
      .select('configuration')
      .eq('id', id)
      .single();

    if (fetchError || !currentWallbox) {
      throw new Error('Wallbox nicht gefunden');
    }

    // Verschlüssele nur die geänderten sensiblen Daten
    const encryptedConfig = {
      ...updates.configuration,
      // Behalte bestehende verschlüsselte Werte
      ...Object.fromEntries(
        Object.entries(currentWallbox.configuration)
          .filter(([key]) => key.endsWith('_encrypted') || key.endsWith('_iv'))
      )
    };

    // Verschlüssele neue oder geänderte sensible Daten
    const newEncryptedConfig = encryptionService.encryptConfig(encryptedConfig);

    const { data, error } = await supabase
      .from('wallbox_connections')
      .update({
        ...updates,
        configuration: newEncryptedConfig
      })
      .eq('id', id)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Wallbox:', error);
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