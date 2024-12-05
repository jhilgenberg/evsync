import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
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

    const body = await request.json();
    const { make, model, license_plate } = body;

    const { data, error } = await supabase
      .from('cars')
      .insert([
        {
          user_id: session.user.id,
          make,
          model,
          license_plate,
        },
      ])
      .select();

    if (error) throw error;

    return NextResponse.json(data[0], { status: 201 });
  } catch (error) {
    console.error('Fehler beim Speichern des Autos:', error);
    return NextResponse.json({ error: 'Fehler beim Speichern des Autos' }, { status: 500 });
  }
}

export async function GET(request: Request) {
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

    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .eq('user_id', session.user.id);

    if (error) throw error;

    return NextResponse.json({ cars: data });
  } catch (error) {
    console.error('Fehler beim Abrufen der Daten:', error);
    return NextResponse.json({ error: 'Fehler beim Abrufen der Daten' }, { status: 500 });
  }
} 