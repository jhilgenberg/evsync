import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    const { session_ids, car_id } = await request.json();

    const { data, error } = await supabase
      .from('charging_sessions')
      .update({ car_id: car_id || null })
      .in('id', session_ids)
      .select();

    if (error) throw error;

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Ladesitzungen:', error);
    return NextResponse.json({ error: 'Fehler beim Aktualisieren der Ladesitzungen' }, { status: 500 });
  }
} 