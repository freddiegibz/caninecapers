import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    console.log('📧 Starting email backfill process...');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE;
    const acuityUserId = process.env.ACUITY_USER_ID;
    const acuityApiKey = process.env.ACUITY_API_KEY;

    if (!supabaseUrl || !supabaseServiceKey || !acuityUserId || !acuityApiKey) {
      return NextResponse.json({ error: 'Missing required environment variables' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find sessions that have null client_email but have acuity_appointment_id
    const { data: sessionsWithoutEmail, error: fetchError } = await supabase
      .from('sessions')
      .select('id, acuity_appointment_id, client_email')
      .is('client_email', null)
      .not('acuity_appointment_id', 'is', null)
      .limit(50); // Process in batches

    if (fetchError) {
      console.error('❌ Error fetching sessions:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    if (!sessionsWithoutEmail || sessionsWithoutEmail.length === 0) {
      console.log('✅ No sessions found that need email backfill');
      return NextResponse.json({ message: 'No sessions need email backfill', processed: 0 });
    }

    console.log(`📧 Found ${sessionsWithoutEmail.length} sessions to backfill emails for`);

    let processedCount = 0;
    let emailFoundCount = 0;

    // Process each session
    for (const session of sessionsWithoutEmail) {
      if (!session.acuity_appointment_id) continue;

      try {
        console.log(`🔍 Fetching Acuity appointment ${session.acuity_appointment_id}...`);

        // Fetch appointment details from Acuity
        const acuityResponse = await fetch(
          `https://acuityscheduling.com/api/v1/appointments/${session.acuity_appointment_id}`,
          {
            headers: {
              'Authorization': `Basic ${Buffer.from(`${acuityUserId}:${acuityApiKey}`).toString('base64')}`,
            },
          }
        );

        if (!acuityResponse.ok) {
          console.warn(`⚠️ Failed to fetch appointment ${session.acuity_appointment_id}: ${acuityResponse.status}`);
          continue;
        }

        const appointmentData = await acuityResponse.json();

        // Extract email from appointment data
        let email = null;
        if (appointmentData.email) {
          email = appointmentData.email;
        } else if (appointmentData.client?.email) {
          email = appointmentData.client.email;
        }

        if (email && email.includes('@')) {
          // Update the session with the email
          const { error: updateError } = await supabase
            .from('sessions')
            .update({ client_email: email.toLowerCase().trim() })
            .eq('id', session.id);

          if (updateError) {
            console.error(`❌ Error updating session ${session.id}:`, updateError);
          } else {
            console.log(`✅ Backfilled email ${email} for session ${session.id}`);
            emailFoundCount++;
          }
        } else {
          console.log(`⚠️ No valid email found for appointment ${session.acuity_appointment_id}`);
        }

        processedCount++;

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (err) {
        console.error(`💥 Error processing session ${session.id}:`, err);
      }
    }

    console.log(`🎉 Email backfill complete! Processed: ${processedCount}, Emails found: ${emailFoundCount}`);

    return NextResponse.json({
      message: `Email backfill completed`,
      processed: processedCount,
      emailsFound: emailFoundCount,
      successRate: processedCount > 0 ? Math.round((emailFoundCount / processedCount) * 100) : 0
    });

  } catch (err) {
    console.error('💥 Email backfill error:', err);
    return NextResponse.json({ error: 'Server error during email backfill' }, { status: 500 });
  }
}
