import { NextResponse } from 'next/server';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const appointmentId = params.id;
    if (!appointmentId) {
      return NextResponse.json({ error: 'Missing appointment id' }, { status: 400 });
    }

    const userId = process.env.ACUITY_USER_ID;
    const apiKey = process.env.ACUITY_API_KEY;
    if (!userId || !apiKey) {
      return NextResponse.json({ error: 'Missing Acuity credentials' }, { status: 500 });
    }

    const auth = Buffer.from(`${userId}:${apiKey}`).toString('base64');
    const resp = await fetch(`https://acuityscheduling.com/api/v1/appointments/${encodeURIComponent(String(appointmentId))}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      },
      cache: 'no-store'
    });

    if (!resp.ok) {
      return NextResponse.json({ error: 'Failed to fetch appointment' }, { status: resp.status });
    }

    const appt: {
      appointmentTypeID?: number | string;
      appointmentTypeId?: number | string;
      typeID?: number | string;
      typeId?: number | string;
      calendarID?: number | string;
      calendarId?: number | string;
    } = await resp.json();
    const appointmentTypeID = appt.appointmentTypeID ?? appt.appointmentTypeId ?? appt.typeID ?? appt.typeId ?? null;
    const calendarID = appt.calendarID ?? appt.calendarId ?? null;

    return NextResponse.json({
      appointmentId,
      appointmentTypeID: appointmentTypeID != null ? String(appointmentTypeID) : null,
      calendarID: calendarID != null ? String(calendarID) : null,
    });
  } catch {
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}

