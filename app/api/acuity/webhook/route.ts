import { NextResponse } from 'next/server';
import { supabase } from '../../../../src/lib/supabaseClient';
import { createClient } from '@supabase/supabase-js';
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
  acuity_appointment_id: number;
  updated_at: string;
  date?: string;
  field?: string;
}

interface SessionInsertData {
  user_id: string | null;
  acuity_appointment_id: number;
  status: 'incomplete';
  date?: string;
  field?: string;
  client_email?: string | null;
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

// Types for Acuity API response
interface AcuityClient {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

interface AcuityAppointment {
  id?: number;
  calendarID?: number;
  datetime?: string;
  client?: AcuityClient;
  // Acuity often puts these at the top level
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  // Plain-text dump of form answers
  formsText?: string;
}

// Helper: try multiple locations in the Acuity appointment payload to find an email
function extractEmailFromAcuityAppointment(appointment: AcuityAppointment | null): string | undefined {
  if (!appointment) return undefined;

  // 1) Client object (if present)
  if (appointment.client?.email && appointment.client.email.includes('@')) {
    return appointment.client.email;
  }

  // 2) Top-level email (common in Acuity v1 appointments API)
  if (appointment.email && appointment.email.includes('@')) {
    return appointment.email;
  }

  // 3) Parse from formsText (e.g. "Email: example@domain.com")
  if (appointment.formsText) {
    const match = appointment.formsText.match(/Email:\s*([^\n\r]+)/i);
    if (match && match[1] && match[1].includes('@')) {
      return match[1].trim();
    }
  }

  return undefined;
}

// Helper: find user by email in auth.users
async function findUserByEmail(email: string) {
  try {
    console.log(`🔍 Searching for user with email: ${email}`);

    // Create admin client with service role for user lookup
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase service role configuration');
      return null;
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Try using the admin API
    try {
      const { data, error } = await adminClient.auth.admin.listUsers();
      if (error) {
        console.error('❌ Admin API error:', error);
        throw error;
      }

      console.log(`📋 Found ${data.users.length} total users in system`);

      const user = data.users.find(u => {
        const userEmail = u.email?.toLowerCase();
        const searchEmail = email.toLowerCase();
        const match = userEmail === searchEmail;
        if (match) {
          console.log(`✅ Found matching user: ${u.id} for email: ${email}`);
        }
        return match;
      });

      if (user) {
        console.log(`🎯 User found: ${user.id}`);
        return user;
      } else {
        console.log(`⚠️ No user found with email: ${email}`);
        // Log some sample emails for debugging
        const sampleEmails = data.users.slice(0, 5).map(u => u.email).filter(Boolean);
        console.log(`📧 Sample user emails in system: ${sampleEmails.join(', ')}`);
        return null;
      }
    } catch (adminError) {
      console.error('💥 Admin API failed:', adminError);
      return null;
    }
  } catch (err) {
    console.error('💥 Error finding user by email:', err);
    return null;
  }
}

// Helper: fetch full appointment details from Acuity API (to get email address)
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
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error('❌ Failed to fetch appointment from Acuity:', res.status, res.statusText);
      return null;
    }

    const json = (await res.json()) as AcuityAppointment;

    // Log a concise summary plus a full snapshot to help debug field locations
    console.log('📥 Fetched appointment from Acuity API:', {
      id: json?.id,
      calendarID: json?.calendarID,
      hasClient: !!json?.client,
      clientEmail: json?.client?.email,
      topLevelEmail: json?.email,
      hasFormsText: typeof json?.formsText === 'string',
    });
    console.log('📥 Full appointment from Acuity API (raw):', JSON.stringify(json, null, 2));

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
    let datetime = formData['appointment[datetime]'] || formData['datetime'];
    let calendarId = formData['appointment[calendarID]'] || formData['calendarID'];

    // Note: Session ID extraction removed - sessions now matched by email address
    
    // Log form fields for debugging (but don't use for matching)
    const formFieldKeys = Object.keys(formData).filter(key => key.includes('forms'));
    console.log('📋 Form field keys found:', formFieldKeys);

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

