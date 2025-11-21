import { NextResponse } from 'next/server';

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
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

    // Acuity API doesn't have a direct /email endpoint
    // Instead, we need to update the appointment with a "no-op" change to trigger email resend
    // OR use the PUT endpoint with the same data to trigger notifications
    
    // First, fetch the current appointment data
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
      console.error('Failed to fetch appointment:', { status: getResp.status, text });
      return NextResponse.json({ error: 'Failed to fetch appointment', details: text }, { status: getResp.status });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _appointment = await getResp.json();
    
    // Acuity API doesn't have a direct /email endpoint for resending
    // The endpoint /api/v1/appointments/{id}/email doesn't exist in Acuity's API
    // 
    // Workaround: Try making a minimal update to trigger notifications
    // However, this may not work as Acuity might not resend emails on updates
    // 
    // Alternative: Direct users to use Acuity's built-in reschedule page which includes
    // the magic link in the confirmation email
    
    // Try the /email endpoint first (even though it likely doesn't exist)
    // This will give us a clear 404 if it doesn't exist
    const emailResp = await fetch(`https://acuityscheduling.com/api/v1/appointments/${encodeURIComponent(String(appointmentId))}/email`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });

    if (emailResp.ok) {
      // If this endpoint exists and works, great!
      return NextResponse.json({ success: true, message: 'Email resend triggered' });
    }

    // If endpoint doesn't exist (404), Acuity API doesn't support this
    if (emailResp.status === 404) {
      const text = await emailResp.text();
      console.error('Email resend endpoint not found (404):', text);
      return NextResponse.json({ 
        error: 'Email resend not available via API', 
        details: 'Acuity Scheduling API does not provide an endpoint to resend appointment emails. Please use the Acuity dashboard to resend emails, or use the reschedule link which includes the manage link.',
        statusCode: 404
      }, { status: 404 });
    }

    // Other error (not 404)
    const text = await emailResp.text();
    console.error('Failed to trigger email resend:', { status: emailResp.status, text });
    return NextResponse.json({ 
      error: 'Failed to trigger email resend', 
      details: text || 'Unknown error',
      statusCode: emailResp.status
    }, { status: emailResp.status });
  } catch (e) {
    console.error('Unexpected error in resend:', e);
    return NextResponse.json({ error: 'Unexpected error', details: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
