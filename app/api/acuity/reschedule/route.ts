import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const appointmentId = body?.appointmentId;
    const datetime = body?.datetime; // ISO string
    const calendarID = body?.calendarID; // optional

    if (!appointmentId || !datetime) {
      return NextResponse.json({ error: 'Missing appointmentId or datetime' }, { status: 400 });
    }

    const userId = process.env.ACUITY_USER_ID;
    const apiKey = process.env.ACUITY_API_KEY;
    if (!userId || !apiKey) {
      return NextResponse.json({ error: 'Missing Acuity credentials' }, { status: 500 });
    }

    const auth = Buffer.from(`${userId}:${apiKey}`).toString('base64');

    // First, fetch the current appointment to get all required fields
    // Acuity API requires sending all fields when updating, not just the changed ones
    const getResp = await fetch(`https://acuityscheduling.com/api/v1/appointments/${encodeURIComponent(String(appointmentId))}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      },
      cache: 'no-store'
    });

    if (!getResp.ok) {
      const text = await getResp.text();
      console.error('Failed to fetch appointment for reschedule:', { status: getResp.status, text });
      return NextResponse.json({ error: 'Failed to fetch appointment', details: text }, { status: getResp.status });
    }

    const currentAppointment: any = await getResp.json();
    console.log('Current appointment:', { id: currentAppointment.id, datetime: currentAppointment.datetime, calendarID: currentAppointment.calendarID });

    // Convert datetime from ISO string (with Z) to Acuity's expected format (+0000)
    // Acuity expects: "2025-11-12T16:30:00+0000" format
    // We receive: "2025-11-12T19:30:00.000Z" format
    let acuityDatetime = datetime;
    if (datetime.includes('Z')) {
      // Replace Z with +0000 for Acuity format
      acuityDatetime = datetime.replace('Z', '+0000');
      // Remove milliseconds if present (Acuity format doesn't include them)
      acuityDatetime = acuityDatetime.replace(/\.\d{3}/, '');
    } else if (!datetime.includes('+') && !datetime.includes('-', 10)) {
      // If no timezone, assume UTC and add +0000
      acuityDatetime = datetime.replace(/\.\d{3}/, '') + '+0000';
    }

    console.log('Datetime conversion:', { 
      input: datetime, 
      output: acuityDatetime,
      currentAppointmentFormat: currentAppointment.datetime
    });

    // Build reschedule payload - the reschedule endpoint only needs datetime and optionally calendarID
    const payload: Record<string, unknown> = {
      datetime: acuityDatetime, // Update datetime in Acuity's format
    };
    
    // Update calendarID if provided and different from current
    if (calendarID && calendarID !== currentAppointment.calendarID) {
      payload.calendarID = calendarID;
    }

    console.log('Updating appointment with payload:', { 
      appointmentId, 
      oldDatetime: currentAppointment.datetime, 
      newDatetime: acuityDatetime,
      oldCalendarID: currentAppointment.calendarID,
      newCalendarID: calendarID || currentAppointment.calendarID
    });

    // Use the specific reschedule endpoint instead of general PUT
    // Acuity has a dedicated endpoint: PUT /appointments/:id/reschedule
    const updateResp = await fetch(`https://acuityscheduling.com/api/v1/appointments/${encodeURIComponent(String(appointmentId))}/reschedule`, {
      method: 'PUT',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const text = await updateResp.text();
    let json: any = null;
    try { 
      json = JSON.parse(text); 
      console.log('Update response:', { status: updateResp.status, appointment: json });
    } catch (e) {
      console.error('Failed to parse update response:', text);
    }

    if (!updateResp.ok) {
      return NextResponse.json({ 
        error: 'Failed to reschedule appointment', 
        details: json || text,
        statusCode: updateResp.status
      }, { status: updateResp.status });
    }

    // Verify the update actually changed the datetime
    const updatedDatetime = json?.datetime || json?.appointment?.datetime;
    // Compare normalized formats (both should be in +0000 format)
    const normalizedUpdated = updatedDatetime?.replace('Z', '+0000') || updatedDatetime;
    const normalizedExpected = acuityDatetime;
    if (normalizedUpdated !== normalizedExpected) {
      console.warn('Datetime mismatch after update:', { 
        expected: normalizedExpected, 
        actual: normalizedUpdated,
        rawExpected: datetime,
        rawActual: updatedDatetime
      });
      return NextResponse.json({ 
        success: false,
        error: 'Appointment datetime was not updated correctly',
        expected: normalizedExpected,
        actual: normalizedUpdated,
        appointment: json || {}
      }, { status: 200 }); // Still 200 because Acuity returned 200, but datetime didn't change
    }

    // After successful reschedule, sync the updated data to Supabase
    try {
      const syncResp = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/sessions/sync-acuity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: String(appointmentId) })
      });
      
      if (syncResp.ok) {
        const syncData = await syncResp.json();
        console.log('Synced appointment to Supabase:', syncData);
      } else {
        console.warn('Failed to sync appointment to Supabase, but reschedule was successful');
      }
    } catch (syncErr) {
      console.warn('Error syncing to Supabase:', syncErr);
      // Don't fail the reschedule if sync fails
    }

    return NextResponse.json({ 
      success: true, 
      appointment: json || {},
      updatedDatetime: updatedDatetime,
      message: 'Appointment rescheduled successfully'
    });
  } catch (e) {
    console.error('Unexpected error in reschedule:', e);
    return NextResponse.json({ 
      error: 'Unexpected error', 
      details: e instanceof Error ? e.message : String(e) 
    }, { status: 500 });
  }
}