    // If email still not found in webhook payload, fetch from Acuity API
    if (!clientEmail && appointmentId) {
      console.log('📥 Email not in webhook payload - fetching appointment details from Acuity API...');
      const appointmentDetails = await fetchAcuityAppointmentById(appointmentId);

      const extractedEmail = extractEmailFromAcuityAppointment(appointmentDetails);
      if (extractedEmail) {
        clientEmail = extractedEmail;
        console.log('✅ Found email from Acuity API (post-processed):', clientEmail);
      } else {
        console.warn('⚠️ Could not fetch email from Acuity API');
      }

      // Also update datetime and calendarId if missing
      if (!datetime && appointmentDetails?.datetime) {
        datetime = appointmentDetails.datetime;
        console.log('✅ Updated datetime from Acuity API:', datetime);
      }
      if (!calendarId && appointmentDetails?.calendarID) {
        calendarId = appointmentDetails.calendarID.toString();
        console.log('✅ Updated calendarId from Acuity API:', calendarId);
      }
    }

    // Normalize email: lowercase and trim
    if (clientEmail) {
      clientEmail = clientEmail.toLowerCase().trim();
    }

    console.log('📄 Extracted fields:', { action, appointmentId, datetime, calendarId, clientEmail });
    console.log('📄 Session matching: Using email address for matching sessions');

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
      hasClientEmail: !!clientEmail
    });

    // Sessions are now matched by email address, not Session ID

    // Parse and validate calendar ID
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

    // Create payload object for logging
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

    // Match sessions by email address (primary method)
    if (!clientEmail) {
      console.log('⚠️ No email address found - cannot match session. Logging booking only.');
      return NextResponse.json({ message: 'OK - no email to match' }, { status: 200 });
    }

    console.log('🎯 Matching session by email address:', clientEmail);

    // Find incomplete session by email (email stored when incomplete session was created)
    const { data: incompleteSession, error: sessionErr } = await supabase
      .from('sessions')
      .select('id, user_id, created_at')
      .eq('status', 'incomplete')
      .eq('client_email', clientEmail.toLowerCase().trim())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sessionErr) {
      console.error('❌ Error fetching incomplete session:', sessionErr);
    }

    if (incompleteSession) {
      console.log(`✅ Found incomplete session ${incompleteSession.id} for email ${clientEmail}`);

      const updateData: SessionUpdateData = {
        acuity_appointment_id: parseInt(appointmentId, 10),
        updated_at: new Date().toISOString(),
      };

      if (date) updateData.date = date;
      if (field !== 'Unknown Field') updateData.field = field;

      const { error: updateErr } = await supabase
        .from('sessions')
        .update(updateData)
        .eq('id', incompleteSession.id);

      if (updateErr) {
        console.error('❌ Session update error:', updateErr);
      } else {
        console.log(`✅ Updated session ${incompleteSession.id} with appointment data for email ${clientEmail}`);
        return NextResponse.json({ message: 'OK' }, { status: 200 });
      }
    } else {
      console.log(`⚠️ No incomplete session found for email ${clientEmail} - creating new session`);
    }

    // If no incomplete session found, create new incomplete session
    // Note: We can't directly query auth.users with regular Supabase client
    // For new sessions without incomplete match, we'll create with user_id = null
    // It can be linked later if needed

    console.log('📝 Creating new incomplete session for email:', clientEmail);

    // Try to find user by email to link the session
    const user = await findUserByEmail(clientEmail);
    const userId = user?.id || null;

    if (userId) {
      console.log('✅ Found user account, linking session to user:', userId);
    } else {
      console.log('⚠️ No user account found for email, session will be unlinked');
    }

    const insertData: SessionInsertData = {
      user_id: userId,
      acuity_appointment_id: parseInt(appointmentId, 10),
      status: 'incomplete',
      client_email: clientEmail,
    };

    if (date) insertData.date = date;
    if (field !== 'Unknown Field') insertData.field = field;

    const { error: insertErr } = await supabase.from('sessions').insert(insertData);

    if (insertErr) {
      console.error('❌ Error creating session:', insertErr);
    } else {
      console.log(`✅ Created new incomplete session for email ${clientEmail}`);
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
