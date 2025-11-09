import { NextResponse } from 'next/server';
import { supabase } from '../../../../src/lib/supabaseClient';
import fs from 'fs';
import path from 'path';

// Helper type for Acuity webhook logging
interface AcuityWebhookLog {
  action?: string | null;
  appointment: {
    id?: string | null;
    datetime?: string | null;
    calendarID?: string | null;
    client?: {
      email?: string | null;
    };
  };
}

// Database operation types
interface SessionUpdateData {
  status: 'complete';
  acuity_appointment_id: number;
  updated_at: string;
  date?: string;
  field?: string;
}

interface SessionInsertData {
  user_id: string | null;
  acuity_appointment_id: number;
  status: 'complete';
  source?: string;
  date?: string;
  field?: string;
}

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

// Types for Acuity API response (minimal shape we need)
interface AcuityFormValue {
  id?: number;
  fieldID?: number;
  name?: string;
  value?: string;
}

interface AcuityForm {
  id?: number;
  name?: string;
  values?: AcuityFormValue[];
}

interface AcuityAppointment {
  id?: number;
  calendarID?: number;
  datetime?: string;
  forms?: AcuityForm[];
}

// Helper: fetch full appointment details from Acuity API (to access intake forms)
async function fetchAcuityAppointmentById(appointmentId: string): Promise<AcuityAppointment | null> {
  try {
    const userId = process.env.ACUITY_USER_ID;
    const apiKey = process.env.ACUITY_API_KEY;

    if (!userId || !apiKey) {
      console.warn('⚠️ Missing ACUITY_USER_ID or ACUITY_API_KEY env vars; cannot fetch appointment details');
      return null;
    }

    const auth = Buffer.from(`${userId}:${apiKey}`).toString('base64');
    const url = `https://acuityscheduling.com/api/v1/appointments/${encodeURIComponent(appointmentId)}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      },
      // Node runtime; Next.js route can await fetch server-side
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error('❌ Failed to fetch appointment from Acuity:', res.status, res.statusText);
      return null;
    }

    const json = (await res.json()) as AcuityAppointment;
    console.log('📥 Fetched appointment from Acuity API (truncated):', {
      id: json?.id,
      calendarID: json?.calendarID,
      hasForms: Array.isArray(json?.forms),
      formsCount: Array.isArray(json?.forms) ? json.forms.length : 0
    });
    return json;
  } catch (err) {
    console.error('❌ Error fetching Acuity appointment:', err);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    // Parse Acuity's form-encoded payload
    const requestBody = await request.text();
    console.log('📄 Raw request body:', requestBody);

    // Parse form data manually since URLSearchParams doesn't handle nested brackets well
    const formData: Record<string, string> = {};
    const pairs = requestBody.split('&');
    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (key && value) {
        formData[decodeURIComponent(key)] = decodeURIComponent(value);
      }
    }
    console.log('📄 Manually parsed form data:', formData);

    // Extract key fields - handle both nested appointment[...] format (app) and flat format (Acuity direct)
    const action = formData['action'];

    // Try nested format first (app-generated), then flat format (Acuity direct)
    const appointmentId = formData['appointment[id]'] || formData['id'];
    const datetime = formData['appointment[datetime]'] || formData['datetime'];
    const calendarId = formData['appointment[calendarID]'] || formData['calendarID'];

    // Extract session ID from Acuity custom field format: appointment[forms][N][id]=17517976 & appointment[forms][N][value]=<sessionId>
    // Acuity sends custom fields as: appointment[forms][0][id]=17517976&appointment[forms][0][value]=<sessionId>
    let sessionId: string | undefined;
    const ACUITY_SESSION_FIELD_ID = '17517976';
    
    // Log all form field keys to help debug
    const formFieldKeys = Object.keys(formData).filter(key => key.includes('forms'));
    console.log('📋 Form field keys found:', formFieldKeys);
    
    // Find the index where the field ID matches our session field ID
    for (let i = 0; i < 100; i++) { // Check up to 100 form fields (should be more than enough)
      const fieldIdKey = `appointment[forms][${i}][id]`;
      const fieldValueKey = `appointment[forms][${i}][value]`;
      
      // Log what we're checking
      if (formData[fieldIdKey]) {
        console.log(`📋 Checking form field ${i}: id=${formData[fieldIdKey]}, value=${formData[fieldValueKey]}`);
      }
      
      if (formData[fieldIdKey] === ACUITY_SESSION_FIELD_ID) {
        sessionId = formData[fieldValueKey];
        console.log(`✅ Found session ID in custom field at index ${i}:`, sessionId);
        break;
      }
    }
    
    // Fallback: also check direct sessionId parameter (for backwards compatibility)
    if (!sessionId) {
      sessionId = formData['sessionId'];
      if (sessionId) {
        console.log('📋 Found session ID in direct parameter:', sessionId);
      } else {
        console.log('⚠️ No session ID found in custom fields or direct parameter');
      }
    }
    
    const sessionToken = formData['sessionToken'];

    // Check for app-generated booking validation (for logging only - we rely on sessionId presence instead)
    const source = formData['source'];
    const isAppGenerated = source === 'app' || formData['app_generated'] === 'true';
    console.log('📄 Booking source validation:', { source, isAppGenerated, hasSessionId: !!sessionId });

    // Handle client email field - try multiple possible formats
    let clientEmail = formData['appointment[client][email]'] || formData['email'];
    console.log('📄 Checking for clientEmail:', {
      nested: formData['appointment[client][email]'],
      flat: formData['email'],
      truncated: formData['client][email']
    });

    if (!clientEmail) {
      // Try alternative keys that might be generated by different encoders
      const possibleKeys = ['client][email', 'appointment_client_email', 'client_email'];
      for (const key of possibleKeys) {
        console.log(`📄 Checking key "${key}":`, formData[key]);
        if (formData[key]) {
          clientEmail = formData[key];
          console.log(`📄 Found email in key "${key}":`, clientEmail);
          break;
        }
      }
    }

    // Last resort: search for any key containing 'email'
    if (!clientEmail) {
      for (const [key, value] of Object.entries(formData)) {
        if (key.includes('email') && value.includes('@')) {
          clientEmail = value;
          console.log(`📄 Found email in key "${key}":`, clientEmail);
          break;
        }
      }
    }

    console.log('📄 Extracted fields:', { action, appointmentId, datetime, calendarId, clientEmail, sessionId, sessionToken });
    console.log('📄 Session matching condition check:', { hasSessionId: !!sessionId, hasSessionToken: !!sessionToken });

    // Validate minimum required fields - be flexible for different Acuity webhook events
    if (!appointmentId) {
      console.error('❌ Missing appointment ID - cannot process:', { appointmentId });
      return NextResponse.json({ message: 'OK' }, { status: 200 });
    }

    // Log what we have vs what we need
    console.log('📋 Field availability:', {
      hasAppointmentId: !!appointmentId,
      hasDatetime: !!datetime,
      hasCalendarId: !!calendarId,
      hasClientEmail: !!clientEmail,
      hasSessionId: !!sessionId
    });

    // If session ID missing in webhook payload, fetch appointment details from Acuity API and try to read intake forms
    if (!sessionId && appointmentId) {
      console.log('🔎 No sessionId in webhook; fetching appointment details from Acuity API…');
      const appt = await fetchAcuityAppointmentById(appointmentId);
      if (appt && Array.isArray(appt.forms)) {
        const FIELD_NAME_FALLBACK = process.env.ACUITY_SESSION_FIELD_NAME || 'Session ID';

        // Debug: print minimal snapshot of forms/values
        try {
          const formsSnapshot = appt.forms.slice(0, 3).map((f) => ({
            id: f.id,
            name: f.name,
            values: (f.values || []).slice(0, 5).map((v) => ({
              id: v.id, fieldID: v.fieldID, name: v.name, valuePreview: v.value?.slice(0, 12)
            }))
          }));
          console.log('🧩 Forms snapshot:', JSON.stringify(formsSnapshot));
        } catch {}

        // 1) Match by numeric field ID inside forms[].values[]
        outer: for (const form of appt.forms) {
          if (!Array.isArray(form.values)) continue;
          for (const v of form.values) {
            const valueFieldId = v.id ?? v.fieldID;
            if (valueFieldId != null && String(valueFieldId) === ACUITY_SESSION_FIELD_ID) {
              if (v.value) {
                sessionId = String(v.value);
                console.log('✅ Extracted sessionId via field ID in forms.values:', sessionId);
                break outer;
              }
            }
          }
        }

        // 2) Fallback: match by field name (case-insensitive)
        if (!sessionId) {
          outer2: for (const form of appt.forms) {
            if (!Array.isArray(form.values)) continue;
            for (const v of form.values) {
              const name = v.name?.toLowerCase().trim();
              if (name && (name === FIELD_NAME_FALLBACK.toLowerCase().trim() || name.includes('session id'))) {
                if (v.value) {
                  sessionId = String(v.value);
                  console.log('✅ Extracted sessionId via field NAME in forms.values:', { name: v.name, sessionId });
                  break outer2;
                }
              }
            }
          }
        }

        if (!sessionId) {
          console.log('⚠️ No matching session form field found in Acuity API response');
        }
      } else {
        console.log('⚠️ Appointment details unavailable or forms array missing from Acuity API response');
      }
    }

    // Process bookings with session ID (from custom field/API)
    // If still no session ID, treat as external booking and log only

    // Parse and validate calendar ID (skip for external bookings with missing data)
    let calendarNum: number | null = null;
    let field = 'Unknown Field';
    let date: string | null = null;

    if (calendarId) {
      calendarNum = parseInt(calendarId, 10);
      if (isNaN(calendarNum)) {
        console.error('❌ Invalid calendar ID:', calendarId);
        return NextResponse.json({ message: 'OK' }, { status: 200 });
      }
      field = getFieldName(calendarNum);
    }

    if (datetime) {
      date = formatDate(datetime);
    }

    // Handle session-based matching for bookings with session ID (from custom field or API)
    if (sessionId) {
      console.log('🎯 Booking with session ID - attempting session matching');

      // Find the incomplete session by ID (token validation optional - session ID is sufficient)
      const { data: existingSession, error: sessionErr } = await supabase
        .from('sessions')
        .select('id, session_token, user_id')
        .eq('id', sessionId)
        .eq('status', 'incomplete')
        .maybeSingle();

      if (sessionErr) {
        console.error('❌ Session lookup error:', sessionErr);
      }

      if (existingSession) {
        // Valid session found - mark as complete
        // Optionally validate token if provided, but don't require it
        if (sessionToken && existingSession.session_token !== sessionToken) {
          console.log(`⚠️ Session ${sessionId} token mismatch, but continuing with session ID match`);
        }

        const updateData: SessionUpdateData = {
          status: 'complete',
          acuity_appointment_id: parseInt(appointmentId, 10),
          updated_at: new Date().toISOString(),
        };

        // Only update fields that are available
        if (date) updateData.date = date;
        if (field !== 'Unknown Field') updateData.field = field;

        const { error: updateErr } = await supabase
          .from('sessions')
          .update(updateData)
          .eq('id', sessionId);

        if (updateErr) {
          console.error('❌ Session update error:', updateErr);
        } else {
          console.log(`✅ Marked session ${sessionId} as complete with appointment ${appointmentId}`);
        }
        
        // Return success after updating session
        return NextResponse.json({ message: 'OK' }, { status: 200 });
      } else {
        console.log(`⚠️ Session ${sessionId} not found - treating as external booking`);
        // Fall through to external booking logic
      }
    }

    // Handle bookings without session ID (external bookings) - log only
    if (!sessionId) {
      console.log('ℹ️ External booking detected (no session ID) - logging but not processing:', {
        appointmentId,
        clientEmail,
        source: source || 'unknown'
      });

      // Create payload object for logging only
      const payload: AcuityWebhookLog = {
        action,
        appointment: {
          id: appointmentId,
          datetime,
          calendarID: calendarId,
          client: {
            email: clientEmail
          }
        }
      };

      // Save to file for audit purposes but don't create session
      try {
        const logDir = '/tmp';
        const filePath = path.join(logDir, `acuity_external_booking_${Date.now()}.json`);
        fs.writeFileSync(filePath, JSON.stringify({
          ...payload,
          source: source || 'external',
          processed: false,
          reason: 'Not app-generated booking'
        }, null, 2));
        console.log(`📄 Logged external booking to ${filePath}`);
      } catch (fileErr) {
        console.error('❌ Error logging external booking:', fileErr);
      }

      // Return success but don't process the session
      return NextResponse.json({
        message: 'External booking logged',
        processed: false
      }, { status: 200 });
    }

    // Create payload object for logging (app-generated bookings only)
    const payload: AcuityWebhookLog = {
      action,
      appointment: {
        id: appointmentId,
        datetime,
        calendarID: calendarId,
        client: {
          email: clientEmail
        }
      }
    };

    // Log the full incoming payload for debugging
    console.log('🔗 Acuity Webhook Received:', JSON.stringify(payload, null, 2));

    // --- LOG PAYLOAD TO /tmp ---
    try {
      const logDir = '/tmp';
      const filePath = path.join(logDir, `acuity_payload_${Date.now()}.json`);
      fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
      console.log(`📄 Saved payload to ${filePath}`);
    } catch (fileErr) {
      console.error('❌ Error writing payload file:', fileErr);
    }

    const status = action === 'scheduled' ? 'complete' : 'incomplete';

    // Find user by email (only if we have an email)
    let user_id = null;
    if (clientEmail) {
      const { data: user, error: userErr } = await supabase
        .from('users')
        .select('id')
        .eq('email', clientEmail)
        .maybeSingle();

      if (userErr) {
        console.error('❌ User lookup error:', userErr);
        // Continue processing even if user lookup fails
      }
      user_id = user?.id ?? null;
    }

    // Handle idempotency: if user exists, check for incomplete session to complete
    let sessionError = null;

    if (user_id) {
      // First, check if there's an incomplete session for this user
      const { data: existing, error: existingErr } = await supabase
        .from('sessions')
        .select('id')
        .eq('user_id', user_id)
        .eq('status', 'incomplete')
        .limit(1)
        .maybeSingle();

      if (existingErr) {
        console.error('❌ Session lookup error:', existingErr);
      }

      if (existing) {
        // Update existing incomplete session to complete
        const { error } = await supabase
          .from('sessions')
          .update({
            status: 'complete',
            acuity_appointment_id: parseInt(appointmentId, 10),
            date,
            field,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        sessionError = error;
        console.log(`✅ Marked existing session complete for user ${clientEmail}`);
      } else {
        // Insert new completed session
        const { error } = await supabase.from('sessions').insert({
          user_id,
          acuity_appointment_id: parseInt(appointmentId, 10),
        field,
        date,
          status: 'complete',
        });
        sessionError = error;
        console.log(`✅ Created new completed session for user ${clientEmail}`);
      }
    } else {
      // Insert new session for unlinked user
      const insertData: SessionInsertData = {
        user_id: null,
        acuity_appointment_id: parseInt(appointmentId, 10),
        status: 'complete',
      };

      // Only include fields that are available
      if (date) insertData.date = date;
      if (field !== 'Unknown Field') insertData.field = field;

      const { error } = await supabase.from('sessions').insert(insertData);
      sessionError = error;
      console.log(`✅ Created new completed session for unlinked user ${clientEmail}`);
    }

    if (sessionError) {
      console.error('❌ Error saving session:', sessionError);
    } else {
      console.log('✅ Session processed successfully:', {
        appointmentId,
        clientEmail,
        field,
        date,
        status
      });
    }

    // Always return 200 OK to prevent Acuity retry loops
    return NextResponse.json({ message: 'OK' }, { status: 200 });
  } catch (err) {
    console.error('❌ Webhook error:', err);
    return NextResponse.json({ message: 'OK' }, { status: 200 });
  }
}

// Handle GET requests for endpoint health checks
export async function GET() {
  return NextResponse.json({ status: 'ok' }, { status: 200 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
