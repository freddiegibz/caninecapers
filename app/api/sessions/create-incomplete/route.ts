import { NextResponse } from 'next/server';
import { supabase } from '../../../../src/lib/supabaseClient';

export async function POST(request: Request) {
  try {
    const { user_id, field, date, session_token } = await request.json();

    if (!field || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create incomplete session
    const { data: session, error } = await supabase
      .from('sessions')
      .insert({
        user_id: user_id || null,
        field,
        date,
        status: 'incomplete',
        session_token: session_token || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        source: 'app'
      })
      .select('id, session_token')
      .single();

    if (error) {
      console.error('Error creating session:', error);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    console.log('✅ Created incomplete session:', session.id);
    return NextResponse.json({ sessionId: session.id, sessionToken: session.session_token });

  } catch (err) {
    console.error('Session creation error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
