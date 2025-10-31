import { NextResponse } from 'next/server';
import { supabase } from '../../../../src/lib/supabaseClient';

// Helper function to get field name from calendar ID
function getFieldName(calendarID: number): string {
  if (calendarID === 4783035) {
    return "Central Bark";
  }
  if (calendarID === 6255352) {
    return "Hyde Bark";
  }
  return "Central Bark"; // fallback
}

// Helper function to get appointment length from type ID
function getAppointmentLength(typeID: string): string {
  switch (typeID) {
    case '18525224': // 30-Minute Reservation
      return '30 min';
    case '29373489': // 45-Minute Reservation
      return '45 min';
    case '18525161': // 1-Hour Reservation
      return '1 hour';
    default:
      return '30 min';
  }
}

// Helper function to split datetime into date and start_time
function splitDatetime(datetime: string): { date: string; start_time: string } {
  const dateObj = new Date(datetime);

  // Format date as YYYY-MM-DD
  const date = dateObj.toISOString().split('T')[0];

  // Format time as HH:MM:SS in UTC
  const hours = String(dateObj.getUTCHours()).padStart(2, '0');
  const minutes = String(dateObj.getUTCMinutes()).padStart(2, '0');
  const seconds = String(dateObj.getUTCSeconds()).padStart(2, '0');
  const start_time = `${hours}:${minutes}:${seconds}`;

  return { date, start_time };
}

export async function POST(request: Request) {
  try {
    // Parse the incoming JSON payload
    const payload = await request.json();

    // Extract required fields from Acuity webhook payload
    const {
      id,
      datetime,
      calendar,
      type,
      firstName,
      lastName,
      email,
      price
    } = payload;

    // Validate required fields
    if (!id || !datetime || !calendar || !type || !firstName || !lastName || !email) {
      console.error('Missing required fields in Acuity webhook payload:', payload);
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Process the data
    const client_name = `${firstName} ${lastName}`;
    const field = getFieldName(Number(calendar));
    const { date, start_time } = splitDatetime(datetime);
    const length = getAppointmentLength(type);

    // Query Supabase users table to find matching user by email
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    let user_id = null;
    if (user) {
      user_id = user.id;
      console.log(`✅ Booking linked to user ${email}`);
    } else {
      console.log(`⚠️ No matching user for ${email} — saved as unlinked.`);
    }

    // Insert into Supabase booked_sessions table
    const { error } = await supabase
      .from('booked_sessions')
      .insert({
        acuity_id: id,
        user_id: user_id,
        client_name: client_name,
        client_email: email,
        field: field,
        date: date,
        start_time: start_time,
        length: length,
        price: price || 0
      });

    // Log errors but don't fail the webhook
    if (error) {
      console.error('Error inserting booking into Supabase:', error);
      console.error('Payload data:', {
        acuity_id: id,
        client_name,
        client_email: email,
        field,
        date,
        start_time,
        length,
        price
      });
    } else {
      console.log('Successfully inserted booking:', {
        acuity_id: id,
        client_name,
        field,
        date,
        start_time
      });
    }

    // Always return success to prevent Acuity from retrying
    return NextResponse.json({ message: 'OK' }, { status: 200 });

  } catch (error) {
    console.error('Error processing Acuity webhook:', error);
    // Return success even on error to prevent endless retries
    return NextResponse.json({ message: 'OK' }, { status: 200 });
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
