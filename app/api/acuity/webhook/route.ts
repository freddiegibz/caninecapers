import { NextResponse } from 'next/server';
import { supabase } from '../../../../src/lib/supabaseClient';
import fs from 'fs';
import path from 'path';

// Type definitions for Acuity webhook payloads
interface AcuityAppointment {
  id: string | number;
  datetime: string;
  calendar: string | number;
  firstName: string;
  lastName: string;
  email: string;
  type?: string;
  price?: string | number;
}

interface AcuityWebhookPayload {
  appointment?: AcuityAppointment;
  [key: string]: unknown;
}

// Helper type for form data parsing
type FormDataObject = Record<string, string>;

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
    // --- FLEXIBLE PARSING ---
    let payload: AcuityWebhookPayload;
    try {
      payload = await request.json();
      console.log('✅ Parsed as JSON payload');
    } catch {
      console.log('⚠️ JSON parsing failed, trying form-encoded...');
      const text = await request.text();
      const params = new URLSearchParams(text);
      const formData: FormDataObject = {};

      for (const [key, value] of params.entries()) {
        formData[key] = value;
      }

      const appointmentData: Partial<AcuityAppointment> = {};
      for (const [key, value] of Object.entries(formData)) {
        const match = key.match(/^appointment\[(.+)\]$/);
        if (match) {
          const fieldName = match[1];
          switch (fieldName) {
            case 'id':
              appointmentData.id = isNaN(Number(value)) ? value : Number(value);
              break;
            case 'calendar':
              appointmentData.calendar = isNaN(Number(value)) ? value : Number(value);
              break;
            case 'price':
              appointmentData.price = isNaN(Number(value)) ? value : Number(value);
              break;
            case 'type':
              appointmentData.type = value;
              break;
            case 'datetime':
              appointmentData.datetime = value;
              break;
            case 'firstName':
              appointmentData.firstName = value;
              break;
            case 'lastName':
              appointmentData.lastName = value;
              break;
            case 'email':
              appointmentData.email = value;
              break;
            default:
              // For any other fields, just store as string
              (appointmentData as Record<string, unknown>)[fieldName] = value;
          }
        }
      }
      payload = { appointment: appointmentData as AcuityAppointment };
      console.log('✅ Parsed as form-encoded payload');
    }

    // Log the full incoming payload for debugging
    console.log('🔗 Acuity Webhook Received:', JSON.stringify(payload, null, 2));

    const appointment = payload.appointment || payload;

    // --- LOG PAYLOAD TO /tmp ---
    try {
      const logDir = '/tmp';
      const filePath = path.join(logDir, `acuity_payload_${Date.now()}.json`);
      fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
      console.log(`📄 Saved payload to ${filePath}`);
    } catch (fileErr) {
      console.error('❌ Error writing payload file:', fileErr);
    }
    const { id, datetime, calendar, firstName, lastName, email } = appointment;

    if (!id || !datetime || !calendar || !firstName || !lastName || !email) {
      console.error('❌ Missing required fields:', payload);
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (typeof datetime !== 'string') {
      console.error('❌ Invalid datetime format:', datetime);
      return NextResponse.json({ error: 'Invalid datetime format' }, { status: 400 });
    }

    const calendarId = typeof calendar === 'string' || typeof calendar === 'number'
      ? Number(calendar)
      : NaN;

    if (isNaN(calendarId)) {
      console.error('❌ Invalid calendar ID:', calendar);
      return NextResponse.json({ error: 'Invalid calendar ID' }, { status: 400 });
    }

    const field = getFieldName(calendarId);
    const date = formatDate(datetime);

    // Find user by email
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (userErr) console.error('User lookup error:', userErr);
    const user_id = user?.id ?? null;

    // If user found, mark incomplete session complete, else insert new
    let sessionError = null;

    if (user_id) {
      const { data: existing, error: existingErr } = await supabase
        .from('sessions')
        .select('id')
        .eq('user_id', user_id)
        .eq('status', 'incomplete')
        .limit(1)
        .maybeSingle();

      if (existingErr) console.error('Session lookup error:', existingErr);

      if (existing) {
        const { error } = await supabase
          .from('sessions')
          .update({
            status: 'complete',
            acuity_appointment_id: id,
            date,
            field,
          })
          .eq('id', existing.id);
        sessionError = error;
        console.log(`✅ Marked existing session complete for user ${email}`);
      } else {
        const { error } = await supabase.from('sessions').insert({
          user_id,
          acuity_appointment_id: id,
          field,
          date,
          status: 'complete',
        });
        sessionError = error;
        console.log(`✅ Created new completed session for user ${email}`);
      }
    } else {
      const { error } = await supabase.from('sessions').insert({
        user_id: null,
        acuity_appointment_id: id,
        field,
        date,
        status: 'complete',
      });
      sessionError = error;
      console.log(`✅ Created new completed session for unlinked user ${email}`);
    }

    if (sessionError) {
      console.error('❌ Error saving session:', sessionError);
    } else {
      console.log('✅ Session saved/updated:', { id, email, field, date });
    }

    return NextResponse.json({ message: 'OK' }, { status: 200 });
  } catch (err) {
    console.error('❌ Webhook error:', err);
    return NextResponse.json({ message: 'OK' }, { status: 200 });
  }
}

// Handle GET requests (for Acuity webhook testing/validation)
export async function GET() {
  return NextResponse.json({
    message: 'Acuity webhook endpoint is active',
    status: 'ready'
  }, { status: 200 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
