import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
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
  
      const { car_id } = await request.json();
      const { id } = params;
  
      const { data, error } = await supabase
        .from('charging_sessions')
        .update({ car_id })
        .eq('id', id)
        .select();
  
      if (error) throw error;
  
      return NextResponse.json(data[0], { status: 200 });
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Ladesitzung:', error);
      return NextResponse.json({ error: 'Fehler beim Aktualisieren der Ladesitzung' }, { status: 500 });
    }
  }