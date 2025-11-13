import { NextResponse } from 'next/server';
import { supabase } from '../../../../src/lib/supabaseClient';

// Helper: map Acuity calendar IDs → field names
function getFieldName(calendarID: number): string {
  switch (calendarID) {
    case 4783035:
      return 'Central Bark';
    case 6255352:
      return 'Hyde Bark';
    default:
      return 'Central Bark';
  }
}

// Helper: format datetime to ISO string
function formatDate(datetime: string): string {
  const d = new Date(datetime);
  return d.toISOString();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const appointmentId = body?.appointmentId;
    const sessionId = body?.sessionId; // Optional: if provided, update specific session

    if (!appointmentId) {
      return NextResponse.json({ error: 'Missing appointmentId' }, { status: 400 });
    }

    const userId = process.env.ACUITY_USER_ID;
    const apiKey = process.env.ACUITY_API_KEY;
    if (!userId || !apiKey) {
      return NextResponse.json({ error: 'Missing Acuity credentials' }, { status: 500 });
    }

    // Fetch appointment from Acuity
    const auth = Buffer.from(`${userId}:${apiKey}`).toString('base64');
    const acuityResp = await fetch(`https://acuityscheduling.com/api/v1/appointments/${encodeURIComponent(String(appointmentId))}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      },
      cache: 'no-store'
    });

    if (!acuityResp.ok) {
      const text = await acuityResp.text();
      return NextResponse.json({ error: 'Failed to fetch appointment from Acuity', details: text }, { status: acuityResp.status });
    }

    const appointment: {
      id?: number;
      datetime?: string;
      calendarID?: number;
      appointmentTypeID?: number;
    } = await acuityResp.json();
    
    // Extract data from Acuity appointment
    const acuityAppointmentId = appointment.id;
    const datetime = appointment.datetime;
    const calendarID = appointment.calendarID;
    
    if (!datetime || !calendarID) {
      return NextResponse.json({ error: 'Missing datetime or calendarID in Acuity appointment' }, { status: 400 });
    }

    const field = getFieldName(calendarID);
    const date = formatDate(datetime);

    // Find session(s) to update
    let query = supabase
      .from('sessions')
      .select('id, user_id')
      .eq('acuity_appointment_id', acuityAppointmentId);

    // If sessionId provided, filter by it
    if (sessionId) {
      query = query.eq('id', sessionId);
    }

    const { data: sessions, error: findError } = await query;

    if (findError) {
      console.error('Error finding sessions:', findError);
      return NextResponse.json({ error: 'Failed to find sessions', details: findError.message }, { status: 500 });
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ error: 'No sessions found for this appointment', appointmentId: acuityAppointmentId }, { status: 404 });
    }

    // Update all matching sessions
    const updateData = {
      date,
      field,
      updated_at: new Date().toISOString()
    };

    const { error: updateError } = await supabase
      .from('sessions')
      .update(updateData)
      .eq('acuity_appointment_id', acuityAppointmentId);

    if (updateError) {
      console.error('Error updating sessions:', updateError);
      return NextResponse.json({ error: 'Failed to update sessions', details: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Updated ${sessions.length} session(s)`,
      updated: {
        date,
        field,
        appointmentId: acuityAppointmentId
      }
    });
  } catch (e) {
    console.error('Unexpected error in sync:', e);
    return NextResponse.json({ 
      error: 'Unexpected error', 
      details: e instanceof Error ? e.message : String(e) 
    }, { status: 500 });
  }
}

