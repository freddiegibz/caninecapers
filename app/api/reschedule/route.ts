import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const appointmentId = url.searchParams.get('appointmentId');
    const email = url.searchParams.get('email');

    if (!appointmentId) {
      return NextResponse.json({ error: 'Missing appointmentId' }, { status: 400 });
    }

    const ownerId = '21300080';
    const accountDomain = 'https://caninecapers.as.me';
    const encodedId = encodeURIComponent(String(appointmentId));
    const emailParam = email ? `&email=${encodeURIComponent(email)}` : '';

    // Try to fetch appointment details to include appointmentTypeID (improves deep-link routing)
    let appointmentTypeID: string | null = null;
    let calendarID: string | null = null;
    try {
      const userId = process.env.ACUITY_USER_ID;
      const apiKey = process.env.ACUITY_API_KEY;
      if (userId && apiKey) {
        const auth = Buffer.from(`${userId}:${apiKey}`).toString('base64');
        const resp = await fetch(`https://acuityscheduling.com/api/v1/appointments/${encodeURIComponent(String(appointmentId))}`, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json'
          },
          cache: 'no-store'
        });
        if (resp.ok) {
          const appt: any = await resp.json();
          // Try multiple possible field names defensively
          appointmentTypeID = String(
            appt.appointmentTypeID ?? appt.appointmentTypeId ?? appt.typeID ?? appt.typeId ?? ''
          ) || null;
          calendarID = appt.calendarID != null ? String(appt.calendarID) : null;
        }
      }
    } catch {
      // Ignore API failures; we'll still try redirect candidates
    }

    const typeParam = appointmentTypeID ? `&appointmentType=${encodeURIComponent(appointmentTypeID)}` : '';
    const calendarParam = calendarID ? `&calendarID=${encodeURIComponent(calendarID)}` : '';

    // Prefer Acuity app dynamic link with the richest params first
    const candidates: string[] = [
      `https://app.acuityscheduling.com/schedule.php?owner=${ownerId}&action=appt&appointmentID=${encodedId}&apptId=${encodedId}${typeParam}${calendarParam}${emailParam}`,
      `${accountDomain}/appointments/${encodedId}/reschedule`,
      // Fallback to owner portal
      `https://app.acuityscheduling.com/schedule.php?owner=${ownerId}&action=appt${typeParam}${calendarParam}${emailParam}`
    ];

    // Redirect to the first (richest) candidate; Acuity will handle remaining routing
    return NextResponse.redirect(candidates[0], { status: 302 });
  } catch (e) {
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}
